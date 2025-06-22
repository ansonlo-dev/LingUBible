import { AlertTriangle, Settings, Mail, Lock } from 'lucide-react';
import { DEV_MODE } from '@/config/devMode';
import { useLanguage } from '@/hooks/useLanguage';

export function DevModeIndicator() {
  const { t } = useLanguage();

  if (!DEV_MODE.enabled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 shadow-lg">
        <div className="flex items-start space-x-2">
          <Settings className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              🔧 開發模式已啟用
            </div>
            <div className="space-y-1 text-yellow-700 dark:text-yellow-300">
              <div className="flex items-center space-x-2">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="text-xs sm:text-sm">任何郵件域名可註冊</span>
              </div>
              {DEV_MODE.bypassPassword && (
                <div className="flex items-center space-x-2">
                  <Lock className="h-3 w-3 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">密碼強度檢查已繞過</span>
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 flex items-center space-x-1">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              <span>生產環境請關閉</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 