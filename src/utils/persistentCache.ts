/**
 * Persistent cache using localStorage with TTL support
 * 持久化緩存，支援瀏覽器標籤頁關閉後的數據保存
 */

interface PersistentCacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  version: string; // 版本控制，用於數據結構變更時清除舊緩存
}

class PersistentCache {
  private readonly version = '1.0.0'; // 當數據結構變更時更新版本號
  private readonly storagePrefix = 'lingubible_cache_';

  /**
   * Set a value in persistent cache with TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in milliseconds (default: 30 minutes for landing page data)
   */
  set<T>(key: string, value: T, ttl: number = 30 * 60 * 1000): void {
    try {
      const entry: PersistentCacheEntry<T> = {
        data: value,
        timestamp: Date.now(),
        ttl,
        version: this.version
      };
      
      const storageKey = this.getStorageKey(key);
      localStorage.setItem(storageKey, JSON.stringify(entry));
      
      console.log(`🏪 Persistent cache SET: ${key} (TTL: ${Math.round(ttl / 1000 / 60)}min)`);
    } catch (error) {
      console.warn('Failed to set persistent cache:', error);
      // 如果 localStorage 滿了或其他錯誤，靜默處理
    }
  }

  /**
   * Get a value from persistent cache
   * @param key Cache key
   * @returns Cached value or null if not found/expired/invalid
   */
  get<T>(key: string): T | null {
    try {
      const storageKey = this.getStorageKey(key);
      const stored = localStorage.getItem(storageKey);
      
      if (!stored) {
        return null;
      }

      const entry: PersistentCacheEntry<T> = JSON.parse(stored);
      
      // 版本檢查 - 如果版本不匹配，清除舊數據
      if (entry.version !== this.version) {
        console.log(`🔄 Cache version mismatch for ${key}, clearing old cache`);
        this.delete(key);
        return null;
      }

      const now = Date.now();
      const isExpired = now - entry.timestamp > entry.ttl;
      
      if (isExpired) {
        console.log(`⏰ Cache expired for ${key}, removing`);
        this.delete(key);
        return null;
      }

      console.log(`✅ Persistent cache HIT: ${key}`);
      return entry.data;
    } catch (error) {
      console.warn(`Failed to get persistent cache for ${key}:`, error);
      // 如果解析失敗，清除損壞的數據
      this.delete(key);
      return null;
    }
  }

  /**
   * Check if a key exists and is not expired
   * @param key Cache key
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific key from persistent cache
   * @param key Cache key
   */
  delete(key: string): void {
    try {
      const storageKey = this.getStorageKey(key);
      localStorage.removeItem(storageKey);
      console.log(`🗑️ Persistent cache DELETED: ${key}`);
    } catch (error) {
      console.warn(`Failed to delete persistent cache for ${key}:`, error);
    }
  }

  /**
   * Clear all cache entries for this app
   */
  clear(): void {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.storagePrefix)) {
          keys.push(key);
        }
      }
      
      keys.forEach(key => localStorage.removeItem(key));
      console.log(`🧹 Cleared ${keys.length} persistent cache entries`);
    } catch (error) {
      console.warn('Failed to clear persistent cache:', error);
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    try {
      const now = Date.now();
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (!storageKey || !storageKey.startsWith(this.storagePrefix)) {
          continue;
        }
        
        try {
          const stored = localStorage.getItem(storageKey);
          if (!stored) continue;
          
          const entry: PersistentCacheEntry<any> = JSON.parse(stored);
          
          // 檢查版本和過期時間
          if (entry.version !== this.version || (now - entry.timestamp > entry.ttl)) {
            keysToRemove.push(storageKey);
          }
        } catch {
          // 解析失敗的項目也要清除
          keysToRemove.push(storageKey);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      if (keysToRemove.length > 0) {
        console.log(`🧹 Cleaned up ${keysToRemove.length} expired/invalid cache entries`);
      }
    } catch (error) {
      console.warn('Failed to cleanup persistent cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { totalEntries: number; totalSize: number } {
    let totalEntries = 0;
    let totalSize = 0;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.storagePrefix)) {
          totalEntries++;
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length * 2; // UTF-16 編碼，每字符2字節
          }
        }
      }
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
    }
    
    return { totalEntries, totalSize };
  }

  private getStorageKey(key: string): string {
    return `${this.storagePrefix}${key}`;
  }
}

// Export singleton instance
export const persistentCache = new PersistentCache();

// Persistent cache keys for all pages
export const PERSISTENT_CACHE_KEYS = {
  // Landing page
  POPULAR_COURSES: 'landing_popular_courses',
  POPULAR_INSTRUCTORS: 'landing_popular_instructors', 
  TOP_COURSES_BY_GPA: 'landing_top_courses_gpa',
  TOP_INSTRUCTORS_BY_GPA: 'landing_top_instructors_gpa',
  MAIN_PAGE_STATS: 'landing_main_page_stats',
  // Catalog pages
  ALL_COURSES_WITH_STATS: 'catalog_all_courses_with_stats',
  ALL_INSTRUCTORS_WITH_DETAILED_STATS: 'catalog_all_instructors_detailed_stats',
  COURSES_WITH_STATS_BATCH: 'catalog_courses_with_stats_batch',
} as const;

// Cache TTL for landing page data (longer TTL since this data changes less frequently)
export const PERSISTENT_CACHE_TTL = {
  LANDING_PAGE_DATA: 30 * 60 * 1000, // 30 minutes for landing page content
  STATS_DATA: 15 * 60 * 1000, // 15 minutes for stats
} as const;

// Initialize cleanup on app start
if (typeof window !== 'undefined') {
  // 定期清理過期緩存 - 每30分鐘執行一次
  setInterval(() => {
    persistentCache.cleanup();
  }, 30 * 60 * 1000);
  
  // 頁面載入時立即執行一次清理
  persistentCache.cleanup();
  
  // 在開發模式下顯示緩存統計
  if (import.meta.env.DEV) {
    const stats = persistentCache.getStats();
    console.log(`📊 Persistent cache stats:`, {
      entries: stats.totalEntries,
      size: `${Math.round(stats.totalSize / 1024)}KB`
    });
  }
}