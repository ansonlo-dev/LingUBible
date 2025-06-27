import { useState, useEffect } from 'react';
import { CourseService, Course, CourseTeachingInfo, CourseReviewInfo } from '@/services/api/courseService';

interface CourseDetailData {
  course: Course | null;
  courseStats: {
    averageRating: number;
    reviewCount: number;
  };
  teachingInfo: CourseTeachingInfo[];
  reviews: (CourseReviewInfo & { upvotes: number; downvotes: number; userVote?: 'up' | 'down' | null })[];
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
  language?: string
): CourseDetailOptimized => {
  const [data, setData] = useState<CourseDetailData>({
    course: null,
    courseStats: {
      averageRating: 0,
      reviewCount: 0
    },
    teachingInfo: [],
    reviews: []
  });
  const [loading, setLoading] = useState(true);
  const [teachingInfoLoading, setTeachingInfoLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseCode) {
      setError('Course code not provided');
      setLoading(false);
      return;
    }

    const loadCourseData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 第一階段：載入基本課程信息和統計（快速顯示）
        const [courseData, statsData] = await Promise.all([
          CourseService.getCourseByCode(courseCode),
          CourseService.getCourseStats(courseCode)
        ]);

        if (!courseData) {
          setError('Course not found');
          setLoading(false);
          return;
        }

        // 更新基本數據，允許頁面快速渲染
        setData(prev => ({
          ...prev,
          course: courseData,
          courseStats: {
            averageRating: statsData.averageRating,
            reviewCount: statsData.reviewCount
          }
        }));
        
        setLoading(false);

        // 第二階段：並行載入教學信息和評論（背景載入）
        const loadDetailedData = async () => {
          try {
            // 並行載入教學信息和評論
            const [teachingInfoData, reviewsData] = await Promise.all([
              CourseService.getCourseTeachingInfoOptimized(courseCode).finally(() => {
                setTeachingInfoLoading(false);
              }),
              CourseService.getCourseReviewsWithVotesOptimized(courseCode, userId, language).finally(() => {
                setReviewsLoading(false);
              })
            ]);

            // 更新詳細數據
            setData(prev => ({
              ...prev,
              teachingInfo: teachingInfoData,
              reviews: reviewsData
            }));

          } catch (detailError) {
            console.error('Failed to load detailed course data:', detailError);
            // 詳細數據載入失敗不影響基本內容顯示
            setTeachingInfoLoading(false);
            setReviewsLoading(false);
          }
        };

        // 在背景中載入詳細數據
        loadDetailedData();

      } catch (error) {
        console.error('Failed to load course data:', error);
        setError('Failed to load course information');
        setLoading(false);
        setTeachingInfoLoading(false);
        setReviewsLoading(false);
      }
    };

    loadCourseData();
  }, [courseCode, userId, language]);

  return {
    data,
    loading,
    error,
    teachingInfoLoading,
    reviewsLoading
  };
}; 