import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, BookOpen, Users, Star, TrendingUp, FileText, Hash, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchDropdown({ isOpen, onClose }: SearchDropdownProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showResults, setShowResults] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // 追蹤組件是否已掛載
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if this is desktop mode (always open)
  const isDesktopMode = isOpen && onClose.toString() === '() => {}';
  
  // 檢查是否是初始載入（桌面版在初始載入時不應該自動獲得焦點）
  const isInitialLoad = isDesktopMode && !isInitialized;

  // Mock search results data
  const searchResults = [
    {
      category: t('nav.courses'),
      icon: BookOpen,
      items: [
        { title: t('course.introCS'), subtitle: 'CS101 - Dr. Sarah Johnson', href: '#' },
        { title: t('course.advancedMath'), subtitle: 'MATH301 - Prof. Michael Chen', href: '#' },
        { title: t('course.englishLit'), subtitle: 'ENG201 - Dr. Emily Davis', href: '#' },
      ]
    },
    {
      category: t('nav.lecturers'),
      icon: Users,
      items: [
        { title: 'Dr. Sarah Johnson', subtitle: t('department.computerScience'), href: '#' },
        { title: 'Prof. Michael Chen', subtitle: t('department.mathematics'), href: '#' },
        { title: 'Dr. Emily Davis', subtitle: t('department.english'), href: '#' },
      ]
    },
    {
      category: '熱門搜尋',
      icon: TrendingUp,
      items: [
        { title: '計算機科學導論', subtitle: '最受歡迎的入門課程', href: '#' },
        { title: '高等數學', subtitle: '挑戰性課程', href: '#' },
        { title: '英國文學', subtitle: '文學愛好者首選', href: '#' },
      ]
    },
    {
      category: '快速操作',
      icon: Hash,
      items: [
        { title: '撰寫評論', subtitle: '分享您的課程體驗', href: '#' },
        { title: '查看我的評論', subtitle: '管理您的評論', href: '#' },
        { title: '瀏覽熱門課程', subtitle: '發現受歡迎的課程', href: '#' },
      ]
    }
  ];

  // Filter results based on search query
  const filteredResults = searchQuery.trim() === '' 
    ? searchResults 
    : searchResults.map(group => ({
        ...group,
        items: group.items.filter(item => 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(group => group.items.length > 0);

  // Get all items for keyboard navigation
  const allItems = filteredResults.flatMap(group => group.items);

  const handleSelect = (href: string) => {
    if (!isDesktopMode) {
      onClose();
    }
    setSearchQuery('');
    setSelectedIndex(-1);
    setShowResults(false);
    console.log('Navigate to:', href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        if (isDesktopMode) {
          setShowResults(false);
          inputRef.current?.blur();
        } else {
          onClose();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!showResults) setShowResults(true);
        setSelectedIndex(prev => (prev + 1) % allItems.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!showResults) setShowResults(true);
        setSelectedIndex(prev => prev <= 0 ? allItems.length - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allItems[selectedIndex]) {
          handleSelect(allItems[selectedIndex].href);
        }
        break;
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // 檢查是否是真正的用戶互動
    // 如果組件剛掛載且未初始化，或者是初始載入，則阻止焦點
    if (!isMounted || isInitialLoad || (!isInitialized && !e.target.matches(':focus-visible'))) {
      console.log('Preventing automatic focus on mount'); // 調試用
      e.target.blur();
      return;
    }
    
    // 只有在已經初始化且用戶真正互動時才顯示結果
    if (isInitialized && !isInitialLoad) {
      setShowResults(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    
    // 只有在非初始載入時才顯示結果
    if (!isInitialLoad) {
      setShowResults(true);
    }
    
    // 用戶開始輸入時標記為已初始化
    if (!isInitialized) {
      setIsInitialized(true);
    }
  };

  // 添加一個處理用戶點擊的函數
  const handleInputClick = () => {
    // 如果是初始載入狀態，啟用輸入框
    if (isInitialLoad) {
      setIsInitialized(true);
      // 延遲一點時間讓 disabled 屬性更新，然後聚焦
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // 聚焦後再顯示結果
          setShowResults(true);
        }
      }, 10);
      return; // 提前返回，不執行下面的邏輯
    }
    
    if (!isInitialized) {
      setIsInitialized(true);
    }
    
    // 只有在非初始載入時才立即顯示結果
    if (!isInitialLoad) {
      setShowResults(true);
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    console.log('handleInputBlur called, isDesktopMode:', isDesktopMode); // 調試用
    
    // 檢查焦點是否移動到搜尋結果容器內
    const relatedTarget = e.relatedTarget as HTMLElement;
    const searchContainer = searchRef.current;
    
    // 如果焦點移動到搜尋容器內的元素，不隱藏結果
    if (searchContainer && relatedTarget && searchContainer.contains(relatedTarget)) {
      console.log('Focus moved within search container, not hiding results'); // 調試用
      return;
    }
    
    console.log('Focus moved outside, hiding results in 150ms'); // 調試用
    
    // 延遲隱藏結果，以便點擊結果項目時有時間處理
    setTimeout(() => {
      console.log('Setting showResults to false'); // 調試用
      setShowResults(false);
    }, 150);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedIndex(-1);
    if (isDesktopMode) {
      setShowResults(false);
      inputRef.current?.blur();
    } else {
      onClose();
    }
  };

  // 使用 useCallback 創建穩定的關閉函數
  const handleCloseResults = useCallback(() => {
    console.log('handleCloseResults called, isDesktopMode:', isDesktopMode);
    if (isDesktopMode) {
      setShowResults(false);
      // 強制失去焦點
      if (inputRef.current) {
        inputRef.current.blur();
      }
    } else {
      onClose();
    }
  }, [isDesktopMode, onClose]);

  // 處理全域鍵盤快捷鍵
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 只在桌面版且不是初始載入時處理 Ctrl+K
      if (isDesktopMode && !isInitialLoad && (e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isInitialized) {
          setIsInitialized(true);
        }
        setShowResults(true);
        // 聚焦到搜尋框
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    };

    // 只有在非初始載入狀態時才添加監聽器
    if (isDesktopMode && !isInitialLoad) {
      document.addEventListener('keydown', handleGlobalKeyDown);
    }

    return () => {
      if (isDesktopMode) {
        document.removeEventListener('keydown', handleGlobalKeyDown);
      }
    };
  }, [isDesktopMode, isInitialized, isInitialLoad]);

  // Focus input when opened (mobile mode)
  useEffect(() => {
    // 只有在手機版且用戶明確打開搜尋時才自動獲得焦點
    if (isOpen && !isDesktopMode && inputRef.current) {
      // 延遲一點時間確保 DOM 已經渲染
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // 手機版打開時標記為已初始化並顯示搜尋結果
          setIsInitialized(true);
          setShowResults(true);
        }
      }, 100);
    }
  }, [isOpen, isDesktopMode]);

  // Click outside to close (主要用於手機版)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      
      // 檢查點擊是否在搜尋容器外部
      if (searchRef.current && !searchRef.current.contains(target)) {
        console.log('Clicked outside search container, calling handleCloseResults'); // 調試用
        
        // 手機版：關閉整個搜尋對話框
        if (!isDesktopMode) {
          onClose();
        }
        // 桌面版主要依賴 onBlur 事件處理
      }
    };

    // 主要為手機版添加監聽器
    if (isOpen && !isDesktopMode) {
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('touchstart', handleClickOutside, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
    };
  }, [isOpen, isDesktopMode, onClose]);

  // 組件掛載後設置標記
  useEffect(() => {
    setIsMounted(true);
    
    // 確保初始狀態正確
    if (isInitialLoad) {
      setShowResults(false);
    }
    
    // 確保輸入框不會自動獲得焦點
    const checkAndRemoveFocus = () => {
      if (inputRef.current && document.activeElement === inputRef.current && !isInitialized) {
        console.log('Removing unwanted focus from search input'); // 調試用
        inputRef.current.blur();
      }
    };
    
    // 立即檢查
    checkAndRemoveFocus();
    
    // 延遲檢查，以防瀏覽器稍後設置焦點
    const timeouts = [
      setTimeout(checkAndRemoveFocus, 50),
      setTimeout(checkAndRemoveFocus, 100),
      setTimeout(checkAndRemoveFocus, 200),
      setTimeout(checkAndRemoveFocus, 500)
    ];
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [isInitialized, isInitialLoad]);

  // 創建一個 ref 回調來處理 Input 掛載
  const inputRefCallback = useCallback((element: HTMLInputElement | null) => {
    inputRef.current = element;
    
    // 如果是初始載入且元素獲得了焦點，立即移除焦點
    if (element && isInitialLoad && document.activeElement === element) {
      console.log('Removing focus from input on mount'); // 調試用
      element.blur();
    }
  }, [isInitialLoad]);

  if (!isOpen) return null;

  // 重新設計邏輯：
  // 1. 必須已初始化且 showResults 為 true 才顯示
  // 2. 絕對不在初始載入時顯示
  // 3. 內容根據搜尋文字過濾，但總是顯示一些結果
  const shouldShowResults = isInitialized && showResults && !isInitialLoad;

  console.log('shouldShowResults:', shouldShowResults, 'showResults:', showResults, 'searchQuery:', searchQuery, 'isDesktopMode:', isDesktopMode); // 調試用

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto z-[99999]" style={{ overflow: 'visible' }}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <div 
          onClick={isInitialLoad ? handleInputClick : undefined}
          className={isInitialLoad ? 'cursor-text' : ''}
        >
          <Input
            ref={inputRefCallback}
            type="text"
            placeholder={`${t('search.placeholder')}...`}
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onClick={!isInitialLoad ? handleInputClick : undefined}
            autoFocus={false}
            autoComplete="off"
            tabIndex={isMounted && !isInitialLoad ? 0 : -1}
            disabled={isInitialLoad}
            className={`pl-10 h-12 text-base transition-all ${
              isDesktopMode 
                ? 'border-2 border-muted-foreground/20 focus:border-primary pr-10' 
                : 'border-2 border-primary/20 focus:border-primary pr-10'
            } ${isInitialLoad ? 'cursor-text' : ''}`}
            style={isInitialLoad ? { pointerEvents: 'auto', opacity: 1, cursor: 'text' } : {}}
          />
        </div>
        {/* Clear/Close button - show for both desktop and mobile */}
        {(searchQuery.trim() !== '' || !isDesktopMode) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {isDesktopMode && searchQuery.trim() === '' && (
          <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            CTRL K
          </kbd>
        )}
      </div>

      {/* Search Results Dropdown */}
      {shouldShowResults && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 border border-border rounded-lg shadow-xl max-h-96 overflow-y-auto z-[99999] dark:bg-black bg-white"
          style={{ 
            backgroundColor: document.documentElement.classList.contains('dark') ? '#000000' : '#ffffff',
            backdropFilter: 'none'
          }}
        >
          {filteredResults.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              找不到相關結果
            </div>
          ) : (
            <div className="p-2">
              {filteredResults.map((group, groupIndex) => (
                <div key={group.category} className={groupIndex > 0 ? 'mt-4' : ''}>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.category}
                  </div>
                  {group.items.map((item, itemIndex) => {
                    const globalIndex = filteredResults
                      .slice(0, groupIndex)
                      .reduce((acc, g) => acc + g.items.length, 0) + itemIndex;
                    
                    return (
                      <button
                        key={`${group.category}-${itemIndex}`}
                        onClick={() => handleSelect(item.href)}
                        onMouseDown={(e) => e.preventDefault()}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-left transition-colors ${
                          selectedIndex === globalIndex
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-accent/50'
                        }`}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                          <group.icon className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-medium truncate">{item.title}</span>
                          <span className="text-sm text-muted-foreground truncate">{item.subtitle}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 