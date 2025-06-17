import { useState, useEffect } from 'react';
import { CourseService } from '@/services/api/courseService';
import { useRegisteredUsers } from '@/hooks/useRegisteredUsers';

interface MainPageStats {
  coursesCount: number;
  instructorsCount: number;
  reviewsCount: number;
  registeredStudentsCount: number;
}

export function useMainPageStats() {
  const [stats, setStats] = useState<MainPageStats>({
    coursesCount: 0,
    instructorsCount: 0,
    reviewsCount: 0,
    registeredStudentsCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 獲取註冊用戶統計
  const { stats: registeredUsersStats, loading: registeredUsersLoading } = useRegisteredUsers();

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // 並行獲取課程和講師統計數據
        const [coursesWithStats, instructorsWithStats] = await Promise.all([
                CourseService.getCoursesWithStats(),
      CourseService.getInstructorsWithStats()
        ]);

        // 只計算有評論的課程和講師
        const coursesWithReviews = coursesWithStats.filter(course => course.reviewCount > 0);
        const instructorsWithReviews = instructorsWithStats.filter(instructor => instructor.reviewCount > 0);

        // 計算總評論數
        const totalReviews = coursesWithStats.reduce((sum, course) => sum + course.reviewCount, 0);

        setStats({
          coursesCount: coursesWithReviews.length,
          instructorsCount: instructorsWithReviews.length,
          reviewsCount: totalReviews,
          registeredStudentsCount: registeredUsersStats.totalRegisteredUsers
        });

      } catch (error) {
        console.error('Error loading main page stats:', error);
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    // 只有當註冊用戶數據載入完成後才開始載入其他統計
    if (!registeredUsersLoading) {
      loadStats();
    }
  }, [registeredUsersStats.totalRegisteredUsers, registeredUsersLoading]);

  return {
    stats,
    loading: loading || registeredUsersLoading,
    error
  };
} 