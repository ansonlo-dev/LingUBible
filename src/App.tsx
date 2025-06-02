import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { useState, useEffect } from 'react';
import { theme } from '@/lib/utils';

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

const App = () => {
  const [isDark, setIsDark] = useState(initialIsDark);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    // 強制應用正確的主題，確保與存儲同步
    const effectiveTheme = theme.getEffectiveTheme();
    const shouldUseDark = effectiveTheme === 'dark';
    
    // 強制設定主題，確保與 DOM 同步
    setTheme(shouldUseDark);
    setIsDark(shouldUseDark);
  }, []);

  // 監聽視窗大小變化
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // 當從手機版切換到桌面版時，關閉手機版側邊欄
      if (!mobile && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
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

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <Routes>
              {/* 登入頁面使用獨立佈局 */}
              <Route path="/login" element={<Login />} />
              
              {/* 其他頁面使用主要佈局 */}
              <Route path="/*" element={
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
                      className="md:hidden fixed inset-0 z-20 bg-black/50"
                      onClick={() => setIsMobileSidebarOpen(false)}
                    />
                  )}
                  
                  {/* 主要內容區域 */}
                  <div className={`main-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                    {/* 頂部 Header - sticky */}
                    <Header 
                      onToggleSidebar={handleSidebarToggle}
                      isSidebarCollapsed={isSidebarCollapsed}
                    />
                    
                    {/* 頁面內容 */}
                    <main className="content-area">
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                    
                    {/* Footer */}
                    <Footer />
                  </div>
                </div>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
