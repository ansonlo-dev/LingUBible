import { useState, useEffect } from 'react';
import { CourseService, CourseWithStats } from '@/services/api/courseService';
import { globalDataManager } from '@/utils/globalDataManager';

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
        // 🚀 步驟1：檢查globalDataManager是否已載入數據，如有則立即顯示（無需進度條）
        if (globalDataManager.isDataLoaded()) {
          console.log('⚡ useCoursesWithStats: Using cached data from globalDataManager for instant display');
          
          try {
            // 從globalDataManager獲取已載入的核心數據
            const [popularCourses, topCourses] = await Promise.all([
              globalDataManager.getPopularCourses(),
              globalDataManager.getTopCourses()
            ]);
            
            // 合併並去重核心數據作為初始顯示
            const coreCoursesMap = new Map<string, CourseWithStats>();
            [...popularCourses, ...topCourses].forEach(course => {
              coreCoursesMap.set(course.course_code, course);
            });
            
            const coreCourses = Array.from(coreCoursesMap.values());
            setCourses(coreCourses);
            setLoading(false); // 立即結束載入，不顯示進度條
            
            console.log(`⚡ useCoursesWithStats: Displayed ${coreCourses.length} cached courses instantly`);
            
          } catch (error) {
            console.error('Error loading cached data, fallback to full loading:', error);
          }
        } else {
          // globalDataManager沒有緩存數據，需要載入完整數據並顯示進度條
          console.log('📚 useCoursesWithStats: No cached data, loading full dataset with progress...');
          
          try {
            const coursesWithStats = await CourseService.getCoursesWithStats();
            setCourses(coursesWithStats);
            setLoading(false);
            
            console.log(`⚡ useCoursesWithStats: Loaded ${coursesWithStats.length} courses`);
            
          } catch (error) {
            console.error('Error loading courses when no cache:', error);
            setError('Failed to load courses');
            setLoading(false);
          }
        }
        
        // 🚀 步驟2：背景載入完整數據集（不阻塞UI）
        setStatsLoading(true);
        
        setTimeout(async () => {
          try {
            console.log('📚 useCoursesWithStats: Loading full dataset in background...');
            const coursesWithStats = await CourseService.getCoursesWithStats();
            
            setCourses(coursesWithStats);
            setStatsLoading(false);
            
            console.log(`✅ useCoursesWithStats: Full dataset loaded (${coursesWithStats.length} courses)`);
          } catch (error) {
            console.error('Error loading full courses dataset:', error);
            setError('Failed to load courses');
            setStatsLoading(false);
          }
        }, 100); // 微小延遲確保UI已渲染
        
      } else {
        // 直接載入完整數據
        try {
          const coursesWithStats = await CourseService.getCoursesWithStats();
          setCourses(coursesWithStats);
          setLoading(false);
          
          console.log(`⚡ useCoursesWithStats: Loaded ${coursesWithStats.length} courses`);
          
        } catch (error) {
          console.error('Error loading courses directly:', error);
          setError('Failed to load courses');
          setLoading(false);
        }
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
      course.department.toLowerCase().includes(searchTerm.toLowerCase())
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