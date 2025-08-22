/**
 * Simple in-memory cache with TTL (Time To Live) support
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Set a value in cache with TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in milliseconds (default: 5 minutes)
   */
  set<T>(key: string, value: T, ttl: number = 5 * 60 * 1000): void {
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl
    };
    this.cache.set(key, entry);
  }

  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Cached value or null if not found/expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Check if a key exists and is not expired
   * @param key Cache key
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific key from cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const courseStatsCache = new MemoryCache();

// Cache keys constants
export const CACHE_KEYS = {
  TEACHING_LANGUAGE_STATS: 'teaching_language_stats',
  OFFERED_TERM_STATS: 'offered_term_stats',
  SERVICE_LEARNING_STATS: 'service_learning_stats',
  ALL_TEACHING_RECORDS: 'all_teaching_records',
} as const;

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  STATS: 10 * 60 * 1000, // 10 minutes for statistics
  TEACHING_RECORDS: 30 * 60 * 1000, // 30 minutes for teaching records
} as const;