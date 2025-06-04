import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { X } from 'lucide-react';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    console.log('CookieConsent: 組件初始化，當前語言:', language);
    
    // 檢查是否已經同意過 cookies
    const hasConsented = localStorage.getItem('cookieConsent');
    if (hasConsented) {
      console.log('CookieConsent: 用戶已同意 Cookie，不顯示彈窗');
      return;
    }

    // 確保語言上下文已經初始化
    // 通過檢查翻譯函數是否返回正確的值來判斷
    const checkLanguageInitialized = () => {
      const testTranslation = t('cookie.title');
      console.log('CookieConsent: 測試翻譯結果:', testTranslation, '語言:', language);
      // 如果翻譯返回的不是 key 本身，說明語言已經初始化
      return testTranslation !== 'cookie.title' && testTranslation.length > 0;
    };

    // 等待語言初始化完成
    const waitForLanguage = () => {
      if (checkLanguageInitialized()) {
        console.log('CookieConsent: 語言已初始化，準備顯示彈窗');
        // 語言已初始化，延遲顯示 Cookie 同意
        setTimeout(() => {
          console.log('CookieConsent: 顯示 Cookie 彈窗，語言:', language);
          setIsVisible(true);
        }, 1000);
      } else {
        console.log('CookieConsent: 語言還未初始化，繼續等待...');
        // 語言還沒初始化，繼續等待
        setTimeout(waitForLanguage, 100);
      }
    };

    // 開始等待語言初始化
    waitForLanguage();
  }, [t, language]);

  const handleAccept = () => {
    console.log('CookieConsent: 用戶接受 Cookie');
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    console.log('CookieConsent: 用戶拒絕 Cookie');
    localStorage.setItem('cookieConsent', 'declined');
    setIsVisible(false);
  };

  const handleClose = () => {
    console.log('CookieConsent: 用戶關閉 Cookie 彈窗');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  // 在渲染時也記錄當前語言和翻譯
  console.log('CookieConsent: 渲染彈窗，語言:', language, '標題翻譯:', t('cookie.title'));

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