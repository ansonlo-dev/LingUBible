import { BookOpen, Search, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SearchDropdown } from './SearchDialog';
import { PWAStatusIndicator } from './PWAStatusIndicator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from '@/components/UserMenu';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export function Header({ onToggleSidebar, isSidebarCollapsed }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();

  return (
    <>
      <header className="header-sticky">
        {/* 左側區域 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 側邊欄摺疊按鈕 - 桌面版和手機版都顯示 */}
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
          
          {/* Logo - 桌面版和手機版都顯示，但手機版較小 */}
          <Link to="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity whitespace-nowrap">
            <BookOpen className="h-5 w-5 md:h-6 md:w-6" />
            <span className="text-lg md:text-xl font-bold">LingUBible</span>
          </Link>
        </div>

        {/* 中間區域 - 桌面版搜索 */}
        <div className="flex-1 mx-4 hidden md:block">
          <SearchDropdown 
            isOpen={true}
            onClose={() => {}} // Desktop version is always open
            isDesktop={true}
          />
        </div>

        {/* 右側區域 */}
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          {/* 手機版搜索按鈕 */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              className="h-8 w-8"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          {/* PWA 狀態指示器 - 只在桌面版顯示文字 */}
          <PWAStatusIndicator showText={false} className="hidden sm:flex" />
          
          {/* 語言切換器 - 手機版較小 */}
          <div className="scale-90 md:scale-100">
            <LanguageSwitcher onLanguageChange={setLanguage} currentLanguage={language} />
          </div>
          
          {/* 主題切換 */}
          <ThemeToggle />
          
          {/* 用戶菜單或登入按鈕 */}
          {user ? (
            <UserMenu />
          ) : (
            <Button 
              asChild
              className="gradient-primary hover:opacity-90 text-white font-medium text-sm md:text-base px-2 md:px-4"
              size="sm"
            >
              <Link to="/login">
                <span className="hidden sm:inline">{t('nav.signIn')}</span>
                <span className="sm:hidden">{t('nav.signIn')}</span>
              </Link>
            </Button>
          )}
        </div>
      </header>

      {/* Mobile Search - positioned like desktop */}
      {isSearchOpen && (
        <div className="md:hidden fixed top-16 left-4 right-4 z-[99999]">
          <SearchDropdown 
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
          />
        </div>
      )}
    </>
  );
}
