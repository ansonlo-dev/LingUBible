import { databases, account } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';

export interface UserFavorite {
  $id: string;
  user_id: string;
  type: 'course' | 'instructor';
  item_id: string;
  created_at: string;
  $createdAt: string;
  $updatedAt: string;
}

// 本地緩存
class FavoritesCache {
  private cache = new Map<string, boolean>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分鐘緩存
  private allFavoritesCache: Set<string> | null = null;
  private allFavoritesCacheExpiry = 0;

  private getCacheKey(type: 'course' | 'instructor', itemId: string, userId: string): string {
    return `${userId}_${type}_${itemId}`;
  }

  get(type: 'course' | 'instructor', itemId: string, userId: string): boolean | null {
    const key = this.getCacheKey(type, itemId, userId);
    const expiry = this.cacheExpiry.get(key);
    
    if (expiry && Date.now() < expiry) {
      return this.cache.get(key) ?? null;
    }
    
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
    return null;
  }

  set(type: 'course' | 'instructor', itemId: string, userId: string, value: boolean): void {
    const key = this.getCacheKey(type, itemId, userId);
    this.cache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
    
    // 更新全部收藏緩存
    if (this.allFavoritesCache) {
      const favoriteKey = `${type}_${itemId}`;
      if (value) {
        this.allFavoritesCache.add(favoriteKey);
      } else {
        this.allFavoritesCache.delete(favoriteKey);
      }
    }
  }

  setBatch(items: Array<{ type: 'course' | 'instructor'; itemId: string; isFavorited: boolean }>, userId: string): void {
    items.forEach(item => {
      this.set(item.type, item.itemId, userId, item.isFavorited);
    });
  }

  getAllFavorites(userId: string): Set<string> | null {
    if (this.allFavoritesCacheExpiry > Date.now()) {
      return this.allFavoritesCache;
    }
    return null;
  }

  setAllFavorites(favorites: Set<string>, userId: string): void {
    this.allFavoritesCache = favorites;
    this.allFavoritesCacheExpiry = Date.now() + this.CACHE_DURATION;
  }

  clear(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
    this.allFavoritesCache = null;
    this.allFavoritesCacheExpiry = 0;
  }

  invalidateUser(userId: string): void {
    // 清除特定用戶的緩存
    for (const [key] of this.cache) {
      if (key.startsWith(userId + '_')) {
        this.cache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }
    this.allFavoritesCache = null;
    this.allFavoritesCacheExpiry = 0;
  }
}

const favoritesCache = new FavoritesCache();

export class FavoritesService {
  private static readonly DATABASE_ID = 'favorites';
  private static readonly COLLECTION_ID = 'user_favorites';
  private static pendingOperations = new Map<string, Promise<any>>();

  /**
   * 獲取用戶ID
   */
  private static async getUserId(): Promise<string> {
    const user = await account.get();
    return user.$id;
  }

  /**
   * 批量預載所有收藏狀態
   */
  static async preloadAllFavorites(): Promise<Set<string>> {
    try {
      const userId = await this.getUserId();
      
      // 檢查緩存
      const cached = favoritesCache.getAllFavorites(userId);
      if (cached) {
        return cached;
      }

      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.COLLECTION_ID,
        [
          Query.equal('user_id', userId),
          Query.limit(1000)
        ]
      );
      
      const favorites = new Set<string>();
      response.documents.forEach(doc => {
        favorites.add(`${doc.type}_${doc.item_id}`);
      });
      
      // 緩存結果
      favoritesCache.setAllFavorites(favorites, userId);
      
      return favorites;
    } catch (error) {
      console.error('Error preloading favorites:', error);
      return new Set();
    }
  }

  /**
   * 添加收藏（優化版本）
   */
  static async addFavorite(type: 'course' | 'instructor', itemId: string): Promise<UserFavorite> {
    const operationKey = `add_${type}_${itemId}`;
    
    // 如果已有相同操作在進行中，返回該Promise
    if (this.pendingOperations.has(operationKey)) {
      return this.pendingOperations.get(operationKey)!;
    }

    const operation = this._performAddFavorite(type, itemId);
    this.pendingOperations.set(operationKey, operation);
    
    try {
      const result = await operation;
      return result;
    } finally {
      this.pendingOperations.delete(operationKey);
    }
  }

  private static async _performAddFavorite(type: 'course' | 'instructor', itemId: string): Promise<UserFavorite> {
    try {
      const userId = await this.getUserId();
      
      // 樂觀更新緩存
      favoritesCache.set(type, itemId, userId, true);
      
      const favorite = await databases.createDocument(
        this.DATABASE_ID,
        this.COLLECTION_ID,
        ID.unique(),
        {
          user_id: userId,
          type: type,
          item_id: itemId,
          created_at: new Date().toISOString()
        }
      );
      
      return favorite as unknown as UserFavorite;
    } catch (error: any) {
      // 如果失敗，回滾緩存
      const userId = await this.getUserId();
      favoritesCache.set(type, itemId, userId, false);
      
      if (error.code === 409) {
        throw new Error('Already favorited');
      }
      console.error('Error adding favorite:', error);
      throw new Error('Failed to add favorite');
    }
  }

  /**
   * 移除收藏（優化版本）
   */
  static async removeFavorite(type: 'course' | 'instructor', itemId: string): Promise<void> {
    const operationKey = `remove_${type}_${itemId}`;
    
    if (this.pendingOperations.has(operationKey)) {
      return this.pendingOperations.get(operationKey)!;
    }

    const operation = this._performRemoveFavorite(type, itemId);
    this.pendingOperations.set(operationKey, operation);
    
    try {
      await operation;
    } finally {
      this.pendingOperations.delete(operationKey);
    }
  }

  private static async _performRemoveFavorite(type: 'course' | 'instructor', itemId: string): Promise<void> {
    try {
      const userId = await this.getUserId();
      
      // 樂觀更新緩存
      favoritesCache.set(type, itemId, userId, false);
      
      // 查找現有的收藏記錄
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.COLLECTION_ID,
        [
          Query.equal('user_id', userId),
          Query.equal('type', type),
          Query.equal('item_id', itemId),
          Query.limit(1)
        ]
      );
      
      if (response.documents.length > 0) {
        await databases.deleteDocument(
          this.DATABASE_ID,
          this.COLLECTION_ID,
          response.documents[0].$id
        );
      }
    } catch (error) {
      // 如果失敗，回滾緩存
      const userId = await this.getUserId();
      favoritesCache.set(type, itemId, userId, true);
      
      console.error('Error removing favorite:', error);
      throw new Error('Failed to remove favorite');
    }
  }

  /**
   * 檢查是否已收藏（優化版本）
   */
  static async isFavorited(type: 'course' | 'instructor', itemId: string): Promise<boolean> {
    try {
      const userId = await this.getUserId();
      
      // 首先檢查緩存
      const cached = favoritesCache.get(type, itemId, userId);
      if (cached !== null) {
        return cached;
      }

      // 如果沒有緩存，檢查全部收藏緩存
      const allFavorites = favoritesCache.getAllFavorites(userId);
      if (allFavorites) {
        const isFavorited = allFavorites.has(`${type}_${itemId}`);
        favoritesCache.set(type, itemId, userId, isFavorited);
        return isFavorited;
      }

      // 最後才查詢數據庫
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.COLLECTION_ID,
        [
          Query.equal('user_id', userId),
          Query.equal('type', type),
          Query.equal('item_id', itemId),
          Query.limit(1)
        ]
      );
      
      const isFavorited = response.documents.length > 0;
      favoritesCache.set(type, itemId, userId, isFavorited);
      return isFavorited;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }

  /**
   * 獲取用戶的所有收藏
   */
  static async getUserFavorites(type?: 'course' | 'instructor'): Promise<UserFavorite[]> {
    try {
      const userId = await this.getUserId();
      
      const queries = [
        Query.equal('user_id', userId),
        Query.orderDesc('created_at'),
        Query.limit(1000)
      ];
      
      if (type) {
        queries.push(Query.equal('type', type));
      }
      
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.COLLECTION_ID,
        queries
      );
      
      return response.documents as unknown as UserFavorite[];
    } catch (error) {
      console.error('Error getting user favorites:', error);
      throw new Error('Failed to get favorites');
    }
  }

  /**
   * 切換收藏狀態（優化版本）
   */
  static async toggleFavorite(type: 'course' | 'instructor', itemId: string): Promise<boolean> {
    try {
      const userId = await this.getUserId();
      
      // 檢查當前狀態（優先使用緩存）
      let isFavorited = favoritesCache.get(type, itemId, userId);
      if (isFavorited === null) {
        isFavorited = await this.isFavorited(type, itemId);
      }
      
      if (isFavorited) {
        await this.removeFavorite(type, itemId);
        return false;
      } else {
        await this.addFavorite(type, itemId);
        return true;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  /**
   * 批量檢查收藏狀態（大幅優化）
   */
  static async checkMultipleFavorites(items: Array<{ type: 'course' | 'instructor'; itemId: string }>): Promise<Record<string, boolean>> {
    try {
      const userId = await this.getUserId();
      const result: Record<string, boolean> = {};
      
      // 首先嘗試從全部收藏緩存中獲取
      const allFavorites = await this.preloadAllFavorites();
      
      items.forEach(item => {
        const key = `${item.type}_${item.itemId}`;
        result[key] = allFavorites.has(key);
      });
      
      // 更新個別緩存
      items.forEach(item => {
        const key = `${item.type}_${item.itemId}`;
        favoritesCache.set(item.type, item.itemId, userId, result[key]);
      });
      
      return result;
    } catch (error) {
      console.error('Error checking multiple favorites:', error);
      return {};
    }
  }

  /**
   * 清除緩存（用於登出等情況）
   */
  static clearCache(): void {
    favoritesCache.clear();
  }

  /**
   * 使特定用戶的緩存失效
   */
  static invalidateUserCache(userId: string): void {
    favoritesCache.invalidateUser(userId);
  }
} 