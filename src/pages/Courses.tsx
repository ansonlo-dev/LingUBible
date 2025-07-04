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


/**
 * Maps database language codes to user-friendly language names
 */
const mapLanguageCode = (courseLanguage: string): string => {
  if (courseLanguage === 'E') {
    return 'English';
  } else if (courseLanguage === 'C') {
    return 'Mandarin Chinese';
  } else if (courseLanguage === 'English') {
    return 'English';
  } else if (courseLanguage === 'Mandarin Chinese') {
    return 'Mandarin Chinese';
  }
  // Default to English for any unrecognized codes
  return 'English';
};

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

  // 講師搜尋相關狀態
  const [instructorCourseMap, setInstructorCourseMap] = useState<Map<string, Set<string>>>(new Map());
  const [instructorDataLoaded, setInstructorDataLoaded] = useState(false);

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

  // 組件載入時清除學期相關緩存，確保獲取最新數據
  useEffect(() => {
    const initializePerformanceOptimizations = async () => {
      try {
        // 清除舊的緩存
        CourseService.clearCache();
        
        // 🚀 預加載所有教學記錄以實現零延遲篩選
        console.log('🚀 Preloading teaching records for optimal filtering performance...');
        const termCoursesMap = await CourseService.getAllTermsCoursesOfferedBatch();
        console.log('✅ Teaching records preloaded successfully');

        // 🔍 構建講師-課程映射以支援講師搜尋
        console.log('🔍 Building instructor-course mapping for search...');
        const instructorMap = new Map<string, Set<string>>();
        
        try {
          // 獲取所有講師以進行基本映射
          const allInstructors = await CourseService.getAllInstructors();
          
          // 為每個講師的所有名稱建立初始映射（將在後台填充課程）
          allInstructors.forEach(instructor => {
            // 英文名稱
            const englishNameKey = instructor.name.toLowerCase();
            instructorMap.set(englishNameKey, new Set());
            
            // 中文名稱
            if (instructor.name_tc) {
              const tcNameKey = instructor.name_tc.toLowerCase();
              instructorMap.set(tcNameKey, new Set());
            }
            
            if (instructor.name_sc) {
              const scNameKey = instructor.name_sc.toLowerCase();
              instructorMap.set(scNameKey, new Set());
            }
          });
          
          console.log('✅ Basic instructor mapping initialized with', instructorMap.size, 'entries');
          
          // 在後台漸進式建立完整的講師-課程映射
          setTimeout(async () => {
            try {
              console.log('🔄 Building comprehensive instructor-course mapping in background...');
              const allTermsInstructorsMap = await CourseService.getAllTermsInstructorsTeachingBatch();
              
              // 限制同時處理的講師數量以避免性能問題
              const uniqueInstructors = Array.from(new Set(
                Array.from(allTermsInstructorsMap.values()).flatMap(names => Array.from(names))
              )).slice(0, 50); // 限制處理前50位講師
              
              for (const instructorName of uniqueInstructors) {
                try {
                  const teachingRecords = await CourseService.getInstructorTeachingRecords(instructorName);
                  const instructor = allInstructors.find(inst => inst.name === instructorName);
                  
                  // 為所有名稱添加課程映射
                  const nameKeys = [
                    instructorName.toLowerCase(),
                    instructor?.name_tc?.toLowerCase(),
                    instructor?.name_sc?.toLowerCase()
                  ].filter(Boolean) as string[];
                  
                  teachingRecords.forEach(record => {
                    nameKeys.forEach(nameKey => {
                      instructorMap.get(nameKey)?.add(record.course_code);
                    });
                  });
                } catch (error) {
                  // 靜默處理錯誤，不影響主要功能
                }
              }
              
              console.log('✅ Background instructor mapping completed');
            } catch (error) {
              console.warn('Background instructor mapping failed:', error);
            }
          }, 2000); // 2秒後開始後台處理
          
        } catch (error) {
          console.warn('Failed to initialize instructor mapping:', error);
          console.log('✅ Using empty instructor mapping');
        }
        
        setInstructorCourseMap(instructorMap);
        setInstructorDataLoaded(true);
        console.log('✅ Instructor-course mapping built successfully');
      } catch (error) {
        console.error('❌ Error preloading teaching records:', error);
      }
    };

    initializePerformanceOptimizations();
  }, []);

  // 當學期篩選條件改變時，非同步檢查課程是否在該學期開設
  useEffect(() => {
    if (filters.offeredTerm === 'all' || filters.offeredTerm === getCurrentTermCode()) {
      // 如果是 'all' 或當前學期，不需要額外檢查
      setTermFilteredCourses(new Set());
      setTermFilterLoading(false);
      return;
    }

    // 對於其他學期，使用批量方法檢查
    const checkCoursesForTerm = async () => {
      setTermFilterLoading(true);
      try {
        // 使用批量方法獲取該學期開設的所有課程
        const coursesOfferedInTerm = await CourseService.getCoursesOfferedInTermBatch(filters.offeredTerm);
        setTermFilteredCourses(coursesOfferedInTerm);
      } catch (error) {
        console.error('Error checking courses for term:', error);
        setTermFilteredCourses(new Set());
      } finally {
        setTermFilterLoading(false);
      }
    };

    checkCoursesForTerm();
  }, [filters.offeredTerm]);

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

  // 📊 性能優化：記憶化學期篩選狀態檢查
  const shouldShowLoadingForTermFilter = useMemo(() => {
    return filters.offeredTerm !== 'all' && 
           filters.offeredTerm !== getCurrentTermCode() && 
           termFilterLoading;
  }, [filters.offeredTerm, termFilterLoading]);

  // 篩選和排序課程
  const filteredAndSortedCourses = useMemo(() => {
    // If we're loading term data, return empty array to avoid showing stale results
    if (shouldShowLoadingForTermFilter) {
      return [];
    }

    let filtered = courses;

    // 搜尋篩選 - Enhanced multi-language search
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
      
      filtered = filtered.filter(course => {
        // 1. 課程標題搜尋（多語言）
        const courseTitleMatch = 
          course.course_title.toLowerCase().includes(searchTermLower) ||
          (course.course_title_tc && course.course_title_tc.toLowerCase().includes(searchTermLower)) ||
          (course.course_title_sc && course.course_title_sc.toLowerCase().includes(searchTermLower));
        
        // 2. 課程代碼搜尋
        const courseCodeMatch = course.course_code.toLowerCase().includes(searchTermLower);
        
        // 3. 部門名稱搜尋（多語言）
        const departmentEnglish = course.department?.toLowerCase() || '';
        const departmentTc = translateDepartmentName(course.department || '', getTcTranslation).toLowerCase();
        const departmentSc = translateDepartmentName(course.department || '', getScTranslation).toLowerCase();
        
        const departmentMatch = 
          departmentEnglish.includes(searchTermLower) ||
          departmentTc.includes(searchTermLower) ||
          departmentSc.includes(searchTermLower);
        
        // 4. 講師搜尋（多語言）
        let instructorMatch = false;
        if (instructorDataLoaded && instructorCourseMap.size > 0) {
          for (const [instructorName, courseCodes] of instructorCourseMap) {
            if (instructorName.includes(searchTermLower) && courseCodes.has(course.course_code)) {
              instructorMatch = true;
              break;
            }
          }
        }
        
        return courseTitleMatch || courseCodeMatch || departmentMatch || instructorMatch;
      });
    }

    // 學科領域篩選
    if (filters.subjectArea !== 'all') {
      filtered = filtered.filter(course => course.department === filters.subjectArea);
    }

    // 教學語言篩選
    if (filters.teachingLanguage !== 'all') {
      filtered = filtered.filter(course => {
        const courseLanguage = mapLanguageCode(course.course_language);
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
        case 'averageGPA':
          // Average GPA sorting: valid values first, sorted by value; invalid values (-1) at the end
          const aGPA = a.averageGPA > 0 ? a.averageGPA : -999;
          const bGPA = b.averageGPA > 0 ? b.averageGPA : -999;
          comparison = aGPA - bGPA;
          break;
        default:
          comparison = a.course_code.localeCompare(b.course_code);
          break;
      }
      
      // 根據排序順序調整結果
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return sortedCourses;
  }, [courses, debouncedSearchTerm, filters, termFilteredCourses, shouldShowLoadingForTermFilter, instructorDataLoaded, instructorCourseMap]);

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
            courses={courses}
          />
        </div>

        {/* 載入狀態指示器 */}
        {(statsLoading || shouldShowLoadingForTermFilter) && (
          <div className="text-center mt-4">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {shouldShowLoadingForTermFilter ? t('filter.checkingTerm') : t('common.loadingStats')}
            </div>
          </div>
        )}

        {/* 課程列表 */}
        <div className="mt-4">
          {/* 如果正在載入學期篩選，顯示載入中的課程卡片 */}
          {shouldShowLoadingForTermFilter ? (
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
                    averageGPA={course.averageGPA}
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