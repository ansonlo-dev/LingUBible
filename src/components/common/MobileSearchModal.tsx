import { useState, useRef, useEffect, useMemo } from 'react';
import { X, BookText as BookOpenIcon, GraduationCap, MessageSquare, Loader2, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useNavigate } from 'react-router-dom';
import { CourseService, CourseWithStats, InstructorWithDetailedStats } from '@/services/api/courseService';
import { getCourseTitle, getInstructorName, translateDepartmentName, getTeachingLanguageName, extractInstructorNameForSorting } from '@/utils/textUtils';
import { formatGPA } from '@/utils/gradeUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { SearchHistory, useSearchHistory } from '@/components/common/SearchHistory';
import { useEnhancedResponsive } from '@/hooks/useEnhancedResponsive';
import { BookLoadingAnimation } from '@/components/ui/BookLoadingAnimation';
import { SimpleTooltip } from '@/components/ui/responsive-tooltip';

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
  const { isMobileLandscape, isMobilePortrait } = useEnhancedResponsive();
  
  // Track viewport dimensions for responsive positioning
  const [viewportDimensions, setViewportDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    isLandscape: typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false,
    isTabletSize: typeof window !== 'undefined' ? window.innerWidth >= 640 && window.innerWidth < 1024 : false
  });
  
  // Use a stable value for desktop mode detection based on viewport state
  const isDesktopMode = !isMobile && viewportDimensions.width >= 1024;
  
  // Detect iPad devices specifically (different from large desktop screens)
  const isIPadDevice = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const width = viewportDimensions.width;
    const height = viewportDimensions.height;
    // iPad devices: Mini (1024x768), Air (1180x820), Pro (1366x1024 landscape / 1024x1366 portrait)
    // Check for iPad-like aspect ratios and sizes
    const maxDimension = Math.max(width, height);
    const minDimension = Math.min(width, height);
    const isIPadSize = (
      (maxDimension >= 1024 && maxDimension <= 1400) && 
      (minDimension >= 768 && minDimension <= 1024)  // Updated to include iPad Pro portrait (1024 width)
    );
    return isIPadSize && isDesktopMode;
  }, [viewportDimensions.width, viewportDimensions.height, isDesktopMode]);
  
  
  // For true desktop (larger than iPad Pro), use simple centering
  const isLargeDesktop = isDesktopMode && !isIPadDevice;
  
  // Memoize sidebar positions for iPad positioning
  const sidebarPositions = useMemo(() => ({
    collapsed: 4,    // 4rem when collapsed
    expanded: 11     // 11rem when expanded
  }), []);
  
  // Calculate modal positioning for iPad devices
  const modalLeftPosition = useMemo(() => {
    if (!isIPadDevice) return 0;
    
    return isSidebarCollapsed ? sidebarPositions.collapsed : sidebarPositions.expanded;
  }, [isIPadDevice, isSidebarCollapsed, sidebarPositions]);
  
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
  const [searchActiveTab, setSearchActiveTab] = useState<'courses' | 'instructors'>('courses'); // Tab for search results
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

  // 處理 X 按鈕點擊：如果有文字則清空，沒有文字則關閉
  const handleCloseButtonClick = () => {
    if (searchQuery.trim()) {
      // 如果有搜索文字，清空文字並重新聚焦輸入框
      setSearchQuery('');
      setSelectedIndex(-1);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } else {
      // 如果沒有文字，關閉模態框
      handleClose();
    }
  };

  // 處理背景點擊：除了手機直立模式外都可以點擊關閉
  const handleBackdropClick = () => {
    // 允許所有非手機直立模式的設備點擊背景關閉
    // 這包括桌面、平板和手機橫屏模式
    if (!isMobilePortrait) {
      handleClose();
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

  // Update viewport dimensions when sidebar state changes (important for iPad positioning)
  useEffect(() => {
    if (isOpen && isIPadDevice) {
      const updateViewportForSidebar = () => {
        setViewportDimensions(prev => ({
          ...prev,
          width: window.innerWidth,
          height: window.innerHeight
        }));
      };
      
      // Small delay to ensure sidebar animation completes
      const timer = setTimeout(updateViewportForSidebar, 100);
      return () => clearTimeout(timer);
    }
  }, [isSidebarCollapsed, isOpen, isIPadDevice]);







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
      // Force update viewport dimensions when modal opens to ensure correct positioning
      const updateViewport = () => {
        setViewportDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
          isLandscape: window.innerWidth > window.innerHeight,
          isTabletSize: window.innerWidth >= 640 && window.innerWidth < 1024
        });
      };
      
      // Update immediately and after a small delay to ensure proper initialization
      updateViewport();
      setTimeout(updateViewport, 50);
      
      // 立即設置載入狀態，避免建議項目閃現
      setLoading(true);
      setIsInitialized(false);
      
      const loadData = async () => {
        try {
          // 採用分階段載入減少API併發壓力
          // 第一階段：載入搜索必須的基礎數據
          const [allCoursesData, allInstructorsData] = await Promise.all([
            CourseService.getCoursesWithStatsBatch(), // 獲取所有課程用於搜索
            CourseService.getAllInstructorsWithDetailedStats(), // 獲取所有講師用於搜索
          ]);
          
          setAllCourses(allCoursesData);
          setAllInstructors(allInstructorsData);
          
          // 短暫延遲避免API過載
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // 第二階段：載入熱門項目（用戶經常訪問）
          const [coursesData, instructorsData] = await Promise.all([
            CourseService.getPopularCourses(20), // 獲取前20個熱門課程，提供更多建議選項
            CourseService.getPopularInstructorsWithDetailedStats(20), // 獲取前20個熱門講師，提供更多建議選項
          ]);
          
          setPopularCourses(coursesData);
          setPopularInstructors(instructorsData);
          
          // 短暫延遲避免API過載
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // 第三階段：載入最佳項目（較少使用的標籤）
          const [topCoursesData, topInstructorsData] = await Promise.all([
            CourseService.getTopCoursesByGPA(20), // 獲取前20個最佳課程，提供更多建議選項
            CourseService.getTopInstructorsByGPA(20) // 獲取前20個最佳教師，提供更多建議選項
          ]);
          
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
      .sort((a, b) => {
        // 首先按姓名排序（忽略職稱），然後按評論數降序排序
        const aNameForSort = extractInstructorNameForSorting(a.name);
        const bNameForSort = extractInstructorNameForSorting(b.name);
        return aNameForSort.localeCompare(bNameForSort);
      })
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
    <div className={`fixed inset-0 z-[9999]`} style={{ pointerEvents: 'auto' }}>
      {/* Backdrop - 現在覆蓋整個螢幕包括側邊欄 */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-md transition-all duration-300 ease-in-out"
        style={{
          transform: 'translateZ(0)', // Force GPU acceleration
          WebkitBackdropFilter: 'blur(12px)', // Safari support
          backdropFilter: 'blur(12px)', // Modern browsers
          // 確保遮罩覆蓋包括側邊欄在內的整個螢幕
          left: '0',
          right: '0',
          top: '0',
          bottom: '0',
          zIndex: 50, // 高於側邊欄(40)但低於模態框內容(110)
          isolation: 'isolate' // Create new stacking context
        }}
        onClick={handleBackdropClick}
      />
      
      {/* Search Modal Content */}
      {isDesktopMode ? (
        <div 
          className={isLargeDesktop ? "fixed inset-0 flex items-center justify-center p-4" : "fixed inset-0 flex items-center justify-center"}
          key={`desktop-modal-${isSidebarCollapsed}-${isIPadDevice}`} // Force re-render when sidebar or device type changes
          style={{
            ...(isLargeDesktop ? {} : {
              // iPad-specific positioning that adapts to sidebar
              paddingLeft: `${modalLeftPosition}rem`,
              paddingRight: '1rem',
              paddingTop: '1rem',
              paddingBottom: '1rem',
              transition: 'padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' // Smooth transition when sidebar toggles
            }),
            zIndex: 9999, // Standard z-index
            pointerEvents: 'auto'
          }}
          onClick={handleBackdropClick}
        >
          <div 
            className={`bg-white dark:bg-card rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden desktop-search-modal w-full`}
            style={{
              ...(isLargeDesktop ? {
                // Large desktop: centered with consistent max width
                maxWidth: '64rem',
                width: '100%',
                height: viewportDimensions.height <= 600 ? 'calc(100vh - 8rem)' : '75vh'
              } : {
                // iPad: centered with adaptive max width that considers available space
                maxWidth: '64rem',
                width: '100%',
                height: viewportDimensions.height <= 600 ? 'calc(100vh - 2rem)' : '75vh'
              })
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
                onClick={handleCloseButtonClick}
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
                    <div className={`${isMobileLandscape ? 'flex' : 'hidden sm:flex'} flex-col items-center gap-0`}>
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
                    <div className={`${isMobileLandscape ? 'flex' : 'hidden sm:flex'} flex-col items-center gap-0`}>
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
                    <div className={`${isMobileLandscape ? 'flex' : 'hidden sm:flex'} flex-col items-center gap-0`}>
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
                    <div className={`${isMobileLandscape ? 'flex' : 'hidden sm:flex'} flex-col items-center gap-0`}>
                      <span>{t('featured.topInstructors')}</span>
                      <span className="text-xs opacity-75">({t('featured.highestAvgGPA')})</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Sticky Tab Title - Only show on small screens when no search query */}
            {!searchQuery.trim() && (
              <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 px-4 py-2 sm:hidden">
                <div className="flex items-center gap-2">
                  {activeTab === 'courses' && (
                    <>
                      <BookOpenIcon className="h-4 w-4 text-red-600" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{t('featured.courses')}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">({t('featured.mostReviews')})</span>
                      </div>
                    </>
                  )}
                  {activeTab === 'instructors' && (
                    <>
                      <GraduationCap className="h-4 w-4 text-red-600" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{t('featured.instructors')}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">({t('featured.mostReviews')})</span>
                      </div>
                    </>
                  )}
                  {activeTab === 'topCourses' && (
                    <>
                      <BookOpenIcon className="h-4 w-4 text-gray-500" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{t('featured.topCourses')}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">({t('featured.highestAvgGPA')})</span>
                      </div>
                    </>
                  )}
                  {activeTab === 'topInstructors' && (
                    <>
                      <GraduationCap className="h-4 w-4 text-gray-500" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{t('featured.topInstructors')}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">({t('featured.highestAvgGPA')})</span>
                      </div>
                    </>
                  )}
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
                  // Dynamic max height that adapts to device type and viewport
                  maxHeight: isLargeDesktop 
                    ? (viewportDimensions.height <= 600 ? 'calc(100vh - 12rem)' : '60vh')
                    : (viewportDimensions.height <= 600 ? 'calc(100vh - 6rem)' : '60vh')
                }}
                >
                  {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                      <BookLoadingAnimation size="lg" className="mb-4" />
                      <p className="text-muted-foreground text-center">{t('common.loading')}</p>
                    </div>
                  ) : (
                    <div className="p-4 pb-12 space-y-6">
                    {/* 搜尋結果 */}
                    {searchQuery.trim() && (
                      <div className="space-y-6">
                        {/* Search Tab Switcher */}
                        {(filteredCourses.length > 0 || filteredInstructors.length > 0) && (
                          <div className="space-y-2">
                            {/* Sticky Tab Title */}
                            <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 px-4 py-2 border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-2">
                                {searchActiveTab === 'courses' ? (
                                  <>
                                    <BookOpenIcon className="h-5 w-5 text-red-600" />
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {t('search.courses')}
                                    </span>
                                    {filteredCourses.length > 0 && (
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        ({filteredCourses.length})
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <GraduationCap className="h-5 w-5 text-red-600" />
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {t('search.instructors')}
                                    </span>
                                    {filteredInstructors.length > 0 && (
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        ({filteredInstructors.length})
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {/* Tab Buttons */}
                            <div className="px-4">
                              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                                <button
                                  onClick={() => setSearchActiveTab('courses')}
                                  className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                    searchActiveTab === 'courses'
                                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                  }`}
                                >
                                  <BookOpenIcon className="h-4 w-4 text-red-600" />
                                  {isMobileLandscape && (
                                    <span className="ml-2">{t('search.courses')}</span>
                                  )}
                                </button>
                                <button
                                  onClick={() => setSearchActiveTab('instructors')}
                                  className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                    searchActiveTab === 'instructors'
                                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                  }`}
                                >
                                  <GraduationCap className="h-4 w-4 text-red-600" />
                                  {isMobileLandscape && (
                                    <span className="ml-2">{t('search.instructors')}</span>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* 課程結果 */}
                        {searchActiveTab === 'courses' && filteredCourses.length > 0 && (
                          <div>
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
                                        <div className="font-bold text-gray-900 dark:text-white font-mono truncate">
                                          {course.course_code}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                          {titleInfo.secondary ? `${titleInfo.primary} • ${titleInfo.secondary}` : titleInfo.primary}
                                        </div>
                                        <div className="flex items-center gap-1 flex-wrap mt-1">
                                          {facultyKey && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                              {t(facultyKey)}
                                            </span>
                                          )}
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                            {departmentName}
                                          </span>
                                          {(course.currentTermTeachingLanguage || (course.teachingLanguages && course.teachingLanguages.length > 0)) && (
                                            <SimpleTooltip
                                              content={(() => {
                                                const languages = course.teachingLanguages || [course.currentTermTeachingLanguage].filter(Boolean);
                                                const languageNames = languages.map(code => getTeachingLanguageName(code, t));
                                                return `${t('course.teachingLanguage')}: ${languageNames.join(', ')}`;
                                              })()}
                                            >
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 overflow-hidden cursor-help">
                                                <div className="flex items-center gap-1">
                                                  {(course.teachingLanguages || [course.currentTermTeachingLanguage].filter(Boolean)).map((code, index) => (
                                                    <span 
                                                      key={code}
                                                      className={`${
                                                        index > 0 ? 'border-l border-orange-300 dark:border-orange-700 pl-1' : ''
                                                      }`}
                                                    >
                                                      {code === course.currentTermTeachingLanguage ? (
                                                        <strong>{code}</strong>
                                                      ) : (
                                                        code
                                                      )}
                                                    </span>
                                                  ))}
                                                </div>
                                              </span>
                                            </SimpleTooltip>
                                          )}
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
                        {searchActiveTab === 'instructors' && filteredInstructors.length > 0 && (
                          <div>
                            <div className="space-y-2">
                              {filteredInstructors.map((instructor, index) => {
                                const instructorName = getInstructorName(instructor, currentLanguage);
                                const departmentName = translateDepartmentName(instructor.department, t);
                                const facultyKey = getFacultyByDepartment(instructor.department);
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
                                        <div className="font-bold text-gray-900 dark:text-white truncate">
                                          {instructorName.primary}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                          {instructorName.secondary || ''}
                                        </div>
                                        <div className="flex items-center gap-1 flex-wrap mt-1">
                                          {facultyKey && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                              {t(facultyKey)}
                                            </span>
                                          )}
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                            {departmentName}
                                          </span>
                                          {(instructor.currentTermTeachingLanguage || (instructor.teachingLanguages && instructor.teachingLanguages.length > 0)) && (
                                            <SimpleTooltip
                                              content={(() => {
                                                const languages = instructor.teachingLanguages || [instructor.currentTermTeachingLanguage].filter(Boolean);
                                                const languageNames = languages.map(code => getTeachingLanguageName(code, t));
                                                return `${t('course.teachingLanguage')}: ${languageNames.join(', ')}`;
                                              })()}
                                            >
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 overflow-hidden cursor-help">
                                                <div className="flex items-center gap-1">
                                                  {(instructor.teachingLanguages || [instructor.currentTermTeachingLanguage].filter(Boolean)).map((code, index) => (
                                                    <span 
                                                      key={code}
                                                      className={`${
                                                        index > 0 ? 'border-l border-orange-300 dark:border-orange-700 pl-1' : ''
                                                      }`}
                                                    >
                                                      {code === instructor.currentTermTeachingLanguage ? (
                                                        <strong>{code}</strong>
                                                      ) : (
                                                        code
                                                      )}
                                                    </span>
                                                  ))}
                                                </div>
                                              </span>
                                            </SimpleTooltip>
                                          )}
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
                        {((searchActiveTab === 'courses' && filteredCourses.length === 0) || 
                          (searchActiveTab === 'instructors' && filteredInstructors.length === 0)) && (
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
                                        <div className="font-bold text-gray-900 dark:text-white font-mono">
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
                                          {(course.currentTermTeachingLanguage || (course.teachingLanguages && course.teachingLanguages.length > 0)) && (
                                            <SimpleTooltip
                                              content={(() => {
                                                const languages = course.teachingLanguages || [course.currentTermTeachingLanguage].filter(Boolean);
                                                const languageNames = languages.map(code => getTeachingLanguageName(code, t));
                                                return `${t('course.teachingLanguage')}: ${languageNames.join(', ')}`;
                                              })()}
                                            >
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 overflow-hidden cursor-help">
                                                <div className="flex items-center gap-1">
                                                  {(course.teachingLanguages || [course.currentTermTeachingLanguage].filter(Boolean)).map((code, index) => (
                                                    <span 
                                                      key={code}
                                                      className={`${
                                                        index > 0 ? 'border-l border-orange-300 dark:border-orange-700 pl-1' : ''
                                                      }`}
                                                    >
                                                      {code === course.currentTermTeachingLanguage ? (
                                                        <strong>{code}</strong>
                                                      ) : (
                                                        code
                                                      )}
                                                    </span>
                                                  ))}
                                                </div>
                                              </span>
                                            </SimpleTooltip>
                                          )}
                                          {/* Service Learning badges */}
                                          {course.serviceLearningTypes && course.serviceLearningTypes.length > 0 && (
                                            (() => {
                                              // Sort service learning types: SO first, then SC
                                              const sortedTypes = [...course.serviceLearningTypes].sort((a, b) => {
                                                if (a === 'optional' && b !== 'optional') return -1;
                                                if (b === 'optional' && a !== 'optional') return 1;
                                                return 0;
                                              });

                                              const serviceLearningTexts = sortedTypes.map(type => {
                                                const isCurrentTerm = course.currentTermServiceLearning?.includes(type);
                                                const text = type === 'optional' ? t('review.optional') : t('review.compulsory');
                                                return isCurrentTerm ? `${text} (${t('teaching.current')})` : text;
                                              });

                                              const tooltipText = `${t('features.serviceLearning')}: ${serviceLearningTexts.join(', ')}`;

                                              return (
                                                <SimpleTooltip content={tooltipText}>
                                                  <span 
                                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800 cursor-help overflow-hidden"
                                                  >
                                                    <div className="flex items-center gap-1">
                                                      {sortedTypes.map((type, index) => {
                                                        const isCurrentTerm = course.currentTermServiceLearning?.includes(type);
                                                        const text = type === 'optional' ? 'SO' : 'SC';
                                                        return (
                                                          <span 
                                                            key={type}
                                                            className={`${
                                                              index > 0 ? 'border-l border-purple-300 dark:border-purple-700 pl-1' : ''
                                                            } ${
                                                              isCurrentTerm ? 'underline decoration-2 underline-offset-1' : ''
                                                            }`}
                                                          >
                                                            {text}
                                                          </span>
                                                        );
                                                      })}
                                                    </div>
                                                  </span>
                                                </SimpleTooltip>
                                              );
                                            })()
                                          )}
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
                                        <div className="font-bold text-gray-900 dark:text-white">
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
                                          {(instructor.currentTermTeachingLanguage || (instructor.teachingLanguages && instructor.teachingLanguages.length > 0)) && (
                                            <SimpleTooltip
                                              content={(() => {
                                                const languages = instructor.teachingLanguages || [instructor.currentTermTeachingLanguage].filter(Boolean);
                                                const languageNames = languages.map(code => getTeachingLanguageName(code, t));
                                                return `${t('course.teachingLanguage')}: ${languageNames.join(', ')}`;
                                              })()}
                                            >
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 overflow-hidden cursor-help">
                                                <div className="flex items-center gap-1">
                                                  {(instructor.teachingLanguages || [instructor.currentTermTeachingLanguage].filter(Boolean)).map((code, index) => (
                                                    <span 
                                                      key={code}
                                                      className={`${
                                                        index > 0 ? 'border-l border-orange-300 dark:border-orange-700 pl-1' : ''
                                                      }`}
                                                    >
                                                      {code === instructor.currentTermTeachingLanguage ? (
                                                        <strong>{code}</strong>
                                                      ) : (
                                                        code
                                                      )}
                                                    </span>
                                                  ))}
                                                </div>
                                              </span>
                                            </SimpleTooltip>
                                          )}
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
                                        <div className="font-bold text-gray-900 dark:text-white font-mono">
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
                                          {(course.currentTermTeachingLanguage || (course.teachingLanguages && course.teachingLanguages.length > 0)) && (
                                            <SimpleTooltip
                                              content={(() => {
                                                const languages = course.teachingLanguages || [course.currentTermTeachingLanguage].filter(Boolean);
                                                const languageNames = languages.map(code => getTeachingLanguageName(code, t));
                                                return `${t('course.teachingLanguage')}: ${languageNames.join(', ')}`;
                                              })()}
                                            >
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 overflow-hidden cursor-help">
                                                <div className="flex items-center gap-1">
                                                  {(course.teachingLanguages || [course.currentTermTeachingLanguage].filter(Boolean)).map((code, index) => (
                                                    <span 
                                                      key={code}
                                                      className={`${
                                                        index > 0 ? 'border-l border-orange-300 dark:border-orange-700 pl-1' : ''
                                                      }`}
                                                    >
                                                      {code === course.currentTermTeachingLanguage ? (
                                                        <strong>{code}</strong>
                                                      ) : (
                                                        code
                                                      )}
                                                    </span>
                                                  ))}
                                                </div>
                                              </span>
                                            </SimpleTooltip>
                                          )}
                                          {/* Service Learning badges */}
                                          {course.serviceLearningTypes && course.serviceLearningTypes.length > 0 && (
                                            (() => {
                                              // Sort service learning types: SO first, then SC
                                              const sortedTypes = [...course.serviceLearningTypes].sort((a, b) => {
                                                if (a === 'optional' && b !== 'optional') return -1;
                                                if (b === 'optional' && a !== 'optional') return 1;
                                                return 0;
                                              });

                                              const serviceLearningTexts = sortedTypes.map(type => {
                                                const isCurrentTerm = course.currentTermServiceLearning?.includes(type);
                                                const text = type === 'optional' ? t('review.optional') : t('review.compulsory');
                                                return isCurrentTerm ? `${text} (${t('teaching.current')})` : text;
                                              });

                                              const tooltipText = `${t('features.serviceLearning')}: ${serviceLearningTexts.join(', ')}`;

                                              return (
                                                <SimpleTooltip content={tooltipText}>
                                                  <span 
                                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800 cursor-help overflow-hidden"
                                                  >
                                                    <div className="flex items-center gap-1">
                                                      {sortedTypes.map((type, index) => {
                                                        const isCurrentTerm = course.currentTermServiceLearning?.includes(type);
                                                        const text = type === 'optional' ? 'SO' : 'SC';
                                                        return (
                                                          <span 
                                                            key={type}
                                                            className={`${
                                                              index > 0 ? 'border-l border-purple-300 dark:border-purple-700 pl-1' : ''
                                                            } ${
                                                              isCurrentTerm ? 'underline decoration-2 underline-offset-1' : ''
                                                            }`}
                                                          >
                                                            {text}
                                                          </span>
                                                        );
                                                      })}
                                                    </div>
                                                  </span>
                                                </SimpleTooltip>
                                              );
                                            })()
                                          )}
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

                        {/* 最佳教師 - Only show when topInstructors tab is active */}
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
                                        <div className="font-bold text-gray-900 dark:text-white">
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
                                          {(instructor.currentTermTeachingLanguage || (instructor.teachingLanguages && instructor.teachingLanguages.length > 0)) && (
                                            <SimpleTooltip
                                              content={(() => {
                                                const languages = instructor.teachingLanguages || [instructor.currentTermTeachingLanguage].filter(Boolean);
                                                const languageNames = languages.map(code => getTeachingLanguageName(code, t));
                                                return `${t('course.teachingLanguage')}: ${languageNames.join(', ')}`;
                                              })()}
                                            >
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 overflow-hidden cursor-help">
                                                <div className="flex items-center gap-1">
                                                  {(instructor.teachingLanguages || [instructor.currentTermTeachingLanguage].filter(Boolean)).map((code, index) => (
                                                    <span 
                                                      key={code}
                                                      className={`${
                                                        index > 0 ? 'border-l border-orange-300 dark:border-orange-700 pl-1' : ''
                                                      }`}
                                                    >
                                                      {code === instructor.currentTermTeachingLanguage ? (
                                                        <strong>{code}</strong>
                                                      ) : (
                                                        code
                                                      )}
                                                    </span>
                                                  ))}
                                                </div>
                                              </span>
                                            </SimpleTooltip>
                                          )}
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
          className={`fixed left-0 right-0 flex justify-center px-0 top-0`}
          style={{
            zIndex: 9999 // Standard z-index
          }}
        >
          <div 
            className={`bg-white dark:bg-card shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden w-full rounded-none`}
            style={{
              maxWidth: 'none', // Always full width for mobile
              // Fixed height to prevent jumping between loading and loaded states
              height: '100vh' // Always use full viewport height
            }}
            onClick={(e) => e.stopPropagation()}

          >
            {/* 搜索輸入框 */}
            <div
              className="flex items-center px-4 min-w-0 border-b border-gray-200 dark:border-gray-700"
              style={{
                borderBottom: '1px solid rgb(var(--border))'
              }}
            >
              <input
                ref={inputRef}
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 py-4 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 min-w-0"
              />
              <button
                onClick={handleCloseButtonClick}
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
                    <div className={`${isMobileLandscape ? 'flex' : 'hidden sm:flex'} flex-col items-center gap-0`}>
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
                    <div className={`${isMobileLandscape ? 'flex' : 'hidden sm:flex'} flex-col items-center gap-0`}>
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
                    <div className={`${isMobileLandscape ? 'flex' : 'hidden sm:flex'} flex-col items-center gap-0`}>
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
                    <div className={`${isMobileLandscape ? 'flex' : 'hidden sm:flex'} flex-col items-center gap-0`}>
                      <span>{t('featured.topInstructors')}</span>
                      <span className="text-xs opacity-75">({t('featured.highestAvgGPA')})</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Sticky Tab Title - Only show on small screens when no search query */}
            {!searchQuery.trim() && (
              <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 px-4 py-2 sm:hidden"
                style={{
                  backgroundColor: 'transparent',
                  paddingLeft: '25px'
                }}
              >
                <div className="flex items-center gap-2">
                  {activeTab === 'courses' && (
                    <>
                      <BookOpenIcon className="h-4 w-4 text-red-600" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{t('featured.courses')} <span className="text-xs text-gray-500 dark:text-gray-400">({t('featured.mostReviews')})</span></span>
                      </div>
                    </>
                  )}
                  {activeTab === 'instructors' && (
                    <>
                      <GraduationCap className="h-4 w-4 text-red-600" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{t('featured.instructors')} <span className="text-xs text-gray-500 dark:text-gray-400">({t('featured.mostReviews')})</span></span>
                      </div>
                    </>
                  )}
                  {activeTab === 'topCourses' && (
                    <>
                      <BookOpenIcon className="h-4 w-4 text-gray-500" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{t('featured.topCourses')} <span className="text-xs text-gray-500 dark:text-gray-400">({t('featured.highestAvgGPA')})</span></span>
                      </div>
                    </>
                  )}
                  {activeTab === 'topInstructors' && (
                    <>
                      <GraduationCap className="h-4 w-4 text-gray-500" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{t('featured.topInstructors')} <span className="text-xs text-gray-500 dark:text-gray-400">({t('featured.highestAvgGPA')})</span></span>
                      </div>
                    </>
                  )}
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
                          ? 'calc(100vh)' // Mobile phones in landscape (more conservative)
                          : 'calc(100vh)'  // Tablets in landscape  
                        )
                      : '90vh' // Portrait mode
                  }}
              >
                {loading ? (
                  <div className="h-full flex flex-col items-center justify-center min-h-0">
                    <BookLoadingAnimation size="lg" className="mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-center">{t('common.loading')}</p>
                  </div>
                ) : (
                  <div 
                    className="p-4 space-y-6"
                    style={{
                      // Extra bottom padding to simulate additional items
                      paddingTop: '0px',
                      paddingBottom: viewportDimensions.height <= 450 ? '6rem' : '8rem'
                    }}
                  >
                    {/* 搜尋結果 */}
                    {searchQuery.trim() && (
                      <div className="space-y-6">
                        {/* Search Tab Switcher */}
                        {(filteredCourses.length > 0 || filteredInstructors.length > 0) && (
                          <div className="space-y-2">
                            {/* Tab Buttons */}
                            {/* <div className="px-4"> */}
                              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1"
                                style={{
                                  marginTop: '0.75rem'
                                }}
                              >
                                <button
                                  onClick={() => setSearchActiveTab('courses')}
                                  className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                    searchActiveTab === 'courses'
                                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                  }`}
                                >
                                  <BookOpenIcon className="h-4 w-4 text-white-600" />
                                  {(!isMobile || isMobileLandscape) && (
                                    <span className="ml-2">{t('search.courses')}</span>
                                  )}
                                </button>
                                <button
                                  onClick={() => setSearchActiveTab('instructors')}
                                  className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                    searchActiveTab === 'instructors'
                                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                  }`}
                                >
                                  <GraduationCap className="h-4 w-4 text-white-600" />
                                  {(!isMobile || isMobileLandscape) && (
                                    <span className="ml-2">{t('search.instructors')}</span>
                                  )}
                                </button>
                              </div>
                            {/* Sticky Tab Title */}
                            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 px-4 py-2 sm:hidden"
                              style={{
                                backgroundColor: 'transparent',
                                position: 'relative',
                                right: '26px',
                                scale: '0.9'
                              }}
                            >
                              <div className="flex items-center gap-2">
                                {searchActiveTab === 'courses' ? (
                                  <>
                                    <BookOpenIcon className="h-5 w-5 text-red-600" />
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {t('search.courses')}
                                    </span>
                                    {filteredCourses.length > 0 && (
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        ({filteredCourses.length})
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <GraduationCap className="h-5 w-5 text-red-600" />
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {t('search.instructors')}
                                    </span>
                                    {filteredInstructors.length > 0 && (
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        ({filteredInstructors.length})
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* 課程結果 */}
                        {searchActiveTab === 'courses' && filteredCourses.length > 0 && (
                          <div style={{ marginTop: '0' }}>
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
                                        <div className="font-bold text-gray-900 dark:text-white font-mono truncate">
                                          {course.course_code}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                          {titleInfo.secondary ? `${titleInfo.primary} • ${titleInfo.secondary}` : titleInfo.primary}
                                        </div>
                                        <div className="flex items-center gap-1 flex-wrap mt-1">
                                          {facultyKey && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                              {t(facultyKey)}
                                            </span>
                                          )}
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                            {departmentName}
                                          </span>
                                          {(course.currentTermTeachingLanguage || (course.teachingLanguages && course.teachingLanguages.length > 0)) && (
                                            <SimpleTooltip
                                              content={(() => {
                                                const languages = course.teachingLanguages || [course.currentTermTeachingLanguage].filter(Boolean);
                                                const languageNames = languages.map(code => getTeachingLanguageName(code, t));
                                                return `${t('course.teachingLanguage')}: ${languageNames.join(', ')}`;
                                              })()}
                                            >
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 overflow-hidden cursor-help">
                                                <div className="flex items-center gap-1">
                                                  {(course.teachingLanguages || [course.currentTermTeachingLanguage].filter(Boolean)).map((code, index) => (
                                                    <span 
                                                      key={code}
                                                      className={`${
                                                        index > 0 ? 'border-l border-orange-300 dark:border-orange-700 pl-1' : ''
                                                      }`}
                                                    >
                                                      {code === course.currentTermTeachingLanguage ? (
                                                        <strong>{code}</strong>
                                                      ) : (
                                                        code
                                                      )}
                                                    </span>
                                                  ))}
                                                </div>
                                              </span>
                                            </SimpleTooltip>
                                          )}
                                          {/* Service Learning badges */}
                                          {course.serviceLearningTypes && course.serviceLearningTypes.length > 0 && (
                                            (() => {
                                              // Sort service learning types: SO first, then SC
                                              const sortedTypes = [...course.serviceLearningTypes].sort((a, b) => {
                                                if (a === 'optional' && b !== 'optional') return -1;
                                                if (b === 'optional' && a !== 'optional') return 1;
                                                return 0;
                                              });

                                              const serviceLearningTexts = sortedTypes.map(type => {
                                                const isCurrentTerm = course.currentTermServiceLearning?.includes(type);
                                                const text = type === 'optional' ? t('review.optional') : t('review.compulsory');
                                                return isCurrentTerm ? `${text} (${t('teaching.current')})` : text;
                                              });

                                              const tooltipText = `${t('features.serviceLearning')}: ${serviceLearningTexts.join(', ')}`;

                                              return (
                                                <SimpleTooltip content={tooltipText}>
                                                  <span 
                                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800 cursor-help overflow-hidden"
                                                  >
                                                    <div className="flex items-center gap-1">
                                                      {sortedTypes.map((type, index) => {
                                                        const isCurrentTerm = course.currentTermServiceLearning?.includes(type);
                                                        const text = type === 'optional' ? 'SO' : 'SC';
                                                        return (
                                                          <span 
                                                            key={type}
                                                            className={`${
                                                              index > 0 ? 'border-l border-purple-300 dark:border-purple-700 pl-1' : ''
                                                            } ${
                                                              isCurrentTerm ? 'underline decoration-2 underline-offset-1' : ''
                                                            }`}
                                                          >
                                                            {text}
                                                          </span>
                                                        );
                                                      })}
                                                    </div>
                                                  </span>
                                                </SimpleTooltip>
                                              );
                                            })()
                                          )}
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
                        {searchActiveTab === 'instructors' && filteredInstructors.length > 0 && (
                          <div style={{ marginTop: '0' }}>
                            <div className="space-y-2">
                              {filteredInstructors.map((instructor, index) => {
                                const instructorName = getInstructorName(instructor, currentLanguage);
                                const departmentName = translateDepartmentName(instructor.department, t);
                                const facultyKey = getFacultyByDepartment(instructor.department);
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
                                        <div className="font-bold text-gray-900 dark:text-white truncate">
                                          {instructorName.primary}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                          {instructorName.secondary || ''}
                                        </div>
                                        <div className="flex items-center gap-1 flex-wrap mt-1">
                                          {facultyKey && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                              {t(facultyKey)}
                                            </span>
                                          )}
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                            {departmentName}
                                          </span>
                                          {(instructor.currentTermTeachingLanguage || (instructor.teachingLanguages && instructor.teachingLanguages.length > 0)) && (
                                            <SimpleTooltip
                                              content={(() => {
                                                const languages = instructor.teachingLanguages || [instructor.currentTermTeachingLanguage].filter(Boolean);
                                                const languageNames = languages.map(code => getTeachingLanguageName(code, t));
                                                return `${t('course.teachingLanguage')}: ${languageNames.join(', ')}`;
                                              })()}
                                            >
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 overflow-hidden cursor-help">
                                                <div className="flex items-center gap-1">
                                                  {(instructor.teachingLanguages || [instructor.currentTermTeachingLanguage].filter(Boolean)).map((code, index) => (
                                                    <span 
                                                      key={code}
                                                      className={`${
                                                        index > 0 ? 'border-l border-orange-300 dark:border-orange-700 pl-1' : ''
                                                      }`}
                                                    >
                                                      {code === instructor.currentTermTeachingLanguage ? (
                                                        <strong>{code}</strong>
                                                      ) : (
                                                        code
                                                      )}
                                                    </span>
                                                  ))}
                                                </div>
                                              </span>
                                            </SimpleTooltip>
                                          )}
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
                        {((searchActiveTab === 'courses' && filteredCourses.length === 0) || 
                          (searchActiveTab === 'instructors' && filteredInstructors.length === 0)) && (
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
                                        <div className="font-bold text-gray-900 dark:text-white font-mono">
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
                                          {(course.currentTermTeachingLanguage || (course.teachingLanguages && course.teachingLanguages.length > 0)) && (
                                            <SimpleTooltip
                                              content={(() => {
                                                const languages = course.teachingLanguages || [course.currentTermTeachingLanguage].filter(Boolean);
                                                const languageNames = languages.map(code => getTeachingLanguageName(code, t));
                                                return `${t('course.teachingLanguage')}: ${languageNames.join(', ')}`;
                                              })()}
                                            >
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 overflow-hidden cursor-help">
                                                <div className="flex items-center gap-1">
                                                  {(course.teachingLanguages || [course.currentTermTeachingLanguage].filter(Boolean)).map((code, index) => (
                                                    <span 
                                                      key={code}
                                                      className={`${
                                                        index > 0 ? 'border-l border-orange-300 dark:border-orange-700 pl-1' : ''
                                                      }`}
                                                    >
                                                      {code === course.currentTermTeachingLanguage ? (
                                                        <strong>{code}</strong>
                                                      ) : (
                                                        code
                                                      )}
                                                    </span>
                                                  ))}
                                                </div>
                                              </span>
                                            </SimpleTooltip>
                                          )}
                                          {/* Service Learning badges */}
                                          {course.serviceLearningTypes && course.serviceLearningTypes.length > 0 && (
                                            (() => {
                                              // Sort service learning types: SO first, then SC
                                              const sortedTypes = [...course.serviceLearningTypes].sort((a, b) => {
                                                if (a === 'optional' && b !== 'optional') return -1;
                                                if (b === 'optional' && a !== 'optional') return 1;
                                                return 0;
                                              });

                                              const serviceLearningTexts = sortedTypes.map(type => {
                                                const isCurrentTerm = course.currentTermServiceLearning?.includes(type);
                                                const text = type === 'optional' ? t('review.optional') : t('review.compulsory');
                                                return isCurrentTerm ? `${text} (${t('teaching.current')})` : text;
                                              });

                                              const tooltipText = `${t('features.serviceLearning')}: ${serviceLearningTexts.join(', ')}`;

                                              return (
                                                <SimpleTooltip content={tooltipText}>
                                                  <span 
                                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800 cursor-help overflow-hidden"
                                                  >
                                                    <div className="flex items-center gap-1">
                                                      {sortedTypes.map((type, index) => {
                                                        const isCurrentTerm = course.currentTermServiceLearning?.includes(type);
                                                        const text = type === 'optional' ? 'SO' : 'SC';
                                                        return (
                                                          <span 
                                                            key={type}
                                                            className={`${
                                                              index > 0 ? 'border-l border-purple-300 dark:border-purple-700 pl-1' : ''
                                                            } ${
                                                              isCurrentTerm ? 'underline decoration-2 underline-offset-1' : ''
                                                            }`}
                                                          >
                                                            {text}
                                                          </span>
                                                        );
                                                      })}
                                                    </div>
                                                  </span>
                                                </SimpleTooltip>
                                              );
                                            })()
                                          )}
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
                                        <div className="font-bold text-gray-900 dark:text-white">
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
                                          {(instructor.currentTermTeachingLanguage || (instructor.teachingLanguages && instructor.teachingLanguages.length > 0)) && (
                                            <SimpleTooltip
                                              content={(() => {
                                                const languages = instructor.teachingLanguages || [instructor.currentTermTeachingLanguage].filter(Boolean);
                                                const languageNames = languages.map(code => getTeachingLanguageName(code, t));
                                                return `${t('course.teachingLanguage')}: ${languageNames.join(', ')}`;
                                              })()}
                                            >
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 overflow-hidden cursor-help">
                                                <div className="flex items-center gap-1">
                                                  {(instructor.teachingLanguages || [instructor.currentTermTeachingLanguage].filter(Boolean)).map((code, index) => (
                                                    <span 
                                                      key={code}
                                                      className={`${
                                                        index > 0 ? 'border-l border-orange-300 dark:border-orange-700 pl-1' : ''
                                                      }`}
                                                    >
                                                      {code === instructor.currentTermTeachingLanguage ? (
                                                        <strong>{code}</strong>
                                                      ) : (
                                                        code
                                                      )}
                                                    </span>
                                                  ))}
                                                </div>
                                              </span>
                                            </SimpleTooltip>
                                          )}
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
                                        <div className="font-bold text-gray-900 dark:text-white font-mono">
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
                                          {(course.currentTermTeachingLanguage || (course.teachingLanguages && course.teachingLanguages.length > 0)) && (
                                            <SimpleTooltip
                                              content={(() => {
                                                const languages = course.teachingLanguages || [course.currentTermTeachingLanguage].filter(Boolean);
                                                const languageNames = languages.map(code => getTeachingLanguageName(code, t));
                                                return `${t('course.teachingLanguage')}: ${languageNames.join(', ')}`;
                                              })()}
                                            >
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 overflow-hidden cursor-help">
                                                <div className="flex items-center gap-1">
                                                  {(course.teachingLanguages || [course.currentTermTeachingLanguage].filter(Boolean)).map((code, index) => (
                                                    <span 
                                                      key={code}
                                                      className={`${
                                                        index > 0 ? 'border-l border-orange-300 dark:border-orange-700 pl-1' : ''
                                                      }`}
                                                    >
                                                      {code === course.currentTermTeachingLanguage ? (
                                                        <strong>{code}</strong>
                                                      ) : (
                                                        code
                                                      )}
                                                    </span>
                                                  ))}
                                                </div>
                                              </span>
                                            </SimpleTooltip>
                                          )}
                                          {/* Service Learning badges */}
                                          {course.serviceLearningTypes && course.serviceLearningTypes.length > 0 && (
                                            (() => {
                                              // Sort service learning types: SO first, then SC
                                              const sortedTypes = [...course.serviceLearningTypes].sort((a, b) => {
                                                if (a === 'optional' && b !== 'optional') return -1;
                                                if (b === 'optional' && a !== 'optional') return 1;
                                                return 0;
                                              });

                                              const serviceLearningTexts = sortedTypes.map(type => {
                                                const isCurrentTerm = course.currentTermServiceLearning?.includes(type);
                                                const text = type === 'optional' ? t('review.optional') : t('review.compulsory');
                                                return isCurrentTerm ? `${text} (${t('teaching.current')})` : text;
                                              });

                                              const tooltipText = `${t('features.serviceLearning')}: ${serviceLearningTexts.join(', ')}`;

                                              return (
                                                <SimpleTooltip content={tooltipText}>
                                                  <span 
                                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800 cursor-help overflow-hidden"
                                                  >
                                                    <div className="flex items-center gap-1">
                                                      {sortedTypes.map((type, index) => {
                                                        const isCurrentTerm = course.currentTermServiceLearning?.includes(type);
                                                        const text = type === 'optional' ? 'SO' : 'SC';
                                                        return (
                                                          <span 
                                                            key={type}
                                                            className={`${
                                                              index > 0 ? 'border-l border-purple-300 dark:border-purple-700 pl-1' : ''
                                                            } ${
                                                              isCurrentTerm ? 'underline decoration-2 underline-offset-1' : ''
                                                            }`}
                                                          >
                                                            {text}
                                                          </span>
                                                        );
                                                      })}
                                                    </div>
                                                  </span>
                                                </SimpleTooltip>
                                              );
                                            })()
                                          )}
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

                        {/* 最佳教師 - Only show when topInstructors tab is active */}
                        {activeTab === 'topInstructors' && (
                          <div>
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
                                        <div className="font-bold text-gray-900 dark:text-white">
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
                                          {(instructor.currentTermTeachingLanguage || (instructor.teachingLanguages && instructor.teachingLanguages.length > 0)) && (
                                            <SimpleTooltip
                                              content={(() => {
                                                const languages = instructor.teachingLanguages || [instructor.currentTermTeachingLanguage].filter(Boolean);
                                                const languageNames = languages.map(code => getTeachingLanguageName(code, t));
                                                return `${t('course.teachingLanguage')}: ${languageNames.join(', ')}`;
                                              })()}
                                            >
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 overflow-hidden cursor-help">
                                                <div className="flex items-center gap-1">
                                                  {(instructor.teachingLanguages || [instructor.currentTermTeachingLanguage].filter(Boolean)).map((code, index) => (
                                                    <span 
                                                      key={code}
                                                      className={`${
                                                        index > 0 ? 'border-l border-orange-300 dark:border-orange-700 pl-1' : ''
                                                      }`}
                                                    >
                                                      {code === instructor.currentTermTeachingLanguage ? (
                                                        <strong>{code}</strong>
                                                      ) : (
                                                        code
                                                      )}
                                                    </span>
                                                  ))}
                                                </div>
                                              </span>
                                            </SimpleTooltip>
                                          )}
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