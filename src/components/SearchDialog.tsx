import { useState, useEffect, useRef } from 'react';
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
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if this is desktop mode (always open)
  const isDesktopMode = isOpen && onClose.toString() === '() => {}';

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

  const handleInputFocus = () => {
    setShowResults(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowResults(true);
  };

  // Focus input when opened (mobile mode)
  useEffect(() => {
    if (isOpen && !isDesktopMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isDesktopMode]);

  // Click outside to close (only for mobile mode)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        if (isDesktopMode) {
          setShowResults(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, isDesktopMode]);

  if (!isOpen) return null;

  const shouldShowResults = showResults && (searchQuery.trim() !== '' || isDesktopMode);

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={`${t('search.placeholder')}...`}
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          className={`pl-10 h-12 text-base transition-all ${
            isDesktopMode 
              ? 'border-2 border-muted-foreground/20 focus:border-primary pr-4' 
              : 'border-2 border-primary/20 focus:border-primary pr-10'
          }`}
        />
        {!isDesktopMode && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {isDesktopMode && (
          <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            CTRL K
          </kbd>
        )}
      </div>

      {/* Search Results Dropdown */}
      {shouldShowResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {filteredResults.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {searchQuery.trim() === '' ? '開始輸入以搜尋...' : '找不到相關結果'}
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