import React, { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { GooglePlayIcon, PLAY_STORE_URL } from '@/components/common/PlayStoreDownloadButton';

const DISMISSED_UNTIL_KEY = 'pwaInstallPromptDismissedUntil';
const DISMISS_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
// 已經被帶去 Play Store 的用戶，短期內不用再提醒
const DISMISS_AFTER_ACTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
// Android 沒有 beforeinstallprompt 這種觸發點（我們直接推薦上架的 App），
// 稍微延遲再出現，避免一進站就打斷閱讀
const ANDROID_PROMPT_DELAY_MS = 2500;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    __pwaDeferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  // iOS Safari
  (window.navigator as unknown as { standalone?: boolean }).standalone === true;

// 已經在 TWA（即 Play Store 上架的 App）裡面就不要再推薦下載
const isTwa = () => document.referrer.startsWith('android-app://');

const isAndroid = () => /android/i.test(navigator.userAgent);

const wasDismissed = () => {
  try {
    const raw = localStorage.getItem(DISMISSED_UNTIL_KEY);
    if (!raw) return false;
    const until = Number(raw);
    if (!Number.isFinite(until)) return false;
    if (Date.now() >= until) {
      localStorage.removeItem(DISMISSED_UNTIL_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

const rememberDismissal = (durationMs: number) => {
  try {
    localStorage.setItem(DISMISSED_UNTIL_KEY, String(Date.now() + durationMs));
  } catch {
    // ignore storage errors (e.g. private mode)
  }
};

export const PWAInstallPrompt: React.FC = () => {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  // Android 一律改推 Play Store 上的原生 App，體驗比加到主畫面的 PWA 好
  const [android] = useState(() =>
    typeof window !== 'undefined' ? isAndroid() && !isTwa() : false,
  );

  useEffect(() => {
    if (isStandalone() || isTwa() || wasDismissed()) return;

    if (android) {
      const timer = window.setTimeout(() => setVisible(true), ANDROID_PROMPT_DELAY_MS);
      return () => window.clearTimeout(timer);
    }

    if (window.__pwaDeferredPrompt) {
      setVisible(true);
    }

    const onInstallable = () => setVisible(true);
    const onInstalled = () => setVisible(false);

    window.addEventListener('pwainstallable', onInstallable);
    window.addEventListener('pwainstalled', onInstalled);
    return () => {
      window.removeEventListener('pwainstallable', onInstallable);
      window.removeEventListener('pwainstalled', onInstalled);
    };
  }, [android]);

  const handleInstall = useCallback(async () => {
    if (android) {
      // 直接前往 Play Store 下載已上架的 Android App
      window.open(PLAY_STORE_URL, '_blank', 'noopener,noreferrer');
      rememberDismissal(DISMISS_AFTER_ACTION_MS);
      setVisible(false);
      return;
    }

    const deferred = window.__pwaDeferredPrompt;
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      window.__pwaDeferredPrompt = null;
      if (choice.outcome === 'accepted') {
        setVisible(false);
      }
    } catch {
      // If prompt() throws (e.g. already used), just hide.
      window.__pwaDeferredPrompt = null;
      setVisible(false);
    }
  }, [android]);

  const handleDismiss = useCallback(() => {
    rememberDismissal(DISMISS_DURATION_MS);
    setVisible(false);
  }, []);

  if (!visible) return null;

  const title = android ? t('pwa.install.androidTitle') : t('pwa.install.title');
  const description = android
    ? t('pwa.install.androidDescription')
    : t('pwa.install.description');

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={title}
      className="fixed inset-x-3 bottom-3 z-[60] sm:inset-x-0 sm:bottom-4 sm:mx-auto sm:w-fit sm:max-w-md"
    >
      {/* 手機：文字一行、按鈕另一行，標題才不會被擠到截斷；sm 以上維持單行排版 */}
      <div className="relative flex flex-col gap-2.5 rounded-2xl border border-border bg-white/95 dark:bg-zinc-900/95 backdrop-blur shadow-xl ring-1 ring-black/5 dark:ring-white/10 px-3 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 h-11 w-11 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center overflow-hidden">
            <img
              src="/web-app-manifest-192x192.png"
              alt=""
              aria-hidden="true"
              className="h-9 w-9 object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={handleDismiss}
            className="text-xs sm:text-sm px-2.5 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors whitespace-nowrap"
          >
            {t('pwa.install.notNow')}
          </button>
          {android ? (
            <button
              type="button"
              onClick={handleInstall}
              aria-label={t('pwa.install.getOnGooglePlay')}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 rounded-md font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 transition-colors whitespace-nowrap shadow-sm"
            >
              <GooglePlayIcon className="h-4 w-4 flex-shrink-0" />
              Google Play
            </button>
          ) : (
            <button
              type="button"
              onClick={handleInstall}
              className="text-xs sm:text-sm px-3 py-1.5 rounded-md font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors whitespace-nowrap shadow-sm"
            >
              {t('pwa.install.install')}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={t('pwa.install.dismiss')}
          className="sm:hidden absolute -top-2 -right-2 h-6 w-6 rounded-full bg-zinc-800 text-white flex items-center justify-center shadow-md"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
