/**
 * Honours classification, merit-list (Dean's / President's) detection and GPA
 * projection helpers for the GPA & Hons planner.
 *
 * The maximum attainable GPA is 4.00 (see GRADE_TO_GPA_MAP in `gradeUtils.ts`;
 * there is no A+). A student is also normally required to keep each term's GPA
 * at or above {@link MIN_TERM_GPA} (studies are discontinued after two terms
 * below 1.00), so 1.00 — not 0.00 — is the realistic worst case when checking
 * whether a classification is already secured.
 */

export const MAX_GPA = 4.0;
/** Studies are discontinued after two terms below this term GPA. */
export const MIN_TERM_GPA = 1.0;

/** Honours degree classifications + Pass, ordered best → worst. */
export type HonoursKey = 'first' | 'upperSecond' | 'lowerSecond' | 'third' | 'pass';

export interface HonoursTier {
  key: HonoursKey;
  /** Minimum cumulative GPA required for this classification. */
  cgpa: number;
}

/** Minimum cumulative GPA per classification (best → worst). */
export const HONOURS_TIERS: HonoursTier[] = [
  { key: 'first', cgpa: 3.5 },
  { key: 'upperSecond', cgpa: 3.0 },
  { key: 'lowerSecond', cgpa: 2.5 },
  { key: 'third', cgpa: 2.0 },
  { key: 'pass', cgpa: 1.67 },
];

/** Honours classifications a student would realistically *target* (excludes Pass). */
export const HONOURS_TARGETS: HonoursTier[] = HONOURS_TIERS.filter((t) => t.key !== 'pass');

/** Merit lists (plotted separately, in their own colours). */
export const AWARD_LINES = {
  presidentsList: 3.7,
  deansList: 3.3,
} as const;

// Year-level merit-list requirements.
export const YEAR_AWARD = {
  /** Minimum credits earned across the academic year. */
  minYearCredits: 24,
  /** Minimum credits in at least one term within the year. */
  minTermCredits: 12,
  deansListMin: 3.3, // 3.30–3.69
  presidentsListMin: 3.7, // 3.70+
} as const;

/**
 * Letter grades that carry a numeric grade point and therefore count towards
 * the GPA. Pass/fail-style grades (P, Fail, S, U, AU, I, W, …) are excluded —
 * they appear on the transcript but do not affect the GPA.
 */
export const GPA_BEARING_GRADES = [
  'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F',
] as const;

/** Non-GPA transcript grades (do not affect the GPA). */
export const NON_GPA_GRADES = ['P', 'Fail', 'I', 'U', 'S', 'W', 'AU'] as const;

/**
 * Grades that disqualify a student from the Dean's / President's List for that
 * academic year: F (Failure), Fail, U (Unsatisfactory) and I (Incomplete).
 */
export const AWARD_DISQUALIFYING_GRADES = ['F', 'FAIL', 'U', 'I'] as const;

export const isGpaBearingGrade = (grade: string | null | undefined): boolean => {
  if (!grade) return false;
  return (GPA_BEARING_GRADES as readonly string[]).includes(grade.trim().toUpperCase());
};

export const isAwardDisqualifyingGrade = (grade: string | null | undefined): boolean => {
  if (!grade) return false;
  return (AWARD_DISQUALIFYING_GRADES as readonly string[]).includes(grade.trim().toUpperCase());
};

/**
 * Classify a cumulative GPA into an honours tier (or Pass).
 * @returns the matching {@link HonoursKey}, or `null` if below the Pass line.
 */
export const classifyHonours = (cgpa: number | null | undefined): HonoursKey | null => {
  if (cgpa == null || Number.isNaN(cgpa)) return null;
  for (const tier of HONOURS_TIERS) {
    if (cgpa >= tier.cgpa) return tier.key;
  }
  return null;
};

/** The next tier up from a given cumulative GPA, or `null` if already First. */
export const nextHonoursTier = (cgpa: number | null | undefined): HonoursTier | null => {
  if (cgpa == null || Number.isNaN(cgpa)) return HONOURS_TIERS[HONOURS_TIERS.length - 1];
  for (let i = HONOURS_TIERS.length - 1; i >= 0; i--) {
    if (cgpa < HONOURS_TIERS[i].cgpa) return HONOURS_TIERS[i];
  }
  return null; // already at/above First Class
};

// ---------------------------------------------------------------------------
// Dean's / President's List (per academic year)
// ---------------------------------------------------------------------------

export type YearAwardKey = 'presidentsList' | 'deansList';

export interface YearAwardInput {
  /** GPA over the academic year's GPA-bearing courses (null if none). */
  yearGpa: number | null;
  /** Credit-bearing credits earned across the academic year. */
  yearCredits: number;
  /** Largest credit load taken in a single term within the year. */
  maxTermCredits: number;
  /** Whether any course in the year carries an F / Fail / U / I grade. */
  hasDisqualifyingGrade: boolean;
}

/**
 * Determine whether an academic year qualifies for the President's or Dean's
 * List. Both require ≥24 credits in the year, ≥12 credits in one term, and no
 * F / Fail / U / I grades; President's needs a Year GPA ≥ 3.70, Dean's 3.30–3.69.
 */
export const classifyYearAward = ({
  yearGpa,
  yearCredits,
  maxTermCredits,
  hasDisqualifyingGrade,
}: YearAwardInput): YearAwardKey | null => {
  if (yearGpa == null || hasDisqualifyingGrade) return null;
  if (yearCredits < YEAR_AWARD.minYearCredits) return null;
  if (maxTermCredits < YEAR_AWARD.minTermCredits) return null;
  if (yearGpa >= YEAR_AWARD.presidentsListMin) return 'presidentsList';
  if (yearGpa >= YEAR_AWARD.deansListMin) return 'deansList';
  return null;
};

// ---------------------------------------------------------------------------
// Target calculator
// ---------------------------------------------------------------------------

export interface RequiredAvgInput {
  /** Sum of (gradePoint × credits) over completed GPA-bearing courses. */
  earnedPoints: number;
  /** Sum of credits over completed GPA-bearing courses. */
  earnedCredits: number;
  /** Credits still to be taken in the remaining terms. */
  remainingCredits: number;
  /** Target cumulative GPA to reach by graduation. */
  targetCgpa: number;
}

export type RequiredAvgStatus =
  | 'achieved'      // already secured assuming the mandatory ≥1.00/term floor
  | 'feasible'      // floor < required ≤ 4.00
  | 'impossible'    // required > 4.00
  | 'noRemaining';  // remainingCredits ≤ 0 and target not met

export interface RequiredAvgResult {
  /** Minimum average GPA needed across the remaining credits. */
  required: number;
  status: RequiredAvgStatus;
  /** Worst-case (≥1.00/credit) or current final CGPA, depending on status. */
  projectedCgpa: number;
}

/**
 * Minimum average GPA a student must average over their remaining credits to
 * graduate at (or above) a target cumulative GPA.
 *
 *   required = (target·(earned + remaining) − earnedPoints) / remaining
 *
 * Because a student must keep each term's GPA at or above {@link MIN_TERM_GPA}
 * (or risk discontinuation), the target is treated as "secured" once the
 * required average drops to that floor.
 */
export const requiredRemainingAvg = ({
  earnedPoints,
  earnedCredits,
  remainingCredits,
  targetCgpa,
}: RequiredAvgInput): RequiredAvgResult => {
  if (remainingCredits <= 0) {
    const currentCgpa = earnedCredits > 0 ? earnedPoints / earnedCredits : 0;
    return {
      required: 0,
      status: currentCgpa >= targetCgpa ? 'achieved' : 'noRemaining',
      projectedCgpa: currentCgpa,
    };
  }

  const totalCredits = earnedCredits + remainingCredits;
  const required = (targetCgpa * totalCredits - earnedPoints) / remainingCredits;
  // Worst realistic outcome: averaging the mandatory minimum in every remaining credit.
  const guaranteedCgpa = (earnedPoints + MIN_TERM_GPA * remainingCredits) / totalCredits;

  if (required <= MIN_TERM_GPA || guaranteedCgpa >= targetCgpa) {
    return { required: Math.max(0, required), status: 'achieved', projectedCgpa: guaranteedCgpa };
  }
  if (required > MAX_GPA + 1e-9) {
    return {
      required,
      status: 'impossible',
      projectedCgpa: (earnedPoints + MAX_GPA * remainingCredits) / totalCredits,
    };
  }
  return { required, status: 'feasible', projectedCgpa: targetCgpa };
};
