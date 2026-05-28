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

        // 並行載入：課程主檔、教學記錄（含講師、學期）、評論（含投票）。
        // 統計值與「當前學期開設與否」皆可從這三組資料推導，
        // 不需另外打 getCourseStats / getCourseDetailedStatsOptimized /
        // isCourseOfferedInTerm 以及第二次的 reviews 查詢 —— 每次省下 ~3
        // 份 reviews 掃描（每份最多 300~500 列）與 1 份 teaching_records 查詢。
        const [courseData, teachingInfoData, reviewsData] = await Promise.all([
          CourseService.getCourseByCode(courseCode),
          CourseService.getCourseTeachingInfoOptimized(courseCode),
          CourseService.getCourseReviewsWithVotesOptimized(courseCode, userId),
        ]);

        const loadTime = Date.now() - startTime;
        console.log(`Optimized course detail data loaded in ${loadTime}ms for:`, courseCode);

        if (!courseData) {
          setError(t('pages.courseDetail.courseNotFound'));
          return;
        }

        // 從評論集合衍生統計值（N/A 值在 DB 編碼為 -1，需排除）
        const rawReviews = reviewsData.map(r => r.review);
        const reviewCount = rawReviews.length;
        const validWorkload = rawReviews.filter(r => r.course_workload > 0);
        const validDifficulty = rawReviews.filter(r => r.course_difficulties > 0);
        const validUsefulness = rawReviews.filter(r => r.course_usefulness > 0);
        const sum = (arr: { course_workload?: number; course_difficulties?: number; course_usefulness?: number }[], key: 'course_workload' | 'course_difficulties' | 'course_usefulness') =>
          arr.reduce((acc, r) => acc + ((r[key] as number) || 0), 0);
        const averageWorkload = validWorkload.length > 0 ? sum(validWorkload, 'course_workload') / validWorkload.length : -1;
        const averageDifficulty = validDifficulty.length > 0 ? sum(validDifficulty, 'course_difficulties') / validDifficulty.length : -1;
        const averageUsefulness = validUsefulness.length > 0 ? sum(validUsefulness, 'course_usefulness') / validUsefulness.length : -1;
        const averageRating = averageUsefulness > 0 ? averageUsefulness : 0; // 與 getCourseDetailedStats 一致：使用實用性作為總體評分

        // 從教學記錄推導「課程在指定當前學期是否開設」
        const isOfferedInCurrentTerm = currentTermCode
          ? teachingInfoData.some(info => info.term.term_code === currentTermCode)
          : false;

        // 一次性更新所有數據
        setData({
          course: courseData,
          courseStats: {
            averageRating,
            reviewCount,
          },
          teachingInfo: teachingInfoData,
          reviews: reviewsData,
          allReviewsForChart: reviewsData,
          isOfferedInCurrentTerm,
          detailedStats: {
            averageWorkload,
            averageDifficulty,
            averageUsefulness,
          },
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