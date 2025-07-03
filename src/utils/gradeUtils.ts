/**
 * Grade to GPA conversion utility for Hong Kong university system
 * Based on standard Hong Kong university grading scale
 */

export interface GradeInfo {
  grade: string;
  gpa: number;
  description: string;
}

export interface GradeStatistics {
  mean: number | null;
  standardDeviation: number | null;
  totalCount: number;
  gradeDistribution: Record<string, number>;
}

// Standard Hong Kong university grade to GPA mapping
const GRADE_TO_GPA_MAP: Record<string, GradeInfo> = {
  'A': { grade: 'A', gpa: 4.00, description: 'Excellent' },
  'A-': { grade: 'A-', gpa: 3.67, description: 'Excellent' },
  'B+': { grade: 'B+', gpa: 3.33, description: 'Good' },
  'B': { grade: 'B', gpa: 3.00, description: 'Good' },
  'B-': { grade: 'B-', gpa: 2.67, description: 'Good' },
  'C+': { grade: 'C+', gpa: 2.33, description: 'Fair' },
  'C': { grade: 'C', gpa: 2.00, description: 'Fair' },
  'C-': { grade: 'C-', gpa: 1.67, description: 'Fair' },
  'D+': { grade: 'D+', gpa: 1.33, description: 'Pass' },
  'D': { grade: 'D', gpa: 1.00, description: 'Pass' },
  'F': { grade: 'F', gpa: 0.00, description: 'Failure' },
  'I': { grade: 'I', gpa: 0.00, description: 'Incomplete' },
  'M': { grade: 'M', gpa: 0.00, description: 'Merit' },
  'VS': { grade: 'VS', gpa: 0.00, description: 'Very Satisfactory' },
  'S': { grade: 'S', gpa: 0.00, description: 'Satisfactory' },
  'U': { grade: 'U', gpa: 0.00, description: 'Unsatisfactory' },
  'P': { grade: 'P', gpa: 0.00, description: 'Pass' },
  'W': { grade: 'W', gpa: 0.00, description: 'Withdrawn' },
  'AU': { grade: 'AU', gpa: 0.00, description: 'Audit' }
};

// Grade order for sorting (best to worst)
const GRADE_ORDER = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'N/A'];

/**
 * Get GPA information for a given grade
 * @param grade - The letter grade (e.g., 'A+', 'B', 'C-')
 * @returns GradeInfo object with grade, GPA, and description, or null if grade not found
 */
export const getGradeInfo = (grade: string): GradeInfo | null => {
  if (!grade) return null;
  
  const normalizedGrade = grade.trim().toUpperCase();
  return GRADE_TO_GPA_MAP[normalizedGrade] || null;
};

/**
 * Get GPA value for a given grade
 * @param grade - The letter grade
 * @returns GPA value as number, or null if grade not found
 */
export const getGPA = (grade: string): number | null => {
  const gradeInfo = getGradeInfo(grade);
  return gradeInfo ? gradeInfo.gpa : null;
};

/**
 * Format GPA for display
 * @param gpa - GPA value
 * @returns Formatted GPA string
 */
export const formatGPA = (gpa: number): string => {
  return gpa.toFixed(2);
};

/**
 * Get formatted GPA string for a grade
 * @param grade - The letter grade
 * @returns Formatted GPA string or null if grade not found
 */
export const getFormattedGPA = (grade: string): string | null => {
  const gpa = getGPA(grade);
  return gpa !== null ? formatGPA(gpa) : null;
};

/**
 * Get all available grades
 * @returns Array of all grade strings
 */
export const getAllGrades = (): string[] => {
  return Object.keys(GRADE_TO_GPA_MAP);
};

/**
 * Check if a grade is valid
 * @param grade - The grade to validate
 * @returns true if grade is valid, false otherwise
 */
export const isValidGrade = (grade: string): boolean => {
  return getGradeInfo(grade) !== null;
};

/**
 * Normalize grade from review data (handle -1 and empty values)
 * @param grade - Raw grade value from review
 * @returns Normalized grade string
 */
export const normalizeGrade = (grade: string | null | undefined): string => {
  if (!grade || grade === '-1' || grade.trim() === '') {
    return 'N/A';
  }
  return grade.trim().toUpperCase();
};

/**
 * Sort grades in descending order (A+ to F, then N/A)
 * @param grades - Array of grade strings
 * @returns Sorted array of grades
 */
export const sortGradesDescending = (grades: string[]): string[] => {
  return [...grades].sort((a, b) => {
    const aIndex = GRADE_ORDER.indexOf(a);
    const bIndex = GRADE_ORDER.indexOf(b);
    
    // If grade not found in order, put it at the end
    const aOrder = aIndex === -1 ? GRADE_ORDER.length : aIndex;
    const bOrder = bIndex === -1 ? GRADE_ORDER.length : bIndex;
    
    return aOrder - bOrder;
  });
};

/**
 * Get complete grade distribution with all grades (including 0 counts)
 * @param gradeDistribution - Existing grade distribution
 * @returns Complete distribution with all possible grades
 */
export const getCompleteGradeDistribution = (gradeDistribution: Record<string, number>): Record<string, number> => {
  const completeDistribution: Record<string, number> = {};
  
  // Initialize all grades with 0
  GRADE_ORDER.forEach(grade => {
    completeDistribution[grade] = gradeDistribution[grade] || 0;
  });
  
  // Add any additional grades from the input that aren't in the standard order
  Object.keys(gradeDistribution).forEach(grade => {
    if (!GRADE_ORDER.includes(grade)) {
      completeDistribution[grade] = gradeDistribution[grade];
    }
  });
  
  return completeDistribution;
};

/**
 * Calculate grade statistics including mean GPA and standard deviation
 * @param gradeDistribution - Grade distribution data
 * @returns Statistics object with mean, standard deviation, etc.
 */
export const calculateGradeStatistics = (gradeDistribution: Record<string, number>): GradeStatistics => {
  const totalCount = Object.values(gradeDistribution).reduce((sum, count) => sum + count, 0);
  
  if (totalCount === 0) {
    return {
      mean: null,
      standardDeviation: null,
      totalCount: 0,
      gradeDistribution
    };
  }
  
  // Calculate mean GPA (excluding N/A grades)
  let totalGPA = 0;
  let validGradeCount = 0;
  
  Object.entries(gradeDistribution).forEach(([grade, count]) => {
    if (grade !== 'N/A' && count > 0) {
      const gpa = getGPA(grade);
      if (gpa !== null) {
        totalGPA += gpa * count;
        validGradeCount += count;
      }
    }
  });
  
  if (validGradeCount === 0) {
    return {
      mean: null,
      standardDeviation: null,
      totalCount,
      gradeDistribution
    };
  }
  
  const mean = totalGPA / validGradeCount;
  
  // Calculate standard deviation
  let varianceSum = 0;
  Object.entries(gradeDistribution).forEach(([grade, count]) => {
    if (grade !== 'N/A' && count > 0) {
      const gpa = getGPA(grade);
      if (gpa !== null) {
        const deviation = gpa - mean;
        varianceSum += (deviation * deviation) * count;
      }
    }
  });
  
  const variance = varianceSum / validGradeCount;
  const standardDeviation = Math.sqrt(variance);
  
  return {
    mean,
    standardDeviation,
    totalCount,
    gradeDistribution
  };
};

/**
 * Calculate grade distribution from review data
 * @param reviews - Array of reviews with course_final_grade field
 * @returns Grade distribution object
 */
export const calculateGradeDistributionFromReviews = (reviews: Array<{ course_final_grade?: string | null }>): Record<string, number> => {
  const distribution: Record<string, number> = {};
  
  reviews.forEach(review => {
    const normalizedGrade = normalizeGrade(review.course_final_grade);
    distribution[normalizedGrade] = (distribution[normalizedGrade] || 0) + 1;
  });
  
  return distribution;
}; 