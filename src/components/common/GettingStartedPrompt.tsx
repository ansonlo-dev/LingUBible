import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, ExternalLink } from 'lucide-react';

import { useLanguage } from '@/hooks/useLanguage';
import { GettingStartedGuide } from '@/components/common/GettingStartedGuide';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { gettingStartedCookie } from '@/lib/cookies';
import { cn } from '@/lib/utils';

/**
 * First-visit tour. Opens once, then never again: closing it in *any* way
 * (button, ✕, Esc, backdrop) writes the cookie, because a reader who dismissed
 * the guide has made their choice just as clearly as one who finished it.
 *
 * Routes where a modal would be actively unhelpful — the guide's own page, and
 * the auth flow, where people are mid-task — are skipped.
 */

/** Paths that must never be interrupted by the tour. */
const SUPPRESSED_PREFIXES = [
  '/guide',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/oauth',
];

export function GettingStartedPrompt() {
  const { t, language } = useLanguage();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (gettingStartedCookie.hasBeenSeen()) return;
    if (SUPPRESSED_PREFIXES.some((p) => location.pathname.startsWith(p))) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    let attempts = 0;
    const maxAttempts = 60; // ~30s, then give up for this visit

    // Four things must settle first, or the tour lands on top of them: the
    // translations (an untranslated modal is worse than none), the cookie
    // banner, the install prompt, and any confirmation the page itself is
    // asking for (e.g. the planner's "add this shared timetable?" dialog on a
    // shared link). Two overlays at once is the classic first-visit mess.
    const ready = () => {
      const translated = t('gettingStarted.title') !== 'gettingStarted.title';
      const consentHandled = Boolean(localStorage.getItem('cookieConsent'));
      const installPromptGone = !document.querySelector('[data-install-prompt]');
      const noBlockingDialog = !document.querySelector('[role="alertdialog"]');
      return translated && consentHandled && installPromptGone && noBlockingDialog;
    };

    const wait = () => {
      attempts += 1;
      if (attempts > maxAttempts) return;
      if (ready()) {
        timeoutId = setTimeout(() => setOpen(true), 600);
      } else {
        timeoutId = setTimeout(wait, 500);
      }
    };

    wait();
    return () => clearTimeout(timeoutId);
  }, [t, language, location.pathname]);

  const dismiss = () => {
    gettingStartedCookie.markAsSeen();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : dismiss())}>
      <DialogContent
        className={cn(
          'flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0',
          'rounded-xl border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 sm:rounded-xl'
        )}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="border-b border-gray-200 dark:border-zinc-700 px-4 py-3 pr-12 sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-base font-bold sm:text-lg">
            <Compass className="h-5 w-5 shrink-0 text-primary" />
            {t('gettingStarted.title')}
          </DialogTitle>
          <DialogDescription className="mt-0.5 text-xs sm:text-sm">
            {t('gettingStarted.subtitle')}
          </DialogDescription>
        </div>

        <div data-guide-scroll className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <GettingStartedGuide
            variant="dialog"
            onFinish={dismiss}
            onNavigate={dismiss}
            footerSlot={
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                <button
                  type="button"
                  onClick={dismiss}
                  className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  {t('gettingStarted.later')}
                </button>
                <Link
                  to="/guide"
                  onClick={dismiss}
                  className="inline-flex items-center gap-1 text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  {t('gettingStarted.openFullPage')}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            }
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
