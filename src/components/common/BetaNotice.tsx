import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const BETA_NOTICE_EXPANDED_KEY = 'betaNoticeExpanded';

export const BetaNotice: React.FC = () => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      return localStorage.getItem(BETA_NOTICE_EXPANDED_KEY) !== 'false';
    } catch {
      return true;
    }
  });

  const toggleExpanded = () => {
    setIsExpanded(prev => {
      const next = !prev;
      try {
        localStorage.setItem(BETA_NOTICE_EXPANDED_KEY, String(next));
      } catch {
        // Ignore storage errors (e.g. private mode)
      }
      return next;
    });
  };

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
                <span className="mx-2 text-amber-600 dark:text-amber-400">·</span>
                <span className="font-normal text-amber-700 dark:text-amber-300">
                  {t('beta.notice.spreadsheetPrompt')}{' '}
                  <a
                    href="https://docs.google.com/spreadsheets/d/1PU1l6cZNeSbuSS880MRxl48gNmW3ds5ysWzk3Zmsv-0/edit?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-amber-200/70 dark:bg-amber-700/40 px-1.5 py-0.5 font-semibold text-amber-900 dark:text-amber-100 underline decoration-amber-700/60 dark:decoration-amber-300/60 underline-offset-2 ring-1 ring-amber-400/60 dark:ring-amber-500/40 hover:bg-amber-300/80 dark:hover:bg-amber-600/50 hover:ring-amber-500 transition-colors"
                  >
                    {t('beta.notice.spreadsheetLinkText')}
                    <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                  </a>
                  {t('beta.notice.spreadsheetSuffix')}
                </span>
              </p>
              {isExpanded && (
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                  {t('beta.notice.message')}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={toggleExpanded}
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