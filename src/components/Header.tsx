import { BookOpen, Search, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SearchDropdown } from './SearchDialog';
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
          
          {/* 桌面版 Logo */}
          <Link to="/" className="hidden md:flex items-center gap-2 text-xl font-bold text-primary hover:opacity-80 transition-opacity whitespace-nowrap">
            <BookOpen className="h-6 w-6" />
            LingUBible
          </Link>
        </div>

        {/* Desktop Search - Always visible */}
        <div className="flex-1 mx-4 hidden md:block">
          <SearchDropdown 
            isOpen={true}
            onClose={() => {}} // Desktop version is always open
          />
        </div>

        {/* Mobile Search Button */}
        <div className="md:hidden flex-1 flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <LanguageSwitcher onLanguageChange={setLanguage} currentLanguage={language} />
          <ThemeToggle />
          {user ? (
            <UserMenu />
          ) : (
            <Button 
              asChild
              className="gradient-primary hover:opacity-90 text-white font-medium"
            >
              <Link to="/login">
                {t('nav.signIn')}
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
