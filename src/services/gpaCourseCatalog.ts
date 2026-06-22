import { CourseService } from '@/services/api/courseService';
import { persistentCache } from '@/utils/persistentCache';

/**
 * Lightweight course lookup for the GPA & Hons planner: maps an UPPER course
 * code to its credits and multilingual titles, so the planner can auto-fill the
 * credit value when a user picks a course (some courses are non-credit-bearing,
 * i.e. credits = 0, and must be excluded from the GPA).
 *
 * Like the timetable catalog, this distils the heavy, app-wide-cached
 * `getCoursesWithStats()` result into a small map and caches THAT in
 * localStorage for 24h — so opening the planner costs 0 extra Appwrite reads
 * when the catalog cache is already warm, and at most one fetch per day per
 * browser otherwise. This is a passive cache (no background refresh).
 */
export interface GpaCourseInfo {
  code: string;
  title: string;
  title_tc?: string;
  title_sc?: string;
  /** Parsed credit value. 0 means non-credit-bearing. */
  credits: number;
}

export type GpaCourseCatalog = Record<string, GpaCourseInfo>;

const CATALOG_KEY = 'gpa_course_catalog_v1';
const CATALOG_TTL = 24 * 60 * 60 * 1000; // 24h

let inflight: Promise<GpaCourseCatalog> | null = null;

const parseCredits = (raw: string | undefined): number => {
  if (raw == null) return 0;
  const n = parseFloat(String(raw).trim());
  return Number.isFinite(n) ? n : 0;
};

export async function loadGpaCourseCatalog(): Promise<GpaCourseCatalog> {
  const cached = persistentCache.get<GpaCourseCatalog>(CATALOG_KEY);
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const courses = await CourseService.getCoursesWithStats();
      const catalog: GpaCourseCatalog = {};
      for (const c of courses) {
        const code = (c.course_code || '').toUpperCase();
        if (!code) continue;
        catalog[code] = {
          code,
          title: c.course_title || code,
          title_tc: c.course_title_tc,
          title_sc: c.course_title_sc,
          credits: parseCredits(c.credits),
        };
      }
      persistentCache.set(CATALOG_KEY, catalog, CATALOG_TTL);
      return catalog;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
