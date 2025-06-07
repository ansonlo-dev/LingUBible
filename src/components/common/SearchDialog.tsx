import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, BookOpen, Users, Star, TrendingUp, FileText, Hash, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  isDesktop?: boolean; // 新增 prop 來明確標識桌面模式
}

export function SearchDropdown({ isOpen, onClose, isDesktop = false }: SearchDropdownProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showResults, setShowResults] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // 追蹤組件是否已掛載
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeoutRef = useRef<number | null>(null);

  // Check if this is desktop mode (always open)
  const isDesktopMode = isDesktop;
  
  // 檢查是否是初始載入（桌面版在初始載入時不應該自動獲得焦點）
  const isInitialLoad = isDesktopMode && !isInitialized;

  // 檢測操作系統以顯示正確的快捷鍵提示
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

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
    // 清除任何待處理的 blur 超時
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    
    // 簡化邏輯：只要獲得焦點就顯示結果
    if (!isInitialized) {
      setIsInitialized(true);
    }
    
    // 統一處理，移動端和桌面端都使用相同邏輯
    setTimeout(() => {
      setShowResults(true);
    }, isDesktopMode ? 0 : 100);
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
    if (!isInitialized) {
      setIsInitialized(true);
    }
    
    // 簡化處理
    setTimeout(() => {
      setShowResults(true);
    }, isDesktopMode ? 0 : 100);
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // 移動端完全忽略 blur 事件
    if (!isDesktopMode) {
      return;
    }
    
    // 檢查焦點是否移動到搜尋結果容器內
    const relatedTarget = e.relatedTarget as HTMLElement;
    const searchContainer = searchRef.current;
    
    // 如果焦點移動到搜尋容器內的元素，不隱藏結果
    if (searchContainer && relatedTarget && searchContainer.contains(relatedTarget)) {
      return;
    }
    
    // 桌面端延遲隱藏結果
    blurTimeoutRef.current = window.setTimeout(() => {
      setShowResults(false);
      blurTimeoutRef.current = null;
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
      // 處理 Ctrl+K 或 Cmd+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        
        // 如果是桌面版，聚焦搜索框並顯示結果
        if (isDesktopMode) {
          setIsInitialized(true);
          setShowResults(true);
          
          // 聚焦到搜尋框
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }
      }
    };

    // 添加全局鍵盤監聽器
    document.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isDesktopMode]);

  // Focus input when opened (mobile mode)
  useEffect(() => {
    // 手機版不自動獲得焦點，也不自動顯示搜尋結果
    // 只有當用戶明確點擊或聚焦搜尋框時才顯示結果
    if (isOpen && !isDesktopMode) {
      // 確保手機版初始狀態不顯示搜尋結果
      setShowResults(false);
      setIsInitialized(false);
    }
  }, [isOpen, isDesktopMode]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      
      // 檢查點擊是否在搜尋容器外部
      if (searchRef.current && !searchRef.current.contains(target)) {
        if (isDesktopMode) {
          // 桌面版：隱藏搜索結果
          setShowResults(false);
        } else {
          // 移動端：關閉整個搜尋對話框
          onClose();
        }
      }
    };

    if (isOpen) {
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
    
    // 確保初始狀態正確 - 手機版和桌面版都不應該在初始載入時顯示搜尋結果
    if (isInitialLoad || !isDesktopMode) {
      setShowResults(false);
      setIsInitialized(false);
    }
    
    // 確保輸入框不會自動獲得焦點
    const checkAndRemoveFocus = () => {
      if (inputRef.current && document.activeElement === inputRef.current && !isInitialized) {
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
      // 清理 blur timeout
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, [isInitialized, isInitialLoad, isDesktopMode]);

  // 創建一個 ref 回調來處理 Input 掛載
  const inputRefCallback = useCallback((element: HTMLInputElement | null) => {
    inputRef.current = element;
    
    // 如果是初始載入且元素獲得了焦點，立即移除焦點
    if (element && isInitialLoad && document.activeElement === element) {
      element.blur();
    }
  }, [isInitialLoad]);

  if (!isOpen) return null;

  // 重新設計邏輯：
  // 1. 必須已初始化且 showResults 為 true 才顯示
  // 2. 桌面版：絕對不在初始載入時顯示
  // 3. 手機版：只有在用戶明確聚焦搜尋框後才顯示
  // 4. 內容根據搜尋文字過濾，但總是顯示一些結果
  const shouldShowResults = isInitialized && showResults && (isDesktopMode ? !isInitialLoad : true);

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto z-[99999]" style={{ overflow: 'visible' }}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={isDesktopMode ? `${t('search.placeholder')}...` : t('search.search')}
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onClick={handleInputClick}

          autoFocus={false}
          autoComplete="off"
          className={`pl-10 h-9 text-base transition-all text-center placeholder:text-center ${
            isDesktopMode 
              ? 'border border-muted-foreground/20 focus:border-primary pr-10' 
              : 'border border-muted-foreground/20 focus:border-primary pr-10'
          }`}
        />
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
        {/* Ctrl+K 提示 - 只在桌面版且搜索框為空時顯示，移動設備隱藏 */}
        {isDesktopMode && searchQuery.trim() === '' && (
          <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 hidden md:inline-flex">
            <span className="text-xs">{isMac ? '⌘' : 'Ctrl'}</span>
            <span>+</span>
            <span>K</span>
          </kbd>
        )}
      </div>

      {/* Mobile Search Results Dropdown */}
      {shouldShowResults && !isDesktopMode && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 border border-border rounded-lg shadow-xl max-h-96 overflow-y-auto z-[999999]"
          style={{
            backgroundColor: document.documentElement.classList.contains('dark') 
              ? '#0a0a0a' 
              : '#ffffff',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none'
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
      
      {/* Desktop Search Results Dropdown */}
      {shouldShowResults && isDesktopMode && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 border border-border rounded-lg shadow-xl max-h-96 overflow-y-auto z-[999999]"
          style={{
            backgroundColor: document.documentElement.classList.contains('dark') 
              ? '#0a0a0a' 
              : '#ffffff',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none'
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