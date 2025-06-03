import { Code, AlertTriangle } from 'lucide-react';
import { studentVerificationService } from '@/services/studentVerificationService';

export function DevelopmentBanner() {
  const isDevelopmentMode = studentVerificationService.isDevelopmentMode();

  if (!isDevelopmentMode) {
    return null;
  }

  return (
    <div className="bg-orange-100 dark:bg-orange-900/30 border-b border-orange-200 dark:border-orange-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-2 text-sm">
          <div className="flex items-center space-x-2 text-orange-700 dark:text-orange-300">
            <Code className="h-4 w-4" />
            <span className="font-medium">開發模式</span>
            <span>•</span>
            <span>郵件驗證功能使用模擬模式</span>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-xs">請設定 VITE_RESEND_API_KEY 以啟用實際郵件發送</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 