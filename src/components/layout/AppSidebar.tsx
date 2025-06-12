import { Home, Users, Menu, X, GraduationCap, MessageSquareText, UserCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageSwitcher, type Language } from '@/components/common/LanguageSwitcher';
import { BookOpenIcon } from '@/components/icons/BookOpenIcon';
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
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [forceRender, setForceRender] = useState(0);

  // 監聽 OAuth 登入完成事件，用於強制重新渲染
  useEffect(() => {
    const handleOAuthComplete = () => {
      console.log('側邊欄: 收到 OAuth 完成事件，強制重新渲染');
      setForceRender(prev => prev + 1);
    };

    // 監聽自定義事件
    window.addEventListener('oauthLoginComplete', handleOAuthComplete);
    
    return () => {
      window.removeEventListener('oauthLoginComplete', handleOAuthComplete);
    };
  }, []);

  // 檢測移動設備並監聽方向變化
  useEffect(() => {
    const checkIsMobile = () => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(newIsMobile);
      // 強制重新渲染以確保 shouldShowText 正確更新
      setForceRender(prev => prev + 1);
    };

    // 初始檢測
    checkIsMobile();

    // 處理方向變化的函數，添加延遲確保視窗大小正確更新
    const handleOrientationChange = () => {
      // 立即檢測一次
      checkIsMobile();
      
      // 延遲檢測，確保視窗大小已經更新
      setTimeout(() => {
        checkIsMobile();
      }, 100);
      
      // 再次延遲檢測，處理某些設備的延遲更新
      setTimeout(() => {
        checkIsMobile();
      }, 300);
    };

    // 監聽多種事件來確保捕獲所有變化
    window.addEventListener('resize', checkIsMobile);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // 監聽視覺視窗變化（PWA 特有）
    if ('visualViewport' in window) {
      window.visualViewport?.addEventListener('resize', checkIsMobile);
    }

    return () => {
      window.removeEventListener('resize', checkIsMobile);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if ('visualViewport' in window) {
        window.visualViewport?.removeEventListener('resize', checkIsMobile);
      }
    };
  }, []);

  // 創建一個包裝的語言切換函數，在手機版時不關閉側邊欄
  const handleLanguageChange = async (newLanguage: Language) => {
    console.log('🔄 側邊欄: 語言切換到', newLanguage, '手機版側邊欄狀態:', isMobileOpen);
    
    // 在語言切換前，如果是手機版且側邊欄開啟，保存狀態
    if (isMobile && isMobileOpen) {
      console.log('📱 側邊欄: 保存手機版側邊欄開啟狀態到 sessionStorage');
      sessionStorage.setItem('mobileSidebarWasOpen', 'true');
    }
    
    // 調用原始的語言切換函數
    await setLanguage(newLanguage);
    
    console.log('✅ 側邊欄: 語言切換完成');
  };

  // 在移動設備上，忽略 isCollapsed 狀態，始終顯示文字
  const shouldShowText = !isCollapsed || isMobile;
  
  // 簡化導航邏輯：只要用戶存在且不在載入中就顯示認證菜單項
  // 這樣可以避免延遲顯示的問題
  const navigation = [
    { name: t('nav.home'), href: '/', icon: HomeIcon, current: location.pathname === '/' },
    { name: t('nav.courses'), href: '/courses', icon: BookOpenIcon, current: location.pathname === '/courses' },
    { name: t('nav.lecturers'), href: '#', icon: GraduationCap, current: false },
    // 只要用戶已登入且不在載入中就顯示我的評價和設定選項
    ...(user && !loading ? [
      { name: t('sidebar.myReviews'), href: '#', icon: MessageSquareText, current: false },
      { name: t('sidebar.settings'), href: '/settings', icon: UserCircle, current: location.pathname === '/settings' }
    ] : []),
  ];

  return (
    <>
      {/* 側邊欄內容 - 直接使用 flex 佈局，不再包裝額外的 div */}
      <div key={`sidebar-${forceRender}`} className="flex flex-col h-full">
        {/* Logo 區域 - 所有設備都顯示 */}
        <div className="p-4 md:p-2 md:h-16 md:flex md:items-center mt-2">
          {shouldShowText && (
            <Link 
              to="/" 
              className="flex items-center gap-3 px-3 py-2 text-primary hover:opacity-80 transition-opacity cursor-pointer"
              onClick={() => onMobileToggle && onMobileToggle()}
            >
              <BookOpenIcon className="h-6 w-6 flex-shrink-0" />
              <span className="text-xl font-bold">LingUBible</span>
            </Link>
          )}
          {!shouldShowText && (
            <Link 
              to="/" 
              className="flex items-center justify-center px-3 py-2 text-primary hover:opacity-80 transition-opacity cursor-pointer"
              onClick={() => onMobileToggle && onMobileToggle()}
            >
              <BookOpenIcon className="h-6 w-6" />
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
                <LanguageSwitcher onLanguageChange={handleLanguageChange} currentLanguage={language} variant="pills" />
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
                <LanguageSwitcher onLanguageChange={handleLanguageChange} currentLanguage={language} variant="vertical-pills" />
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
