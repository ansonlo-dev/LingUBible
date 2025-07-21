import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useLanguage } from "@/hooks/useLanguage";
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { RecaptchaProvider, useRecaptcha } from '@/contexts/RecaptchaContext';
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/common/CookieConsent";
import { DocumentHead } from "@/components/common/DocumentHead";
import { BetaNotice } from "@/components/common/BetaNotice";
import { BackToTop } from "@/components/ui/back-to-top";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import SmartFontLoader from "@/components/common/SmartFontLoader";

// 導入優化字體 CSS
import "./styles/optimizedFonts.css";

import Index from "./pages/Index";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Lecturers from "./pages/Lecturers";
import InstructorsList from "./pages/InstructorsList";
import WriteReview from "./pages/WriteReview";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import UserSettings from "./pages/user/UserSettings";
import MyReviews from "./pages/user/MyReviews";
import Favorites from "./pages/Favorites";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import OAuthCallback from "./pages/auth/OAuthCallback";
import OAuthLoginCallback from "./pages/auth/OAuthLoginCallback";

import NotFound from "./pages/NotFound";
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";
import Contact from "./pages/legal/Contact";
import FAQ from "./pages/legal/FAQ";
import EmailPreview from "./pages/EmailPreview";
import PerformanceTest from "./pages/PerformanceTest";


import { DevModeRoute } from "@/components/dev/DevModeRoute";
import { useState, useEffect, useCallback } from 'react';
import { theme } from '@/lib/utils';
import { useSwipeGesture } from "@/hooks/ui/use-swipe-gesture";
import { swipeHintCookie } from '@/lib/cookies';
import { sidebarStateCookie } from '@/lib/cookies';
import { usePingSystem } from '@/hooks/usePingSystem';
import { useVisitorSession } from '@/hooks/useVisitorSession';
import { useLanguageFromUrl } from '@/hooks/useLanguageFromUrl';
import { useResponsive } from '@/hooks/useEnhancedResponsive';
import { initializeScrollbarCompensation } from '@/utils/ui/scrollbarCompensation';



const queryClient = new QueryClient();

// 主題切換函數
function setTheme(mode: 'light' | 'dark' | 'system') {
  const root = document.documentElement;
  
  // 保存主題設定
  theme.set(mode);
  
  // 獲取實際應該應用的主題
  const effectiveTheme = theme.getEffectiveTheme();
  const isDark = effectiveTheme === 'dark';
  
  if (isDark) {
    root.classList.add('dark');
    root.style.backgroundColor = 'rgb(0, 0, 0)';
    root.style.color = 'rgb(255, 255, 255)';
    document.body.style.backgroundColor = 'rgb(0, 0, 0)';
    document.body.style.color = 'rgb(255, 255, 255)';
  } else {
    root.classList.remove('dark');
    root.style.backgroundColor = 'rgb(255, 255, 255)';
    root.style.color = 'rgb(0, 0, 0)';
    document.body.style.backgroundColor = 'rgb(255, 255, 255)';
    document.body.style.color = 'rgb(0, 0, 0)';
  }
}

// 立即初始化主題，避免首次載入時的顏色問題
function initializeTheme() {
  const effectiveTheme = theme.getEffectiveTheme();
  const shouldUseDark = effectiveTheme === 'dark';
  
  const root = document.documentElement;
  
  if (shouldUseDark) {
    root.classList.add('dark');
    root.style.backgroundColor = 'rgb(0, 0, 0)';
    root.style.color = 'rgb(255, 255, 255)';
    document.body.style.backgroundColor = 'rgb(0, 0, 0)';
    document.body.style.color = 'rgb(255, 255, 255)';
  } else {
    root.classList.remove('dark');
    root.style.backgroundColor = 'rgb(255, 255, 255)';
    root.style.color = 'rgb(0, 0, 0)';
    document.body.style.backgroundColor = 'rgb(255, 255, 255)';
    document.body.style.color = 'rgb(0, 0, 0)';
  }
  
  return shouldUseDark;
}

// 立即執行主題初始化
const initialIsDark = initializeTheme();

// 內部 App 組件，在 LanguageProvider 內部使用
const AppContent = () => {
  const { t, isLoading: translationsLoading } = useLanguage();
  
  // 所有 hooks 必須在條件返回之前調用
  const [showBetaNotice, setShowBetaNotice] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isDark, setIsDark] = useState(initialIsDark);
  const { isDesktop, isMobile } = useResponsive(); // Now uses enhanced detection
  
  // Simplified sidebar state initialization - no complex mobile detection needed here
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && !isMobile) {
      // Only read from cookie for non-mobile devices
        return sidebarStateCookie.getState();
    }
    // Mobile devices default to collapsed
    return false;
  });
  
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化訪客會話（如果用戶未登入）
  useVisitorSession();

  // 啟動 ping 系統來追蹤用戶在線狀態
  usePingSystem({
    enabled: true,
    pingInterval: 45 * 1000, // 每 45 秒 ping 一次，與本地統計服務同步
    activityEvents: ['click', 'keydown', 'scroll', 'mousemove', 'touchstart']
  });

  useEffect(() => {
    // 獲取當前主題模式和實際主題
    const currentMode = theme.get() || 'system';
    const effectiveTheme = theme.getEffectiveTheme();
    const shouldUseDark = effectiveTheme === 'dark';
    
    // 強制設定主題，確保與 DOM 同步
    setTheme(currentMode);
    setIsDark(shouldUseDark);
    
    // 監聽系統主題變化（僅當設定為 system 時）
    const unwatch = theme.watchSystemTheme((systemIsDark) => {
      const currentStoredMode = theme.get() || 'system';
      if (currentStoredMode === 'system') {
        // 重新應用主題以反映系統變化
        setTheme('system');
        setIsDark(systemIsDark);
      }
    });
    
    // 初始化滑動提示狀態
    const hasUsedSwipe = swipeHintCookie.hasBeenUsed();
    setShowSwipeHint(!hasUsedSwipe);
    setIsInitialized(true);
    
    // 初始化滾動條補償系統，防止下拉選單導致的佈局偏移
    const cleanupScrollbarCompensation = initializeScrollbarCompensation();
    
    // 如果顯示滑動提示，4秒後自動隱藏
    let timer: NodeJS.Timeout | undefined;
    if (!hasUsedSwipe) {
      timer = setTimeout(() => {
        setShowSwipeHint(false);
        swipeHintCookie.markAsUsed();
      }, 4000);
    }
    
    return () => {
      unwatch();
      cleanupScrollbarCompensation();
      if (timer) clearTimeout(timer);
    };
  }, []);

  // 監聽滾動事件來關閉滑動提示
  useEffect(() => {
    if (!showSwipeHint || !isMobile) return;

    const handleScroll = () => {
      setShowSwipeHint(false);
      swipeHintCookie.markAsUsed();
    };

    // 監聽 window 和 document 的滾動事件
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    
    // 監聽觸摸滾動 - 更準確的檢測方法
    let touchStartY = 0;
    let touchStartTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const currentY = e.touches[0].clientY;
        const deltaY = Math.abs(currentY - touchStartY);
        const deltaTime = Date.now() - touchStartTime;
        
        // 如果垂直移動超過 15px 且時間合理，認為是滾動
        if (deltaY > 15 && deltaTime > 50) {
          setShowSwipeHint(false);
          swipeHintCookie.markAsUsed();
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [showSwipeHint, isMobile]);

  // 開發者工具：重置滑動提示（按 Ctrl/Cmd + Shift + R）
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'R') {
        event.preventDefault();
        swipeHintCookie.reset();
        setShowSwipeHint(true);
        console.log('滑動提示已重置');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 監聽設備類型變化，處理側邊欄狀態
  useEffect(() => {
    // 當從手機版切換到桌面版時，關閉手機版側邊欄並恢復桌面版狀態
    if (isDesktop && isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
      // 清理可能殘留的 CSS 類
      document.body.classList.remove('mobile-sidebar-open');
      // 從 cookie 讀取桌面版側邊欄狀態
      setIsSidebarCollapsed(sidebarStateCookie.getState());
    }
    
    // 當從桌面版切換到手機版時，確保側邊欄狀態正確
    if (isMobile && !isMobileSidebarOpen) {
      // 手機版時不需要摺疊狀態，因為會使用 overlay 模式
      setIsSidebarCollapsed(false);
      // 確保清理桌面版可能殘留的 CSS 類
      document.body.classList.remove('mobile-sidebar-open');
    }
  }, [isDesktop, isMobile, isMobileSidebarOpen]);

  // 監聽語言變化事件，並在語言切換後恢復手機版側邊欄狀態
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      console.log('🌐 App: 收到語言變化事件', event.detail);
      
             // 使用 setTimeout 確保在語言切換完成後檢查狀態
       setTimeout(() => {
         const wasOpen = sessionStorage.getItem('mobileSidebarWasOpen');
         if (wasOpen === 'true' && isMobile && !isMobileSidebarOpen) {
           console.log('📱 App: 語言切換後恢復手機版側邊欄開啟狀態');
           setIsMobileSidebarOpen(true);
           // 清除標記，避免重複恢復
           sessionStorage.removeItem('mobileSidebarWasOpen');
           
           // 移除可能的自動聚焦，避免首頁項目被意外聚焦
           setTimeout(() => {
             if (document.activeElement && document.activeElement !== document.body) {
               (document.activeElement as HTMLElement).blur();
               console.log('📱 App: 移除側邊欄重新展開後的自動聚焦');
             }
           }, 50);
         }
       }, 100); // 短暫延遲確保狀態更新完成
    };

    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, [isMobile, isMobileSidebarOpen]);

  // 在組件初始化時，檢查是否需要恢復手機版側邊欄狀態（處理頁面刷新的情況）
  useEffect(() => {
    const wasOpen = sessionStorage.getItem('mobileSidebarWasOpen');
    if (wasOpen === 'true' && isMobile && !isMobileSidebarOpen) {
      console.log('📱 App: 初始化時恢復手機版側邊欄開啟狀態');
      setIsMobileSidebarOpen(true);
      // 清除標記，避免重複恢復
      sessionStorage.removeItem('mobileSidebarWasOpen');
      
      // 移除可能的自動聚焦
      setTimeout(() => {
        if (document.activeElement && document.activeElement !== document.body) {
          (document.activeElement as HTMLElement).blur();
          console.log('📱 App: 移除初始化恢復後的自動聚焦');
        }
      }, 150);
    }
  }, [isInitialized]); // 只在初始化完成時執行一次

  const toggleSidebar = () => {
    const newCollapsedState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newCollapsedState);
    
    // 只在桌面版時保存狀態到 cookie
    if (!isMobile) {
      sidebarStateCookie.saveState(newCollapsedState);
    }
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  // 禁用/啟用 body 滾動（手機版側邊欄打開時）- 使用 CSS 類的方法
  useEffect(() => {
    if (isMobile && isMobileSidebarOpen) {
      // 使用 CSS 類而不是直接操作樣式，避免影響 sticky 定位
      document.body.classList.add('mobile-sidebar-open');
      
      return () => {
        // 移除 CSS 類
        document.body.classList.remove('mobile-sidebar-open');
      };
    } else {
      // 確保在不需要時移除 CSS 類
      document.body.classList.remove('mobile-sidebar-open');
    }
  }, [isMobile, isMobileSidebarOpen]);

  // 狀態一致性檢查和修復
  useEffect(() => {
    // 如果是桌面版但 mobile sidebar 還是開著，強制關閉
    if (isDesktop && isMobileSidebarOpen) {
      console.log('📱 App: 檢測到桌面版但 mobile sidebar 仍開啟，強制關閉');
      setIsMobileSidebarOpen(false);
      document.body.classList.remove('mobile-sidebar-open');
    }
    
    // 如果 CSS 類與狀態不一致，修復
    const hasOpenClass = document.body.classList.contains('mobile-sidebar-open');
    const shouldHaveOpenClass = isMobile && isMobileSidebarOpen;
    
    if (hasOpenClass !== shouldHaveOpenClass) {
      console.log(`📱 App: CSS 類狀態不一致，修復中 (hasClass: ${hasOpenClass}, shouldHave: ${shouldHaveOpenClass})`);
      if (shouldHaveOpenClass) {
        document.body.classList.add('mobile-sidebar-open');
      } else {
        document.body.classList.remove('mobile-sidebar-open');
      }
    }
  }, [isDesktop, isMobile, isMobileSidebarOpen]);

  // 統一的側邊欄切換函數，根據設備類型選擇正確的行為
  const handleSidebarToggle = () => {
    if (isMobile) {
      toggleMobileSidebar();
    } else {
      toggleSidebar();
    }
  };

  // 滑動手勢處理 - 打開側邊欄（從左半部分滑動到右半部分）
  const { ref: swipeOpenRef, forceReinit: forceSwipeOpenReinit } = useSwipeGesture({
    onSwipeRight: () => {
      if (isMobile && !isMobileSidebarOpen) {
        setIsMobileSidebarOpen(true);
        // 標記用戶已使用滑動功能並保存到 cookie
        swipeHintCookie.markAsUsed();
        setShowSwipeHint(false);
      }
    },
    enabled: isMobile && !isMobileSidebarOpen,
    swipeZone: 'left-half-to-right', // 從左半部分滑動到右半部分觸發
    threshold: 80, // 適中的滑動距離要求，考慮到用戶需要滑動更長距離
    restraint: 100, // 允許更多垂直偏移，因為滑動距離更長
    allowedTime: 800 // 增加允許時間，因為滑動距離更長
  });

  // 滑動手勢處理 - 關閉側邊欄（從右半部分滑動到左半部分）
  const { ref: swipeCloseRef, forceReinit: forceSwipeCloseReinit } = useSwipeGesture({
    onSwipeLeft: () => {
      if (isMobile && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    },
    enabled: isMobile && isMobileSidebarOpen,
    swipeZone: 'right-half-to-left', // 從右半部分滑動到左半部分觸發
    threshold: 80, // 適中的滑動距離要求，考慮到用戶需要滑動更長距離
    restraint: 100, // 允許更多垂直偏移，因為滑動距離更長
    allowedTime: 800 // 增加允許時間，因為滑動距離更長
  });

  // 統一的滑動手勢重新初始化函數
  const forceSwipeReinit = useCallback(() => {
    forceSwipeOpenReinit();
    forceSwipeCloseReinit();
  }, [forceSwipeOpenReinit, forceSwipeCloseReinit]);

  // Show loading screen while translations are loading
  if (translationsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <RouterContent 
          isDark={isDark}
          setIsDark={setIsDark}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
          isMobile={isMobile}
          showSwipeHint={showSwipeHint}
          setShowSwipeHint={setShowSwipeHint}
          isInitialized={isInitialized}
          toggleSidebar={toggleSidebar}
          toggleMobileSidebar={toggleMobileSidebar}
          handleSidebarToggle={handleSidebarToggle}
          forceSwipeReinit={forceSwipeReinit}
        />
      </BrowserRouter>
    </>
  );
};

// Router 內部的內容組件
const RouterContent = ({ 
  isDark, 
  setIsDark, 
  isSidebarCollapsed, 
  setIsSidebarCollapsed, 
  isMobileSidebarOpen, 
  setIsMobileSidebarOpen, 
  isMobile, 
  showSwipeHint, 
  setShowSwipeHint, 
  isInitialized,
  toggleSidebar,
  toggleMobileSidebar,
  handleSidebarToggle,
  forceSwipeReinit
}: {
  isDark: boolean;
  setIsDark: (value: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (value: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (value: boolean) => void;
  isMobile: boolean;
  showSwipeHint: boolean;
  setShowSwipeHint: (value: boolean) => void;
  isInitialized: boolean;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  handleSidebarToggle: () => void;
  forceSwipeReinit: () => void;
}) => {
  const { t } = useLanguage();

  // 處理 URL 語言參數 - 現在在 Router 內部
  useLanguageFromUrl();

  // 側邊欄快捷鍵 Alt+L 和 Ctrl+Shift+L
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+L 或 Ctrl+Shift+L 快捷鍵
      if (
        e.key.toLowerCase() === 'l' &&
        ((e.altKey && !e.ctrlKey && !e.shiftKey) ||
         (e.ctrlKey && e.shiftKey && !e.altKey))
      ) {
        e.preventDefault();
        handleSidebarToggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSidebarToggle]);

  return (
    <>
      {/* 動態文檔標題和元數據 */}
      <DocumentHead />
      
      {/* SEO 測試器 - 僅開發模式 */}
      {/* {import.meta.env.DEV && <SEOTester />} */}
      
      <Routes>
        {/* 登入和註冊頁面使用獨立佈局 */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/oauth/login-callback" element={<OAuthLoginCallback />} />
        
        {/* 其他頁面使用主要佈局 */}
        <Route 
          path="*" 
          element={
            <div className="app-layout">
              {/* 左側邊欄 - 固定定位 */}
              <aside 
                className={`
                  sidebar-container 
                  ${isSidebarCollapsed ? 'collapsed' : ''} 
                  ${isMobileSidebarOpen ? 'mobile-open' : ''}
                `}
                style={{
                  position: 'fixed',
                  zIndex: 40
                }}
              >
                <AppSidebar 
                  isCollapsed={isSidebarCollapsed}
                  onToggle={handleSidebarToggle}
                  isMobileOpen={isMobileSidebarOpen}
                  onMobileToggle={toggleMobileSidebar}
                />
              </aside>
              
              {/* 手機版遮罩 */}
              {isMobileSidebarOpen && isMobile && (
                <div 
                  className="fixed inset-0 z-[45] bg-black/50"
                  onClick={() => setIsMobileSidebarOpen(false)}
                />
              )}
              
              {/* 主要內容區域包含header和content */}
              <div 
                className={`main-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
              >
                {/* 頂部 Header - 回到main-container內部但保持sticky */}
                <Header 
                  onToggleSidebar={handleSidebarToggle}
                  isSidebarCollapsed={isSidebarCollapsed}
                />
                {/* 手機版透明滾動方向動畫指示器 */}
                {isInitialized && isMobile && !isMobileSidebarOpen && showSwipeHint && (
                  <div className="fixed inset-0 z-50 pointer-events-none">
                    {/* 透明覆蓋層 */}
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm swipe-overlay-animation" />
                    
                    {/* 滾動方向指示器 */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="swipe-direction-indicator">
                        {/* 箭頭動畫 */}
                        <div className="flex items-center gap-2 text-white">
                          <div className="swipe-arrow-container">
                            <svg className="w-8 h-8 swipe-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <svg className="w-8 h-8 swipe-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <svg className="w-8 h-8 swipe-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </div>
                        </div>
                        
                        {/* 文字提示 */}
                        <div className="text-center mt-4">
                          <p className="text-white text-lg font-medium swipe-text-animation">
                            {t('swipe.hint')}
                          </p>
                          <p className="text-white/70 text-sm mt-2">
                            {t('swipe.dismissHint')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 測試版通知橫幅 */}
                <BetaNotice />
                
                {/* 頁面內容 */}
                <main className="content-area">
                  <RouteMonitor 
                    isMobile={isMobile}
                    isMobileSidebarOpen={isMobileSidebarOpen}
                    forceSwipeReinit={forceSwipeReinit}
                  />
                  <ScrollToTop />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/courses" element={<Courses />} />
                    <Route path="/courses/:courseCode" element={<CourseDetail />} />
                    <Route path="/instructors" element={<InstructorsList />} />
                    <Route path="/instructors/:instructorName" element={<Lecturers />} />
                    <Route path="/write-review" element={<WriteReview />} />
                    <Route path="/write-review/:courseCode" element={<WriteReview />} />
                    <Route path="/my-reviews" element={
                      <ProtectedRoute>
                        <MyReviews />
                      </ProtectedRoute>
                    } />
                    <Route path="/favorites" element={
                      <ProtectedRoute>
                        <Favorites />
                      </ProtectedRoute>
                    } />
                    <Route path="/settings" element={
                      <ProtectedRoute>
                        <UserSettings />
                      </ProtectedRoute>
                    } />

                                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/faq" element={<FAQ />} />
                    {/* 開發模式專用路由 */}
                    <Route 
                      path="/email-preview" 
                      element={
                        <DevModeRoute>
                          <EmailPreview />
                        </DevModeRoute>
                      } 
                    />
                    <Route 
                      path="/performance" 
                      element={
                        <DevModeRoute>
                          <PerformanceTest />
                        </DevModeRoute>
                      } 
                    />

          
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                
                {/* Footer */}
                <Footer />
                <BackToTop />
              </div>
            </div>
          } 
        />
      </Routes>
    </>
  );
};

// 路由監控組件
const RouteMonitor = ({ 
  isMobile, 
  isMobileSidebarOpen, 
  forceSwipeReinit 
}: {
  isMobile: boolean;
  isMobileSidebarOpen: boolean;
  forceSwipeReinit: () => void;
}) => {
  const location = useLocation();

  // 監控路由變化，確保滑動手勢在頁面導航後正常工作
  useEffect(() => {
    // 在路由變化後稍微延遲，確保頁面完全加載，然後重新初始化滑動手勢
    const timeoutId = setTimeout(() => {
      // 強制重新初始化滑動手勢
      if (isMobile && forceSwipeReinit) {
        forceSwipeReinit();
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [location.pathname, isMobile, isMobileSidebarOpen, forceSwipeReinit]);

  return null; // 這個組件不渲染任何內容，只是監控路由
};

const App = () => {

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <RecaptchaProvider>
            <AuthProvider>
              <SmartFontLoader />
              <AppContent />
              <Toaster />
              <CookieConsent />
              {/* <DevModeIndicator /> */}
            </AuthProvider>
          </RecaptchaProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
