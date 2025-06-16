interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: string;
}

interface CacheConfig {
  // 緩存過期時間（毫秒）
  ttl: number;
  // 是否在背景更新數據
  backgroundRefresh: boolean;
  // 背景更新的閾值（距離過期時間的百分比）
  backgroundRefreshThreshold: number;
  // 最大緩存大小
  maxSize: number;
  // 緩存版本（用於強制失效）
  version: string;
}

type CacheKey = string;
type CacheStore = Map<CacheKey, CacheItem<any>>;

export class CacheService {
  private static instance: CacheService;
  private cache: CacheStore = new Map();
  private refreshPromises: Map<CacheKey, Promise<any>> = new Map();

  // 預設配置
  private static readonly DEFAULT_CONFIGS: Record<string, CacheConfig> = {
    // 課程列表 - 中等更新頻率
    courses: {
      ttl: 5 * 60 * 1000, // 5分鐘
      backgroundRefresh: true,
      backgroundRefreshThreshold: 0.7, // 剩餘30%時間時開始背景更新
      maxSize: 1,
      version: '1.0'
    },
    // 講師列表 - 低更新頻率
    instructors: {
      ttl: 10 * 60 * 1000, // 10分鐘
      backgroundRefresh: true,
      backgroundRefreshThreshold: 0.6,
      maxSize: 1,
      version: '1.0'
    },
    // 課程詳情 - 中等更新頻率
    courseDetail: {
      ttl: 3 * 60 * 1000, // 3分鐘
      backgroundRefresh: true,
      backgroundRefreshThreshold: 0.8,
      maxSize: 20, // 可以緩存多個課程詳情
      version: '1.0'
    },
    // 講師詳情 - 中等更新頻率
    instructorDetail: {
      ttl: 5 * 60 * 1000, // 5分鐘
      backgroundRefresh: true,
      backgroundRefreshThreshold: 0.7,
      maxSize: 10,
      version: '1.0'
    },
    // 評論數據 - 高更新頻率
    reviews: {
      ttl: 2 * 60 * 1000, // 2分鐘
      backgroundRefresh: true,
      backgroundRefreshThreshold: 0.9,
      maxSize: 50,
      version: '1.0'
    },
    // 統計數據 - 中等更新頻率
    stats: {
      ttl: 5 * 60 * 1000, // 5分鐘
      backgroundRefresh: true,
      backgroundRefreshThreshold: 0.8,
      maxSize: 30,
      version: '1.0'
    }
  };

  private constructor() {
    // 定期清理過期緩存
    setInterval(() => this.cleanup(), 60 * 1000); // 每分鐘清理一次
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * 獲取緩存數據，如果不存在或過期則執行 fetcher 函數
   */
  async get<T>(
    key: CacheKey,
    fetcher: () => Promise<T>,
    configType: keyof typeof CacheService.DEFAULT_CONFIGS = 'courses'
  ): Promise<T> {
    const config = CacheService.DEFAULT_CONFIGS[configType];
    const now = Date.now();
    const cacheItem = this.cache.get(key);
    
    // 檢查緩存是否有效
    if (cacheItem && this.isValid(cacheItem, config, now)) {
      // 檢查是否需要背景更新
      if (config.backgroundRefresh && this.shouldBackgroundRefresh(cacheItem, config, now)) {
        this.backgroundRefresh(key, fetcher, config, configType);
      }
      return cacheItem.data;
    }

    // 檢查是否已經有正在進行的請求
    const existingPromise = this.refreshPromises.get(key);
    if (existingPromise) {
      return existingPromise;
    }

    // 執行新的請求
    const promise = this.fetchAndCache(key, fetcher, config, configType);
    this.refreshPromises.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.refreshPromises.delete(key);
    }
  }

  /**
   * 設置緩存數據
   */
  set<T>(
    key: CacheKey,
    data: T,
    configType: keyof typeof CacheService.DEFAULT_CONFIGS = 'courses'
  ): void {
    const config = CacheService.DEFAULT_CONFIGS[configType];
    const now = Date.now();

    // 檢查緩存大小限制
    this.enforceMaxSize(configType);

    const cacheItem: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt: now + config.ttl,
      version: config.version
    };

    this.cache.set(key, cacheItem);
  }

  /**
   * 刪除特定緩存
   */
  delete(key: CacheKey): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空所有緩存
   */
  clear(): void {
    this.cache.clear();
    this.refreshPromises.clear();
  }

  /**
   * 清空特定類型的緩存
   */
  clearByType(configType: keyof typeof CacheService.DEFAULT_CONFIGS): void {
    const keysToDelete: CacheKey[] = [];
    
    for (const [key] of this.cache) {
      if (key.startsWith(`${configType}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * 強制刷新緩存
   */
  async refresh<T>(
    key: CacheKey,
    fetcher: () => Promise<T>,
    configType: keyof typeof CacheService.DEFAULT_CONFIGS = 'courses'
  ): Promise<T> {
    this.delete(key);
    return this.get(key, fetcher, configType);
  }

  /**
   * 檢查緩存是否存在且有效
   */
  has(key: CacheKey): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    const now = Date.now();
    if (now > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * 獲取緩存統計信息
   */
  getStats() {
    const now = Date.now();
    let validCount = 0;
    let expiredCount = 0;
    let totalSize = 0;

    for (const [, item] of this.cache) {
      totalSize++;
      if (item.expiresAt > now) {
        validCount++;
      } else {
        expiredCount++;
      }
    }

    return {
      totalSize,
      validCount,
      expiredCount,
      hitRate: this.cache.size > 0 ? validCount / this.cache.size : 0
    };
  }

  // 私有方法

  private isValid(item: CacheItem<any>, config: CacheConfig, now: number): boolean {
    return item.expiresAt > now && item.version === config.version;
  }

  private shouldBackgroundRefresh(item: CacheItem<any>, config: CacheConfig, now: number): boolean {
    const timeUntilExpiry = item.expiresAt - now;
    const totalTtl = config.ttl;
    const remainingRatio = timeUntilExpiry / totalTtl;
    
    return remainingRatio <= (1 - config.backgroundRefreshThreshold);
  }

  private async backgroundRefresh<T>(
    key: CacheKey,
    fetcher: () => Promise<T>,
    config: CacheConfig,
    configType: keyof typeof CacheService.DEFAULT_CONFIGS
  ): Promise<void> {
    // 避免重複的背景更新
    if (this.refreshPromises.has(key)) {
      return;
    }

    const promise = this.fetchAndCache(key, fetcher, config, configType);
    this.refreshPromises.set(key, promise);

    try {
      await promise;
    } catch (error) {
      console.warn(`Background refresh failed for key ${key}:`, error);
    } finally {
      this.refreshPromises.delete(key);
    }
  }

  private async fetchAndCache<T>(
    key: CacheKey,
    fetcher: () => Promise<T>,
    config: CacheConfig,
    configType: keyof typeof CacheService.DEFAULT_CONFIGS
  ): Promise<T> {
    try {
      const data = await fetcher();
      this.set(key, data, configType);
      return data;
    } catch (error) {
      // 如果有舊的緩存數據，在錯誤時返回舊數據
      const oldItem = this.cache.get(key);
      if (oldItem) {
        console.warn(`Fetch failed for key ${key}, returning stale data:`, error);
        return oldItem.data;
      }
      throw error;
    }
  }

  private enforceMaxSize(configType: keyof typeof CacheService.DEFAULT_CONFIGS): void {
    const config = CacheService.DEFAULT_CONFIGS[configType];
    const prefix = `${configType}:`;
    
    // 獲取該類型的所有緩存項
    const typeItems: Array<[CacheKey, CacheItem<any>]> = [];
    for (const [key, item] of this.cache) {
      if (key.startsWith(prefix)) {
        typeItems.push([key, item]);
      }
    }

    // 如果超過最大大小，刪除最舊的項目
    if (typeItems.length >= config.maxSize) {
      typeItems.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const itemsToDelete = typeItems.slice(0, typeItems.length - config.maxSize + 1);
      
      for (const [key] of itemsToDelete) {
        this.cache.delete(key);
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: CacheKey[] = [];

    for (const [key, item] of this.cache) {
      if (item.expiresAt <= now) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.debug(`Cleaned up ${keysToDelete.length} expired cache items`);
    }
  }

  private getConfigTypeFromKey(key: CacheKey): keyof typeof CacheService.DEFAULT_CONFIGS {
    const prefix = key.split(':')[0];
    return (prefix as keyof typeof CacheService.DEFAULT_CONFIGS) || 'courses';
  }
}

// 導出單例實例
export const cacheService = CacheService.getInstance();

// 緩存鍵值生成器
export const CacheKeys = {
  courses: () => 'courses:all',
  coursesWithStats: () => 'courses:withStats',
  courseDetail: (courseCode: string) => `courseDetail:${courseCode}`,
  courseStats: (courseCode: string) => `stats:course:${courseCode}`,
  courseReviews: (courseCode: string) => `reviews:course:${courseCode}`,
  instructors: () => 'instructors:all',
  instructorsWithStats: () => 'instructors:withStats',
  instructorDetail: (instructorName: string) => `instructorDetail:${instructorName}`,
  instructorCourses: (instructorName: string) => `instructorDetail:${instructorName}:courses`,
  instructorReviews: (instructorName: string) => `instructorDetail:${instructorName}:reviews`,
  terms: () => 'courses:terms',
  teachingRecords: (courseCode: string) => `courses:${courseCode}:teaching`
}; 