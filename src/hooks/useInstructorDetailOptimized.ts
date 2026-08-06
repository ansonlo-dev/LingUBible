import { useState, useEffect } from 'react';
import { CourseService, InstructorTeachingCourse, InstructorReviewFromDetails, OfferingLookup } from '@/services/api/courseService';
import { useAuth } from '@/contexts/AuthContext';

interface InstructorDetailData {
  teachingCourses: InstructorTeachingCourse[];
  /** 該講師各課程 / 學期 / 場次的學額 / 收生資料（course_offerings） */
  offerings: OfferingLookup;
  reviews: (InstructorReviewFromDetails & { upvotes: number; downvotes: number; userVote?: 'up' | 'down' | null })[];
}

interface InstructorDetailOptimized {
  data: InstructorDetailData;
  loading: boolean;
  error: string | null;
  teachingCoursesLoading: boolean;
  reviewsLoading: boolean;
}

export const useInstructorDetailOptimized = (instructorName: string | null): InstructorDetailOptimized => {
  const { user } = useAuth();
  const [data, setData] = useState<InstructorDetailData>({
    teachingCourses: [],
    offerings: { byTerm: new Map(), bySession: new Map() },
    reviews: []
  });
  const [loading, setLoading] = useState(true);
  const [teachingCoursesLoading, setTeachingCoursesLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!instructorName) {
      setLoading(false);
      setTeachingCoursesLoading(false);
      setReviewsLoading(false);
      return;
    }

    const loadInstructorData = async () => {
      try {
        setLoading(true);
        setTeachingCoursesLoading(true);
        setReviewsLoading(true);
        setError(null);

        const startTime = Date.now();

        // 並行載入教學課程、評論數據（包含投票信息）與學額資料。
        // 學額資料以 6 小時被動快取保存，重複瀏覽同一講師頁不會再產生讀取。
        const [teachingCourses, reviews, offerings] = await Promise.all([
          CourseService.getInstructorTeachingCoursesOptimized(instructorName),
          CourseService.getInstructorReviewsFromDetailsWithVotesBatch(instructorName, user?.$id),
          CourseService.getInstructorOfferings(instructorName)
        ]);

        const loadTime = Date.now() - startTime;
        console.log(`Optimized instructor detail data loaded in ${loadTime}ms for:`, instructorName);

        setData({
          teachingCourses,
          offerings,
          reviews
        });
      } catch (err) {
        console.error('Error loading instructor detail data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load instructor data');
      } finally {
        setLoading(false);
        setTeachingCoursesLoading(false);
        setReviewsLoading(false);
      }
    };

    loadInstructorData();
  }, [instructorName]);

  return {
    data,
    loading,
    error,
    teachingCoursesLoading,
    reviewsLoading
  };
}; 