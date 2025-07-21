import { PanelLeft, Search, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

import { MobileSearchModal } from '@/components/common/MobileSearchModal';
import { useState, useEffect } from 'react';

import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from "@/components/user/UserMenu";
import { Link } from 'react-router-dom';
import { useEnhancedResponsive } from '@/hooks/useEnhancedResponsive';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export function Header({ onToggleSidebar, isSidebarCollapsed }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [forceRender, setForceRender] = useState(0);
  const { isMobilePortrait } = useEnhancedResponsive();

  // 檢測操作系統
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  // 監聽強制用戶更新事件，確保 Header 立即反映用戶狀態變化
  useEffect(() => {
    const handleForceUserUpdate = () => {
      console.log('Header: 收到強制用戶更新事件，強制重新渲染');
      setForceRender(prev => prev + 1);
    };

    window.addEventListener('forceUserUpdate', handleForceUserUpdate);
    
    return () => {
      window.removeEventListener('forceUserUpdate', handleForceUserUpdate);
    };
  }, []);

  // Ctrl+K 鍵盤快捷鍵
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="header-sticky">
        {isMobilePortrait ? (
          // Mobile Portrait Layout
          <>
            {/* 左側區域 */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* 側邊欄摺疊按鈕 */}
              {onToggleSidebar && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleSidebar}
                  className="flex"
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* 中間區域 - LinguBible Logo */}
            <div className="flex-1 flex justify-center min-w-0">
              <Link 
                to="/" 
                className="flex items-center gap-3 text-primary hover:opacity-80 transition-opacity"
                style={{ transform: 'scale(1.3)' }}
              >
                <BookOpen className="h-10 w-10" />
                <span className="text-2xl font-bold">LingUBible</span>
              </Link>
            </div>

            {/* 右側區域 */}
            <div className="flex items-center gap-1 flex-shrink-0 min-w-fit">
              {/* 搜尋按鈕 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
                className="flex"
              >
                <Search className="h-4 w-4" />
              </Button>
              
              {/* 用戶菜單或登入按鈕 */}
              {user ? (
                <UserMenu />
              ) : (
                <Button 
                  asChild
                  className="gradient-primary hover:opacity-90 text-white font-bold text-xs px-2 whitespace-nowrap"
                  size="sm"
                >
                  <Link to="/login">
                    {t('nav.signIn')}
                  </Link>
                </Button>
              )}
            </div>
          </>
        ) : (
          // Desktop and Other Layouts
          <>
            {/* 左側區域 */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* 側邊欄摺疊按鈕 - 桌面版和手機版都顯示 */}
              {onToggleSidebar && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleSidebar}
                  className="flex"
                  title={t('sidebar.toggleShortcut', { 
                    shortcut: isMac ? 'Alt+L or ⌘+Shift+L' : 'Alt+L or Ctrl+Shift+L' 
                  })}
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* 中間區域 - 搜索框 */}
            <div className="flex-1 flex justify-center min-w-0 mx-1 md:mx-4">
              <div className="w-full max-w-sm md:max-w-2xl lg:max-w-3xl">
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="w-full flex items-center justify-between px-3 py-2 text-muted-foreground bg-background border border-muted-foreground/20 rounded-lg hover:border-primary transition-colors"
                >
                  <Search className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 truncate md:whitespace-nowrap text-sm text-center">{t('search.placeholder')}</span>
                  <div className="hidden md:flex items-center gap-1 flex-shrink-0">
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      <span className="text-xs">{isMac ? '⌘' : 'Ctrl'}</span>K
                    </kbd>
                  </div>
                </button>
              </div>
            </div>

            {/* 右側區域 */}
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0 min-w-fit">
              {/* 用戶菜單或登入按鈕 - 最高優先級，始終顯示 */}
              {user ? (
                <UserMenu />
              ) : (
                <Button 
                  asChild
                  className="gradient-primary hover:opacity-90 text-white font-bold text-sm px-2 sm:px-3 md:px-4 whitespace-nowrap"
                  size="sm"
                >
                  <Link to="/login">
                    <span className="hidden sm:inline">{t('nav.signIn')}</span>
                    <span className="sm:hidden text-xs">{t('nav.signIn')}</span>
                  </Link>
                </Button>
              )}
            </div>
          </>
        )}
      </header>
      
      {/* 搜索模態 */}
      <MobileSearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        isSidebarCollapsed={isSidebarCollapsed}
      />
    </>
  );
}
