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
        // 優化的漸進式載入：直接載入完整數據，先顯示基本欄位
        setStatsLoading(true);
        
        try {
          const coursesWithStats = await CourseService.getCoursesWithStats();
          
          // 先顯示基本課程信息（重置統計信息）
          const coursesWithEmptyStats: CourseWithStats[] = coursesWithStats.map(course => ({
            ...course,
            reviewCount: 0,
            averageRating: 0,
            studentCount: 0,
            averageWorkload: -1,
            averageDifficulty: -1,
            averageUsefulness: -1,
            averageGPA: 0,
            isOfferedInCurrentTerm: course.isOfferedInCurrentTerm // 保留此信息
          }));
          
          setCourses(coursesWithEmptyStats);
          setLoading(false);
          
          // 短暫延遲後顯示完整統計信息，創造漸進式載入體驗
          setTimeout(() => {
            setCourses(coursesWithStats);
            setStatsLoading(false);
          }, 300);
          
        } catch (error) {
          console.error('Error loading courses:', error);
          setError('Failed to load courses');
          setLoading(false);
          setStatsLoading(false);
        }
      } else {
        // 直接載入完整數據
        const coursesWithStats = await CourseService.getCoursesWithStats();
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