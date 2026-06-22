/**
 * Honours classification + GPA projection helpers for the GPA & Hons planner.
 *
 * The cumulative-GPA cutoffs follow the standard Hong Kong undergraduate
 * honours scheme. The maximum attainable GPA is 4.00 (see GRADE_TO_GPA_MAP in
 * `gradeUtils.ts`; there is no A+), which matters for feasibility checks in the
 * target calculator — a required average above 4.00 is mathematically
 * impossible.
 */

export const MAX_GPA = 4.0;

/** Honours degree classifications, ordered best → worst. */
export type HonoursKey = 'first' | 'upperSecond' | 'lowerSecond' | 'third';

export interface HonoursTier {
  key: HonoursKey;
  /** Minimum cumulative GPA required for this classification. */
  cgpa: number;
}

/** Minimum cumulative GPA per honours classification (best → worst). */
export const HONOURS_TIERS: HonoursTier[] = [
  { key: 'first', cgpa: 3.5 },
  { key: 'upperSecond', cgpa: 3.0 },
  { key: 'lowerSecond', cgpa: 2.5 },
  { key: 'third', cgpa: 2.0 },
];

/** Merit lists (plotted separately, in their own colours). */
export const AWARD_LINES = {
  presidentsList: 3.7,
  deansList: 3.3,
} as const;

/**
 * Letter grades that carry a numeric grade point and therefore count towards
 * the GPA. Pass/fail-style grades (P, S, U, AU, I, W, …) are intentionally
 * excluded — they appear on the transcript but do not affect the GPA.
 */
export const GPA_BEARING_GRADES = [
  'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F',
] as const;

/** Non-GPA grades commonly seen on transcripts (do not affect GPA). */
export const NON_GPA_GRADES = ['P', 'S', 'U', 'AU', 'I', 'W'] as const;

export const isGpaBearingGrade = (grade: string | null | undefined): boolean => {
  if (!grade) return false;
  return (GPA_BEARING_GRADES as readonly string[]).includes(grade.trim().toUpperCase());
};

/**
 * Classify a cumulative GPA into an honours tier.
 * @returns the matching {@link HonoursKey}, or `null` if below Third Class.
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
  // Tiers are best → worst; the next goal is the lowest tier whose cutoff is still above us.
  for (let i = HONOURS_TIERS.length - 1; i >= 0; i--) {
    if (cgpa < HONOURS_TIERS[i].cgpa) return HONOURS_TIERS[i];
  }
  return null; // already at/above First Class
};

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
  | 'achieved'      // already at/above target even with 0.0 in remaining credits
  | 'feasible'      // 0 < required ≤ 4.00
  | 'impossible'    // required > 4.00
  | 'noRemaining';  // remainingCredits ≤ 0, target not yet met

export interface RequiredAvgResult {
  /** Minimum average GPA needed across the remaining credits. */
  required: number;
  status: RequiredAvgStatus;
  /** Projected final CGPA if the student averages exactly {@link required}. */
  projectedCgpa: number;
}

/**
 * Minimum average GPA a student must average over their remaining credits to
 * graduate at (or above) a target cumulative GPA.
 *
 *   required = (target·(earned + remaining) − earnedPoints) / remaining
 */
export const requiredRemainingAvg = ({
  earnedPoints,
  earnedCredits,
  remainingCredits,
  targetCgpa,
}: RequiredAvgInput): RequiredAvgResult => {
  const totalCredits = earnedCredits + remainingCredits;
  // CGPA already secured even if every remaining credit scored 0.
  const guaranteedCgpa = totalCredits > 0 ? earnedPoints / totalCredits : 0;

  if (remainingCredits <= 0) {
    const currentCgpa = earnedCredits > 0 ? earnedPoints / earnedCredits : 0;
    return {
      required: 0,
      status: currentCgpa >= targetCgpa ? 'achieved' : 'noRemaining',
      projectedCgpa: currentCgpa,
    };
  }

  const required = (targetCgpa * totalCredits - earnedPoints) / remainingCredits;

  if (required <= 0 || guaranteedCgpa >= targetCgpa) {
    return { required: Math.max(0, required), status: 'achieved', projectedCgpa: guaranteedCgpa };
  }
  if (required > MAX_GPA + 1e-9) {
    return { required, status: 'impossible', projectedCgpa: (earnedPoints + MAX_GPA * remainingCredits) / totalCredits };
  }
  return { required, status: 'feasible', projectedCgpa: targetCgpa };
};
