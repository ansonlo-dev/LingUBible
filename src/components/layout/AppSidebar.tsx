import { Home, BookOpen, Users, Star, TrendingUp, Settings, Menu, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { useState, useEffect } from 'react';

// 自定義 Home 圖示組件
const HomeIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
    />
  </svg>
);

interface AppSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
}

export function AppSidebar({ isCollapsed = false, onToggle, isMobileOpen = false, onMobileToggle }: AppSidebarProps) {
  const { t, language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  // 檢測移動設備並監聽方向變化
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    window.addEventListener('orientationchange', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
      window.removeEventListener('orientationchange', checkIsMobile);
    };
  }, []);

  // 在移動設備上，忽略 isCollapsed 狀態，始終顯示文字
  const shouldShowText = !isCollapsed || isMobile;
  
  const navigation = [
    { name: t('nav.home'), href: '/', icon: HomeIcon, current: location.pathname === '/' },
    { name: t('nav.courses'), href: '#', icon: BookOpen, current: false },
    { name: t('nav.lecturers'), href: '#', icon: Users, current: false },
    { name: t('sidebar.myReviews'), href: '#', icon: Star, current: false },
    { name: t('sidebar.trending'), href: '#', icon: TrendingUp, current: false },
    // 只有在用戶已登入時才顯示設定選項
    ...(user ? [{ name: t('sidebar.settings'), href: '/settings', icon: Settings, current: location.pathname === '/settings' }] : []),
  ];

  return (
    <>
      {/* 側邊欄內容 - 直接使用 flex 佈局，不再包裝額外的 div */}
      <div className="flex flex-col h-full">
        {/* Logo 區域 - 所有設備都顯示 */}
        <div className="p-4 md:p-2 md:h-16 md:flex md:items-center mt-2">
          {shouldShowText && (
            <Link 
              to="/" 
              className="flex items-center gap-3 px-3 py-2 text-primary hover:opacity-80 transition-opacity cursor-pointer"
              onClick={() => onMobileToggle && onMobileToggle()}
            >
              <BookOpen className="h-6 w-6 flex-shrink-0" />
              <span className="text-xl font-bold">LingUBible</span>
            </Link>
          )}
          {!shouldShowText && (
            <Link 
              to="/" 
              className="flex items-center justify-center px-3 py-2 text-primary hover:opacity-80 transition-opacity cursor-pointer"
              onClick={() => onMobileToggle && onMobileToggle()}
            >
              <BookOpen className="h-6 w-6" />
            </Link>
          )}
        </div>

        {/* 導航選單 */}
        <nav className="flex-1 p-4 md:py-4 md:px-2">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isExternalOrHash = item.href.startsWith('#');
              
              return (
                <li key={item.name}>
                  {isExternalOrHash ? (
                    <a
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-md text-base font-bold transition-colors
                        ${item.current 
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                          : 'text-gray-800 dark:text-white hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }
                      `}
                      onClick={() => onMobileToggle && onMobileToggle()}
                      title={!shouldShowText ? item.name : undefined}
                    >
                      <Icon className="h-6 w-6 flex-shrink-0 text-gray-800 dark:text-white" />
                      {shouldShowText && <span className="text-gray-800 dark:text-white font-bold whitespace-nowrap min-w-0 flex-1">{item.name}</span>}
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-md text-base font-bold transition-colors
                        ${item.current 
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                          : 'text-gray-800 dark:text-white hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }
                      `}
                      onClick={() => onMobileToggle && onMobileToggle()}
                      title={!shouldShowText ? item.name : undefined}
                    >
                      <Icon className="h-6 w-6 flex-shrink-0 text-gray-800 dark:text-white" />
                      {shouldShowText && <span className="text-gray-800 dark:text-white font-bold whitespace-nowrap min-w-0 flex-1">{item.name}</span>}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

                {/* 底部設置區域 - 始終顯示語言和主題切換 */}
        <div className="p-4 md:py-4 md:px-2">
          {shouldShowText ? (
            <div className="space-y-1">
              {/* 語言切換器 - 始終顯示 */}
              <div className="flex items-center justify-center px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                <LanguageSwitcher onLanguageChange={setLanguage} currentLanguage={language} variant="pills" />
              </div>
              
              {/* 主題切換 - 始終顯示 */}
              <div className="flex items-center justify-center px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                <ThemeToggle variant="toggle" />
              </div>
            </div>
          ) : (
            /* 摺疊狀態下的圖標版本 */
            <div className="space-y-1">
              <div className="flex justify-center p-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                <LanguageSwitcher onLanguageChange={setLanguage} currentLanguage={language} variant="vertical-pills" />
              </div>
              <div className="flex justify-center p-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                <ThemeToggle variant="button" />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
