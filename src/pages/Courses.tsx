import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { getCurrentTermCode } from '@/utils/dateUtils';
import { PopularItemCard } from '@/components/features/reviews/PopularItemCard';
import { CourseCardSkeleton } from '@/components/features/reviews/CourseCardSkeleton';
import { AdvancedCourseFilters, CourseFilters } from '@/components/features/reviews/AdvancedCourseFilters';
import { Pagination } from '@/components/features/reviews/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { useCoursesWithStats } from '@/hooks/useCoursesWithStats';
import { CourseWithStats, CourseService } from '@/services/api/courseService';
import { BookOpen, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { translateDepartmentName } from '@/utils/textUtils';

const Courses = () => {
  const { t, language } = useLanguage();
  
  // 篩選器狀態
  const [filters, setFilters] = useState<CourseFilters>({
    searchTerm: '',
    subjectArea: 'all',
    teachingLanguage: 'all',
    sortBy: 'code',
    sortOrder: 'asc',
    offeredTerm: 'all',
    itemsPerPage: 6,
    currentPage: 1,
  });

  // 學期篩選結果狀態
  const [termFilteredCourses, setTermFilteredCourses] = useState<Set<string>>(new Set());
  const [termFilterLoading, setTermFilterLoading] = useState(false);

  // 使用防抖來優化搜尋性能
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 300);
  
  // 使用優化的 hook 來管理課程數據
  const { 
    courses, 
    loading, 
    statsLoading, 
    error 
  } = useCoursesWithStats({ 
    enableProgressiveLoading: true
  });

  // 當學期篩選條件改變時，非同步檢查課程是否在該學期開設
  useEffect(() => {
    if (filters.offeredTerm === 'all' || filters.offeredTerm === getCurrentTermCode()) {
      // 如果是 'all' 或當前學期，不需要額外檢查
      setTermFilteredCourses(new Set());
      setTermFilterLoading(false);
      return;
    }

    // 對於其他學期，需要非同步檢查
    const checkCoursesForTerm = async () => {
      setTermFilterLoading(true);
      try {
        const filteredCourseIds = new Set<string>();
        
        // 並行檢查所有課程是否在指定學期開設
        const checkPromises = courses.map(async (course) => {
          const isOffered = await CourseService.isCourseOfferedInTerm(course.course_code, filters.offeredTerm);
          if (isOffered) {
            filteredCourseIds.add(course.course_code);
          }
        });

        await Promise.all(checkPromises);
        setTermFilteredCourses(filteredCourseIds);
      } catch (error) {
        console.error('Error checking courses for term:', error);
        setTermFilteredCourses(new Set());
      } finally {
        setTermFilterLoading(false);
      }
    };

    if (courses.length > 0) {
      checkCoursesForTerm();
    }
  }, [filters.offeredTerm, courses]);

  // 提取可用的學科領域
  const { availableSubjects } = useMemo(() => {
    const subjects = new Set<string>();
    
    courses.forEach(course => {
      if (course.department) {
        subjects.add(course.department);
      }
    });
    
    return {
      availableSubjects: Array.from(subjects).sort()
    };
  }, [courses]);

  // 篩選和排序課程
  const filteredAndSortedCourses = useMemo(() => {
    let filtered = courses;

    // 搜尋篩選
    if (debouncedSearchTerm.trim()) {
      filtered = filtered.filter(course =>
        course.course_title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        course.course_code.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        course.department.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // 學科領域篩選
    if (filters.subjectArea !== 'all') {
      filtered = filtered.filter(course => course.department === filters.subjectArea);
    }

    // 教學語言篩選
    if (filters.teachingLanguage !== 'all') {
      filtered = filtered.filter(course => {
        const courseLanguage = course.course_language || 'English'; // 預設為英文
        return courseLanguage === filters.teachingLanguage;
      });
    }

    // 開設學期篩選
    if (filters.offeredTerm !== 'all') {
      filtered = filtered.filter(course => {
        // 如果選擇的是當前學期，使用預先計算的 isOfferedInCurrentTerm 屬性
        if (filters.offeredTerm === getCurrentTermCode()) {
          return course.isOfferedInCurrentTerm;
        }
        // 對於其他學期，使用非同步檢查的結果
        return termFilteredCourses.has(course.course_code);
      });
    }

    // 排序
    const sortedCourses = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'code':
          comparison = a.course_code.localeCompare(b.course_code);
          break;
        case 'title':
          comparison = a.course_title.localeCompare(b.course_title);
          break;
        case 'subject':
        case 'department':
          comparison = a.department.localeCompare(b.department);
          break;
        case 'workload':
          // 工作量排序：有效值在前，按數值排序；無效值(-1)排在後面
          const aWorkload = a.averageWorkload > 0 ? a.averageWorkload : 999;
          const bWorkload = b.averageWorkload > 0 ? b.averageWorkload : 999;
          comparison = aWorkload - bWorkload;
          break;
        case 'difficulty':
          // 難度排序：有效值在前，按數值排序；無效值(-1)排在後面
          const aDifficulty = a.averageDifficulty > 0 ? a.averageDifficulty : 999;
          const bDifficulty = b.averageDifficulty > 0 ? b.averageDifficulty : 999;
          comparison = aDifficulty - bDifficulty;
          break;
        case 'usefulness':
          // 實用性排序：有效值在前，按數值排序；無效值(-1)排在後面
          const aUsefulness = a.averageUsefulness > 0 ? a.averageUsefulness : -999;
          const bUsefulness = b.averageUsefulness > 0 ? b.averageUsefulness : -999;
          comparison = aUsefulness - bUsefulness;
          break;
        case 'reviews':
          comparison = a.reviewCount - b.reviewCount;
          break;
        default:
          comparison = a.course_code.localeCompare(b.course_code);
          break;
      }
      
      // 根據排序順序調整結果
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return sortedCourses;
  }, [courses, debouncedSearchTerm, filters]);

  // 計算分頁數據
  const paginationData = useMemo(() => {
    const totalItems = filteredAndSortedCourses.length;
    const totalPages = Math.ceil(totalItems / filters.itemsPerPage);
    const startIndex = (filters.currentPage - 1) * filters.itemsPerPage;
    const endIndex = startIndex + filters.itemsPerPage;
    const currentPageCourses = filteredAndSortedCourses.slice(startIndex, endIndex);

    return {
      totalItems,
      totalPages,
      currentPageCourses
    };
  }, [filteredAndSortedCourses, filters.itemsPerPage, filters.currentPage]);

  const handleFiltersChange = (newFilters: CourseFilters) => {
    // 如果不是只更改分頁相關的設置，就重置到第一頁
    if (newFilters.searchTerm !== filters.searchTerm ||
        newFilters.subjectArea !== filters.subjectArea ||
        newFilters.teachingLanguage !== filters.teachingLanguage ||
        newFilters.sortBy !== filters.sortBy ||
        newFilters.sortOrder !== filters.sortOrder ||
        newFilters.offeredTerm !== filters.offeredTerm) {
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
      subjectArea: 'all',
      teachingLanguage: 'all',
      sortBy: 'code',
      sortOrder: 'asc',
      offeredTerm: 'all',
      itemsPerPage: 6,
      currentPage: 1,
    });
  };

  // 頂部區域組件，確保翻譯正確載入
  const HeaderSection = () => (
    <div className="text-center">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        {t('pages.courses.title')}
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

          {/* 課程卡片骨架 */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto mt-4">
            {Array.from({ length: 9 }).map((_, index) => (
              <CourseCardSkeleton key={index} />
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
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('pages.courses.loadFailed')}</h3>
                <p className="text-muted-foreground">
                  {t('pages.courses.loadFailedDesc')}
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
          <AdvancedCourseFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            availableSubjects={availableSubjects}
            onClearAll={handleClearAll}
            totalCourses={courses.length}
            filteredCourses={paginationData.totalItems}
          />
        </div>

        {/* 載入狀態指示器 */}
        {(statsLoading || termFilterLoading) && (
          <div className="text-center mt-4">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {termFilterLoading ? t('filter.checkingTerm') : t('common.loadingStats')}
            </div>
          </div>
        )}

        {/* 課程列表 */}
        <div className="mt-4">
          {/* 如果正在載入學期篩選，顯示載入中的課程卡片 */}
          {termFilterLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {Array.from({ length: filters.itemsPerPage }).map((_, index) => (
                <CourseCardSkeleton key={index} />
              ))}
            </div>
          ) : filteredAndSortedCourses.length === 0 ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <Card className="max-w-md">
                <CardContent className="p-6 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t('pages.courses.noCoursesFound')}</h3>
                  <p className="text-muted-foreground">
                    {filters.searchTerm.trim() ? t('pages.courses.tryOtherKeywords') : t('pages.courses.noCoursesAvailable')}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {paginationData.currentPageCourses.map((course) => (
                  <PopularItemCard
                    key={course.$id}
                    type="course"
                    title={course.course_title}
                    titleTc={course.course_title_tc}
                    titleSc={course.course_title_sc}
                    code={course.course_code}
                    department={translateDepartmentName(course.department, t)}
                    language={course.course_language}
                    rating={course.averageRating}
                    reviewCount={course.reviewCount}
                    isOfferedInCurrentTerm={course.isOfferedInCurrentTerm}
                    averageWorkload={course.averageWorkload}
                    averageDifficulty={course.averageDifficulty}
                    averageUsefulness={course.averageUsefulness}
                    isLoading={statsLoading}
                  />
                ))}
              </div>

              {/* 分頁組件 */}
              <Pagination
                currentPage={filters.currentPage}
                totalPages={paginationData.totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={filters.itemsPerPage}
                totalItems={paginationData.totalItems}
              />
            </>
          )}
        </div>

        {/* 最後更新日期 */}
        <div className="text-center pt-8 mt-8">
          <p className="text-sm text-muted-foreground">
            {t('pages.courses.lastUpdated')}: {new Date().toLocaleDateString(
              language === 'zh-TW' ? 'zh-TW' : language === 'zh-CN' ? 'zh-CN' : 'en-US', 
              {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Courses; 