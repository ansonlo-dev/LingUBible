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
        // 優化的漸進式載入：直接載入完整數據，先顯示基本欄位
        setStatsLoading(true);
        
        try {
          // 並行載入所有需要的數據
          const instructorsWithStats = await CourseService.getAllInstructorsWithDetailedStats();
          
          // 先顯示基本講師信息（重置統計信息）
          const instructorsWithEmptyStats: InstructorWithDetailedStats[] = instructorsWithStats.map(instructor => ({
            ...instructor,
            reviewCount: 0,
            teachingScore: 0,
            gradingFairness: 0,
            averageGPA: 0,
            isTeachingInCurrentTerm: instructor.isTeachingInCurrentTerm // 保留此信息
          }));
          
          setInstructors(instructorsWithEmptyStats);
          setLoading(false);
          
          // 短暫延遲後顯示完整統計信息，創造漸進式載入體驗
          setTimeout(() => {
            setInstructors(instructorsWithStats);
            setStatsLoading(false);
          }, 300);
          
        } catch (statsError) {
          console.error('Error loading instructor stats:', statsError);
          setError('Failed to load instructors');
          setLoading(false);
          setStatsLoading(false);
        }
      } else {
        // 直接載入完整數據
        const instructorsWithStats = await CourseService.getAllInstructorsWithDetailedStats();
        setInstructors(instructorsWithStats);
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