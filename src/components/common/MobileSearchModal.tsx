import { useState, useEffect, useRef } from 'react';
import { Search, Users, TrendingUp, Hash, X } from 'lucide-react';
import { BookOpenIcon } from '@/components/icons/BookOpenIcon';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSearchModal({ isOpen, onClose }: MobileSearchModalProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasAddedHistoryEntry = useRef(false);

  // Mock search results data
  const searchResults = [
    {
      category: t('nav.courses'),
      icon: BookOpenIcon,
      items: [
        { title: t('course.introCS'), subtitle: 'CS101 - Dr. Sarah Johnson', href: '#' },
        { title: t('course.advancedMath'), subtitle: 'MATH301 - Prof. Michael Chen', href: '#' },
        { title: t('course.englishLit'), subtitle: 'ENG201 - Dr. Emily Davis', href: '#' },
        { title: '數據結構與算法', subtitle: 'CS201 - Prof. Alex Wang', href: '#' },
        { title: '機器學習基礎', subtitle: 'CS301 - Dr. Lisa Zhang', href: '#' },
        { title: '網頁開發', subtitle: 'CS202 - Prof. John Smith', href: '#' },
        { title: '數據庫系統', subtitle: 'CS203 - Dr. Maria Garcia', href: '#' },
      ]
    },
    {
      category: t('nav.lecturers'),
      icon: Users,
      items: [
        { title: 'Dr. Sarah Johnson', subtitle: t('department.computerScience'), href: '#' },
        { title: 'Prof. Michael Chen', subtitle: t('department.mathematics'), href: '#' },
        { title: 'Dr. Emily Davis', subtitle: t('department.english'), href: '#' },
        { title: 'Prof. Alex Wang', subtitle: t('department.computerScience'), href: '#' },
        { title: 'Dr. Lisa Zhang', subtitle: t('department.computerScience'), href: '#' },
        { title: 'Prof. John Smith', subtitle: t('department.computerScience'), href: '#' },
        { title: 'Dr. Maria Garcia', subtitle: t('department.computerScience'), href: '#' },
      ]
    },
    {
      category: '熱門搜尋',
      icon: TrendingUp,
      items: [
        { title: '計算機科學導論', subtitle: '最受歡迎的入門課程', href: '#' },
        { title: '高等數學', subtitle: '挑戰性課程', href: '#' },
        { title: '英國文學', subtitle: '文學愛好者首選', href: '#' },
        { title: '數據結構', subtitle: '程式設計必修', href: '#' },
        { title: '機器學習', subtitle: '人工智能入門', href: '#' },
        { title: '網頁設計', subtitle: '前端開發基礎', href: '#' },
        { title: '數據庫', subtitle: '後端開發核心', href: '#' },
        { title: '軟體工程', subtitle: '團隊協作必備', href: '#' },
      ]
    },
    {
      category: '快速操作',
      icon: Hash,
      items: [
        { title: '撰寫評論', subtitle: '分享您的課程體驗', href: '#' },
        { title: '查看我的評論', subtitle: '管理您的評論', href: '#' },
        { title: '瀏覽熱門課程', subtitle: '發現受歡迎的課程', href: '#' },
        { title: '查看講師評分', subtitle: '了解講師教學風格', href: '#' },
        { title: '課程比較', subtitle: '比較不同課程', href: '#' },
        { title: '學習計劃', subtitle: '制定學習路線', href: '#' },
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
    onClose();
    setSearchQuery('');
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
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
          handleSelect(allItems[selectedIndex].href);
        }
        break;
    }
  };

  // 處理瀏覽器返回鍵
  useEffect(() => {
    if (isOpen) {
      // 添加一個虛擬的歷史記錄條目
      if (!hasAddedHistoryEntry.current) {
        window.history.pushState({ searchModal: true }, '', window.location.href);
        hasAddedHistoryEntry.current = true;
      }

      // 監聽 popstate 事件（返回鍵）
      const handlePopState = (event: PopStateEvent) => {
        // 如果是我們的搜索模態框狀態，關閉模態框
        if (event.state?.searchModal || hasAddedHistoryEntry.current) {
          event.preventDefault();
          onClose();
          hasAddedHistoryEntry.current = false;
        }
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    } else {
      // 模態框關閉時，如果我們添加了歷史記錄條目，需要清理
      if (hasAddedHistoryEntry.current) {
        // 檢查當前狀態是否是我們添加的
        if (window.history.state?.searchModal) {
          window.history.back();
        }
        hasAddedHistoryEntry.current = false;
      }
    }
  }, [isOpen, onClose]);

  // Auto focus when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // 延遲聚焦以確保模態完全打開
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-white dark:bg-black flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={t('search.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-4 h-10 text-base bg-white dark:bg-black border border-muted-foreground/20 focus:border-primary"
            autoComplete="off"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-10 w-10"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Results */}
      <div 
        className="flex-1 overflow-y-auto bg-white dark:bg-black min-h-0 overscroll-behavior-y-contain"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y'
        }}
      >
        {filteredResults.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 px-4">
            找不到相關結果
          </div>
        ) : (
          <div className="space-y-3 p-3 pb-6">
            {filteredResults.map((group, groupIndex) => (
              <div key={group.category}>
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.category}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item, itemIndex) => {
                    const globalIndex = filteredResults
                      .slice(0, groupIndex)
                      .reduce((acc, g) => acc + g.items.length, 0) + itemIndex;
                    
                    return (
                      <button
                        key={`${group.category}-${itemIndex}`}
                        onClick={() => handleSelect(item.href)}
                        className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-colors ${
                          selectedIndex === globalIndex
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-accent/50'
                        }`}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted flex-shrink-0">
                          <group.icon className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-medium truncate text-sm">{item.title}</span>
                          <span className="text-xs text-muted-foreground truncate">{item.subtitle}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 