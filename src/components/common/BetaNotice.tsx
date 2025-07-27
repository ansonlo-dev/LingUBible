import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export const BetaNotice: React.FC = () => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-amber-200 dark:border-amber-800">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="flex items-start py-3 gap-3">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                <span className="font-semibold">{t('beta.notice.title')}</span>
              </p>
              {isExpanded && (
                <div className="mt-1 space-y-2">
                  <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                    {t('beta.notice.message')}
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                    {t('beta.notice.oldReviews.prefix')}{' '}
                    <a 
                      href="https://drive.google.com/drive/folders/1K9DNhe7nTz3C7KDBnoeg03CMSxNY6YDv?usp=drive_link"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-extrabold text-amber-900 dark:text-amber-100 bg-amber-200 dark:bg-amber-800 px-3 py-1.5 rounded-lg underline hover:bg-amber-300 dark:hover:bg-amber-700 hover:text-amber-950 dark:hover:text-amber-50 transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                    >
                      {t('beta.notice.oldReviews.linkText')}
                    </a>{' '}
                    {t('beta.notice.oldReviews.suffix')}
                  </p>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 p-1 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            aria-label={isExpanded ? t('beta.notice.collapse') : t('beta.notice.expand')}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}; 