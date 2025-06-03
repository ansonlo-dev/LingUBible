import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { X } from 'lucide-react';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    // 檢查是否已經同意過 cookies
    const hasConsented = localStorage.getItem('cookieConsent');
    if (!hasConsented) {
      // 延遲顯示，讓頁面先載入
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-[100000]">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 relative animate-slide-up">
        {/* 關閉按鈕 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Cookie 圖標 */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            {/* Cookie 主體 */}
            <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full relative overflow-hidden shadow-lg">
              {/* Cookie 缺口 */}
              <div className="absolute top-2 right-1 w-6 h-6 bg-white dark:bg-gray-900 rounded-full"></div>
              
              {/* 巧克力豆 */}
              <div className="absolute top-3 left-3 w-2 h-2 bg-gray-700 rounded-full"></div>
              <div className="absolute top-6 left-6 w-1.5 h-1.5 bg-gray-600 rounded-full"></div>
              <div className="absolute top-8 left-4 w-2 h-2 bg-gray-800 rounded-full"></div>
              <div className="absolute top-10 left-8 w-1.5 h-1.5 bg-gray-700 rounded-full"></div>
              <div className="absolute top-5 left-9 w-1 h-1 bg-gray-600 rounded-full"></div>
            </div>
            
            {/* 飛出的碎屑 */}
            <div className="absolute -top-1 -right-1 w-1 h-1 bg-red-300 rounded-full animate-bounce"></div>
            <div className="absolute -top-2 right-2 w-0.5 h-0.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="absolute top-0 right-4 w-1 h-1 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>

        {/* 標題 */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">
          {t('cookie.title')}
        </h3>

        {/* 描述 */}
        <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6 leading-relaxed">
          {t('cookie.description')}
        </p>

        {/* 按鈕 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleAccept}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            {t('cookie.accept')}
          </Button>
          <Button
            onClick={handleDecline}
            variant="outline"
            className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
          >
            {t('cookie.learnMore')}
          </Button>
        </div>
      </div>
    </div>
  );
} 