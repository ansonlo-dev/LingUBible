import React, { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const DISMISSED_UNTIL_KEY = 'pwaInstallPromptDismissedUntil';
const DISMISS_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

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

export const PWAInstallPrompt: React.FC = () => {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || wasDismissed()) return;

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
  }, []);

  const handleInstall = useCallback(async () => {
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
  }, []);

  const handleDismiss = useCallback(() => {
    try {
      localStorage.setItem(
        DISMISSED_UNTIL_KEY,
        String(Date.now() + DISMISS_DURATION_MS),
      );
    } catch {
      // ignore storage errors (e.g. private mode)
    }
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t('pwa.install.title')}
      className="fixed inset-x-3 bottom-3 z-[60] sm:inset-x-0 sm:bottom-4 sm:mx-auto sm:w-fit sm:max-w-md"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-white/95 dark:bg-zinc-900/95 backdrop-blur shadow-xl ring-1 ring-black/5 dark:ring-white/10 px-3 py-3 sm:px-4">
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
          <p className="text-sm font-semibold text-foreground truncate">
            {t('pwa.install.title')}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {t('pwa.install.description')}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={handleDismiss}
            className="text-xs sm:text-sm px-2.5 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors whitespace-nowrap"
          >
            {t('pwa.install.notNow')}
          </button>
          <button
            type="button"
            onClick={handleInstall}
            className="text-xs sm:text-sm px-3 py-1.5 rounded-md font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors whitespace-nowrap shadow-sm"
          >
            {t('pwa.install.install')}
          </button>
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
