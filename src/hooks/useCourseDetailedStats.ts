import { useState, useEffect } from 'react';
import { CourseService } from '@/services/api/courseService';

interface CourseDetailedStats {
  reviewCount: number;
  averageRating: number;
  studentCount: number;
  averageWorkload: number;
  averageDifficulty: number;
  averageUsefulness: number;
}

export function useCourseDetailedStats(courseCode: string) {
  const [stats, setStats] = useState<CourseDetailedStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      if (!courseCode) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const detailedStats = await CourseService.getCourseDetailedStats(courseCode);
        
        if (isMounted) {
          setStats(detailedStats);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch course stats');
          setStats(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, [courseCode]);

  return { stats, isLoading, error };
} 