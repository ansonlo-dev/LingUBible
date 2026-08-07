import { tablesDB, ID } from '@/lib/appwrite';
import { CustomAvatar } from "@/utils/ui/avatarUtils";
import { Query } from 'appwrite';

const DATABASE_ID = 'lingubible';
const COLLECTION_ID = 'user_avatars';

export interface UserAvatarDocument {
  $id: string;
  userId: string;
  animal: string;
  backgroundIndex: number;
  createdAt: string;
  updatedAt: string;
}

/** 頭像幾乎不變動：被動 TTL 快取，過期後由下一次呼叫重新讀取（無背景刷新）。 */
const AVATAR_CACHE_TTL = 10 * 60 * 1000;

/**
 * 每張評論卡片都會掛一個 <ReviewAvatar>，各自呼叫 getUserAvatar()。原本一位用戶
 * 一個 listRows，一頁 20 張卡就是 20 個請求，「載入更多」再加 20。改成把同一輪
 * render 內的所有請求收集起來，用一次 Query.equal('userId', [...]) 查完。
 */
const BATCH_WINDOW_MS = 0;

/** 單一查詢的陣列值上限（Appwrite 限制 100）。 */
const QUERY_CHUNK_SIZE = 100;

class AvatarService {
  // value 為 null 代表「已知這位用戶沒有自訂頭像」（負快取），避免每次掛載都重查
  private cache = new Map<string, { value: CustomAvatar | null; expiry: number }>();
  // 同一批內重複的 userId 共用同一次查詢
  private pending = new Map<string, ((avatar: CustomAvatar | null) => void)[]>();
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  /** 回傳 undefined 表示未命中；null 是「沒有自訂頭像」這個有效結果。 */
  private readCache(userId: string): CustomAvatar | null | undefined {
    const entry = this.cache.get(userId);
    if (!entry) return undefined;
    if (Date.now() > entry.expiry) {
      this.cache.delete(userId);
      return undefined;
    }
    return entry.value;
  }

  private writeCache(userId: string, value: CustomAvatar | null): void {
    this.cache.set(userId, { value, expiry: Date.now() + AVATAR_CACHE_TTL });
  }

  private scheduleFlush(): void {
    if (this.flushTimer !== null) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      void this.flushPending();
    }, BATCH_WINDOW_MS);
  }

  private async flushPending(): Promise<void> {
    const batch = this.pending;
    this.pending = new Map();
    const userIds = [...batch.keys()];
    if (userIds.length === 0) return;

    const results = new Map<string, CustomAvatar | null>();
    try {
      const chunks: string[][] = [];
      for (let i = 0; i < userIds.length; i += QUERY_CHUNK_SIZE) {
        chunks.push(userIds.slice(i, i + QUERY_CHUNK_SIZE));
      }

      const responses = await Promise.all(
        chunks.map(chunk =>
          tablesDB.listRows({
            databaseId: DATABASE_ID,
            tableId: COLLECTION_ID,
            queries: [
              Query.equal('userId', chunk),
              // 每位用戶一列；留一倍餘裕，萬一有重複列也不會擠掉其他人的
              Query.limit(chunk.length * 2),
              Query.select(['userId', 'animal', 'backgroundIndex', 'createdAt'])
            ]
          })
        )
      );

      responses.forEach(response => {
        (response.rows as unknown as UserAvatarDocument[]).forEach(doc => {
          // 比照原本取 rows[0] 的行為：同一用戶有多列時以第一列為準
          if (results.has(doc.userId)) return;
          results.set(doc.userId, {
            animal: doc.animal,
            backgroundIndex: doc.backgroundIndex,
            createdAt: doc.createdAt
          });
        });
      });

      // 查無資料的用戶也要寫入負快取，否則每次掛載都會再查一次
      userIds.forEach(id => this.writeCache(id, results.get(id) ?? null));
    } catch (error) {
      // 失敗不寫快取（下次呼叫會重試），回傳 null 與原本的行為一致
      console.error('獲取用戶頭像失敗:', error);
    }

    batch.forEach((waiters, id) => {
      const value = results.get(id) ?? null;
      waiters.forEach(resolve => resolve(value));
    });
  }

  /** 直接查一位用戶的原始資料列（寫入路徑用，不經快取）。 */
  private async fetchAvatarRow(userId: string): Promise<UserAvatarDocument | null> {
    const response = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: COLLECTION_ID,
      queries: [
        Query.equal('userId', userId),
        Query.limit(1)
      ]
    });
    return (response.rows[0] as unknown as UserAvatarDocument) || null;
  }

  // 獲取用戶的自定義頭像
  async getUserAvatar(userId: string): Promise<CustomAvatar | null> {
    if (!userId) return null;

    const cached = this.readCache(userId);
    if (cached !== undefined) return cached;

    return new Promise<CustomAvatar | null>(resolve => {
      const waiters = this.pending.get(userId);
      if (waiters) {
        waiters.push(resolve);
        return;
      }
      this.pending.set(userId, [resolve]);
      this.scheduleFlush();
    });
  }

  // 保存或更新用戶的自定義頭像
  async saveUserAvatar(userId: string, avatar: Omit<CustomAvatar, 'createdAt'>): Promise<boolean> {
    try {
      // 先檢查是否已存在。這裡刻意不走 getUserAvatar 的快取：判斷「更新還是新增」
      // 必須依當下的實際資料，而且原本也是查一次拿 $id，合併成一次查詢即可
      const existingRow = await this.fetchAvatarRow(userId);
      const now = new Date().toISOString();

      if (existingRow) {
        await tablesDB.updateRow({
          databaseId: DATABASE_ID,
          tableId: COLLECTION_ID,
          rowId: existingRow.$id,
          data: {
            animal: avatar.animal,
            backgroundIndex: avatar.backgroundIndex,
            updatedAt: now
          }
        });
      } else {
        // 創建新記錄
        await tablesDB.createRow({
          databaseId: DATABASE_ID,
          tableId: COLLECTION_ID,
          rowId: ID.unique(),
          data: {
            userId,
            animal: avatar.animal,
            backgroundIndex: avatar.backgroundIndex,
            createdAt: now,
            updatedAt: now
          }
        });
      }

      // 寫入後同步快取：AVATAR_UPDATE_EVENT 會讓其他元件立刻重新讀取，
      // 若還留著舊值就會顯示成沒改到
      this.writeCache(userId, {
        animal: avatar.animal,
        backgroundIndex: avatar.backgroundIndex,
        createdAt: existingRow?.createdAt || now
      });

      return true;
    } catch (error) {
      console.error('保存用戶頭像失敗:', error);
      return false;
    }
  }

  // 刪除用戶的自定義頭像
  async deleteUserAvatar(userId: string): Promise<boolean> {
    try {
      const existingRow = await this.fetchAvatarRow(userId);

      if (existingRow) {
        await tablesDB.deleteRow({
          databaseId: DATABASE_ID,
          tableId: COLLECTION_ID,
          rowId: existingRow.$id
        });
      }

      // 刪除後即「沒有自訂頭像」，直接寫入負快取
      this.writeCache(userId, null);

      return true;
    } catch (error) {
      console.error('刪除用戶頭像失敗:', error);
      return false;
    }
  }

  // 獲取頭像統計信息
  async getAvatarStats(): Promise<{
    totalCustomAvatars: number;
    popularAnimals: { animal: string; count: number }[];
    popularBackgrounds: { backgroundIndex: number; count: number }[];
  }> {
    try {
      const response = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: COLLECTION_ID,
        queries: [
          Query.limit(100)
        ]
      });

      const docs = response.rows as unknown as UserAvatarDocument[];
      
      // 統計動物使用頻率
      const animalCounts: { [key: string]: number } = {};
      const backgroundCounts: { [key: number]: number } = {};

      docs.forEach(doc => {
        animalCounts[doc.animal] = (animalCounts[doc.animal] || 0) + 1;
        backgroundCounts[doc.backgroundIndex] = (backgroundCounts[doc.backgroundIndex] || 0) + 1;
      });

      const popularAnimals = Object.entries(animalCounts)
        .map(([animal, count]) => ({ animal, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const popularBackgrounds = Object.entries(backgroundCounts)
        .map(([backgroundIndex, count]) => ({ backgroundIndex: parseInt(backgroundIndex), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalCustomAvatars: docs.length,
        popularAnimals,
        popularBackgrounds
      };
    } catch (error) {
      console.error('獲取頭像統計失敗:', error);
      return {
        totalCustomAvatars: 0,
        popularAnimals: [],
        popularBackgrounds: []
      };
    }
  }
}

export const avatarService = new AvatarService(); 