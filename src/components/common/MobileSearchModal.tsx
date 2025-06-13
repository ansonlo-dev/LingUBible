import { useState, useRef, useEffect } from 'react';
import { X, BookOpen as BookOpenIcon, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CourseService } from '@/services/api/courseService';
import type { UGCourse, LecturerWithStats } from '@/types/course';

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSearchModal({ isOpen, onClose }: MobileSearchModalProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [courses, setCourses] = useState<UGCourse[]>([]);
  const [lecturers, setLecturers] = useState<LecturerWithStats[]>([]);
  const [loading, setLoading] = useState(false);
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
      ).slice(0, 5)
    : courses.slice(0, 5);

  const filteredLecturers = searchQuery.trim()
    ? lecturers.filter(lecturer =>
        lecturer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lecturer.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lecturer.specialties && lecturer.specialties.some(specialty => 
          specialty.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      ).slice(0, 5)
    : lecturers.slice(0, 5);

  const searchResults = [
    {
      category: t('nav.courses'),
      icon: BookOpenIcon,
      items: filteredCourses.map(course => ({
        title: course.title,
        subtitle: `${course.code} - ${course.department}`,
        href: `/course/${course.code}`
      }))
    },
    {
      category: t('nav.lecturers'),
      icon: Users,
      items: filteredLecturers.map(lecturer => ({
        title: lecturer.name,
        subtitle: lecturer.department,
        href: `/lecturer/${lecturer.$id}`
      }))
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
          onClose();
        }
        break;
      case 'Escape':
        onClose();
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed inset-x-4 top-20 mx-auto max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700">
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
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 搜索結果 */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500 dark:text-gray-400">載入中...</p>
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
                            onClick={onClose}
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
                  沒有找到相關結果
                </p>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  輸入關鍵字開始搜索
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 