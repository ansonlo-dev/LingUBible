import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const BETA_NOTICE_DISMISSED_KEY = 'beta-notice-dismissed';

export const BetaNotice: React.FC = () => {
  const { t } = useLanguage();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 檢查用戶是否已經關閉過通知
    const dismissed = localStorage.getItem(BETA_NOTICE_DISMISSED_KEY);
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  // 開發者工具：重置測試版通知（按 Ctrl/Cmd + Shift + B）
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'B') {
        event.preventDefault();
        localStorage.removeItem(BETA_NOTICE_DISMISSED_KEY);
        setIsDismissed(false);
        console.log('🔄 測試版通知已重置');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(BETA_NOTICE_DISMISSED_KEY, 'true');
  };

  // 如果已被關閉，不顯示通知
  if (isDismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-amber-200 dark:border-amber-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between py-3 gap-3">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                <span className="font-semibold">{t('beta.notice.title')}</span>
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
                {t('beta.notice.message')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-800/30 hover:bg-amber-200 dark:hover:bg-amber-700/40 rounded-md transition-colors duration-200"
            >
              {t('beta.notice.dismiss')}
            </button>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors duration-200 rounded-md hover:bg-amber-100 dark:hover:bg-amber-800/30"
              aria-label="關閉通知"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 