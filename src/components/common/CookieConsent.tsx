import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, Info, Shield, Settings, BarChart3 } from 'lucide-react';
import { swipeHintCookie } from '@/lib/cookies';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    console.log('CookieConsent: 組件初始化，當前語言:', language);
    
    // 檢查是否已經同意過 cookies
    const hasConsented = localStorage.getItem('cookieConsent');
    if (hasConsented) {
      console.log('CookieConsent: 用戶已同意 Cookie，不顯示彈窗');
      return;
    }

    // 檢查是否為手機版
    const isMobile = window.innerWidth < 768;
    
    // 確保語言上下文已經初始化
    // 通過檢查翻譯函數是否返回正確的值來判斷
    const checkLanguageInitialized = () => {
      const testTranslation = t('cookie.title');
      console.log('CookieConsent: 測試翻譯結果:', testTranslation, '語言:', language);
      // 如果翻譯返回的不是 key 本身，說明語言已經初始化
      return testTranslation !== 'cookie.title' && testTranslation.length > 0;
    };

    // 檢查滑動提示是否已經關閉（只在手機版檢查）
    const checkSwipeHintClosed = () => {
      if (!isMobile) {
        // 桌面版不需要等待滑動提示
        return true;
      }
      // 手機版需要等待滑動提示關閉
      return swipeHintCookie.hasBeenUsed();
    };

    // 等待語言初始化和滑動提示關閉
    const waitForConditions = () => {
      const languageReady = checkLanguageInitialized();
      const swipeHintClosed = checkSwipeHintClosed();
      
      console.log('CookieConsent: 條件檢查 - 語言準備:', languageReady, '滑動提示已關閉:', swipeHintClosed, '是否手機版:', isMobile);
      
      if (languageReady && swipeHintClosed) {
        console.log('CookieConsent: 所有條件滿足，準備顯示彈窗');
        // 所有條件都滿足，延遲顯示 Cookie 同意
        setTimeout(() => {
          console.log('CookieConsent: 顯示 Cookie 彈窗，語言:', language);
          setIsVisible(true);
        }, 1000);
      } else {
        console.log('CookieConsent: 條件未滿足，繼續等待...');
        // 條件未滿足，繼續等待
        setTimeout(waitForConditions, 100);
      }
    };

    // 開始等待條件滿足
    waitForConditions();
  }, [t, language]);

  const handleAccept = () => {
    console.log('CookieConsent: 用戶接受 Cookie');
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
    setShowDetails(false);
  };

  const handleDecline = () => {
    console.log('CookieConsent: 用戶拒絕 Cookie');
    localStorage.setItem('cookieConsent', 'declined');
    setIsVisible(false);
    setShowDetails(false);
  };

  const handleClose = () => {
    console.log('CookieConsent: 用戶關閉 Cookie 彈窗');
    setIsVisible(false);
    setShowDetails(false);
  };

  const handleLearnMore = () => {
    setShowDetails(true);
  };

  const handleBackToConsent = () => {
    setShowDetails(false);
  };

  if (!isVisible) return null;

  // 在渲染時也記錄當前語言和翻譯
  console.log('CookieConsent: 渲染彈窗，語言:', language, '標題翻譯:', t('cookie.title'));

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-[100000]">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 relative animate-slide-up overflow-hidden">
        {/* 關閉按鈕 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {!showDetails ? (
          // 主要同意界面
          <div className="p-6">
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
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleAccept}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                {t('cookie.accept')}
              </Button>
              <div className="flex gap-3">
                <Button
                  onClick={handleLearnMore}
                  variant="outline"
                  className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
                >
                  <Info className="h-4 w-4 mr-2" />
                  {t('cookie.learnMore')}
                </Button>
                <Button
                  onClick={handleDecline}
                  variant="outline"
                  className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
                >
                  {t('cookie.decline')}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // 詳細政策界面
          <div className="max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              {/* 標題 */}
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pr-8">
                {t('cookie.policy.title')}
              </h3>

              {/* 介紹 */}
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                {t('cookie.policy.intro')}
              </p>

              {/* Cookie 類型 */}
              <div className="space-y-4 mb-6">
                {/* 必要 Cookie */}
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                      {t('cookie.policy.essential.title')}
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      {t('cookie.policy.essential.desc')}
                    </p>
                  </div>
                </div>

                {/* 功能性 Cookie */}
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Settings className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-900 dark:text-green-100 text-sm">
                      {t('cookie.policy.functional.title')}
                    </h4>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      {t('cookie.policy.functional.desc')}
                    </p>
                  </div>
                </div>

                {/* 分析 Cookie */}
                <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 text-sm">
                      {t('cookie.policy.analytics.title')}
                    </h4>
                    <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                      {t('cookie.policy.analytics.desc')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cookie 類型列表 */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
                  {t('cookie.policy.types')}
                </h4>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                  <p>{t('cookie.policy.type1')}</p>
                  <p>{t('cookie.policy.type2')}</p>
                  <p>{t('cookie.policy.type3')}</p>
                  <p>{t('cookie.policy.type4')}</p>
                </div>
              </div>

              {/* 保存期限 */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                  {t('cookie.policy.retention')}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {t('cookie.policy.retention.desc')}
                </p>
              </div>

              {/* 用戶控制 */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                  {t('cookie.policy.control')}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {t('cookie.policy.control.desc')}
                </p>
              </div>

              {/* 聯繫信息 */}
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                {t('cookie.policy.contact')}
              </p>

              {/* 按鈕 */}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleAccept}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {t('cookie.accept')}
                </Button>
                <div className="flex gap-3">
                  <Button
                    onClick={handleBackToConsent}
                    variant="outline"
                    className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
                  >
                    {t('cookie.close')}
                  </Button>
                  <Button
                    onClick={handleDecline}
                    variant="outline"
                    className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
                  >
                    {t('cookie.decline')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 