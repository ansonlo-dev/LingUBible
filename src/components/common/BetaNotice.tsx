import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ExternalLink, X } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const BETA_NOTICE_STATE_KEY = 'betaNoticeState';
const LEGACY_EXPANDED_KEY = 'betaNoticeExpanded';

// Three states:
//  - 'expanded'  : full banner with the detail message
//  - 'collapsed' : single-line banner (header only) — the chevron toggle
//  - 'hidden'    : banner fully dismissed; replaced by a tiny floating pill
//                  so the user can always bring it back with one click.
type BetaNoticeState = 'expanded' | 'collapsed' | 'hidden';

const readInitialState = (): BetaNoticeState => {
  try {
    const stored = localStorage.getItem(BETA_NOTICE_STATE_KEY);
    if (stored === 'expanded' || stored === 'collapsed' || stored === 'hidden') {
      return stored;
    }
    // Migrate from the old boolean-style key.
    if (localStorage.getItem(LEGACY_EXPANDED_KEY) === 'false') {
      return 'collapsed';
    }
  } catch {
    // Ignore storage errors (e.g. private mode)
  }
  return 'expanded';
};

export const BetaNotice: React.FC = () => {
  const { t } = useLanguage();
  const [state, setState] = useState<BetaNoticeState>(readInitialState);

  const update = (next: BetaNoticeState) => {
    setState(next);
    try {
      localStorage.setItem(BETA_NOTICE_STATE_KEY, next);
    } catch {
      // Ignore storage errors (e.g. private mode)
    }
  };

  const isExpanded = state === 'expanded';

  // Hidden state: render only a compact floating pill. It occupies almost no
  // screen space but stays clearly labelled ("WIP") so it's obvious how to
  // restore the full notice.
  if (state === 'hidden') {
    return (
      <button
        onClick={() => update('expanded')}
        aria-label={t('beta.notice.show')}
        title={t('beta.notice.show')}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 rounded-full border border-amber-300 dark:border-amber-700 bg-amber-100/95 dark:bg-amber-900/90 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-200 shadow-lg backdrop-blur transition-colors hover:bg-amber-200 dark:hover:bg-amber-800"
      >
        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
        {t('beta.notice.title')}
      </button>
    );
  }

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
          <div className="flex-shrink-0 flex items-center gap-0.5">
            <button
              onClick={() => update(isExpanded ? 'collapsed' : 'expanded')}
              className="p-1 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
              aria-label={isExpanded ? t('beta.notice.collapse') : t('beta.notice.expand')}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => update('hidden')}
              className="p-1 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
              aria-label={t('beta.notice.hide')}
              title={t('beta.notice.hide')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
