import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, PartyPopper, RotateCcw } from 'lucide-react';

import { useLanguage } from '@/hooks/useLanguage';
import { DocumentHead } from '@/components/common/DocumentHead';
import { ShareButton } from '@/components/common/ShareButton';
import {
  GettingStartedGuide,
  GETTING_STARTED_STEP_COUNT,
} from '@/components/common/GettingStartedGuide';
import { Button } from '@/components/ui/button';
import { gettingStartedCookie } from '@/lib/cookies';

/**
 * The permanent home of the tour. Reaching this page counts as having seen the
 * guide, so the first-visit modal stops asking.
 */
export default function GettingStarted() {
  const { t } = useLanguage();
  const [finished, setFinished] = useState(false);
  // Bumping this remounts the guide, so "play again" really starts from step 1.
  const [runId, setRunId] = useState(0);

  const doneRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gettingStartedCookie.markAsSeen();
  }, []);

  // The closing card renders below the guide; bring it into view so finishing
  // the tour feels like an arrival rather than nothing happening.
  useEffect(() => {
    if (!finished) return;
    doneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [finished]);

  return (
    <div className="min-h-screen bg-background">
      <DocumentHead
        title={`${t('gettingStarted.title')} \u00b7 LingUBible`}
        description={t('gettingStarted.subtitle')}
      />

      <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <header className="mb-6">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <Compass className="h-7 w-7 shrink-0 text-primary" />
            <h1 className="text-2xl font-bold sm:text-3xl">{t('gettingStarted.title')}</h1>
            <ShareButton
              title={`${t('gettingStarted.title')} · LingUBible`}
              description={t('gettingStarted.subtitle')}
              text={t('share.text.gettingStarted')}
              hashtags={['LingUBible', 'LingnanU']}
            />
          </div>
          <p className="mt-2 text-center text-sm text-muted-foreground sm:text-left">
            {t('gettingStarted.subtitle')}
          </p>
          <p className="mt-1 text-center text-xs text-muted-foreground sm:text-left">
            {t('gettingStarted.meta', { total: GETTING_STARTED_STEP_COUNT })}
          </p>
        </header>

        <section className="rounded-xl border border-gray-200 bg-card/60 p-4 dark:border-zinc-700 sm:p-6">
          <GettingStartedGuide key={runId} variant="page" onFinish={() => setFinished(true)} />
        </section>

        {finished && (
          <section ref={doneRef} className="mt-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 text-center">
              <PartyPopper className="mx-auto h-8 w-8 text-primary" />
              <h2 className="mt-2 text-lg font-bold">{t('gettingStarted.done.title')}</h2>
              <p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">
                {t('gettingStarted.done.desc')}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button
                  asChild
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md hover:from-red-600 hover:to-red-700"
                >
                  <Link to="/courses">{t('gettingStarted.done.browse')}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/faq">{t('gettingStarted.done.faq')}</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFinished(false);
                    setRunId((n) => n + 1);
                  }}
                  className="gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t('gettingStarted.done.replay')}
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
