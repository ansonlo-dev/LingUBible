/**
 * Persistent cache disabled: this module now acts as a simple no-op helper so
 * the application falls back to live Appwrite queries every time. Keeping the
 * interface avoids large refactors while eliminating the background cache
 * refreshes that were exhausting the free plan quota.
 */

class PersistentCache {
  set<T>(_key: string, _value: T, _ttl: number = 30 * 60 * 1000): void {
    // no-op
  }

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

  cleanup(): void {
    // no-op
  }

  getStats(): { totalEntries: number; totalSize: number } {
    return { totalEntries: 0, totalSize: 0 };
  }
}

export const persistentCache = new PersistentCache();

// Persistent cache keys are retained for compatibility with existing API
export const PERSISTENT_CACHE_KEYS = {
  POPULAR_COURSES: 'landing_popular_courses',
  POPULAR_INSTRUCTORS: 'landing_popular_instructors',
  TOP_COURSES_BY_GPA: 'landing_top_courses_gpa',
  TOP_INSTRUCTORS_BY_GPA: 'landing_top_instructors_gpa',
  MAIN_PAGE_STATS: 'landing_main_page_stats',
  ALL_COURSES_WITH_STATS: 'catalog_all_courses_with_stats',
  ALL_INSTRUCTORS_WITH_DETAILED_STATS: 'catalog_all_instructors_detailed_stats',
  COURSES_WITH_STATS_BATCH: 'catalog_courses_with_stats_batch',
} as const;

export const PERSISTENT_CACHE_TTL = {
  LANDING_PAGE_DATA: 30 * 60 * 1000,
  STATS_DATA: 15 * 60 * 1000,
} as const;

// Cleanup hooks are no longer required now that caching is disabled, but keep
// the structure intact to avoid runtime errors where they used to be invoked.
if (typeof window !== 'undefined') {
  // no scheduled cleanup needed when nothing is stored
}
