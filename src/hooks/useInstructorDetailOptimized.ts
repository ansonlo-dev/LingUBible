import { useState, useEffect } from 'react';
import { CourseService, InstructorTeachingCourse, InstructorReviewFromDetails } from '@/services/api/courseService';
import { useAuth } from '@/contexts/AuthContext';

interface InstructorDetailData {
  teachingCourses: InstructorTeachingCourse[];
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

        // 並行載入教學課程和評論數據（包含投票信息）
        const [teachingCourses, reviews] = await Promise.all([
          CourseService.getInstructorTeachingCoursesOptimized(instructorName),
          CourseService.getInstructorReviewsFromDetailsWithVotesBatch(instructorName, user?.$id)
        ]);

        const loadTime = Date.now() - startTime;
        console.log(`Optimized instructor detail data loaded in ${loadTime}ms for:`, instructorName);

        setData({
          teachingCourses,
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