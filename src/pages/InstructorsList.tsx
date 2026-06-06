import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { translateDepartmentName, extractInstructorNameForSorting, extractUniqueDepartmentsFromInstructors, doesInstructorBelongToDepartment } from '@/utils/textUtils';
import { InstructorGrid } from '@/components/responsive';
import { LoadingProgress } from '@/components/ui/loading-progress';

const InstructorsList = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 篩選器狀態
  const [filters, setFilters] = useState<InstructorFilters>({
    searchTerm: '',
    department: [],
    teachingTerm: [],
    teachingLanguage: [],
    sortBy: 'name',
    sortOrder: 'asc',
    currentPage: 1,
    itemsPerPage: 6,
    showFormerStaff: false,
  });

  // 使用防抖來優化搜尋性能
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 300);
  
  const [instructors, setInstructors] = useState<InstructorWithDetailedStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 學期篩選相關狀態
  const [termFilteredInstructors, setTermFilteredInstructors] = useState<Set<string>>(new Set());
  const [termFilterLoading, setTermFilterLoading] = useState(false);

  // 初始化時讀取 URL 查詢參數
  useEffect(() => {
    const urlFilters: Partial<InstructorFilters> = {};
    
    // 讀取搜尋關鍵字
    const searchTerm = searchParams.get('search');
    if (searchTerm) {
      urlFilters.searchTerm = searchTerm;
    }
    
    // 讀取部門篩選
    const department = searchParams.get('department');
    if (department) {
      urlFilters.department = department.split(',').filter(d => d.trim());
    }
    
    // 讀取學期篩選
    const teachingTerm = searchParams.get('teachingTerm');
    if (teachingTerm) {
      urlFilters.teachingTerm = teachingTerm.split(',').filter(t => t.trim());
    }
    
    // 讀取教學語言篩選
    const teachingLanguage = searchParams.get('teachingLanguage');
    if (teachingLanguage) {
      urlFilters.teachingLanguage = teachingLanguage.split(',').filter(l => l.trim());
    }
    
    // 讀取排序方式
    const sortBy = searchParams.get('sortBy');
    if (sortBy && ['name', 'department', 'teaching', 'grading', 'reviews'].includes(sortBy)) {
      urlFilters.sortBy = sortBy as InstructorFilters['sortBy'];
    }
    
    // 讀取排序順序
    const sortOrder = searchParams.get('sortOrder');
    if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
      urlFilters.sortOrder = sortOrder as InstructorFilters['sortOrder'];
    }
    
    // 讀取頁碼
    const page = searchParams.get('page');
    if (page && !isNaN(parseInt(page))) {
      urlFilters.currentPage = parseInt(page);
    }

    // 讀取顯示前教職員開關
    const showFormerStaff = searchParams.get('showFormerStaff');
    if (showFormerStaff === 'true') {
      urlFilters.showFormerStaff = true;
    }
    
    // 如果有 URL 參數，更新 filters 狀態
    if (Object.keys(urlFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...urlFilters }));
    }
  }, [searchParams]);

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

  // 當學期篩選條件改變時，使用預加載的數據進行快速檢查
  useEffect(() => {
    // 確保 teachingTerm 是陣列
    const teachingTermArray = Array.isArray(filters.teachingTerm) ? filters.teachingTerm : [];
    
    // 如果沒有講師數據，或者沒有選擇學期篩選，跳過
    if (instructors.length === 0 || teachingTermArray.length === 0) {
      setTermFilteredInstructors(new Set());
      setTermFilterLoading(false);
      return;
    }

    // 如果只選擇當前學期，不需要非同步檢查
    const nonCurrentTerms = teachingTermArray.filter(term => term !== getCurrentTermCode());
    if (nonCurrentTerms.length === 0) {
      setTermFilteredInstructors(new Set());
      setTermFilterLoading(false);
      return;
    }

    // 🚀 性能優化：使用預加載的數據進行快速批量檢查
    const checkInstructorsForTerm = async () => {
      setTermFilterLoading(true);
      try {
        // 使用預加載的數據獲取該學期的所有教學講師
        const instructorsTeachingInTerm = await CourseService.getInstructorsTeachingInTermBatch(teachingTermArray);
        
        // 將講師名稱映射到ID以進行快速匹配
        const filteredInstructorIds = new Set<string>();
        instructors.forEach(instructor => {
          if (instructorsTeachingInTerm.has(instructor.name)) {
            filteredInstructorIds.add(instructor.$id);
          }
        });
        
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

  // 📊 性能優化：記憶化學期篩選狀態檢查
  const shouldShowLoadingForTermFilter = useMemo(() => {
    const teachingTermArray = Array.isArray(filters.teachingTerm) ? filters.teachingTerm : [];
    const hasNonCurrentTerms = teachingTermArray.length > 0 && 
                               teachingTermArray.some(term => term !== getCurrentTermCode());
    return hasNonCurrentTerms && termFilterLoading;
  }, [filters.teachingTerm, termFilterLoading]);

  // 📊 性能優化：記憶化可用部門計算 - 支持多部門講師
  const { availableDepartments } = useMemo(() => {
    return {
      availableDepartments: extractUniqueDepartmentsFromInstructors(instructors)
    };
  }, [instructors]);

  // 篩選和排序講師
  const filteredAndSortedInstructors = useMemo(() => {
    // If we're loading term data, return empty array to avoid showing stale results
    if (shouldShowLoadingForTermFilter) {
      return [];
    }

    let filtered = instructors;

    // 前教職員篩選（預設隱藏）
    if (!filters.showFormerStaff) {
      filtered = filtered.filter(instructor => instructor.is_current_staff !== false);
    }

    // 搜尋篩選
    if (debouncedSearchTerm.trim()) {
      const searchTermLower = debouncedSearchTerm.toLowerCase();
      
      // 創建翻譯函數來獲取不同語言的部門名稱
      const getTcTranslation = (key: string) => {
        const zhTwTranslations: Record<string, string> = {
          'department.chinese': '中文系',
          'department.culturalStudies': '文化研究系',
          'department.digitalArts': '數碼藝術及創意產業系',
          'department.english': '英文系',
          'department.history': '歷史系',
          'department.philosophy': '哲學系',
          'department.translation': '翻譯系',
          'department.englishLanguageCentre': '英語及外語教學中心',
          'department.chineseLanguageCentre': '中國語文教學與測試中心',
          'department.accountancy': '會計學系',
          'department.finance': '金融學系',
          'department.management': '管理學學系',
          'department.marketing': '市場及國際企業學系',
          'department.operations': '運營與風險管理學系',
          'department.psychology': '心理學系',
          'department.economics': '經濟學系',
          'department.government': '政府與國際事務學系',
          'department.sociology': '社會學及社會政策系',
          'department.coreOffice': '核心課程辦事處',
          'department.scienceUnit': '科學教研組',
          'department.musicUnit': '黃炳禮音樂及演藝部',
          'department.dataScience': '嶺南教育機構陳斌博士數據科學研究所'
        };
        return zhTwTranslations[key] || key;
      };
      
      const getScTranslation = (key: string) => {
        const zhCnTranslations: Record<string, string> = {
          'department.chinese': '中文系',
          'department.culturalStudies': '文化研究系',
          'department.digitalArts': '数码艺术及创意产业系',
          'department.english': '英文系',
          'department.history': '历史系',
          'department.philosophy': '哲学系',
          'department.translation': '翻译系',
          'department.englishLanguageCentre': '英语及外语教学中心',
          'department.chineseLanguageCentre': '中国语文教学与测试中心',
          'department.accountancy': '会计学系',
          'department.finance': '金融学系',
          'department.management': '管理学学系',
          'department.marketing': '市场及国际企业学系',
          'department.operations': '运营与风险管理学系',
          'department.psychology': '心理学系',
          'department.economics': '经济学系',
          'department.government': '政府与国际事务学系',
          'department.sociology': '社会学及社会政策系',
          'department.coreOffice': '核心课程办事处',
          'department.scienceUnit': '科学教研组',
          'department.musicUnit': '黄炳礼音乐及演艺部',
          'department.dataScience': '岭南教育机构陈斌博士数据科学研究所'
        };
        return zhCnTranslations[key] || key;
      };
      
      filtered = filtered.filter(instructor => {
        // 獲取所有語言版本的部門名稱進行搜索
        const departmentEnglish = instructor.department?.toLowerCase() || '';
        const departmentTc = translateDepartmentName(instructor.department || '', getTcTranslation).toLowerCase();
        const departmentSc = translateDepartmentName(instructor.department || '', getScTranslation).toLowerCase();
        
        return (
          // 講師姓名（所有語言）
          instructor.name.toLowerCase().includes(searchTermLower) ||
          (instructor.name_tc && instructor.name_tc.toLowerCase().includes(searchTermLower)) ||
          (instructor.name_sc && instructor.name_sc.toLowerCase().includes(searchTermLower)) ||
          // 講師昵稱
          (instructor.nickname && instructor.nickname.toLowerCase().includes(searchTermLower)) ||
          // 電子郵件
          instructor.email.toLowerCase().includes(searchTermLower) ||
          // 部門名稱（所有語言）
          departmentEnglish.includes(searchTermLower) ||
          departmentTc.includes(searchTermLower) ||
          departmentSc.includes(searchTermLower)
        );
      });
    }

    // 部門篩選 - 支持多部門講師
    if (filters.department.length > 0) {
      filtered = filtered.filter(instructor => 
        filters.department.some(targetDept => 
          doesInstructorBelongToDepartment(instructor.department, targetDept)
        )
      );
    }

    // 學期篩選
    const teachingTermArray = Array.isArray(filters.teachingTerm) ? filters.teachingTerm : [];
    if (teachingTermArray.length > 0) {
      filtered = filtered.filter(instructor => {
        return teachingTermArray.some(termCode => {
          // 如果選擇的是當前學期，使用預先計算的屬性
          if (termCode === getCurrentTermCode()) {
            return instructor.isTeachingInCurrentTerm;
          }
          // 對於其他學期，使用非同步檢查的結果
          return termFilteredInstructors.has(instructor.$id);
        });
      });
    }

    // 教學語言篩選
    if (filters.teachingLanguage.length > 0) {
      filtered = filtered.filter(instructor => {
        // 檢查講師是否有教學語言數據
        if (!instructor.teachingLanguages || instructor.teachingLanguages.length === 0) {
          return false;
        }
        
        // 檢查選定的語言是否與講師的教學語言匹配
        return filters.teachingLanguage.some(selectedLang => 
          instructor.teachingLanguages.includes(selectedLang)
        );
      });
    }

    // 排序
    const sortedInstructors = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          // 使用提取的姓名進行排序，忽略職稱
          const aNameForSort = extractInstructorNameForSorting(a.name);
          const bNameForSort = extractInstructorNameForSorting(b.name);
          comparison = aNameForSort.localeCompare(bNameForSort);
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
        case 'averageGPA':
          // Average GPA sorting: valid values first, sorted by value; invalid values (-1) at the end
          const aGPA = a.averageGPA > 0 ? a.averageGPA : -999;
          const bGPA = b.averageGPA > 0 ? b.averageGPA : -999;
          comparison = aGPA - bGPA;
          break;
        default:
          // 默認也使用提取的姓名進行排序
          const aDefaultNameForSort = extractInstructorNameForSorting(a.name);
          const bDefaultNameForSort = extractInstructorNameForSorting(b.name);
          comparison = aDefaultNameForSort.localeCompare(bDefaultNameForSort);
          break;
      }
      
      // 根據排序順序調整結果
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return sortedInstructors;
  }, [instructors, debouncedSearchTerm, filters, termFilteredInstructors, shouldShowLoadingForTermFilter]);

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
        JSON.stringify(newFilters.department) !== JSON.stringify(filters.department) ||
        JSON.stringify(newFilters.teachingTerm) !== JSON.stringify(filters.teachingTerm) ||
        JSON.stringify(newFilters.teachingLanguage) !== JSON.stringify(filters.teachingLanguage) ||
        newFilters.sortBy !== filters.sortBy ||
        newFilters.sortOrder !== filters.sortOrder ||
        newFilters.showFormerStaff !== filters.showFormerStaff) {
      newFilters.currentPage = 1;
    }
    
    setFilters(newFilters);
    
    // 更新 URL 查詢參數
    const newSearchParams = new URLSearchParams();
    
    // 添加非默認值到 URL
    if (newFilters.searchTerm.trim()) {
      newSearchParams.set('search', newFilters.searchTerm);
    }
    if (newFilters.department.length > 0) {
      newSearchParams.set('department', newFilters.department.join(','));
    }
    if (newFilters.teachingTerm.length > 0) {
      newSearchParams.set('teachingTerm', newFilters.teachingTerm.join(','));
    }
    if (newFilters.teachingLanguage.length > 0) {
      newSearchParams.set('teachingLanguage', newFilters.teachingLanguage.join(','));
    }
    if (newFilters.sortBy !== 'name') {
      newSearchParams.set('sortBy', newFilters.sortBy);
    }
    if (newFilters.sortOrder !== 'asc') {
      newSearchParams.set('sortOrder', newFilters.sortOrder);
    }
    if (newFilters.currentPage > 1) {
      newSearchParams.set('page', newFilters.currentPage.toString());
    }
    if (newFilters.showFormerStaff) {
      newSearchParams.set('showFormerStaff', 'true');
    }

    // 更新 URL 但不觸發導航
    setSearchParams(newSearchParams, { replace: true });
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, currentPage: page }));
    // 滾動到頁面頂部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearAll = () => {
    const defaultFilters: InstructorFilters = {
      searchTerm: '',
      department: [],
      teachingTerm: [],
      teachingLanguage: [],
      sortBy: 'name',
      sortOrder: 'asc',
      itemsPerPage: 6,
      currentPage: 1,
      showFormerStaff: false,
    };
    
    setFilters(defaultFilters);
    
    // 清除 URL 查詢參數
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  // 處理教學語言標籤點擊
  const handleTeachingLanguageClick = (languages: string[]) => {
    const newFilters = { ...filters, teachingLanguage: languages };
    handleFiltersChange(newFilters);
  };

  // 頂部區域組件，與課程頁面保持一致
  const HeaderSection = () => (
    <div className="text-center">
      <h1 className="text-4xl font-bold leading-relaxed bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        {t('pages.instructors.title')}
      </h1>
    </div>
  );

  // 組件載入時初始化性能優化
  useEffect(() => {
    const initializePerformanceOptimizations = async () => {
      try {
        // 🚀 預加載所有教學記錄以實現零延遲篩選
        console.log('🚀 Preloading teaching records for instructor filtering...');
        await CourseService.getAllTermsInstructorsTeachingBatch();
        console.log('✅ Teaching records preloaded for instructors');
      } catch (error) {
        console.error('❌ Error preloading teaching records for instructors:', error);
      }
    };

    initializePerformanceOptimizations();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          {/* 頁面標題 */}
          <HeaderSection />

          {/* 專業進度條 - 使用智能階段文字 */}
          <div className="max-w-md mx-auto mt-6">
            <LoadingProgress
              isLoading={loading}
              variant="gradient"
              className="mb-4"
            />
          </div>

          {/* 講師卡片骨架 */}
          <InstructorGrid className="max-w-7xl mx-auto mt-4">
            {Array.from({ length: 9 }).map((_, index) => (
              <InstructorCardSkeleton key={index} />
            ))}
          </InstructorGrid>
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
      <div className="container mx-auto px-4 py-8 max-sm:pt-4">
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
            instructors={instructors}
          />
        </div>

        {/* 載入狀態指示器 - 優先顯示卡片 */}
        {shouldShowLoadingForTermFilter && (
          <div className="text-center mt-4">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('filter.checkingTerm')}
            </div>
          </div>
        )}
        
        {/* 基本載入指示器 - 不阻擋卡片顯示 */}
        {loading && !shouldShowLoadingForTermFilter && (
          <div className="text-center mt-2">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t('common.loading')}
            </div>
          </div>
        )}

        {/* 講師列表 */}
        <div className="mt-4">
          {/* 如果正在載入學期篩選，顯示載入中的講師卡片 */}
          {shouldShowLoadingForTermFilter ? (
            <InstructorGrid className="max-w-7xl mx-auto">
              {Array.from({ length: filters.itemsPerPage }).map((_, index) => (
                <InstructorCardSkeleton key={index} />
              ))}
            </InstructorGrid>
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
              <InstructorGrid className="max-w-7xl mx-auto">
                {paginationData.currentPageInstructors.map((instructor) => (
                  <PopularItemCard
                    key={instructor.$id}
                    type="instructor"
                    name={instructor.name}
                    nameTc={instructor.name_tc}
                    nameSc={instructor.name_sc}
                    title={instructor.title}
                    department={instructor.department}
                    teachingScore={instructor.teachingScore}
                    gradingFairness={instructor.gradingFairness}
                    reviewCount={instructor.reviewCount}
                    averageGPA={instructor.averageGPA}
                    averageGPACount={instructor.averageGPACount}
                    isTeachingInCurrentTerm={instructor.isTeachingInCurrentTerm ?? false}
                    teachingLanguages={instructor.teachingLanguages}
                    currentTermTeachingLanguage={instructor.currentTermTeachingLanguage}
                    onTeachingLanguageClick={handleTeachingLanguageClick}
                    enableTwoTapMode={true}
                  />
                ))}
              </InstructorGrid>

              {/* 分頁組件 */}
              <div>
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