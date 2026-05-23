import { useState, useEffect } from 'react';
import { CourseService } from '@/services/api/courseService';
import { useRegisteredUsers } from '@/hooks/useRegisteredUsers';

interface MainPageStats {
  coursesWithReviewsCount: number;
  coursesWithReviewsLast30Days: number;
  instructorsCount: number;
  instructorsWithReviewsCount: number;
  instructorsWithReviewsLast30Days: number;
  reviewsCount: number;
  reviewsLast30Days: number;
  verifiedStudentsCount: number;
  verifiedStudentsLast30Days: number;
}

export function useMainPageStats() {
  const [stats, setStats] = useState<MainPageStats>({
    coursesWithReviewsCount: 0,
    coursesWithReviewsLast30Days: 0,
    instructorsCount: 0,
    instructorsWithReviewsCount: 0,
    instructorsWithReviewsLast30Days: 0,
    reviewsCount: 0,
    reviewsLast30Days: 0,
    verifiedStudentsCount: 0,
    verifiedStudentsLast30Days: 0
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

        // 🚀 使用優化的統計方法，大幅減少 API 調用和數據傳輸
        const optimizedStats = await CourseService.getMainPageStatsOptimized();

        setStats({
          coursesWithReviewsCount: optimizedStats.coursesWithReviewsCount,
          coursesWithReviewsLast30Days: optimizedStats.coursesWithReviewsLast30Days,
          instructorsCount: optimizedStats.instructorsCount,
          instructorsWithReviewsCount: optimizedStats.instructorsWithReviewsCount,
          instructorsWithReviewsLast30Days: optimizedStats.instructorsWithReviewsLast30Days,
          reviewsCount: optimizedStats.reviewsCount,
          reviewsLast30Days: optimizedStats.reviewsLast30Days,
          verifiedStudentsCount: registeredUsersStats.verifiedUsers,
          verifiedStudentsLast30Days: registeredUsersStats.newUsersLast30Days
        });

        console.log('📊 優化主頁統計數據載入完成:', {
          coursesWithReviews: optimizedStats.coursesWithReviewsCount,
          instructorsWithReviews: optimizedStats.instructorsWithReviewsCount,
          totalReviews: optimizedStats.reviewsCount,
          verifiedStudentsCount: registeredUsersStats.verifiedUsers,
          verifiedStudentsLast30Days: registeredUsersStats.newUsersLast30Days
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