import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from '@/components/UserMenu';
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
  // const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(initialIsDark);

  useEffect(() => {
    // 強制應用正確的主題，確保與存儲同步
    const effectiveTheme = theme.getEffectiveTheme();
    const shouldUseDark = effectiveTheme === 'dark';
    
    // 強制設定主題，確保與 DOM 同步
    setTheme(shouldUseDark);
    setIsDark(shouldUseDark);
    
    // Loading screen - 已移除
    // const timer = setTimeout(() => setLoading(false), 500);
    // return () => clearTimeout(timer);
  }, []);

  // 移除載入畫面檢查
  // if (loading) {
  //   return (
  //     <div className={`fixed inset-0 z-50 flex items-center justify-center ${isDark ? 'bg-black text-white' : 'bg-white text-black'}`}>
  //       <div className={`animate-spin rounded-full h-16 w-16 border-4 ${isDark ? 'border-gray-700 border-t-red-400' : 'border-gray-200 border-t-primary'}`}></div>
  //     </div>
  //   );
  // }

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
              <SidebarProvider>
                <div className="min-h-screen flex w-full bg-background">
                  <AppSidebar />
                  {/* Desktop sidebar trigger */}
                  <SidebarTrigger className="hidden md:block" />
                  <SidebarInset className="flex flex-col bg-background">
                    <Header />
                    <main className="flex-1 bg-background">
                      <Routes>
                        <Route path="/" element={<Index />} />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                    <Footer />
                  </SidebarInset>
                </div>
              </SidebarProvider>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);
};

export default App;
