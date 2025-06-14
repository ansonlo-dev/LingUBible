import { useState, useRef, useEffect } from 'react';
import { X, BookOpen as BookOpenIcon, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { CourseService } from '@/services/api/courseService';
import type { UGCourse, LecturerWithStats } from '@/types/course';

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
  const { t } = useLanguage();
  const { isDesktop } = useDeviceDetection();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [courses, setCourses] = useState<UGCourse[]>([]);
  const [lecturers, setLecturers] = useState<LecturerWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasAddedHistoryEntry = useRef(false);

  // 載入數據
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        try {
          setLoading(true);
          const [coursesData, lecturersData] = await Promise.all([
            CourseService.getAllCourses(),
            CourseService.getAllLecturers()
          ]);
          setCourses(coursesData);
          setLecturers(lecturersData);
        } catch (error) {
          console.error('Error loading search data:', error);
        } finally {
          setLoading(false);
          setIsInitialized(true);
        }
      };

      loadData();
    }
  }, [isOpen]);

  // 過濾搜索結果
  const filteredCourses = searchQuery.trim() 
    ? courses.filter(course => 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.department.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : courses.slice(0, 12);

  const filteredLecturers = searchQuery.trim()
    ? lecturers.filter(lecturer =>
        lecturer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lecturer.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lecturer.specialties && lecturer.specialties.some(specialty => 
          specialty.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      ).slice(0, 8)
    : lecturers.slice(0, 12);

  // 建議搜索項目（當沒有搜索查詢時顯示）
  const suggestedCourses = [
    { title: '商業管理導論', code: 'BUS1001', department: '商學院' },
    { title: '計算機科學導論', code: 'CDS1001', department: '計算機科學與數據科學系' },
    { title: '資料結構與演算法', code: 'CDS2001', department: '計算機科學與數據科學系' },
    { title: '總體經濟學', code: 'ECO1001', department: '經濟學系' },
    { title: '英國文學', code: 'ENG2001', department: '英文系' },
    { title: '微積分I', code: 'MAT1001', department: '數學系' },
    { title: '普通心理學', code: 'PSY1001', department: '心理學系' },
    { title: '財務管理', code: 'BUS2001', department: '商學院' },
    { title: '機器學習', code: 'CDS3001', department: '計算機科學與數據科學系' },
    { title: '國際關係', code: 'POL2001', department: '政治學系' },
    { title: '有機化學', code: 'CHE2001', department: '化學系' },
    { title: '統計學原理', code: 'STA1001', department: '統計學系' },
    { title: '社會學概論', code: 'SOC1001', department: '社會學系' },
    { title: '藝術史', code: 'ART1001', department: '藝術系' },
    { title: '物理學I', code: 'PHY1001', department: '物理學系' }
  ];

  const suggestedLecturers = [
    { name: 'Prof Sarah Johnson', department: '計算機科學與數據科學系', id: 'prof-sarah' },
    { name: 'Dr Michael Chen', department: '商學院', id: 'dr-michael' },
    { name: 'Prof Emily Wang', department: '英文系', id: 'prof-emily' },
    { name: 'Dr David Liu', department: '經濟學系', id: 'dr-david' },
    { name: 'Prof Lisa Zhang', department: '心理學系', id: 'prof-lisa' },
    { name: 'Dr Robert Kim', department: '數學系', id: 'dr-robert' },
    { name: 'Prof Jennifer Lee', department: '化學系', id: 'prof-jennifer' },
    { name: 'Dr Thomas Brown', department: '物理學系', id: 'dr-thomas' },
    { name: 'Prof Maria Garcia', department: '政治學系', id: 'prof-maria' },
    { name: 'Dr James Wilson', department: '統計學系', id: 'dr-james' },
    { name: 'Prof Anna Taylor', department: '社會學系', id: 'prof-anna' },
    { name: 'Dr Kevin Chang', department: '藝術系', id: 'dr-kevin' },
    { name: 'Prof Rachel Adams', department: '商學院', id: 'prof-rachel' },
    { name: 'Dr Steven Wu', department: '計算機科學與數據科學系', id: 'dr-steven' },
    { name: 'Prof Helen Davis', department: '英文系', id: 'prof-helen' }
  ];

  const searchResults = [
    {
      category: t('nav.courses'),
      icon: BookOpenIcon,
      items: filteredCourses.length > 0 
        ? filteredCourses.map(course => ({
            title: course.title,
            subtitle: `${course.code} - ${course.department}`,
            href: `/courses/${course.code}`
          }))
        : (!searchQuery.trim() && isInitialized && !loading ? suggestedCourses.map(course => ({
            title: course.title,
            subtitle: `${course.code} - ${course.department}`,
            href: `/courses/${course.code}`
          })) : [])
    },
    {
      category: t('nav.lecturers'),
      icon: Users,
      items: filteredLecturers.length > 0
        ? filteredLecturers.map(lecturer => ({
            title: lecturer.name,
            subtitle: lecturer.department,
            href: `/lecturer/${lecturer.$id}`
          }))
        : (!searchQuery.trim() && isInitialized && !loading ? suggestedLecturers.map(lecturer => ({
            title: lecturer.name,
            subtitle: lecturer.department,
            href: `/lecturer/${lecturer.id}`
          })) : [])
    }
  ];

  const allItems = searchResults.flatMap(category => 
    category.items.map(item => ({ ...item, category: category.category }))
  );

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % allItems.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? allItems.length - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allItems[selectedIndex]) {
          window.location.href = allItems[selectedIndex].href;
          handleClose();
        }
        break;
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
  }, [isOpen, selectedIndex, allItems]);

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
      {isDesktop ? (
        <div className="fixed inset-x-0 top-16 mx-auto max-w-2xl px-4">
          <div 
            className="bg-white dark:bg-card rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 搜索輸入框 */}
            <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
              <input
                ref={inputRef}
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery}
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

            {/* 搜索結果 */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">{t('stats.loading')}</p>
                </div>
              ) : searchResults.some(category => category.items.length > 0) ? (
                <div className="py-2">
                  {searchResults.map((category, categoryIndex) => (
                    category.items.length > 0 && (
                      <div key={category.category}>
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          {category.category}
                        </div>
                        {category.items.map((item, itemIndex) => {
                          const globalIndex = searchResults
                            .slice(0, categoryIndex)
                            .reduce((acc, cat) => acc + cat.items.length, 0) + itemIndex;
                          
                          return (
                            <a
                              key={`${category.category}-${itemIndex}`}
                              href={item.href}
                              onClick={handleClose}
                              className={`flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                selectedIndex === globalIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                            >
                              <category.icon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {item.title}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                  {item.subtitle}
                                </div>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    )
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('search.noResults')}
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('search.startTyping')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="fixed inset-x-4 top-16 bottom-16 mx-auto max-w-2xl">
          <div 
            className="bg-white dark:bg-card rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 h-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 搜索輸入框 */}
            <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
              <input
                ref={inputRef}
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery}
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

            {/* 搜索結果 */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">{t('stats.loading')}</p>
                </div>
              ) : searchResults.some(category => category.items.length > 0) ? (
                <div className="py-2">
                  {searchResults.map((category, categoryIndex) => (
                    category.items.length > 0 && (
                      <div key={category.category}>
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          {category.category}
                        </div>
                        {category.items.map((item, itemIndex) => {
                          const globalIndex = searchResults
                            .slice(0, categoryIndex)
                            .reduce((acc, cat) => acc + cat.items.length, 0) + itemIndex;
                          
                          return (
                            <a
                              key={`${category.category}-${itemIndex}`}
                              href={item.href}
                              onClick={handleClose}
                              className={`flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                selectedIndex === globalIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                            >
                              <category.icon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {item.title}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                  {item.subtitle}
                                </div>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    )
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('search.noResults')}
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('search.startTyping')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 