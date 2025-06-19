import { useState, useEffect } from 'react';
import { CourseService } from '@/services/api/courseService';
import { useRegisteredUsers } from '@/hooks/useRegisteredUsers';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';

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

        // 計算30天前的日期
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

        // 並行獲取所有需要的數據
        const [
          coursesWithStats,
          instructorsWithStats,
          allReviews,
          reviewsLast30Days
        ] = await Promise.all([
          CourseService.getCoursesWithStatsBatch(),
          CourseService.getInstructorsWithStatsBatch(),
          // 獲取所有評論來計算總數
          databases.listDocuments(
            'lingubible',
            'reviews',
            [
              Query.orderDesc('$createdAt'),
              Query.limit(2000),
              Query.select(['$id', 'course_code', 'instructor_details', '$createdAt'])
            ]
          ),
          // 獲取過去30天的評論
          databases.listDocuments(
            'lingubible',
            'reviews',
            [
              Query.greaterThan('$createdAt', thirtyDaysAgoISO),
              Query.orderDesc('$createdAt'),
              Query.limit(1000),
              Query.select(['$id', 'course_code', 'instructor_details', '$createdAt'])
            ]
          )
        ]);

        // 計算當前統計
        const coursesWithReviews = coursesWithStats.filter(course => course.reviewCount > 0).length;
        const instructorsWithReviews = instructorsWithStats.filter(instructor => instructor.reviewCount > 0).length;
        const totalReviews = allReviews.documents.length;

        // 計算30天內的精確變化
        const reviewsInLast30Days = reviewsLast30Days.documents.length;

        // 計算30天內新增有評論的課程
        const coursesWithReviewsInLast30Days = new Set();
        reviewsLast30Days.documents.forEach((review: any) => {
          coursesWithReviewsInLast30Days.add(review.course_code);
        });

        // 計算30天內新增有評論的講師
        const instructorsWithReviewsInLast30Days = new Set();
        reviewsLast30Days.documents.forEach((review: any) => {
          try {
            const instructorDetails = JSON.parse(review.instructor_details);
            instructorDetails.forEach((detail: any) => {
              instructorsWithReviewsInLast30Days.add(detail.instructor_name);
            });
          } catch (error) {
            // 忽略解析錯誤
          }
        });

        setStats({
          coursesWithReviewsCount: coursesWithReviews,
          coursesWithReviewsLast30Days: coursesWithReviewsInLast30Days.size,
          instructorsCount: instructorsWithStats.length,
          instructorsWithReviewsCount: instructorsWithReviews,
          instructorsWithReviewsLast30Days: instructorsWithReviewsInLast30Days.size,
          reviewsCount: totalReviews,
          reviewsLast30Days: reviewsInLast30Days,
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