/**
 * Simple in-memory cache with TTL (Time To Live) support
 */
class MemoryCache {
  /**
   * Cache disabled: storing values is now a no-op to avoid extra background refreshes.
   */
  set<T>(_key: string, _value: T, _ttl: number = 5 * 60 * 1000): void {
    // no-op
  }

  /**
   * Always return null so callers fall back to live queries.
   */
  get<T>(_key: string): T | null {
    return null;
  }

  has(_key: string): boolean {
    return false;
  }

  delete(_key: string): void {
    // no-op
  }

  clear(): void {
    // no-op
  }

  size(): number {
    return 0;
  }

  cleanup(): void {
    // no-op
  }
}

// Export singleton instance (now effectively disabled)
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
