import { CourseService } from '@/services/api/courseService';
import { persistentCache } from '@/utils/persistentCache';

/**
 * Compact multilingual lookup for the timetable planner, so courses can be
 * searched by their Chinese title (e.g. "中文" → CHI3219) and instructors by
 * their Chinese name / nickname even though the timetable CSV only carries the
 * English course title and English instructor name.
 *
 * Reads are kept tiny: this distils the heavy, app-wide-cached
 * `getCoursesWithStats()` / `getAllInstructorsWithDetailedStats()` results into
 * a small map and caches THAT in localStorage for 24h. So opening the planner
 * costs 0 extra reads when those caches are already warm (e.g. the user browsed
 * the catalog), and at most one catalog fetch per day per browser otherwise —
 * never "thousands of reads on every visit".
 */
export interface TimetableCatalog {
  /** UPPER course code → Chinese titles + credits. */
  courses: Record<string, { tc?: string; sc?: string; credits?: string }>;
  /** Normalised English instructor name → Chinese names + nickname. */
  instructors: Record<string, { tc?: string; sc?: string; nickname?: string }>;
}

// When the underlying class-timetable source data was last refreshed. Shown on
// the planner page — update whenever the data is re-imported.
export const TIMETABLE_DATA_UPDATED = '2026/07/15';

// v2: added per-course `credits` to the distilled catalog. Bumping the key
// invalidates the old (creditless) cached copy so it re-distills.
const CATALOG_KEY = 'timetable_catalog_v2';
const CATALOG_TTL = 24 * 60 * 60 * 1000; // 24h

/** Normalise an instructor name for matching (trim, collapse spaces, lowercase). */
export function normInstructorName(name: string): string {
  return (name || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

let inflight: Promise<TimetableCatalog> | null = null;

export async function loadTimetableCatalog(): Promise<TimetableCatalog> {
  const cached = persistentCache.get<TimetableCatalog>(CATALOG_KEY);
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const [courses, instructors] = await Promise.all([
        CourseService.getCoursesWithStats(),
        CourseService.getAllInstructorsWithDetailedStats(),
      ]);

      const catalog: TimetableCatalog = { courses: {}, instructors: {} };
      for (const c of courses) {
        const code = (c.course_code || '').toUpperCase();
        if (!code) continue;
        // Credits come bundled in the same already-cached read (getCoursesWithStats
        // selects `credits`), so the timetable gets them with 0 extra reads.
        if (c.course_title_tc || c.course_title_sc || c.credits) {
          catalog.courses[code] = { tc: c.course_title_tc, sc: c.course_title_sc, credits: c.credits };
        }
      }
      for (const i of instructors) {
        const key = normInstructorName(i.name);
        if (!key) continue;
        if (i.name_tc || i.name_sc || i.nickname) {
          catalog.instructors[key] = { tc: i.name_tc, sc: i.name_sc, nickname: i.nickname };
        }
      }

      persistentCache.set(CATALOG_KEY, catalog, CATALOG_TTL);
      return catalog;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
