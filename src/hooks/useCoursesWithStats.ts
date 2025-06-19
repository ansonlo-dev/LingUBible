import { useState, useEffect } from 'react';
import { CourseService, CourseWithStats } from '@/services/api/courseService';

interface UseCoursesWithStatsOptions {
  enableProgressiveLoading?: boolean;
  searchTerm?: string;
}

interface UseCoursesWithStatsReturn {
  courses: CourseWithStats[];
  filteredCourses: CourseWithStats[];
  loading: boolean;
  statsLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCoursesWithStats(options: UseCoursesWithStatsOptions = {}): UseCoursesWithStatsReturn {
  const { enableProgressiveLoading = true, searchTerm = '' } = options;
  
  const [courses, setCourses] = useState<CourseWithStats[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (enableProgressiveLoading) {
        // 漸進式載入：先顯示基本課程，然後載入統計信息
        const basicCourses = await CourseService.getAllCourses();
        
        // 先顯示基本課程（無統計信息）
        const coursesWithEmptyStats: CourseWithStats[] = basicCourses.map(course => ({
          ...course,
          reviewCount: 0,
          averageRating: 0,
          studentCount: 0,
          isOfferedInCurrentTerm: false
        }));
        
        setCourses(coursesWithEmptyStats);
        setLoading(false);
        
        // 背景載入完整統計信息
        setStatsLoading(true);
        try {
          const coursesWithStats = await CourseService.getCoursesWithStatsBatch();
          setCourses(coursesWithStats);
        } catch (statsError) {
          console.error('Error loading course stats:', statsError);
          // 統計信息載入失敗不影響基本功能
        } finally {
          setStatsLoading(false);
        }
      } else {
        // 直接載入完整數據
        const coursesWithStats = await CourseService.getCoursesWithStatsBatch();
        setCourses(coursesWithStats);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error loading courses:', err);
      setError('Failed to load courses');
      setLoading(false);
    }
  };

  // 處理搜尋過濾
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCourses(courses);
      return;
    }

    const filtered = courses.filter(course =>
      course.course_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_department.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredCourses(filtered);
  }, [courses, searchTerm]);

  // 初始載入
  useEffect(() => {
    loadCourses();
  }, []);

  return {
    courses,
    filteredCourses,
    loading,
    statsLoading,
    error,
    refetch: loadCourses
  };
} 