import { useState, useRef, useEffect, useMemo } from 'react';
import { X, BookOpen as BookOpenIcon, GraduationCap, MessageSquare, Loader2, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useNavigate } from 'react-router-dom';
import { CourseService, CourseWithStats, InstructorWithDetailedStats } from '@/services/api/courseService';
import { getCourseTitle, getInstructorName, translateDepartmentName } from '@/utils/textUtils';
import { formatGPA } from '@/utils/gradeUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { SearchHistory, useSearchHistory } from '@/components/common/SearchHistory';

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSidebarCollapsed?: boolean;
}

export function MobileSearchModal({ isOpen, onClose, isSidebarCollapsed = false }: MobileSearchModalProps) {
  // 包裝 onClose 函數以處理 history 清理
  const handleClose = () => {
    if (hasAddedHistoryEntry.current) {
      // 如果當前 history state 是我們的搜索模態，則通過 history.back() 關閉
      if (window.history.state && window.history.state.modal === 'search') {
        window.history.back();
        return; // 讓 popstate 事件處理關閉
      }
      hasAddedHistoryEntry.current = false;
    }
    // 重置狀態
    setIsInitialized(false);
    setLoading(false);
    onClose();
  };
  const { t, language: currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Track viewport dimensions for responsive positioning
  const [viewportDimensions, setViewportDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    isLandscape: typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false,
    isTabletSize: typeof window !== 'undefined' ? window.innerWidth >= 640 && window.innerWidth < 1024 : false
  });
  
  // Use a stable value for desktop mode detection based on viewport state
  const isDesktopMode = !isMobile && viewportDimensions.width >= 1024;
  
  // Detect iPad Mini landscape specifically
  const isIPadMiniLandscape = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const width = viewportDimensions.width;
    const height = viewportDimensions.height;
    // iPad Mini landscape is 1024x768 (or close to it)
    // Allow some flexibility for browser dev tools UI
    const isIPadMini = width >= 1020 && width <= 1030 && height >= 690 && height <= 820 && width > height;
    
    // Debug logging
    if (isOpen) {
      console.log('Search Modal - Viewport:', { width, height, isIPadMini, isDesktopMode, isSidebarCollapsed });
    }
    
    return isIPadMini;
  }, [viewportDimensions.width, viewportDimensions.height, isOpen, isDesktopMode, isSidebarCollapsed]); // Include all relevant deps
  
  // Memoize sidebar positions to prevent recalculation
  const sidebarPositions = useMemo(() => ({
    collapsed: 4,
    expanded: 11
  }), []);
  
  const modalLeftPosition = useMemo(() => {
    if (!isDesktopMode) return 0;
    return isSidebarCollapsed ? sidebarPositions.collapsed : sidebarPositions.expanded;
  }, [isDesktopMode, isSidebarCollapsed, sidebarPositions]);
  
  // Determine if we should use right-aligned positioning
  const useRightAlign = useMemo(() => {
    return isIPadMiniLandscape && !isSidebarCollapsed;
  }, [isIPadMiniLandscape, isSidebarCollapsed]);
  
  const { addToHistory } = useSearchHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [popularCourses, setPopularCourses] = useState<CourseWithStats[]>([]);
  const [popularInstructors, setPopularInstructors] = useState<InstructorWithDetailedStats[]>([]);
  const [allCourses, setAllCourses] = useState<CourseWithStats[]>([]);
  const [allInstructors, setAllInstructors] = useState<InstructorWithDetailedStats[]>([]);
  const [topCourses, setTopCourses] = useState<CourseWithStats[]>([]);
  const [topInstructors, setTopInstructors] = useState<InstructorWithDetailedStats[]>([]);
  const [activeTab, setActiveTab] = useState<'courses' | 'instructors' | 'topCourses' | 'topInstructors'>('courses'); // Updated tab state
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasAddedHistoryEntry = useRef(false);

  // Handle search history item clicks
  const handleHistoryItemClick = (query: string) => {
    setSearchQuery(query);
    addToHistory(query);
    inputRef.current?.focus();
  };

  // Handle search execution (when user actually searches)
  const handleSearch = (query: string) => {
    if (query.trim()) {
      addToHistory(query.trim());
    }
  };
  
  // Track viewport changes for responsive positioning
  useEffect(() => {
    const updateViewportDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setViewportDimensions(prev => {
        // Only update if dimensions actually changed
        if (prev.width === width && prev.height === height) {
          return prev;
        }
        return {
          width,
          height,
          isLandscape: width > height,
          isTabletSize: width >= 640 && width < 1024
        };
      });
    };

    // Update immediately
    updateViewportDimensions();

    // Listen for resize events
    window.addEventListener('resize', updateViewportDimensions);
    
    // Also listen for orientation changes
    window.addEventListener('orientationchange', () => {
      // Delay to ensure the viewport has updated after orientation change
      setTimeout(updateViewportDimensions, 100);
    });

    // Additional check for dev tools changes
    const resizeObserver = new ResizeObserver(() => {
      updateViewportDimensions();
    });
    
    if (document.body) {
      resizeObserver.observe(document.body);
    }

    return () => {
      window.removeEventListener('resize', updateViewportDimensions);
      window.removeEventListener('orientationchange', updateViewportDimensions);
      resizeObserver.disconnect();
    };
  }, [isOpen]); // Re-run when modal opens to ensure fresh dimensions







  // Get faculty by department name
  const getFacultyByDepartment = (department: string): string => {
    const facultyMapping: { [key: string]: string } = {
      // Faculty of Arts
      'Chinese': 'faculty.arts',
      'Cultural Studies': 'faculty.arts',
      'Digital Arts and Creative Industries': 'faculty.arts',
      'English': 'faculty.arts',
      'History': 'faculty.arts',
      'Philosophy': 'faculty.arts',
      'Translation': 'faculty.arts',
      'Centre for English and Additional Languages': 'faculty.arts',
      'Chinese Language Education and Assessment Centre': 'faculty.arts',
      
      // Faculty of Business
      'Accountancy': 'faculty.business',
      'Finance': 'faculty.business',
      'Management': 'faculty.business',
      'Marketing and International Business': 'faculty.business',
      'Operations and Risk Management': 'faculty.business',
      
      // Faculty of Social Sciences
      'Economics': 'faculty.socialSciences',
      'Government and International Affairs': 'faculty.socialSciences',
      'Psychology': 'faculty.socialSciences',
      'Sociology and Social Policy': 'faculty.socialSciences',
      
      // School of Data Science
      'LEO Dr David P. Chan Institute of Data Science': 'faculty.dataScience',
      
      // School of Interdisciplinary Studies
      'Office of the Core Curriculum': 'faculty.interdisciplinaryStudies',
      'Science Unit': 'faculty.interdisciplinaryStudies',
      'Wong Bing Lai Music and Performing Arts Unit': 'faculty.interdisciplinaryStudies'
    };
    
    return facultyMapping[department] || '';
  };

  // 載入數據
  useEffect(() => {
    if (isOpen) {
      // 立即設置載入狀態，避免建議項目閃現
      setLoading(true);
      setIsInitialized(false);
      
      const loadData = async () => {
        try {
          // 載入熱門課程和講師以及所有數據用於搜索，還有最佳課程和講師
          const [coursesData, instructorsData, allCoursesData, allInstructorsData, topCoursesData, topInstructorsData] = await Promise.all([
            CourseService.getPopularCourses(20), // 獲取前20個熱門課程，提供更多建議選項
            CourseService.getPopularInstructorsWithDetailedStats(20), // 獲取前20個熱門講師，提供更多建議選項
            CourseService.getCoursesWithStatsBatch(), // 獲取所有課程用於搜索
            CourseService.getAllInstructorsWithDetailedStats(), // 獲取所有講師用於搜索
            CourseService.getTopCoursesByGPA(20), // 獲取前20個最佳課程，提供更多建議選項
            CourseService.getTopInstructorsByGPA(20) // 獲取前20個最佳講師，提供更多建議選項
          ]);
          
          setPopularCourses(coursesData);
          setPopularInstructors(instructorsData);
          setAllCourses(allCoursesData);
          setAllInstructors(allInstructorsData);
          setTopCourses(topCoursesData);
          setTopInstructors(topInstructorsData);
        } catch (error) {
          console.error('Error loading search data:', error);
        } finally {
          setLoading(false);
          setIsInitialized(true);
        }
      };

      loadData();
    } else {
      // 當模態框關閉時重置狀態
      setIsInitialized(false);
      setLoading(false);
    }
  }, [isOpen]);

  // 搜索過濾邏輯
  const filteredCourses = searchQuery.trim() 
    ? allCourses.filter(course => {
        // 只顯示有評論的課程
        if (course.reviewCount === 0) return false;
        
        const query = searchQuery.toLowerCase();
        return (
          // 課程代碼
          course.course_code.toLowerCase().includes(query) ||
          // 課程名稱（所有語言）
          course.course_title?.toLowerCase().includes(query) ||
          course.course_title_tc?.toLowerCase().includes(query) ||
          course.course_title_sc?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => b.reviewCount - a.reviewCount) // 按評論數降序排序
      .slice(0, 20) // 充分利用較大空間的搜索結果數量
    : [];

  const filteredInstructors = searchQuery.trim()
    ? allInstructors.filter(instructor => {
        // 只顯示有評論的講師
        if (instructor.reviewCount === 0) return false;
        
        const query = searchQuery.toLowerCase();
        
        // 獲取所有語言版本的部門名稱進行搜索
        const departmentEnglish = instructor.department?.toLowerCase() || '';
        
        // 創建臨時翻譯函數來獲取不同語言的部門名稱
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
        
        const departmentTc = translateDepartmentName(instructor.department || '', getTcTranslation).toLowerCase();
        const departmentSc = translateDepartmentName(instructor.department || '', getScTranslation).toLowerCase();
        
        return (
          // 講師姓名（所有語言）
          instructor.name.toLowerCase().includes(query) ||
          instructor.name_tc?.toLowerCase().includes(query) ||
          instructor.name_sc?.toLowerCase().includes(query) ||
          // 電子郵件
          instructor.email?.toLowerCase().includes(query) ||
          // 部門名稱（所有語言）
          departmentEnglish.includes(query) ||
          departmentTc.includes(query) ||
          departmentSc.includes(query)
        );
      })
      .sort((a, b) => b.reviewCount - a.reviewCount) // 按評論數降序排序
      .slice(0, 20) // 充分利用較大空間的搜索結果數量
    : [];

  // 處理課程點擊
  const handleCourseClick = (courseCode: string, event?: React.MouseEvent) => {
    // Add to search history if there's a search query
    if (searchQuery.trim()) {
      addToHistory(searchQuery.trim());
    }
    // This function is now simplified since we're using <a> tags
    // The browser will handle navigation naturally
    handleClose();
  };

  // 處理講師點擊
  const handleInstructorClick = (instructorName: string, event?: React.MouseEvent) => {
    // Add to search history if there's a search query
    if (searchQuery.trim()) {
      addToHistory(searchQuery.trim());
    }
    // This function is now simplified since we're using <a> tags
    // The browser will handle navigation naturally
    handleClose();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        handleClose();
        break;
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      inputRef.current?.focus();
      
      if (!hasAddedHistoryEntry.current) {
        window.history.pushState({ modal: 'search' }, '');
        hasAddedHistoryEntry.current = true;
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, selectedIndex]);

  useEffect(() => {
    const handlePopState = () => {
      if (isOpen) {
        onClose();
        hasAddedHistoryEntry.current = false;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen, onClose]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchQuery]);



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" style={{ pointerEvents: 'auto' }}>
      {/* Backdrop */}
      <div 
        className="fixed bg-black/50 backdrop-blur-sm transition-all duration-300 ease-in-out"
        style={{
          top: 0,
          bottom: 0,
          ...(useRightAlign ? {
            left: 0,
            right: 0
          } : {
            left: `${modalLeftPosition}rem`,
            right: 0
          }),
          transform: 'translateZ(0)' // Force GPU acceleration
        }}
        onClick={handleClose}
      />
      
      {/* Search Modal Content */}
      {isDesktopMode ? (
        <div 
          className="fixed top-16"
          style={{
            ...(useRightAlign ? {
              left: `${modalLeftPosition}rem`,
              right: 'auto',
              width: `calc(100% - ${modalLeftPosition}rem - 2rem)`,
              maxWidth: '50rem'
            } : {
              left: `${modalLeftPosition}rem`,
              right: '1rem'
            }),
            zIndex: 51, // Ensure it's above the backdrop
            pointerEvents: 'auto',
            transform: 'translateZ(0)', // Force GPU acceleration for smooth transition
            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' // Explicit transition on left and width properties
          }}
        >
          <div 
            className={`bg-white dark:bg-card rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden desktop-search-modal ${useRightAlign ? 'ml-auto' : 'mx-auto'}`}
                          style={{
                maxWidth: useRightAlign ? '100%' : '64rem', // max-w-4xl equivalent
                // Fixed height to prevent jumping between loading and loaded states
                height: viewportDimensions.height <= 600 ? 'calc(100vh - 4rem)' : '70vh'
              }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 搜索輸入框 */}
            <div className="flex items-center px-4">
              <input
                ref={inputRef}
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 py-4 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search History - Only show when no search query */}
            {!searchQuery.trim() && (
              <SearchHistory onHistoryItemClick={handleHistoryItemClick} />
            )}

            {/* Tab Switcher - Only show when no search query */}
            {!searchQuery.trim() && (
              <div className="px-4 py-3">
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('courses')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === 'courses'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <BookOpenIcon className="h-4 w-4 text-red-600" />
                    <div className="hidden sm:flex sm:flex-col sm:items-center sm:gap-0">
                      <span>{t('featured.courses')}</span>
                      <span className="text-xs opacity-75">({t('featured.mostReviews')})</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('instructors')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === 'instructors'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <GraduationCap className="h-4 w-4 text-red-600" />
                    <div className="hidden sm:flex sm:flex-col sm:items-center sm:gap-0">
                      <span>{t('featured.instructors')}</span>
                      <span className="text-xs opacity-75">({t('featured.mostReviews')})</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('topCourses')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === 'topCourses'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <BookOpenIcon className="h-4 w-4 text-gray-500" />
                    <div className="hidden sm:flex sm:flex-col sm:items-center sm:gap-0">
                      <span>{t('featured.topCourses')}</span>
                      <span className="text-xs opacity-75">({t('featured.highestAvgGPA')})</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('topInstructors')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === 'topInstructors'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <GraduationCap className="h-4 w-4 text-gray-500" />
                    <div className="hidden sm:flex sm:flex-col sm:items-center sm:gap-0">
                      <span>{t('featured.topInstructors')}</span>
                      <span className="text-xs opacity-75">({t('featured.highestAvgGPA')})</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* 搜索結果容器 */}
            <div className="flex-1 relative overflow-hidden">
              {/* 滾動內容 */}
              <div 
                ref={scrollContainerRef}
                className="h-full overflow-y-auto scrollbar-hide"
                                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    // Dynamic max height for desktop responsive behavior
                                        maxHeight: viewportDimensions.height <= 600 ? 'calc(100vh - 8rem)' : '500px'
                  }}
                >
                  {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                      <p className="text-muted-foreground text-center">{t('common.loading')}</p>
                    </div>
                  ) : (
                    <div className="p-4 pb-8 space-y-6">
                    {/* 搜尋結果 */}
                    {searchQuery.trim() && (
                      <div className="space-y-6">
                        {/* 課程結果 */}
                        {filteredCourses.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3 px-2">
                              <BookOpenIcon className="h-5 w-5 text-red-600" />
                              <h3 className="font-medium text-gray-900 dark:text-white">{t('search.courses')}</h3>
                            </div>
                            <div className="space-y-2">
                              {filteredCourses.map((course, index) => {
                                const titleInfo = getCourseTitle(course, currentLanguage);
                                const departmentName = translateDepartmentName(course.department, t);
                                const facultyKey = getFacultyByDepartment(course.department);
                                const courseUrl = `/courses/${course.course_code}`;
                                
                                return (
                                  <a
                                    key={course.course_code}
                                    href={courseUrl}
                                    onClick={() => handleCourseClick(course.course_code)}
                                    className="block p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="min-w-0 flex-1">
                                        <div className="font-medium text-gray-900 dark:text-white font-mono truncate">
                                          {course.course_code}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                          {titleInfo.secondary ? `${titleInfo.primary} • ${titleInfo.secondary}` : titleInfo.primary}
                                        </div>
                                        <div className={`${currentLanguage === 'en' ? 'flex flex-col items-start gap-1.5' : 'flex items-center gap-1 flex-wrap'} mt-1`}>
                                          {facultyKey && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                              {t(facultyKey)}
                                            </span>
                                          )}
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                            {departmentName}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-1 text-sm text-gray-500 ml-2 flex-shrink-0">
                                        <div className="flex items-center gap-1">
                                          <MessageSquare className="h-4 w-4" />
                                          <span>{course.reviewCount}</span>
                                        </div>
                                        {/* Average GPA with same styling as course cards */}
                                        {course.averageGPA && course.averageGPA > 0 ? (
                                          <span className="text-sm font-bold text-transparent bg-gradient-to-r from-red-600 via-red-500 to-red-400 dark:from-red-500 dark:via-red-400 dark:to-red-300 bg-clip-text">
                                            {formatGPA(course.averageGPA)}
                                          </span>
                                        ) : (
                                          <span className="text-sm font-bold text-gray-400">N/A</span>
                                        )}
                                      </div>
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 講師結果 */}
                        {filteredInstructors.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3 px-2">
                              <GraduationCap className="h-5 w-5 text-red-600" />
                              <h3 className="font-medium text-gray-900 dark:text-white">{t('search.instructors')}</h3>
                            </div>
                            <div className="space-y-2">
                              {filteredInstructors.map((instructor, index) => {
                                const instructorName = getInstructorName(instructor, currentLanguage);
                                const departmentName = translateDepartmentName(instructor.department, t);
                                const instructorUrl = `/instructors/${encodeURIComponent(instructor.name)}`;
                                
                                return (
                                  <a
                                    key={instructor.name}
                                    href={instructorUrl}
                                    onClick={() => handleInstructorClick(instructor.name)}
                                    className="block p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="min-w-0 flex-1">
                                        <div className="font-medium text-gray-900 dark:text-white truncate">
                                          {instructorName.primary}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                          {departmentName}
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-1 text-sm text-gray-500 ml-3 flex-shrink-0">
                                        <div className="flex items-center gap-1">
                                          <MessageSquare className="h-4 w-4" />
                                          <span>{instructor.reviewCount}</span>
                                        </div>
                                        {/* Average GPA with same styling as instructor cards */}
                                        {instructor.averageGPA && instructor.averageGPA > 0 ? (
                                          <span className="text-sm font-bold text-transparent bg-gradient-to-r from-red-600 via-red-500 to-red-400 dark:from-red-500 dark:via-red-400 dark:to-red-300 bg-clip-text">
                                            {formatGPA(instructor.averageGPA)}
                                          </span>
                                        ) : (
                                          <span className="text-sm font-bold text-gray-400">N/A</span>
                                        )}
                                      </div>
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 無搜索結果 */}
                        {filteredCourses.length === 0 && filteredInstructors.length === 0 && (
                          <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">{t('search.noResults')}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 熱門內容 - 只在沒有搜索時顯示 */}
                    {!searchQuery.trim() && (
                      <>
                        {/* 熱門課程 - Only show when courses tab is active */}
                        {activeTab === 'courses' && (
                          <div>
                            <div className="block sm:hidden flex items-center gap-2 mb-3 px-2">
                              <BookOpenIcon className="h-5 w-5 text-red-600" />
                              <h3 className="font-medium text-gray-900 dark:text-white">{t('featured.courses')} ({t('featured.mostReviews')})</h3>
                            </div>
                            <div className="space-y-2">
                              {popularCourses.map((course) => {
                                const titleInfo = getCourseTitle(course, currentLanguage);
                                const departmentName = translateDepartmentName(course.department, t);
                                const facultyKey = getFacultyByDepartment(course.department);
                                const courseUrl = `/courses/${course.course_code}`;
                                return (
                                  <a
                                    key={course.course_code}
                                    href={courseUrl}
                                    onClick={(e) => {
                                      // Only prevent default if it's a special click (Ctrl, Cmd, middle-click)
                                      // Let normal clicks use the default link behavior
                                      if (e.ctrlKey || e.metaKey || e.button === 1) {
                                        // Let browser handle these naturally
                                        handleClose();
                                        return;
                                      }
                                      // For normal clicks, prevent default and use React Router
                                      e.preventDefault();
                                      navigate(courseUrl);
                                      handleClose();
                                    }}
                                    className="block w-full text-left px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors no-underline"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="min-w-0 flex-1 space-y-1">
                                        {/* 第1行：課程代碼 */}
                                        <div className="font-medium text-gray-900 dark:text-white font-mono">
                                          {course.course_code}
                                        </div>
                                        {/* 第2行：課程名稱 */}
                                        <div className="text-sm text-gray-600 dark:text-gray-300 leading-tight">
                                          {titleInfo.secondary 
                                            ? `${titleInfo.primary} • ${titleInfo.secondary}`
                                            : titleInfo.primary
                                          }
                                        </div>
                                        {/* 第3行：學院和系所 */}
                                        <div className="flex items-center gap-1 flex-wrap">
                                          {facultyKey && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                              {t(facultyKey)}
                                            </span>
                                          )}
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                            {departmentName}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-1 text-sm text-gray-500 ml-3 flex-shrink-0">
                                        <div className="flex items-center gap-1">
                                          <MessageSquare className="h-4 w-4" />
                                          <span>{course.reviewCount}</span>
                                        </div>
                                        {/* Average GPA with same styling as course cards */}
                                        {course.averageGPA && course.averageGPA > 0 ? (
                                          <span className="text-sm font-bold text-transparent bg-gradient-to-r from-red-600 via-red-500 to-red-400 dark:from-red-500 dark:via-red-400 dark:to-red-300 bg-clip-text">
                                            {formatGPA(course.averageGPA)}
                                          </span>
                                        ) : (
                                          <span className="text-sm font-bold text-gray-400">N/A</span>
                                        )}
                                      </div>
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 熱門講師 - Only show when instructors tab is active */}
                        {activeTab === 'instructors' && (
                          <div>
                            <div className="block sm:hidden flex items-center gap-2 mb-3 px-2">
                              <GraduationCap className="h-5 w-5 text-red-600" />
                              <h3 className="font-medium text-gray-900 dark:text-white">{t('featured.instructors')} ({t('featured.mostReviews')})</h3>
                            </div>
                            <div className="space-y-2">
                              {popularInstructors.map((instructor) => {
                                const nameInfo = getInstructorName(instructor, currentLanguage);
                                const departmentName = translateDepartmentName(instructor.department, t);
                                const facultyKey = getFacultyByDepartment(instructor.department);
                                const instructorUrl = `/instructors/${encodeURIComponent(instructor.name)}`;
                                return (
                                  <a
                                    key={instructor.name}
                                    href={instructorUrl}
                                    onClick={(e) => {
                                      // Only prevent default if it's a special click (Ctrl, Cmd, middle-click)
                                      // Let normal clicks use the default link behavior
                                      if (e.ctrlKey || e.metaKey || e.button === 1) {
                                        // Let browser handle these naturally
                                        handleClose();
                                        return;
                                      }
                                      // For normal clicks, prevent default and use React Router
                                      e.preventDefault();
                                      navigate(instructorUrl);
                                      handleClose();
                                    }}
                                    className="block w-full text-left px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors no-underline"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="min-w-0 flex-1 space-y-1">
                                        {/* 第1行：英文名稱 */}
                                        <div className="font-medium text-gray-900 dark:text-white">
                                          {nameInfo.primary}
                                        </div>
                                        {/* 第2行：中文名稱（保留空間以維持高度一致） */}
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                          {nameInfo.secondary || ''}
                                        </div>
                                        {/* 第3行：學院和系所 */}
                                        <div className="flex items-center gap-1 flex-wrap">
                                          {facultyKey && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                              {t(facultyKey)}
                                            </span>
                                          )}
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                            {departmentName}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-1 text-sm text-gray-500 ml-3 flex-shrink-0">
                                        <div className="flex items-center gap-1">
                                          <MessageSquare className="h-4 w-4" />
                                          <span>{instructor.reviewCount}</span>
                                        </div>
                                        {/* Average GPA with same styling as instructor cards */}
                                        {instructor.averageGPA && instructor.averageGPA > 0 ? (
                                          <span className="text-sm font-bold text-transparent bg-gradient-to-r from-red-600 via-red-500 to-red-400 dark:from-red-500 dark:via-red-400 dark:to-red-300 bg-clip-text">
                                            {formatGPA(instructor.averageGPA)}
                                          </span>
                                        ) : (
                                          <span className="text-sm font-bold text-gray-400">N/A</span>
                                        )}
                                      </div>
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 最佳課程 - Only show when topCourses tab is active */}
                        {activeTab === 'topCourses' && (
                          <div>
                            <div className="block sm:hidden flex items-center gap-2 mb-3 px-2">
                              <BookOpenIcon className="h-5 w-5 text-gray-500" />
                              <h3 className="font-medium text-gray-900 dark:text-white">{t('featured.topCourses')} ({t('featured.highestAvgGPA')})</h3>
                            </div>
                            <div className="space-y-2">
                              {topCourses.map((course) => {
                                const titleInfo = getCourseTitle(course, currentLanguage);
                                const departmentName = translateDepartmentName(course.department, t);
                                const facultyKey = getFacultyByDepartment(course.department);
                                const courseUrl = `/courses/${course.course_code}`;
                                return (
                                  <a
                                    key={course.course_code}
                                    href={courseUrl}
                                    onClick={(e) => {
                                      // Only prevent default if it's a special click (Ctrl, Cmd, middle-click)
                                      // Let normal clicks use the default link behavior
                                      if (e.ctrlKey || e.metaKey || e.button === 1) {
                                        // Let browser handle these naturally
                                        handleClose();
                                        return;
                                      }
                                      // For normal clicks, prevent default and use React Router
                                      e.preventDefault();
                                      navigate(courseUrl);
                                      handleClose();
                                    }}
                                    className="block w-full text-left px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors no-underline"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="min-w-0 flex-1 space-y-1">
                                        {/* 第1行：課程代碼 */}
                                        <div className="font-medium text-gray-900 dark:text-white font-mono">
                                          {course.course_code}
                                        </div>
                                        {/* 第2行：課程名稱 */}
                                        <div className="text-sm text-gray-600 dark:text-gray-300 leading-tight">
                                          {titleInfo.secondary 
                                            ? `${titleInfo.primary} • ${titleInfo.secondary}`
                                            : titleInfo.primary
                                          }
                                        </div>
                                        {/* 第3行：學院和系所 */}
                                        <div className="flex items-center gap-1 flex-wrap">
                                          {facultyKey && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                              {t(facultyKey)}
                                            </span>
                                          )}
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                            {departmentName}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-1 text-sm text-gray-500 ml-3 flex-shrink-0">
                                        <div className="flex items-center gap-1">
                                          <MessageSquare className="h-4 w-4" />
                                          <span>{course.reviewCount}</span>
                                        </div>
                                        {/* Average GPA with same styling as course cards */}
                                        {course.averageGPA && course.averageGPA > 0 ? (
                                          <span className="text-sm font-bold text-transparent bg-gradient-to-r from-red-600 via-red-500 to-red-400 dark:from-red-500 dark:via-red-400 dark:to-red-300 bg-clip-text">
                                            {formatGPA(course.averageGPA)}
                                          </span>
                                        ) : (
                                          <span className="text-sm font-bold text-gray-400">N/A</span>
                                        )}
                                      </div>
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 最佳講師 - Only show when topInstructors tab is active */}
                        {activeTab === 'topInstructors' && (
                          <div>
                            <div className="block sm:hidden flex items-center gap-2 mb-3 px-2">
                              <GraduationCap className="h-5 w-5 text-gray-500" />
                              <h3 className="font-medium text-gray-900 dark:text-white">{t('featured.topInstructors')} ({t('featured.highestAvgGPA')})</h3>
                            </div>
                            <div className="space-y-2">
                              {topInstructors.map((instructor) => {
                                const nameInfo = getInstructorName(instructor, currentLanguage);
                                const departmentName = translateDepartmentName(instructor.department, t);
                                const facultyKey = getFacultyByDepartment(instructor.department);
                                const instructorUrl = `/instructors/${encodeURIComponent(instructor.name)}`;
                                return (
                                  <a
                                    key={instructor.name}
                                    href={instructorUrl}
                                    onClick={(e) => {
                                      // Only prevent default if it's a special click (Ctrl, Cmd, middle-click)
                                      // Let normal clicks use the default link behavior
                                      if (e.ctrlKey || e.metaKey || e.button === 1) {
                                        // Let browser handle these naturally
                                        handleClose();
                                        return;
                                      }
                                      // For normal clicks, prevent default and use React Router
                                      e.preventDefault();
                                      navigate(instructorUrl);
                                      handleClose();
                                    }}
                                    className="block w-full text-left px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors no-underline"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="min-w-0 flex-1 space-y-1">
                                        {/* 第1行：英文名稱 */}
                                        <div className="font-medium text-gray-900 dark:text-white">
                                          {nameInfo.primary}
                                        </div>
                                        {/* 第2行：中文名稱（保留空間以維持高度一致） */}
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                          {nameInfo.secondary || ''}
                                        </div>
                                        {/* 第3行：學院和系所 */}
                                        <div className="flex items-center gap-1 flex-wrap">
                                          {facultyKey && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                              {t(facultyKey)}
                                            </span>
                                          )}
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                            {departmentName}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-1 text-sm text-gray-500 ml-3 flex-shrink-0">
                                        <div className="flex items-center gap-1">
                                          <MessageSquare className="h-4 w-4" />
                                          <span>{instructor.reviewCount}</span>
                                        </div>
                                        {/* Average GPA with same styling as instructor cards */}
                                        {instructor.averageGPA && instructor.averageGPA > 0 ? (
                                          <span className="text-sm font-bold text-transparent bg-gradient-to-r from-red-600 via-red-500 to-red-400 dark:from-red-500 dark:via-red-400 dark:to-red-300 bg-clip-text">
                                            {formatGPA(instructor.averageGPA)}
                                          </span>
                                        ) : (
                                          <span className="text-sm font-bold text-gray-400">N/A</span>
                                        )}
                                      </div>
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      ) : (
        <div 
          className="fixed top-16 mx-auto"
          style={{
            // Mobile: sidebar is hidden when collapsed, so we don't need to account for it
            left: '1rem',
            right: '1rem',
            width: 'calc(100vw - 2rem)',
            maxWidth: '48rem', // Slightly smaller max-width for mobile
            zIndex: 51 // Ensure it's above the backdrop
          }}
        >
          <div 
            className="bg-white dark:bg-card rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
            style={{
              // Fixed height to prevent jumping between loading and loaded states
              height: viewportDimensions.height <= 500 
                ? (viewportDimensions.height <= 450 
                    ? 'calc(100vh - 4rem)' // Mobile phones in landscape (more conservative)
                    : 'calc(100vh - 2rem)' // Tablets in landscape
                  )
                : '80vh' // Portrait mode
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 搜索輸入框 */}
            <div className="flex items-center px-4">
              <input
                ref={inputRef}
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 py-4 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search History - Only show when no search query */}
            {!searchQuery.trim() && (
              <SearchHistory onHistoryItemClick={handleHistoryItemClick} />
            )}

            {/* Tab Switcher - Only show when no search query */}
            {!searchQuery.trim() && (
              <div className="px-4 py-3">
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('courses')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === 'courses'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <BookOpenIcon className="h-4 w-4 text-red-600" />
                    <div className="hidden sm:flex sm:flex-col sm:items-center sm:gap-0">
                      <span>{t('featured.courses')}</span>
                      <span className="text-xs opacity-75">({t('featured.mostReviews')})</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('instructors')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === 'instructors'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <GraduationCap className="h-4 w-4 text-red-600" />
                    <div className="hidden sm:flex sm:flex-col sm:items-center sm:gap-0">
                      <span>{t('featured.instructors')}</span>
                      <span className="text-xs opacity-75">({t('featured.mostReviews')})</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('topCourses')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === 'topCourses'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <BookOpenIcon className="h-4 w-4 text-gray-500" />
                    <div className="hidden sm:flex sm:flex-col sm:items-center sm:gap-0">
                      <span>{t('featured.topCourses')}</span>
                      <span className="text-xs opacity-75">({t('featured.highestAvgGPA')})</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('topInstructors')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === 'topInstructors'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <GraduationCap className="h-4 w-4 text-gray-500" />
                    <div className="hidden sm:flex sm:flex-col sm:items-center sm:gap-0">
                      <span>{t('featured.topInstructors')}</span>
                      <span className="text-xs opacity-75">({t('featured.highestAvgGPA')})</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* 搜索結果容器 */}
            <div className="flex-1 relative overflow-hidden">
              {/* 滾動內容 */}
              <div 
                ref={scrollContainerRef}
                className="h-full overflow-y-auto scrollbar-hide"
                                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    // Dynamic max height based on device type and orientation
                    maxHeight: viewportDimensions.height <= 500 
                      ? (viewportDimensions.height <= 450 
                          ? 'calc(100vh - 10rem)' // Mobile phones in landscape (more conservative)
                          : 'calc(100vh - 7rem)'  // Tablets in landscape  
                        )
                      : '65vh' // Portrait mode
                  }}
              >
                {loading ? (
                  <div className="h-full flex flex-col items-center justify-center min-h-0">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-center">{t('common.loading')}</p>
                  </div>
                ) : (
                  <div 
                    className="p-4 space-y-6"
                    style={{
                      // Extra bottom padding to simulate additional items
                      paddingBottom: viewportDimensions.height <= 450 ? '12rem' : '16rem'
                    }}
                  >
                    {/* 搜尋結果 */}
                    {searchQuery.trim() && (
                      <div className="space-y-6">
                        {/* 課程結果 */}
                        {filteredCourses.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3 px-2">
                              <BookOpenIcon className="h-5 w-5 text-red-600" />
                              <h3 className="font-medium text-gray-900 dark:text-white">{t('search.courses')}</h3>
                            </div>
                            <div className="space-y-2">
                              {filteredCourses.map((course, index) => {
                                const titleInfo = getCourseTitle(course, currentLanguage);
                                const departmentName = translateDepartmentName(course.department, t);
                                const facultyKey = getFacultyByDepartment(course.department);
                                const courseUrl = `/courses/${course.course_code}`;
                                
                                return (
                                  <a
                                    key={course.course_code}
                                    href={courseUrl}
                                    onClick={() => handleCourseClick(course.course_code)}
                                    className="block p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="min-w-0 flex-1">
                                        <div className="font-medium text-gray-900 dark:text-white font-mono truncate">
                                          {course.course_code}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                          {titleInfo.secondary ? `${titleInfo.primary} • ${titleInfo.secondary}` : titleInfo.primary}
                                        </div>
                                        <div className={`${currentLanguage === 'en' ? 'flex flex-col items-start gap-1.5' : 'flex items-center gap-1 flex-wrap'} mt-1`}>
                                          {facultyKey && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                              {t(facultyKey)}
                                            </span>
                                          )}
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                            {departmentName}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-1 text-sm text-gray-500 ml-2 flex-shrink-0">
                                        <div className="flex items-center gap-1">
                                          <MessageSquare className="h-4 w-4" />
                                          <span>{course.reviewCount}</span>
                                        </div>
                                        {/* Average GPA with same styling as course cards */}
                                        {course.averageGPA && course.averageGPA > 0 ? (
                                          <span className="text-sm font-bold text-transparent bg-gradient-to-r from-red-600 via-red-500 to-red-400 dark:from-red-500 dark:via-red-400 dark:to-red-300 bg-clip-text">
                                            {formatGPA(course.averageGPA)}
                                          </span>
                                        ) : (
                                          <span className="text-sm font-bold text-gray-400">N/A</span>
                                        )}
                                      </div>
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 講師結果 */}
                        {filteredInstructors.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3 px-2">
                              <GraduationCap className="h-5 w-5 text-red-600" />
                              <h3 className="font-medium text-gray-900 dark:text-white">{t('search.instructors')}</h3>
                            </div>
                            <div className="space-y-2">
                              {filteredInstructors.map((instructor, index) => {
                                const instructorName = getInstructorName(instructor, currentLanguage);
                                const departmentName = translateDepartmentName(instructor.department, t);
                                const instructorUrl = `/instructors/${encodeURIComponent(instructor.name)}`;
                                
                                return (
                                  <a
                                    key={instructor.name}
                                    href={instructorUrl}
                                    onClick={() => handleInstructorClick(instructor.name)}
                                    className="block p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="min-w-0 flex-1">
                                        <div className="font-medium text-gray-900 dark:text-white truncate">
                                          {instructorName.primary}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                          {departmentName}
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-1 text-sm text-gray-500 ml-3 flex-shrink-0">
                                        <div className="flex items-center gap-1">
                                          <MessageSquare className="h-4 w-4" />
                                          <span>{instructor.reviewCount}</span>
                                        </div>
                                        {/* Average GPA with same styling as instructor cards */}
                                        {instructor.averageGPA && instructor.averageGPA > 0 ? (
                                          <span className="text-sm font-bold text-transparent bg-gradient-to-r from-red-600 via-red-500 to-red-400 dark:from-red-500 dark:via-red-400 dark:to-red-300 bg-clip-text">
                                            {formatGPA(instructor.averageGPA)}
                                          </span>
                                        ) : (
                                          <span className="text-sm font-bold text-gray-400">N/A</span>
                                        )}
                                      </div>
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 無搜索結果 */}
                        {filteredCourses.length === 0 && filteredInstructors.length === 0 && (
                          <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">{t('search.noResults')}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 熱門內容 - 只在沒有搜索時顯示 */}
                    {!searchQuery.trim() && (
                      <>
                        {/* 熱門課程 - Only show when courses tab is active */}
                        {activeTab === 'courses' && (
                          <div>
                            <div className="block sm:hidden flex items-center gap-2 mb-3 px-2">
                              <BookOpenIcon className="h-5 w-5 text-red-600" />
                              <h3 className="font-medium text-gray-900 dark:text-white">{t('featured.courses')} ({t('featured.mostReviews')})</h3>
                            </div>
                            <div className="space-y-2">
                              {popularCourses.map((course) => {
                                const titleInfo = getCourseTitle(course, currentLanguage);
                                const departmentName = translateDepartmentName(course.department, t);
                                const facultyKey = getFacultyByDepartment(course.department);
                                const courseUrl = `/courses/${course.course_code}`;
                                return (
                                  <a
                                    key={course.course_code}
                                    href={courseUrl}
                                    onClick={(e) => {
                                      // Only prevent default if it's a special click (Ctrl, Cmd, middle-click)
                                      // Let normal clicks use the default link behavior
                                      if (e.ctrlKey || e.metaKey || e.button === 1) {
                                        // Let browser handle these naturally
                                        handleClose();
                                        return;
                                      }
                                      // For normal clicks, prevent default and use React Router
                                      e.preventDefault();
                                      navigate(courseUrl);
                                      handleClose();
                                    }}
                                    className="block w-full text-left px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors no-underline"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="min-w-0 flex-1 space-y-1">
                                        {/* 第1行：課程代碼 */}
                                        <div className="font-medium text-gray-900 dark:text-white font-mono">
                                          {course.course_code}
                                        </div>
                                        {/* 第2行：課程名稱 */}
                                        <div className="text-sm text-gray-600 dark:text-gray-300 leading-tight">
                                          {titleInfo.secondary 
                                            ? `${titleInfo.primary} • ${titleInfo.secondary}`
                                            : titleInfo.primary
                                          }
                                        </div>
                                        {/* 第3行：學院和系所 */}
                                        <div className="flex items-center gap-1 flex-wrap">
                                          {facultyKey && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                              {t(facultyKey)}
                                            </span>
                                          )}
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                            {departmentName}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-1 text-sm text-gray-500 ml-3 flex-shrink-0">
                                        <div className="flex items-center gap-1">
                                          <MessageSquare className="h-4 w-4" />
                                          <span>{course.reviewCount}</span>
                                        </div>
                                        {/* Average GPA with same styling as course cards */}
                                        {course.averageGPA && course.averageGPA > 0 ? (
                                          <span className="text-sm font-bold text-transparent bg-gradient-to-r from-red-600 via-red-500 to-red-400 dark:from-red-500 dark:via-red-400 dark:to-red-300 bg-clip-text">
                                            {formatGPA(course.averageGPA)}
                                          </span>
                                        ) : (
                                          <span className="text-sm font-bold text-gray-400">N/A</span>
                                        )}
                                      </div>
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 熱門講師 - Only show when instructors tab is active */}
                        {activeTab === 'instructors' && (
                          <div>
                            <div className="block sm:hidden flex items-center gap-2 mb-3 px-2">
                              <GraduationCap className="h-5 w-5 text-red-600" />
                              <h3 className="font-medium text-gray-900 dark:text-white">{t('featured.instructors')} ({t('featured.mostReviews')})</h3>
                            </div>
                            <div className="space-y-2">
                              {popularInstructors.map((instructor) => {
                                const nameInfo = getInstructorName(instructor, currentLanguage);
                                const departmentName = translateDepartmentName(instructor.department, t);
                                const facultyKey = getFacultyByDepartment(instructor.department);
                                const instructorUrl = `/instructors/${encodeURIComponent(instructor.name)}`;
                                return (
                                  <a
                                    key={instructor.name}
                                    href={instructorUrl}
                                    onClick={(e) => {
                                      // Only prevent default if it's a special click (Ctrl, Cmd, middle-click)
                                      // Let normal clicks use the default link behavior
                                      if (e.ctrlKey || e.metaKey || e.button === 1) {
                                        // Let browser handle these naturally
                                        handleClose();
                                        return;
                                      }
                                      // For normal clicks, prevent default and use React Router
                                      e.preventDefault();
                                      navigate(instructorUrl);
                                      handleClose();
                                    }}
                                    className="block w-full text-left px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors no-underline"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="min-w-0 flex-1 space-y-1">
                                        {/* 第1行：英文名稱 */}
                                        <div className="font-medium text-gray-900 dark:text-white">
                                          {nameInfo.primary}
                                        </div>
                                        {/* 第2行：中文名稱（保留空間以維持高度一致） */}
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                          {nameInfo.secondary || ''}
                                        </div>
                                        {/* 第3行：學院和系所 */}
                                        <div className="flex items-center gap-1 flex-wrap">
                                          {facultyKey && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                              {t(facultyKey)}
                                            </span>
                                          )}
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                            {departmentName}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-1 text-sm text-gray-500 ml-3 flex-shrink-0">
                                        <div className="flex items-center gap-1">
                                          <MessageSquare className="h-4 w-4" />
                                          <span>{instructor.reviewCount}</span>
                                        </div>
                                        {/* Average GPA with same styling as instructor cards */}
                                        {instructor.averageGPA && instructor.averageGPA > 0 ? (
                                          <span className="text-sm font-bold text-transparent bg-gradient-to-r from-red-600 via-red-500 to-red-400 dark:from-red-500 dark:via-red-400 dark:to-red-300 bg-clip-text">
                                            {formatGPA(instructor.averageGPA)}
                                          </span>
                                        ) : (
                                          <span className="text-sm font-bold text-gray-400">N/A</span>
                                        )}
                                      </div>
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 最佳課程 - Only show when topCourses tab is active */}
                        {activeTab === 'topCourses' && (
                          <div>
                            <div className="block sm:hidden flex items-center gap-2 mb-3 px-2">
                              <BookOpenIcon className="h-5 w-5 text-gray-500" />
                              <h3 className="font-medium text-gray-900 dark:text-white">{t('featured.topCourses')} ({t('featured.highestAvgGPA')})</h3>
                            </div>
                            <div className="space-y-2">
                              {topCourses.map((course) => {
                                const titleInfo = getCourseTitle(course, currentLanguage);
                                const departmentName = translateDepartmentName(course.department, t);
                                const facultyKey = getFacultyByDepartment(course.department);
                                const courseUrl = `/courses/${course.course_code}`;
                                return (
                                  <a
                                    key={course.course_code}
                                    href={courseUrl}
                                    onClick={(e) => {
                                      // Only prevent default if it's a special click (Ctrl, Cmd, middle-click)
                                      // Let normal clicks use the default link behavior
                                      if (e.ctrlKey || e.metaKey || e.button === 1) {
                                        // Let browser handle these naturally
                                        handleClose();
                                        return;
                                      }
                                      // For normal clicks, prevent default and use React Router
                                      e.preventDefault();
                                      navigate(courseUrl);
                                      handleClose();
                                    }}
                                    className="block w-full text-left px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors no-underline"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="min-w-0 flex-1 space-y-1">
                                        {/* 第1行：課程代碼 */}
                                        <div className="font-medium text-gray-900 dark:text-white font-mono">
                                          {course.course_code}
                                        </div>
                                        {/* 第2行：課程名稱 */}
                                        <div className="text-sm text-gray-600 dark:text-gray-300 leading-tight">
                                          {titleInfo.secondary 
                                            ? `${titleInfo.primary} • ${titleInfo.secondary}`
                                            : titleInfo.primary
                                          }
                                        </div>
                                        {/* 第3行：學院和系所 */}
                                        <div className="flex items-center gap-1 flex-wrap">
                                          {facultyKey && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                              {t(facultyKey)}
                                            </span>
                                          )}
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                            {departmentName}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-1 text-sm text-gray-500 ml-3 flex-shrink-0">
                                        <div className="flex items-center gap-1">
                                          <MessageSquare className="h-4 w-4" />
                                          <span>{course.reviewCount}</span>
                                        </div>
                                        {/* Average GPA with same styling as course cards */}
                                        {course.averageGPA && course.averageGPA > 0 ? (
                                          <span className="text-sm font-bold text-transparent bg-gradient-to-r from-red-600 via-red-500 to-red-400 dark:from-red-500 dark:via-red-400 dark:to-red-300 bg-clip-text">
                                            {formatGPA(course.averageGPA)}
                                          </span>
                                        ) : (
                                          <span className="text-sm font-bold text-gray-400">N/A</span>
                                        )}
                                      </div>
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 最佳講師 - Only show when topInstructors tab is active */}
                        {activeTab === 'topInstructors' && (
                          <div>
                            <div className="block sm:hidden flex items-center gap-2 mb-3 px-2">
                              <GraduationCap className="h-5 w-5 text-gray-500" />
                              <h3 className="font-medium text-gray-900 dark:text-white">{t('featured.topInstructors')} ({t('featured.highestAvgGPA')})</h3>
                            </div>
                            <div className="space-y-2">
                              {topInstructors.map((instructor) => {
                                const nameInfo = getInstructorName(instructor, currentLanguage);
                                const departmentName = translateDepartmentName(instructor.department, t);
                                const facultyKey = getFacultyByDepartment(instructor.department);
                                const instructorUrl = `/instructors/${encodeURIComponent(instructor.name)}`;
                                return (
                                  <a
                                    key={instructor.name}
                                    href={instructorUrl}
                                    onClick={(e) => {
                                      // Only prevent default if it's a special click (Ctrl, Cmd, middle-click)
                                      // Let normal clicks use the default link behavior
                                      if (e.ctrlKey || e.metaKey || e.button === 1) {
                                        // Let browser handle these naturally
                                        handleClose();
                                        return;
                                      }
                                      // For normal clicks, prevent default and use React Router
                                      e.preventDefault();
                                      navigate(instructorUrl);
                                      handleClose();
                                    }}
                                    className="block w-full text-left px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors no-underline"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="min-w-0 flex-1 space-y-1">
                                        {/* 第1行：英文名稱 */}
                                        <div className="font-medium text-gray-900 dark:text-white">
                                          {nameInfo.primary}
                                        </div>
                                        {/* 第2行：中文名稱（保留空間以維持高度一致） */}
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                          {nameInfo.secondary || ''}
                                        </div>
                                        {/* 第3行：學院和系所 */}
                                        <div className="flex items-center gap-1 flex-wrap">
                                          {facultyKey && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                              {t(facultyKey)}
                                            </span>
                                          )}
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                            {departmentName}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-1 text-sm text-gray-500 ml-3 flex-shrink-0">
                                        <div className="flex items-center gap-1">
                                          <MessageSquare className="h-4 w-4" />
                                          <span>{instructor.reviewCount}</span>
                                        </div>
                                        {/* Average GPA with same styling as instructor cards */}
                                        {instructor.averageGPA && instructor.averageGPA > 0 ? (
                                          <span className="text-sm font-bold text-transparent bg-gradient-to-r from-red-600 via-red-500 to-red-400 dark:from-red-500 dark:via-red-400 dark:to-red-300 bg-clip-text">
                                            {formatGPA(instructor.averageGPA)}
                                          </span>
                                        ) : (
                                          <span className="text-sm font-bold text-gray-400">N/A</span>
                                        )}
                                      </div>
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 