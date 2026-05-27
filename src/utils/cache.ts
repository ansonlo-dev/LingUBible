/**
 * Passive two-layer cache (in-memory + localStorage) with TTL support.
 *
 * IMPORTANT: This cache is intentionally PASSIVE — it never schedules background
 * refreshes (no setInterval / no polling). Entries are only populated on demand
 * and served until their TTL expires, after which the next caller re-fetches live
 * data. This is what makes re-enabling caching safe: the original quota exhaustion
 * came from background refresh loops, not from caching itself. A passive TTL cache
 * can only REDUCE Appwrite reads.
 */

interface CacheEntry<T> {
  data: T;
  expiry: number; // absolute ms timestamp
}

const PERSIST_PREFIX = 'lbu_stats_';
// Skip persisting very large payloads to localStorage to avoid filling the
// ~5MB quota; such entries stay in the in-memory layer only.
const MAX_PERSIST_BYTES = 1_000_000;

class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();

  set<T>(key: string, value: T, ttl: number = 5 * 60 * 1000): void {
    const entry: CacheEntry<T> = { data: value, expiry: Date.now() + ttl };
    this.store.set(key, entry);

    // Write-through to localStorage for cross-session persistence (passive).
    try {
      const serialized = JSON.stringify(entry);
      if (serialized.length * 2 <= MAX_PERSIST_BYTES) {
        localStorage.setItem(PERSIST_PREFIX + key, serialized);
      } else {
        // Too large to persist — ensure no stale persisted copy lingers.
        localStorage.removeItem(PERSIST_PREFIX + key);
      }
    } catch {
      // localStorage full or unavailable (private browsing) — skip silently.
    }
  }

  get<T>(key: string): T | null {
    const now = Date.now();

    // 1) In-memory layer (fastest).
    const mem = this.store.get(key);
    if (mem) {
      if (now <= mem.expiry) return mem.data as T;
      this.store.delete(key);
    }

    // 2) Persistent layer fallback.
    try {
      const raw = localStorage.getItem(PERSIST_PREFIX + key);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (now > entry.expiry) {
        localStorage.removeItem(PERSIST_PREFIX + key);
        return null;
      }
      // Promote back into memory for subsequent fast access.
      this.store.set(key, entry);
      return entry.data;
    } catch {
      return null;
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.store.delete(key);
    try {
      localStorage.removeItem(PERSIST_PREFIX + key);
    } catch {
      // ignore
    }
  }

  clear(): void {
    this.store.clear();
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PERSIST_PREFIX)) toRemove.push(k);
      }
      toRemove.forEach(k => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  }

  size(): number {
    return this.store.size;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiry) this.store.delete(key);
    }
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith(PERSIST_PREFIX)) continue;
        try {
          const entry = JSON.parse(localStorage.getItem(k) || '{}');
          if (entry.expiry && now > entry.expiry) toRemove.push(k);
        } catch {
          toRemove.push(k);
        }
      }
      toRemove.forEach(k => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  }
}

// Export singleton instance (now an active passive-TTL cache)
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

// Run a one-time cleanup on startup to evict expired entries without blocking.
if (typeof window !== 'undefined') {
  setTimeout(() => courseStatsCache.cleanup(), 5000);
}
