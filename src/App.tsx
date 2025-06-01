import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from '@/components/UserMenu';
import { useState, useEffect } from 'react';

const queryClient = new QueryClient();

// 主題切換函數
function setTheme(isDark: boolean) {
  const root = document.documentElement;
  if (isDark) {
    root.classList.add('dark');
    document.body.style.backgroundColor = 'rgb(0, 0, 0)';
  } else {
    root.classList.remove('dark');
    document.body.style.backgroundColor = 'rgb(255, 255, 255)';
  }
}

const App = () => {
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // 取得使用者偏好
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    
    // 設定初始主題
    const shouldUseDark = savedTheme === 'dark' || (savedTheme === null && isDarkMode);
    setIsDark(shouldUseDark);
    setTheme(shouldUseDark);
    
    // Loading screen
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${isDark ? 'bg-black text-white' : 'bg-white text-black'}`}>
        <div className={`animate-spin rounded-full h-16 w-16 border-t-4 border-solid ${isDark ? 'border-primary' : 'border-primary'}`}></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="lingubible-ui-theme">
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
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
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
