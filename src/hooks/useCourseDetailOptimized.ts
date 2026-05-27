import { useState, useEffect } from 'react';
import { CourseService, Course, CourseTeachingInfo, CourseReviewInfo } from '@/services/api/courseService';
import { useLanguage } from '@/hooks/useLanguage';

interface CourseDetailData {
  course: Course | null;
  courseStats: {
    averageRating: number;
    reviewCount: number;
  };
  teachingInfo: CourseTeachingInfo[];
  reviews: (CourseReviewInfo & { upvotes: number; downvotes: number; userVote?: 'up' | 'down' | null })[];
  allReviewsForChart: (CourseReviewInfo & { upvotes: number; downvotes: number; userVote?: 'up' | 'down' | null })[];
  isOfferedInCurrentTerm: boolean;
  detailedStats: {
    averageWorkload: number;
    averageDifficulty: number;
    averageUsefulness: number;
  };
}

interface CourseDetailOptimized {
  data: CourseDetailData;
  loading: boolean;
  error: string | null;
  teachingInfoLoading: boolean;
  reviewsLoading: boolean;
}

export const useCourseDetailOptimized = (
  courseCode: string | null, 
  userId?: string,
  language?: string,
  currentTermCode?: string
): CourseDetailOptimized => {
  const { t } = useLanguage();
  const [data, setData] = useState<CourseDetailData>({
    course: null,
    courseStats: {
      averageRating: 0,
      reviewCount: 0
    },
    teachingInfo: [],
    reviews: [],
    allReviewsForChart: [],
    isOfferedInCurrentTerm: false,
    detailedStats: {
      averageWorkload: 0,
      averageDifficulty: 0,
      averageUsefulness: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [teachingInfoLoading, setTeachingInfoLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseCode) {
      setError(t('pages.courseDetail.courseCodeNotProvided'));
      setLoading(false);
      setTeachingInfoLoading(false);
      setReviewsLoading(false);
      return;
    }

    const loadCourseData = async () => {
      try {
        setLoading(true);
        setTeachingInfoLoading(true);
        setReviewsLoading(true);
        setError(null);

        const startTime = Date.now();

        // 並行載入所有數據（包括新增的課程開設狀態和詳細統計）
        const baseDataPromise = Promise.all([
          CourseService.getCourseByCode(courseCode),
          CourseService.getCourseStats(courseCode),
          CourseService.getCourseTeachingInfoOptimized(courseCode),
          CourseService.getCourseReviewsWithVotesOptimized(courseCode, userId), // 所有評論（不自動過濾語言）
          CourseService.getCourseReviewsWithVotesOptimized(courseCode, userId), // 所有評論（用於圖表）
          CourseService.getCourseDetailedStatsOptimized(courseCode)
        ]);

        // 只有提供了 currentTermCode 時才檢查課程開設狀態
        const offerCheckPromise = currentTermCode 
          ? CourseService.isCourseOfferedInTerm(courseCode, currentTermCode)
          : Promise.resolve(false);

        const [baseResults, isOfferedData] = await Promise.all([
          baseDataPromise, 
          offerCheckPromise
        ]);
        
        // 安全地解構結果
        const [courseData, statsData, teachingInfoData, reviewsData, allReviewsData, detailedStatsData] = baseResults;

        const loadTime = Date.now() - startTime;
        console.log(`Optimized course detail data loaded in ${loadTime}ms for:`, courseCode);

        if (!courseData) {
          setError(t('pages.courseDetail.courseNotFound'));
          return;
        }

        // 一次性更新所有數據
        setData({
          course: courseData,
          courseStats: {
            averageRating: statsData.averageRating,
            reviewCount: statsData.reviewCount
          },
          teachingInfo: teachingInfoData,
          reviews: reviewsData,
          allReviewsForChart: allReviewsData,
          isOfferedInCurrentTerm: isOfferedData,
          detailedStats: {
            averageWorkload: detailedStatsData.averageWorkload,
            averageDifficulty: detailedStatsData.averageDifficulty,
            averageUsefulness: detailedStatsData.averageUsefulness
          }
        });

      } catch (error) {
        console.error('Failed to load course data:', error);
        setError(t('pages.courseDetail.failedToLoadCourse'));
      } finally {
        // 一次性關閉所有載入狀態（類似講師詳情頁面）
        setLoading(false);
        setTeachingInfoLoading(false);
        setReviewsLoading(false);
      }
    };

    loadCourseData();
    // 注意：不要把 language 加入依賴。課程資料含多語欄位（_tc/_sc），
    // 切換網站語言時無需重新查詢資料庫，否則每次切換語言都會觸發整頁約 7 次 Appwrite 讀取。
  }, [courseCode, userId, currentTermCode]);

  return {
    data,
    loading,
    error,
    teachingInfoLoading,
    reviewsLoading
  };
}; 