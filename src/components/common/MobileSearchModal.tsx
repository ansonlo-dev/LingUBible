import { useState, useRef, useEffect } from 'react';
import { X, BookOpen as BookOpenIcon, GraduationCap, MessageSquare, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useNavigate } from 'react-router-dom';
import { CourseService } from '@/services/api/courseService';
import type { CourseWithStats, InstructorWithStats, InstructorWithDetailedStats } from '@/services/api/courseService';
import { getCourseTitle, getInstructorName, translateDepartmentName } from '@/utils/textUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSearchModal({ isOpen, onClose }: MobileSearchModalProps) {
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [popularCourses, setPopularCourses] = useState<CourseWithStats[]>([]);
  const [popularInstructors, setPopularInstructors] = useState<InstructorWithDetailedStats[]>([]);
  const [allCourses, setAllCourses] = useState<CourseWithStats[]>([]);
  const [allInstructors, setAllInstructors] = useState<InstructorWithDetailedStats[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasAddedHistoryEntry = useRef(false);

  // Scroll arrow functionality
  const [showScrollButtons, setShowScrollButtons] = useState({ up: false, down: false });
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mobileScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Removed debug functionality - arrows now work with proper max-height

  const checkScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = container;
    
    // Ensure dimensions are valid
    if (scrollHeight <= 0 || clientHeight <= 0) {
      return;
    }
    
    // Check if content is scrollable
    const hasOverflow = scrollHeight > clientHeight;
    if (!hasOverflow) {
      setShowScrollButtons({ up: false, down: false });
      return;
    }
    
    const canScrollUp = scrollTop > 0;
    const canScrollDown = scrollTop < scrollHeight - clientHeight - 1;
    
    setShowScrollButtons({
      up: canScrollUp,
      down: canScrollDown
    });
  };

  const startScrolling = (direction: 'up' | 'down') => {
    stopScrolling();
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const scroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollAmount = direction === 'up' ? -3 : 3;
      
      // Check if we've reached the limits before scrolling
      const atTop = scrollTop <= 0;
      const atBottom = scrollTop >= scrollHeight - clientHeight - 1;
      
      if ((direction === 'up' && atTop) || (direction === 'down' && atBottom)) {
        stopScrolling();
        return;
      }
      
      container.scrollBy(0, scrollAmount);
      
      // Update scroll buttons immediately after scrolling
      setTimeout(() => {
        checkScrollButtons();
      }, 10);
      
      // Check again after scrolling in case we just reached the limit
      const newScrollTop = container.scrollTop;
      const newAtTop = newScrollTop <= 0;
      const newAtBottom = newScrollTop >= scrollHeight - clientHeight - 1;
      
      if ((direction === 'up' && newAtTop) || (direction === 'down' && newAtBottom)) {
        stopScrolling();
        return;
      }
    };

    scrollIntervalRef.current = setInterval(scroll, 16); // ~60fps
    
    // For mobile devices, auto-stop after 1 second to prevent infinite scrolling
    if (isMobile) {
      mobileScrollTimeoutRef.current = setTimeout(() => {
        stopScrolling();
      }, 1000);
    }
  };

  const stopScrolling = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    if (mobileScrollTimeoutRef.current) {
      clearTimeout(mobileScrollTimeoutRef.current);
      mobileScrollTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      checkScrollButtons();
      // Stop auto-scrolling when user manually scrolls
      if (scrollIntervalRef.current) {
        stopScrolling();
      }
    };
    
    const handleTouchStart = () => {
      // Stop auto-scrolling when user starts touching the container
      if (scrollIntervalRef.current) {
        stopScrolling();
      }
    };
    
    container.addEventListener('scroll', handleScroll);
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    
    // Check initially and when content changes
    const observer = new ResizeObserver(() => {
      // Use a small delay to ensure the resize has completed
      setTimeout(checkScrollButtons, 50);
    });
    observer.observe(container);

    // Initial check with a delay to ensure container is properly sized
    const initialTimer = setTimeout(checkScrollButtons, 300);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('touchstart', handleTouchStart);
      observer.disconnect();
      stopScrolling();
      clearTimeout(initialTimer);
    };
  }, []);

  // Check scroll buttons when content changes
  useEffect(() => {
    // Use multiple timeouts to ensure DOM has updated
    const timer1 = setTimeout(checkScrollButtons, 100);
    const timer2 = setTimeout(checkScrollButtons, 300);
    const timer3 = setTimeout(checkScrollButtons, 500);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [searchQuery, loading, popularCourses, popularInstructors, allCourses, allInstructors]);

  // Add scroll event listener to update buttons on manual scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      checkScrollButtons();
    };

    container.addEventListener('scroll', handleScroll);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [scrollContainerRef.current]);

  // Extra check when loading finishes
  useEffect(() => {
    if (!loading && isInitialized) {
      console.log('Loading finished, doing final check');
      const timer = setTimeout(() => {
        checkScrollButtons();
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [loading, isInitialized]);

  // Check scroll buttons when modal is opened and initialized
  useEffect(() => {
    if (isOpen && isInitialized && !loading) {
      const timer = setTimeout(() => {
        checkScrollButtons();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, isInitialized, loading]);

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
          // 載入熱門課程和講師以及所有數據用於搜索
          const [coursesData, instructorsData, allCoursesData, allInstructorsData] = await Promise.all([
            CourseService.getPopularCourses(6), // 獲取前6個熱門課程
            CourseService.getPopularInstructorsWithDetailedStats(6), // 獲取前6個熱門講師
            CourseService.getCoursesWithStatsBatch(), // 獲取所有課程用於搜索
            CourseService.getAllInstructorsWithDetailedStats() // 獲取所有講師用於搜索
          ]);
          
          setPopularCourses(coursesData);
          setPopularInstructors(instructorsData);
          setAllCourses(allCoursesData);
          setAllInstructors(allInstructorsData);
        } catch (error) {
          console.error('Error loading search data:', error);
        } finally {
          setLoading(false);
          setIsInitialized(true);
          // Check scroll buttons after content is loaded
          setTimeout(() => {
            checkScrollButtons();
          }, 200);
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
      .slice(0, 10) // 限制搜索結果數量
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
      .slice(0, 10) // 限制搜索結果數量
    : [];

  // 處理課程點擊
  const handleCourseClick = (courseCode: string, event?: React.MouseEvent) => {
    // This function is now simplified since we're using <a> tags
    // The browser will handle navigation naturally
    handleClose();
  };

  // 處理講師點擊
  const handleInstructorClick = (instructorName: string, event?: React.MouseEvent) => {
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
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      {!isMobile ? (
        <div className="fixed inset-x-0 top-16 mx-auto max-w-4xl px-4">
          <div 
            className="bg-white dark:bg-card rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[70vh] flex flex-col overflow-hidden desktop-search-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 搜索輸入框 */}
            <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
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

            {/* 搜索結果容器 */}
            <div className="flex-1 relative overflow-hidden">


              {/* 上箭頭 */}
              {showScrollButtons.up && (
                <div 
                  className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-white via-white/90 to-transparent dark:from-card dark:via-card/90 flex items-center justify-center py-2 cursor-pointer select-none"
                  onMouseEnter={() => !isMobile && startScrolling('up')}
                  onMouseLeave={() => !isMobile && stopScrolling()}
                  onClick={() => isMobile && startScrolling('up')}
                  onTouchStart={(e) => {
                    if (isMobile) {
                      e.preventDefault();
                      startScrolling('up');
                    }
                  }}
                >
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                </div>
              )}

              {/* 滾動內容 */}
              <div 
                ref={scrollContainerRef}
                className="h-full max-h-[450px] overflow-y-auto scrollbar-hide"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                {loading ? (
                  <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('common.loading')}</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-6">
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
                              {filteredCourses.map((course) => {
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
                                    className="block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors no-underline"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="min-w-0 flex-1">
                                        <div className="font-medium text-gray-900 dark:text-white font-mono truncate">
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
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 text-sm text-gray-500 ml-2 flex-shrink-0">
                                        <MessageSquare className="h-4 w-4" />
                                        <span>{course.reviewCount}</span>
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
                              {filteredInstructors.map((instructor) => {
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
                                    className="block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors no-underline"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="min-w-0 flex-1">
                                        <div className="font-medium text-gray-900 dark:text-white">
                                          {nameInfo.primary}
                                        </div>
                                        {nameInfo.secondary && (
                                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {nameInfo.secondary}
                                          </div>
                                        )}
                                        <div className="flex items-center gap-1 flex-wrap mt-1">
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
                                      <div className="flex items-center gap-1 text-sm text-gray-500 flex-shrink-0">
                                        <MessageSquare className="h-4 w-4" />
                                        <span>{instructor.reviewCount}</span>
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
                        {/* 熱門課程 */}
                        <div>
                          <div className="flex items-center gap-2 mb-3 px-2">
                            <BookOpenIcon className="h-5 w-5 text-red-600" />
                            <h3 className="font-medium text-gray-900 dark:text-white">{t('featured.courses')}</h3>
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
                                    <div className="flex items-center gap-1 text-sm text-gray-500 ml-3 flex-shrink-0">
                                      <MessageSquare className="h-4 w-4" />
                                      <span>{course.reviewCount}</span>
                                    </div>
                                  </div>
                                </a>
                              );
                            })}
                          </div>
                        </div>

                        {/* 熱門講師 */}
                        <div>
                          <div className="flex items-center gap-2 mb-3 px-2">
                            <GraduationCap className="h-5 w-5 text-red-600" />
                            <h3 className="font-medium text-gray-900 dark:text-white">{t('featured.instructors')}</h3>
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
                                    <div className="flex items-center gap-1 text-sm text-gray-500 ml-3 flex-shrink-0">
                                      <MessageSquare className="h-4 w-4" />
                                      <span>{instructor.reviewCount}</span>
                                    </div>
                                  </div>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 下箭頭 */}
              {showScrollButtons.down && (
                <div 
                  className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-card dark:via-card/90 flex items-center justify-center py-2 cursor-pointer select-none"
                  onMouseEnter={() => !isMobile && startScrolling('down')}
                  onMouseLeave={() => !isMobile && stopScrolling()}
                  onClick={() => isMobile && startScrolling('down')}
                  onTouchStart={(e) => {
                    if (isMobile) {
                      e.preventDefault();
                      startScrolling('down');
                    }
                  }}
                >
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="fixed inset-x-4 top-16 bottom-16 mx-auto max-w-4xl">
          <div 
            className="bg-white dark:bg-card rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 h-full flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 搜索輸入框 */}
            <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
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

            {/* 搜索結果容器 */}
            <div className="flex-1 relative overflow-hidden">
              {/* 上箭頭 */}
              {showScrollButtons.up && (
                <div 
                  className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-white via-white/90 to-transparent dark:from-card dark:via-card/90 flex items-center justify-center py-2 cursor-pointer select-none"
                  onMouseEnter={() => !isMobile && startScrolling('up')}
                  onMouseLeave={() => !isMobile && stopScrolling()}
                  onClick={() => isMobile && startScrolling('up')}
                  onTouchStart={(e) => {
                    if (isMobile) {
                      e.preventDefault();
                      startScrolling('up');
                    }
                  }}
                >
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                </div>
              )}

              {/* 滾動內容 */}
              <div 
                ref={scrollContainerRef}
                className="h-full max-h-[400px] overflow-y-auto scrollbar-hide"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                {loading ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="mt-2 text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-6">
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
                              {filteredCourses.map((course) => {
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
                                    className="block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors no-underline"
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
                                      <div className="flex items-center gap-1 text-sm text-gray-500 ml-2 flex-shrink-0">
                                        <MessageSquare className="h-4 w-4" />
                                        <span>{course.reviewCount}</span>
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
                              {filteredInstructors.map((instructor) => {
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
                                    className="block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors no-underline"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="min-w-0 flex-1">
                                        <div className="font-medium text-gray-900 dark:text-white">
                                          {nameInfo.primary}
                                        </div>
                                        {nameInfo.secondary && (
                                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {nameInfo.secondary}
                                          </div>
                                        )}
                                        <div className="flex items-center gap-1 flex-wrap mt-1">
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
                                      <div className="flex items-center gap-1 text-sm text-gray-500 flex-shrink-0">
                                        <MessageSquare className="h-4 w-4" />
                                        <span>{instructor.reviewCount}</span>
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
                        {/* 熱門課程 */}
                        <div>
                          <div className="flex items-center gap-2 mb-3 px-2">
                            <BookOpenIcon className="h-5 w-5 text-red-600" />
                            <h3 className="font-medium text-gray-900 dark:text-white">{t('featured.courses')}</h3>
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
                                    <div className="flex items-center gap-1 text-sm text-gray-500 ml-3 flex-shrink-0">
                                      <MessageSquare className="h-4 w-4" />
                                      <span>{course.reviewCount}</span>
                                    </div>
                                  </div>
                                </a>
                              );
                            })}
                          </div>
                        </div>

                        {/* 熱門講師 */}
                        <div>
                          <div className="flex items-center gap-2 mb-3 px-2">
                            <GraduationCap className="h-5 w-5 text-red-600" />
                            <h3 className="font-medium text-gray-900 dark:text-white">{t('featured.instructors')}</h3>
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
                                    <div className="flex items-center gap-1 text-sm text-gray-500 ml-3 flex-shrink-0">
                                      <MessageSquare className="h-4 w-4" />
                                      <span>{instructor.reviewCount}</span>
                                    </div>
                                  </div>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 下箭頭 */}
              {showScrollButtons.down && (
                <div 
                  className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-card dark:via-card/90 flex items-center justify-center py-2 cursor-pointer select-none"
                  onMouseEnter={() => !isMobile && startScrolling('down')}
                  onMouseLeave={() => !isMobile && stopScrolling()}
                  onClick={() => isMobile && startScrolling('down')}
                  onTouchStart={(e) => {
                    if (isMobile) {
                      e.preventDefault();
                      startScrolling('down');
                    }
                  }}
                >
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 