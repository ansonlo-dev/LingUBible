import { useState, useEffect } from 'react';
import { CourseService } from '@/services/api/courseService';

interface InstructorDetailedStats {
  reviewCount: number;
  teachingScore: number;
  gradingFairness: number;
}

export function useInstructorDetailedStats(instructorName: string) {
  const [stats, setStats] = useState<InstructorDetailedStats>({
    reviewCount: 0,
    teachingScore: 0,
    gradingFairness: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!instructorName) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // 獲取講師的詳細統計信息 - 使用優化版本重用緩存
        const instructorsWithStats = await CourseService.getPopularInstructorsWithDetailedStatsOptimized(100);
        const instructorStats = instructorsWithStats.find(instructor => instructor.name === instructorName);
        
        if (instructorStats) {
          setStats({
            reviewCount: instructorStats.reviewCount,
            teachingScore: instructorStats.teachingScore,
            gradingFairness: instructorStats.gradingFairness
          });
        } else {
          setStats({
            reviewCount: 0,
            teachingScore: 0,
            gradingFairness: 0
          });
        }
      } catch (err) {
        console.error('Error fetching instructor detailed stats:', err);
        setError('Failed to fetch instructor statistics');
        setStats({
          reviewCount: 0,
          teachingScore: 0,
          gradingFairness: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [instructorName]);

  return { stats, loading, error };
} 