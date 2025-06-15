import { useState, useRef, useEffect } from 'react';
import { X, BookOpen as BookOpenIcon, Users, Construction } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasAddedHistoryEntry = useRef(false);

  // 載入數據
  useEffect(() => {
    if (isOpen) {
      // 立即設置載入狀態，避免建議項目閃現
      setLoading(true);
      setIsInitialized(false);
      
      const loadData = async () => {
        try {
          // 模擬載入時間
          await new Promise(resolve => setTimeout(resolve, 500));
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

  // 搜尋功能暫時禁用的提示
  const searchResults = [
    {
      category: t('nav.courses'),
      icon: BookOpenIcon,
      items: []
    },
    {
              category: t('nav.lecturers'),
      icon: Users,
      items: []
    }
  ];

  const allItems: any[] = [];

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
              ) : (
                <div className="p-8 text-center">
                  <Construction className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">搜尋功能重新設計中</h3>
                  <p className="text-muted-foreground">
                    我們正在優化搜尋功能，敬請期待更好的體驗！
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
              ) : (
                <div className="p-8 text-center">
                  <Construction className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">搜尋功能重新設計中</h3>
                  <p className="text-muted-foreground">
                    我們正在優化搜尋功能，敬請期待更好的體驗！
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