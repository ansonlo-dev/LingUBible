import { useState, useEffect } from 'react';
import { CourseService } from '@/services/api/courseService';

interface InstructorDetailParam {
  courseCode: string;
  termCode: string;
  instructorName: string;
  sessionType: string;
}

interface UseInstructorDetailTeachingLanguagesProps {
  params: InstructorDetailParam[];
}

export const useInstructorDetailTeachingLanguages = ({
  params
}: UseInstructorDetailTeachingLanguagesProps) => {
  const [teachingLanguages, setTeachingLanguages] = useState<Map<string, string | null>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeachingLanguages = async () => {
      if (!params || params.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const teachingLanguagesMap = await CourseService.getBatchInstructorDetailTeachingLanguages(params);

        setTeachingLanguages(teachingLanguagesMap);
      } catch (error) {
        console.error('Error loading instructor detail teaching languages:', error);
        setTeachingLanguages(new Map());
      } finally {
        setLoading(false);
      }
    };

    loadTeachingLanguages();
  }, [params]);

  const getTeachingLanguageForInstructor = (
    courseCode: string,
    termCode: string,
    instructorName: string,
    sessionType: string
  ): string | null => {
    const key = `${courseCode}|${termCode}|${instructorName}|${sessionType}`;
    return teachingLanguages.get(key) || null;
  };

  return {
    teachingLanguages,
    loading,
    getTeachingLanguageForInstructor
  };
};
