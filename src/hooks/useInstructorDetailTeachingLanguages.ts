import { useState, useEffect } from 'react';
import { CourseService, InstructorDetail } from '@/services/api/courseService';

interface UseInstructorDetailTeachingLanguagesProps {
  instructorDetails: InstructorDetail[];
  courseCode: string;
  termCode: string;
}

export const useInstructorDetailTeachingLanguages = ({
  instructorDetails,
  courseCode,
  termCode
}: UseInstructorDetailTeachingLanguagesProps) => {
  const [teachingLanguages, setTeachingLanguages] = useState<Map<string, string | null>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeachingLanguages = async () => {
      if (!instructorDetails || instructorDetails.length === 0 || !courseCode || !termCode) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Prepare instructor details for batch query
        const instructorDetailParams = instructorDetails.map(detail => ({
          courseCode,
          termCode,
          instructorName: detail.instructor_name,
          sessionType: detail.session_type
        }));

        // Batch load teaching languages
        const teachingLanguagesMap = await CourseService.getBatchInstructorDetailTeachingLanguages(
          instructorDetailParams
        );

        setTeachingLanguages(teachingLanguagesMap);
      } catch (error) {
        console.error('Error loading instructor detail teaching languages:', error);
        setTeachingLanguages(new Map());
      } finally {
        setLoading(false);
      }
    };

    loadTeachingLanguages();
  }, [instructorDetails, courseCode, termCode]);

  // Helper function to get teaching language for a specific instructor detail
  const getTeachingLanguageForInstructor = (instructorName: string, sessionType: string): string | null => {
    const key = `${courseCode}|${termCode}|${instructorName}|${sessionType}`;
    return teachingLanguages.get(key) || null;
  };

  return {
    teachingLanguages,
    loading,
    getTeachingLanguageForInstructor
  };
}; 