import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PWAProvider } from "@/contexts/PWAContext";
import { AuthProvider } from '@/contexts/AuthContext';
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/common/CookieConsent";
import { DocumentHead } from "@/components/common/DocumentHead";
import { DevModeIndicator } from "@/components/dev/DevModeIndicator";
import { PWAPromptTrigger } from "@/components/common/PWAPromptTrigger";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import UserSettings from "./pages/user/UserSettings";
import AvatarDemo from "./pages/user/AvatarDemo";
import LecturerDemo from "./pages/demo/LecturerDemo";
import NotFound from "./pages/NotFound";
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";
import Contact from "./pages/legal/Contact";
import { useState, useEffect } from 'react';
import { theme } from '@/lib/utils';
import { useSwipeGesture } from "@/hooks/ui/use-swipe-gesture";
import { swipeHintCookie } from '@/lib/cookies';
import { sidebarStateCookie } from '@/lib/cookies';
import { useLanguage } from '@/contexts/LanguageContext';


const queryClient = new QueryClient();

// 主題切換函數
function setTheme(isDark: boolean) {
  const root = document.documentElement;
  const themeName = isDark ? 'dark' : 'light';
  
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
  
  // 保存主題設定
  theme.set(themeName);
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
  const { t } = useLanguage();
  const [isDark, setIsDark] = useState(initialIsDark);
  // 初始化側邊欄狀態：從 cookie 讀取，首次訪問桌面版默認展開
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    // 只在桌面版時從 cookie 讀取狀態
    if (window.innerWidth >= 768) {
      return sidebarStateCookie.getState();
    }
    // 手機版默認收縮
    return false;
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 強制應用正確的主題，確保與存儲同步
    const effectiveTheme = theme.getEffectiveTheme();
    const shouldUseDark = effectiveTheme === 'dark';
    
    // 強制設定主題，確保與 DOM 同步
    setTheme(shouldUseDark);
    setIsDark(shouldUseDark);
    
    // 初始化滑動提示狀態
    const hasUsedSwipe = swipeHintCookie.hasBeenUsed();
    setShowSwipeHint(!hasUsedSwipe);
    setIsInitialized(true);
    
    // 如果顯示滑動提示，4秒後自動隱藏
    if (!hasUsedSwipe) {
      const timer = setTimeout(() => {
        setShowSwipeHint(false);
        swipeHintCookie.markAsUsed();
      }, 4000);
      
      return () => clearTimeout(timer);
    }
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

  // 監聽視窗大小變化
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      const wasMobile = isMobile;
      setIsMobile(mobile);
      
      // 當從手機版切換到桌面版時
      if (wasMobile && !mobile) {
        // 關閉手機版側邊欄
        setIsMobileSidebarOpen(false);
        // 從 cookie 讀取桌面版側邊欄狀態
        setIsSidebarCollapsed(sidebarStateCookie.getState());
      }
      // 當從桌面版切換到手機版時，不需要特殊處理
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, isMobileSidebarOpen]);

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

  // 統一的側邊欄切換函數，根據設備類型選擇正確的行為
  const handleSidebarToggle = () => {
    if (isMobile) {
      toggleMobileSidebar();
    } else {
      toggleSidebar();
    }
  };

  // 滑動手勢處理 - 只在手機版且側邊欄關閉時啟用
  const { ref: swipeRef, forceReinit: forceSwipeReinit } = useSwipeGesture({
    onSwipeRight: () => {
      if (isMobile && !isMobileSidebarOpen) {
        setIsMobileSidebarOpen(true);
        // 標記用戶已使用滑動功能並保存到 cookie
        swipeHintCookie.markAsUsed();
        setShowSwipeHint(false);
      }
    },
    onSwipeLeft: () => {
      if (isMobile && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    },
    enabled: isMobile,
    swipeZone: 'full', // 改為全屏檢測滑動
    threshold: 20, // 進一步降低滑動距離要求（從30降到20）
    restraint: 200, // 允許更多垂直偏移（從150增加到200）
    allowedTime: 800 // 增加允許的滑動時間（從600增加到800）
  });

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      {/* 動態文檔標題和元數據 */}
      <DocumentHead />
      
      <Routes>
        {/* 登入和註冊頁面使用獨立佈局 */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* 其他頁面使用主要佈局 */}
        <Route 
          path="*" 
          element={
            <div className="app-layout">
              {/* 左側邊欄 - 固定定位 */}
              <aside className={`
                sidebar-container 
                ${isSidebarCollapsed ? 'collapsed' : ''} 
                ${isMobileSidebarOpen ? 'mobile-open' : ''}
              `}>
                <AppSidebar 
                  isCollapsed={isSidebarCollapsed}
                  onToggle={handleSidebarToggle}
                  isMobileOpen={isMobileSidebarOpen}
                  onMobileToggle={toggleMobileSidebar}
                />
              </aside>
              
              {/* 手機版遮罩 */}
              {isMobileSidebarOpen && (
                <div 
                  className="md:hidden fixed inset-0 z-[45] bg-black/50"
                  onClick={() => setIsMobileSidebarOpen(false)}
                />
              )}
              
              {/* 主要內容區域 */}
              <div 
                ref={swipeRef}
                className={`main-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
              >
                {/* 手機版透明滾動方向動畫指示器 */}
                {isInitialized && isMobile && !isMobileSidebarOpen && showSwipeHint && (
                  <div className="fixed inset-0 z-30 pointer-events-none">
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
                
                {/* 頂部 Header - sticky */}
                <Header 
                  onToggleSidebar={handleSidebarToggle}
                  isSidebarCollapsed={isSidebarCollapsed}
                />
                
                {/* 頁面內容 */}
                <main className="content-area">
                  <RouteMonitor 
                    isMobile={isMobile}
                    isMobileSidebarOpen={isMobileSidebarOpen}
                    forceSwipeReinit={forceSwipeReinit}
                  />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/settings" element={<UserSettings />} />
                    <Route path="/avatar-demo" element={<AvatarDemo />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/lecturer-demo" element={<LecturerDemo />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                
                {/* Footer */}
                <Footer />
              </div>
            </div>
          } 
        />
      </Routes>
    </BrowserRouter>
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
        <PWAProvider>
          <LanguageProvider>
            <AuthProvider>
              <AppContent />
              <Toaster />
              <Sonner />
              <CookieConsent />
              <DevModeIndicator />
              <PWAPromptTrigger />
            </AuthProvider>
          </LanguageProvider>
        </PWAProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
