import { useState, useEffect, useRef } from 'react';
import { CourseService, InstructorWithDetailedStats } from '@/services/api/courseService';
import { getCurrentTermCode } from '@/utils/dateUtils';

interface UseInstructorsWithStatsOptions {
  enableProgressiveLoading?: boolean;
  searchTerm?: string;
  preloadTermData?: boolean; // 是否預載入學期數據
}

interface UseInstructorsWithStatsReturn {
  instructors: InstructorWithDetailedStats[];
  filteredInstructors: InstructorWithDetailedStats[];
  loading: boolean;
  statsLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  // 學期數據相關
  termInstructorsMap: Map<string, Set<string>>;
  termDataLoading: boolean;
  getInstructorsForTerm: (termCode: string) => Set<string>;
}

export function useInstructorsWithStats(options: UseInstructorsWithStatsOptions = {}): UseInstructorsWithStatsReturn {
  const { enableProgressiveLoading = true, searchTerm = '', preloadTermData = false } = options;
  
  const [instructors, setInstructors] = useState<InstructorWithDetailedStats[]>([]);
  const [filteredInstructors, setFilteredInstructors] = useState<InstructorWithDetailedStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 學期數據狀態
  const [termInstructorsMap, setTermInstructorsMap] = useState<Map<string, Set<string>>>(new Map());
  const [termDataLoading, setTermDataLoading] = useState(false);
  
  // 使用 ref 來避免重複載入
  const loadingRef = useRef(false);
  const termDataLoadingRef = useRef(false);

  const loadInstructors = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    
    try {
      setLoading(true);
      setError(null);
      
      if (enableProgressiveLoading) {
        // 第一階段：快速載入基本講師信息
        const basicInstructors = await CourseService.getAllInstructors();
        
        // 先顯示基本講師（無統計信息）
        const instructorsWithEmptyStats: InstructorWithDetailedStats[] = basicInstructors.map(instructor => ({
          ...instructor,
          reviewCount: 0,
          teachingScore: 0,
          gradingFairness: 0,
          isTeachingInCurrentTerm: false
        }));
        
        setInstructors(instructorsWithEmptyStats);
        setLoading(false);
        
        // 第二階段：載入詳細統計數據
        setStatsLoading(true);
        try {
          const instructorNames = basicInstructors.map(instructor => instructor.name);
          
          // 並行載入基本統計和詳細評分數據
          const [instructorsWithStats, detailedRatings] = await Promise.all([
            CourseService.getAllInstructorsWithDetailedStats(),
            CourseService.getBatchInstructorDetailedStats(instructorNames)
          ]);
          
          // 合併詳細評分數據
          const enhancedInstructors = instructorsWithStats.map(instructor => {
            const detailedStats = detailedRatings.get(instructor.name);
            if (detailedStats) {
              return {
                ...instructor,
                reviewCount: detailedStats.reviewCount,
                teachingScore: detailedStats.teachingScore,
                gradingFairness: detailedStats.gradingFairness
              };
            }
            return instructor;
          });
          
          setInstructors(enhancedInstructors);
        } catch (statsError) {
          console.error('Error loading instructor stats:', statsError);
          // 如果詳細統計載入失敗，至少載入基本統計
          try {
            const instructorsWithStats = await CourseService.getAllInstructorsWithDetailedStats();
            setInstructors(instructorsWithStats);
          } catch (fallbackError) {
            console.error('Error loading fallback instructor stats:', fallbackError);
          }
        } finally {
          setStatsLoading(false);
        }
      } else {
        // 非漸進式載入：一次性載入所有數據
        const instructorsWithStats = await CourseService.getAllInstructorsWithDetailedStats();
        const instructorNames = instructorsWithStats.map(instructor => instructor.name);
        
        // 並行載入詳細評分數據
        const detailedRatings = await CourseService.getBatchInstructorDetailedStats(instructorNames);
        
        // 合併詳細評分數據
        const enhancedInstructors = instructorsWithStats.map(instructor => {
          const detailedStats = detailedRatings.get(instructor.name);
          if (detailedStats) {
            return {
              ...instructor,
              reviewCount: detailedStats.reviewCount,
              teachingScore: detailedStats.teachingScore,
              gradingFairness: detailedStats.gradingFairness
            };
          }
          return instructor;
        });
        
        setInstructors(enhancedInstructors);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error loading instructors:', err);
      setError('Failed to load instructors');
      setLoading(false);
    } finally {
      loadingRef.current = false;
    }
  };

  // 載入學期數據的函數
  const loadTermData = async () => {
    if (termDataLoadingRef.current || !preloadTermData) return;
    termDataLoadingRef.current = true;
    
    try {
      setTermDataLoading(true);
      
      // 獲取所有學期的講師教學狀態
      const allTermsInstructorsMap = await CourseService.getAllTermsInstructorsTeachingBatch();
      setTermInstructorsMap(allTermsInstructorsMap);
      
    } catch (error) {
      console.error('Error loading term data:', error);
      // 學期數據載入失敗不影響基本功能
    } finally {
      setTermDataLoading(false);
      termDataLoadingRef.current = false;
    }
  };

  // 獲取特定學期講師的函數
  const getInstructorsForTerm = (termCode: string): Set<string> => {
    if (termCode === 'all') {
      // 返回所有講師
      return new Set(instructors.map(instructor => instructor.name));
    }
    
    if (termCode === getCurrentTermCode()) {
      // 返回當前學期教學的講師
      return new Set(instructors.filter(instructor => instructor.isTeachingInCurrentTerm).map(instructor => instructor.name));
    }
    
    // 從緩存的學期數據中獲取
    return termInstructorsMap.get(termCode) || new Set();
  };

  // 處理搜尋過濾
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredInstructors(instructors);
      return;
    }

    const filtered = instructors.filter(instructor =>
      instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructor.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredInstructors(filtered);
  }, [instructors, searchTerm]);

  // 初始載入
  useEffect(() => {
    loadInstructors();
  }, []);

  // 預載入學期數據
  useEffect(() => {
    if (preloadTermData && instructors.length > 0) {
      loadTermData();
    }
  }, [preloadTermData, instructors.length]);

  return {
    instructors,
    filteredInstructors,
    loading,
    statsLoading,
    error,
    refetch: loadInstructors,
    // 學期數據相關
    termInstructorsMap,
    termDataLoading,
    getInstructorsForTerm
  };
} 