/**
 * Passive localStorage cache with TTL — no background refresh, no setInterval.
 * Reads return null if the entry is expired; callers treat that as a cache miss
 * and re-fetch live data. This avoids the quota exhaustion that led to the
 * original no-op stub (background refreshes were firing every 2 minutes).
 */

interface CacheEntry<T> {
  value: T;
  expiry: number; // absolute ms timestamp
}

const PREFIX = 'lbu_cache_';

class PersistentCache {
  set<T>(key: string, value: T, ttl: number = 30 * 60 * 1000): void {
    try {
      const entry: CacheEntry<T> = { value, expiry: Date.now() + ttl };
      localStorage.setItem(PREFIX + key, JSON.stringify(entry));
    } catch {
      // localStorage might be full or unavailable (private browsing) — silently skip
    }
  }

  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() > entry.expiry) {
        localStorage.removeItem(PREFIX + key);
        return null;
      }
      return entry.value;
    } catch {
      return null;
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {}
  }

  clear(): void {
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) toRemove.push(k);
      }
      toRemove.forEach(k => localStorage.removeItem(k));
    } catch {}
  }

  cleanup(): void {
    try {
      const now = Date.now();
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith(PREFIX)) continue;
        try {
          const entry = JSON.parse(localStorage.getItem(k) || '{}');
          if (entry.expiry && now > entry.expiry) toRemove.push(k);
        } catch {
          toRemove.push(k);
        }
      }
      toRemove.forEach(k => localStorage.removeItem(k));
    } catch {}
  }

  getStats(): { totalEntries: number; totalSize: number } {
    let totalEntries = 0;
    let totalSize = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith(PREFIX)) continue;
        totalEntries++;
        totalSize += (localStorage.getItem(k) || '').length * 2; // UTF-16 bytes approx
      }
    } catch {}
    return { totalEntries, totalSize };
  }
}

export const persistentCache = new PersistentCache();

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

// Run a one-time cleanup on startup to evict expired entries without blocking
if (typeof window !== 'undefined') {
  setTimeout(() => persistentCache.cleanup(), 5000);
}
