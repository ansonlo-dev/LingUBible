/**
 * Grade to GPA conversion utility for Hong Kong university system
 * Based on standard Hong Kong university grading scale
 */

export interface GradeInfo {
  grade: string;
  gpa: number;
  description: string;
}

// Standard Hong Kong university grade to GPA mapping
const GRADE_TO_GPA_MAP: Record<string, GradeInfo> = {
  'A+': { grade: 'A+', gpa: 4.30, description: 'Excellent' },
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