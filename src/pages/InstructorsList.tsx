import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { getCurrentTermCode } from '@/utils/dateUtils';
import { 
  Users, 
  Search,
  Loader2,
  AlertCircle,
  Mail,
  GraduationCap,
  BookOpen,
  Star,
  MessageSquare,
  TrendingUp,
  Award,
  Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CourseService } from '@/services/api/courseService';
import { 
  InstructorWithDetailedStats
} from '@/services/api/courseService';
import { InstructorCardSkeleton } from '@/components/features/reviews/InstructorCardSkeleton';
import { PopularItemCard } from '@/components/features/reviews/PopularItemCard';
import { AdvancedInstructorFilters, InstructorFilters } from '@/components/features/reviews/AdvancedInstructorFilters';
import { Pagination } from '@/components/features/reviews/Pagination';
import { useDebounce } from '@/hooks/useDebounce';

const InstructorsList = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  
  // 篩選器狀態
  const [filters, setFilters] = useState<InstructorFilters>({
    searchTerm: '',
    department: 'all',
    teachingTerm: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
    currentPage: 1,
    itemsPerPage: 6,
  });

  // 使用防抖來優化搜尋性能
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 300);
  
  const [instructors, setInstructors] = useState<InstructorWithDetailedStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 學期篩選相關狀態
  const [termFilteredInstructors, setTermFilteredInstructors] = useState<Set<string>>(new Set());
  const [termFilterLoading, setTermFilterLoading] = useState(false);

  useEffect(() => {
    const loadInstructors = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 載入所有講師的詳細統計信息
        const instructorsWithDetailedStats = await CourseService.getAllInstructorsWithDetailedStats();
        setInstructors(instructorsWithDetailedStats);
        
      } catch (error) {
        console.error('Error loading instructors:', error);
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    loadInstructors();
  }, [t]);

  // 當學期篩選條件改變時，非同步檢查講師是否在該學期教學
  useEffect(() => {
    if (filters.teachingTerm === 'all' || filters.teachingTerm === getCurrentTermCode()) {
      // 如果是 'all' 或當前學期，不需要額外檢查
      setTermFilteredInstructors(new Set());
      setTermFilterLoading(false);
      return;
    }

    // 對於其他學期，需要非同步檢查
    const checkInstructorsForTerm = async () => {
      setTermFilterLoading(true);
      try {
        const filteredInstructorIds = new Set<string>();
        
        // 並行檢查所有講師是否在指定學期教學
        const checkPromises = instructors.map(async (instructor) => {
          const isTeaching = await CourseService.isInstructorTeachingInTerm(instructor.name, filters.teachingTerm);
          if (isTeaching) {
            filteredInstructorIds.add(instructor.$id);
          }
        });

        await Promise.all(checkPromises);
        setTermFilteredInstructors(filteredInstructorIds);
      } catch (error) {
        console.error('Error checking instructors for term:', error);
        setTermFilteredInstructors(new Set());
      } finally {
        setTermFilterLoading(false);
      }
    };

    checkInstructorsForTerm();
  }, [filters.teachingTerm, instructors]);

  // 提取可用的部門
  const { availableDepartments } = useMemo(() => {
    const departments = new Set<string>();
    
    instructors.forEach(instructor => {
      if (instructor.department) {
        departments.add(instructor.department);
      }
    });
    
    return {
      availableDepartments: Array.from(departments).sort()
    };
  }, [instructors]);

  // 篩選和排序講師
  const filteredAndSortedInstructors = useMemo(() => {
    let filtered = instructors;

    // 搜尋篩選
    if (debouncedSearchTerm.trim()) {
      filtered = filtered.filter(instructor =>
        instructor.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        instructor.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        instructor.department.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (instructor.name_tc && instructor.name_tc.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (instructor.name_sc && instructor.name_sc.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
      );
    }

    // 部門篩選
    if (filters.department !== 'all') {
      filtered = filtered.filter(instructor => instructor.department === filters.department);
    }

    // 學期篩選
    if (filters.teachingTerm !== 'all') {
      filtered = filtered.filter(instructor => {
        // 如果選擇的是當前學期，使用預先計算的屬性
        if (filters.teachingTerm === getCurrentTermCode()) {
          return instructor.isTeachingInCurrentTerm;
        }
        // 對於其他學期，使用非同步檢查的結果
        return termFilteredInstructors.has(instructor.$id);
      });
    }

    // 排序
    const sortedInstructors = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'department':
          comparison = a.department.localeCompare(b.department);
          break;
        case 'teaching':
          // 教學評分排序：有效值在前，按數值排序；無效值(0)排在後面
          const aTeaching = a.teachingScore > 0 ? a.teachingScore : -999;
          const bTeaching = b.teachingScore > 0 ? b.teachingScore : -999;
          comparison = aTeaching - bTeaching;
          break;
        case 'grading':
          // 評分公平性排序：有效值在前，按數值排序；無效值(0)排在後面
          const aGrading = a.gradingFairness > 0 ? a.gradingFairness : -999;
          const bGrading = b.gradingFairness > 0 ? b.gradingFairness : -999;
          comparison = aGrading - bGrading;
          break;
        case 'reviews':
          comparison = a.reviewCount - b.reviewCount;
          break;
        default:
          comparison = a.name.localeCompare(b.name);
          break;
      }
      
      // 根據排序順序調整結果
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return sortedInstructors;
  }, [instructors, debouncedSearchTerm, filters, termFilteredInstructors]);

  // 計算分頁數據
  const paginationData = useMemo(() => {
    const totalItems = filteredAndSortedInstructors.length;
    const totalPages = Math.ceil(totalItems / filters.itemsPerPage);
    const startIndex = (filters.currentPage - 1) * filters.itemsPerPage;
    const endIndex = startIndex + filters.itemsPerPage;
    const currentPageInstructors = filteredAndSortedInstructors.slice(startIndex, endIndex);

    return {
      totalItems,
      totalPages,
      currentPageInstructors
    };
  }, [filteredAndSortedInstructors, filters.itemsPerPage, filters.currentPage]);

  const handleFiltersChange = (newFilters: InstructorFilters) => {
    // 如果不是只更改分頁相關的設置，就重置到第一頁
    if (newFilters.searchTerm !== filters.searchTerm ||
        newFilters.department !== filters.department ||
        newFilters.teachingTerm !== filters.teachingTerm ||
        newFilters.sortBy !== filters.sortBy ||
        newFilters.sortOrder !== filters.sortOrder) {
      newFilters.currentPage = 1;
    }
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, currentPage: page }));
    // 滾動到頁面頂部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearAll = () => {
    setFilters({
      searchTerm: '',
      department: 'all',
      teachingTerm: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
      itemsPerPage: 6,
      currentPage: 1,
    });
  };

  // 頂部區域組件，與課程頁面保持一致
  const HeaderSection = () => (
    <div className="text-center">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        {t('pages.instructors.title')}
      </h1>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          {/* 頁面標題 */}
          <HeaderSection />

          {/* 載入指示器 */}
          <div className="text-center mt-4">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('common.loading')}
            </div>
          </div>

          {/* 講師卡片骨架 */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto mt-4">
            {Array.from({ length: 9 }).map((_, index) => (
              <InstructorCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          {/* 頁面標題 */}
          <HeaderSection />

          <div className="flex justify-center items-center min-h-[400px] mt-4">
            <Card className="max-w-md">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('pages.instructors.loadFailed')}</h3>
                <p className="text-muted-foreground">
                  {t('pages.instructors.loadFailedDesc')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* 頁面標題 */}
        <HeaderSection />

        {/* 高級篩選器 */}
        <div className="mt-2">
          <AdvancedInstructorFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            availableDepartments={availableDepartments}
            onClearAll={handleClearAll}
            totalInstructors={instructors.length}
            filteredInstructors={paginationData.totalItems}
            currentPageStart={paginationData.totalItems > 0 ? (filters.currentPage - 1) * filters.itemsPerPage + 1 : 0}
            currentPageEnd={paginationData.totalItems > 0 ? Math.min(filters.currentPage * filters.itemsPerPage, paginationData.totalItems) : 0}
          />
        </div>

        {/* 載入狀態指示器 */}
        {(loading || termFilterLoading) && (
          <div className="text-center mt-4">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {termFilterLoading ? t('filter.checkingTerm') : t('common.loading')}
            </div>
          </div>
        )}

        {/* 講師列表 */}
        <div className="mt-4">
          {/* 如果正在載入學期篩選，顯示載入中的講師卡片 */}
          {termFilterLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {Array.from({ length: filters.itemsPerPage }).map((_, index) => (
                <InstructorCardSkeleton key={index} />
              ))}
            </div>
          ) : filteredAndSortedInstructors.length === 0 ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <Card className="max-w-md">
                <CardContent className="p-6 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t('pages.instructors.noResults')}</h3>
                  <p className="text-muted-foreground">
                    {filters.searchTerm.trim() ? t('pages.instructors.tryOtherKeywords') : t('pages.instructors.noInstructorsAvailable')}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {paginationData.currentPageInstructors.map((instructor) => (
                  <PopularItemCard
                    key={instructor.$id}
                    type="instructor"
                    name={instructor.name}
                    nameTc={instructor.name_tc}
                    nameSc={instructor.name_sc}
                    department={instructor.department}
                    teachingScore={instructor.teachingScore}
                    gradingFairness={instructor.gradingFairness}
                    reviewCount={instructor.reviewCount}
                    isTeachingInCurrentTerm={instructor.isTeachingInCurrentTerm ?? false}
                  />
                ))}
              </div>

              {/* 分頁組件 */}
              <div className="mt-12">
                <Pagination
                  currentPage={filters.currentPage}
                  totalPages={paginationData.totalPages}
                  onPageChange={handlePageChange}
                  itemsPerPage={filters.itemsPerPage}
                  totalItems={paginationData.totalItems}
                />
              </div>
            </>
          )}
        </div>

        {/* 最後更新日期 */}
        <div className="text-center pt-8 mt-8">
          <p className="text-sm text-muted-foreground">
            {t('pages.instructors.lastUpdated', {
              date: new Date().toLocaleDateString(
                language === 'zh-TW' ? 'zh-TW' : language === 'zh-CN' ? 'zh-CN' : 'en-US', 
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }
              )
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InstructorsList; 