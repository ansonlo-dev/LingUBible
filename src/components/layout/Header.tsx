import { PanelLeft, Search } from 'lucide-react';
import { BookOpenIcon } from '@/components/icons/BookOpenIcon';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { PWAInstallIcon } from '@/components/common/PWAInstallIcon';
import { SearchDropdown } from '@/components/common/SearchDialog';
import { MobileSearchModal } from '@/components/common/MobileSearchModal';
import { useState, useEffect } from 'react';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from "@/components/user/UserMenu";
import { Link } from 'react-router-dom';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export function Header({ onToggleSidebar, isSidebarCollapsed }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const [isDesktop, setIsDesktop] = useState(true);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

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
        </div>

        {/* 中間區域 - 搜索框 */}
        <div className="flex-1 mx-2 md:mx-4">
          {isDesktop ? (
            <SearchDropdown 
              isOpen={true}
              onClose={() => {}} // Always open version
              isDesktop={true}
            />
          ) : (
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-muted-foreground bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>{t('search.search')}</span>
            </button>
          )}
        </div>

        {/* 右側區域 */}
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          
          {/* PWA 安裝圖標 - 所有設備都顯示 */}
          <PWAInstallIcon />
          
          {/* 用戶菜單或登入按鈕 - 最高優先級，始終顯示 */}
          {user ? (
            <UserMenu />
          ) : (
            <Button 
              asChild
              className="gradient-primary hover:opacity-90 text-white font-bold text-sm px-2 sm:px-3 md:px-4"
              size="sm"
            >
              <Link to="/login">
                <span className="hidden sm:inline">{t('nav.signIn')}</span>
                <span className="sm:hidden text-xs">{t('nav.signIn')}</span>
              </Link>
            </Button>
          )}
        </div>
      </header>
      
      {/* 移動端搜索模態 */}
      <MobileSearchModal 
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
      />
    </>
  );
}
