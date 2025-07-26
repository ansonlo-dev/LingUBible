import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export const BetaNotice: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-amber-200 dark:border-amber-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start py-3 gap-3">
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
        </div>
      </div>
    </div>
  );
}; 