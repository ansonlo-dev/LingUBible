import { BookOpen, GraduationCap, Star, Settings, Languages, LogOut, Menu, MessageSquareText, Heart, UserCircle, Mail, BookText } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import { APP_CONFIG } from '@/utils/constants/config';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageSwitcher, type Language } from '@/components/common/LanguageSwitcher';
import { useState, useEffect } from 'react';
import { useResponsive } from '@/hooks/useEnhancedResponsive';

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

export function AppSidebar({ isCollapsed, onToggle, isMobileOpen, onMobileToggle }: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage } = useLanguage(); // Add back language and setLanguage
  const { user, loading } = useAuth(); // Add back loading
  const { isMobile, isMobilePortrait, isTouchDevice } = useResponsive(); // Use enhanced detection
  const [forceRender, setForceRender] = useState(0);
  const [dynamicHeight, setDynamicHeight] = useState('100vh');

  // 監聽 OAuth 登入完成事件和強制用戶更新事件，用於強制重新渲染
  useEffect(() => {
    const handleOAuthComplete = () => {
      console.log('側邊欄: 收到 OAuth 完成事件，強制重新渲染');
      setForceRender(prev => prev + 1);
    };

    const handleForceUserUpdate = () => {
      console.log('側邊欄: 收到強制用戶更新事件，強制重新渲染');
      setForceRender(prev => prev + 1);
    };

    // 監聽自定義事件
    window.addEventListener('oauthLoginComplete', handleOAuthComplete);
    window.addEventListener('forceUserUpdate', handleForceUserUpdate);
    
    return () => {
      window.removeEventListener('oauthLoginComplete', handleOAuthComplete);
      window.removeEventListener('forceUserUpdate', handleForceUserUpdate);
    };
  }, []);

  // 處理動態視窗高度變化（修復手機版側邊欄高度問題）
  useEffect(() => {
    const updateViewportHeight = () => {
      // 使用 window.innerHeight 來獲取實際可視高度
      const vh = window.innerHeight;
      const dynamicVh = `${vh}px`;
      setDynamicHeight(dynamicVh);
      
      // 同時更新 CSS 自定義屬性，用於其他元素
      document.documentElement.style.setProperty('--dynamic-vh', `${vh}px`);
      document.documentElement.style.setProperty('--vh', `${vh * 0.01}px`);
    };

    // 初始設定
    updateViewportHeight();

    // 監聽視窗大小變化
    window.addEventListener('resize', updateViewportHeight);
    
    // 監聽方向變化
    window.addEventListener('orientationchange', () => {
      // 延遲更新，等待瀏覽器完成方向變化
      setTimeout(updateViewportHeight, 100);
      setTimeout(updateViewportHeight, 300);
    });

    // 監聽視覺視窗變化（處理移動端瀏覽器地址欄顯示/隱藏）
    if ('visualViewport' in window && window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
    }

    // 監聽滾動事件，處理某些瀏覽器在滾動時的視窗變化
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updateViewportHeight, 50);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
      window.removeEventListener('scroll', handleScroll);
      if ('visualViewport' in window && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportHeight);
      }
      clearTimeout(scrollTimeout);
    };
  }, []);

  // 創建一個包裝的語言切換函數，在手機版時不關閉側邊欄
  const handleLanguageChange = async (newLanguage: Language) => {
    console.log('🔄 側邊欄: 語言切換到', newLanguage, '手機版側邊欄狀態:', isMobileOpen);
    
    // 在語言切換前，如果是手機版且側邊欄開啟，保存狀態
    if (isMobile && isMobileOpen) {
      console.log('�� 側邊欄: 保存手機版側邊欄開啟狀態到 sessionStorage');
      sessionStorage.setItem('mobileSidebarWasOpen', 'true');
    }
    
    // 調用原始的語言切換函數
    await setLanguage(newLanguage);
    
    console.log('✅ 側邊欄: 語言切換完成');
  };

  // 在移動設備上，忽略 isCollapsed 狀態，始終顯示文字
  // For landscape phones, always show text when sidebar is open
  const isLandscapePhone = isMobile && window.innerWidth > window.innerHeight && window.innerHeight <= 450;
  const shouldShowText = !isCollapsed || isMobile || (isLandscapePhone && isMobileOpen);

  // 修復觸控設備懸停狀態持續的問題（包括平板和手機）
  useEffect(() => {
    if (isTouchDevice || isMobile) {
      // 當路由變化時，移除所有懸停狀態
      const removeHoverStates = () => {
        // 移除所有可能的懸停狀態
        const hoveredElements = document.querySelectorAll('nav a:hover, .sidebar-container nav a:hover');
        hoveredElements.forEach(element => {
          // 強制觸發重新渲染來移除懸停狀態
          (element as HTMLElement).blur();
          // 移除任何可能的focus狀態
          (element as HTMLElement).style.transform = '';
        });
        
        // 觸摸其他地方來移除懸停狀態
        const body = document.body;
        try {
          const touchEvent = new TouchEvent('touchstart', {
            bubbles: true,
            cancelable: true,
            touches: []
          });
          body.dispatchEvent(touchEvent);
        } catch (error) {
          // 如果 TouchEvent 創建失敗，使用 MouseEvent 作為後備
          const mouseEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true
          });
          body.dispatchEvent(mouseEvent);
        }
      };

      // 延遲執行以確保路由變化完成
      const timeoutId = setTimeout(removeHoverStates, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [location.pathname, isMobile, isTouchDevice]);

  // 處理導航項目點擊，移除觸控設備懸停狀態但不關閉側邊欄
  const handleNavClick = (shouldCloseSidebar: boolean = false) => {
    return (e: React.MouseEvent<HTMLAnchorElement>) => {
      // 觸控設備點擊後立即移除懸停狀態
      if (isTouchDevice || isMobile) {
        const target = e.currentTarget;
        target.blur();
        // 立即移除任何 transform 樣式（hover 效果）
        target.style.transform = '';
        
        // 觸發一個觸摸事件來移除懸停狀態
        setTimeout(() => {
          try {
            const touchEvent = new TouchEvent('touchstart', {
              bubbles: true,
              cancelable: true,
              touches: []
            });
            document.body.dispatchEvent(touchEvent);
          } catch (error) {
            // 如果 TouchEvent 不支援，使用其他方法
            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true
            });
            document.body.dispatchEvent(clickEvent);
          }
        }, 50);
        
        // 只有在明確指定需要關閉側邊欄時才關閉（例如點擊 Logo）
        if (shouldCloseSidebar && onMobileToggle) {
          onMobileToggle();
        }
      }
    };
  };
  
  // 重新組織導航項目為分組結構
  const navigationGroups = [
    // Home - 不需要分組名稱
    {
      items: [
        { name: t('nav.home'), href: '/', icon: HomeIcon, current: location.pathname === '/' }
      ]
    },
    // Courses 和 Lecturers 分組
    {
      label: t('sidebar.browse'),
      items: [
        { name: t('nav.courses'), href: '/courses', icon: BookText, current: location.pathname === '/courses' },
        { name: t('nav.lecturers'), href: '/instructors', icon: GraduationCap, current: location.pathname === '/instructors' }
      ]
    },
    // My Reviews、Favorites 和 Settings 分組（僅在用戶登入時顯示）
    ...(user && !loading ? [{
      label: t('sidebar.personal'),
      items: [
        { name: t('sidebar.myReviews'), href: '/my-reviews', icon: MessageSquareText, current: location.pathname === '/my-reviews' },
        { name: t('sidebar.myFavorites'), href: '/favorites', icon: Heart, current: location.pathname === '/favorites' },
        { name: t('sidebar.settings'), href: '/settings', icon: UserCircle, current: location.pathname === '/settings' }
      ]
    }] : [])
  ];

  // 開發工具導航（僅在開發模式顯示）
  const devNavigation = APP_CONFIG.DEV_MODE.ENABLED ? [
    { name: '郵件預覽', href: '/email-preview', icon: Mail, current: location.pathname === '/email-preview' },
  ] : [];

  return (
    <>
      {/* 側邊欄內容 - 使用動態高度 */}
      <div 
        key={`sidebar-${forceRender}`} 
        className="flex flex-col h-full"
        style={{
          // 在手機版使用動態高度
          height: isMobile ? dynamicHeight : undefined,
          minHeight: isMobile ? dynamicHeight : undefined
        }}
      >
        {/* Logo 區域 - 在手機直向模式下隱藏 (因為顯示在 Header 中) */}
        {!isMobilePortrait && (
          <div className="p-4 md:p-2 md:h-16 md:flex md:items-center mt-2">
            {shouldShowText && (
              <Link 
                to="/" 
                className="flex items-center gap-3 px-3 py-2 text-primary hover:opacity-80 transition-opacity cursor-pointer"
                onClick={handleNavClick(true)}
              >
                <BookOpen className="h-6 w-6 flex-shrink-0" strokeWidth={2.5} />
                <span className="text-xl font-black">LingUBible</span>
              </Link>
            )}
            {!shouldShowText && (
              <Link 
                to="/" 
                className="flex items-center justify-center px-3 py-2 text-primary hover:opacity-80 transition-opacity cursor-pointer"
                onClick={handleNavClick(true)}
              >
                <BookOpen className="h-6 w-6" strokeWidth={2.5} />
              </Link>
            )}
          </div>
        )}

        {/* 導航選單 */}
        <nav className="flex-1 p-4 md:py-4 md:px-2">
          <div className="space-y-8">
            {navigationGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* 分組標題 - 只在有標題且顯示文字時顯示 */}
                {group.label && shouldShowText && (
                  <div className="mb-2">
                    <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {group.label}
                    </h3>
                  </div>
                )}
                
                {/* 分組項目 */}
                <ul className="space-y-2">
                  {group.items.map((item) => {
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
                            onClick={handleNavClick(false)}
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
                            onClick={handleNavClick(false)}
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
                
                {/* 分組分隔線 - 只在摺疊狀態且不是最後一個分組時顯示 */}
                {!shouldShowText && groupIndex < navigationGroups.length - 1 && (
                  <div className="mt-6 flex justify-center">
                    <div className="w-8 h-0.5 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* 開發工具區域 - 僅在開發模式顯示 */}
          {devNavigation.length > 0 && (
            <>
              {/* 開發工具分隔線 - 只在摺疊狀態顯示 */}
              {!shouldShowText && (
                <div className="mt-6 flex justify-center">
                  <div className="w-8 h-0.5 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                </div>
              )}
              
              <div className="mt-6 mb-2">
                {shouldShowText && (
                  <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    開發工具
                  </h3>
                )}
              </div>
              <ul className="space-y-2">
                {devNavigation.map((item) => {
                  const Icon = item.icon;
                  
                  return (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-md text-base font-bold transition-colors
                          ${item.current 
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                            : 'text-gray-800 dark:text-white hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }
                        `}
                        onClick={handleNavClick(false)}
                        title={!shouldShowText ? item.name : undefined}
                      >
                        <Icon className="h-6 w-6 flex-shrink-0 text-gray-800 dark:text-white" />
                        {shouldShowText && <span className="text-gray-800 dark:text-white font-bold whitespace-nowrap min-w-0 flex-1">{item.name}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
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
