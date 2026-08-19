import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarClock,
  CalendarRange,
  Calculator,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  MessagesSquare,
  PartyPopper,
  PenLine,
  Sparkles,
} from 'lucide-react';

import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  WelcomeVisual,
  ReviewsVisual,
  MaterialsVisual,
  PlannerVisual,
  GpaVisual,
  CalendarVisual,
  ContributeVisual,
} from '@/components/common/GettingStartedVisuals';

/**
 * The Getting Started tour. One component, two skins:
 *
 * - `variant="dialog"` — what first-time visitors meet, inside a modal.
 * - `variant="page"`   — the permanent copy at /guide.
 *
 * Keeping them the same component means the copy, the steps and the progress
 * behaviour can never drift apart between the two entry points.
 */

type StepId =
  | 'welcome'
  | 'reviews'
  | 'materials'
  | 'planner'
  | 'gpa'
  | 'calendar'
  | 'contribute';

interface StepLink {
  /** In-app route. */
  to: string;
  /** Translation key for the link label. */
  labelKey: string;
}

interface GuideStep {
  id: StepId;
  icon: React.ComponentType<{ className?: string }>;
  /** Short label for the progress pill — kept to one or two words. */
  pillKey: string;
  visual: React.ComponentType;
  links: StepLink[];
  /** How many bullet points this step has (`…​.p1` … `.pN`). */
  bullets: number;
}

const STEPS: GuideStep[] = [
  {
    id: 'welcome',
    icon: Sparkles,
    pillKey: 'gettingStarted.step.welcome.pill',
    visual: WelcomeVisual,
    links: [{ to: '/courses', labelKey: 'nav.courses' }],
    bullets: 3,
  },
  {
    id: 'reviews',
    icon: MessagesSquare,
    pillKey: 'gettingStarted.step.reviews.pill',
    visual: ReviewsVisual,
    links: [
      { to: '/courses', labelKey: 'nav.courses' },
      { to: '/instructors', labelKey: 'nav.lecturers' },
      { to: '/reviews', labelKey: 'nav.latestReviews' },
    ],
    bullets: 3,
  },
  {
    id: 'materials',
    icon: FileText,
    pillKey: 'gettingStarted.step.materials.pill',
    visual: MaterialsVisual,
    links: [{ to: '/courses', labelKey: 'nav.courses' }],
    bullets: 4,
  },
  {
    id: 'planner',
    icon: CalendarRange,
    pillKey: 'gettingStarted.step.planner.pill',
    visual: PlannerVisual,
    links: [{ to: '/planner', labelKey: 'nav.timetable' }],
    bullets: 3,
  },
  {
    id: 'gpa',
    icon: Calculator,
    pillKey: 'gettingStarted.step.gpa.pill',
    visual: GpaVisual,
    links: [{ to: '/gpa-hons', labelKey: 'nav.gpaHons' }],
    bullets: 3,
  },
  {
    id: 'calendar',
    icon: CalendarClock,
    pillKey: 'gettingStarted.step.calendar.pill',
    visual: CalendarVisual,
    links: [{ to: '/calendar', labelKey: 'nav.calendar' }],
    bullets: 3,
  },
  {
    id: 'contribute',
    icon: PenLine,
    pillKey: 'gettingStarted.step.contribute.pill',
    visual: ContributeVisual,
    links: [
      { to: '/write-review', labelKey: 'gettingStarted.link.writeReview' },
      { to: '/favorites', labelKey: 'sidebar.myFavorites' },
    ],
    bullets: 3,
  },
];

export const GETTING_STARTED_STEP_COUNT = STEPS.length;

// -----------------------------------------------------------------------------
// Progress indicator — same visual language as the review form's step bar
// -----------------------------------------------------------------------------

function StepProgress({
  current,
  visited,
  onSelect,
}: {
  current: number;
  visited: Set<number>;
  onSelect: (index: number) => void;
}) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Keep the active pill in view on narrow screens. Measured from the live
  // rects rather than `offsetLeft`, which is relative to the nearest positioned
  // ancestor and so goes wrong the moment the row is wrapped or centred.
  useEffect(() => {
    const container = containerRef.current;
    const pill = pillRefs.current[current];
    if (!container || !pill) return;
    const containerRect = container.getBoundingClientRect();
    const pillRect = pill.getBoundingClientRect();
    const PAD = 16; // breathing room so the pill never hugs the edge
    if (pillRect.left < containerRect.left + PAD) {
      container.scrollBy({ left: pillRect.left - containerRect.left - PAD, behavior: 'smooth' });
    } else if (pillRect.right > containerRect.right - PAD) {
      container.scrollBy({ left: pillRect.right - containerRect.right + PAD, behavior: 'smooth' });
    }
  }, [current]);

  const pct = ((current + 1) / STEPS.length) * 100;

  return (
    <div className="space-y-2">
      {/* Counters: how far in, and how much has actually been read */}
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          {t('gettingStarted.progress', { current: current + 1, total: STEPS.length })}
        </span>
        <span className="flex items-center gap-1 tabular-nums">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
          {t('gettingStarted.readCount', { read: visited.size, total: STEPS.length })}
        </span>
      </div>

      {/* Thin bar — the at-a-glance version for people who never look at pills */}
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={current + 1}
        aria-label={t('gettingStarted.title')}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Pills — every step is reachable; this is a guide, not a form */}
      <div ref={containerRef} className="flex overflow-x-auto scrollbar-hide py-2">
        {/* `mx-auto` centres the row when it fits and collapses to 0 when it
            doesn't. `justify-center` on the scroller would instead push the
            first pill into negative scroll space, where it can never be
            reached — which is exactly what it did before. */}
        <div className="mx-auto flex items-center px-1.5">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCurrent = index === current;
            const isRead = visited.has(index) && !isCurrent;
            return (
              <div key={step.id} className="flex flex-shrink-0 items-center">
                <button
                  type="button"
                  ref={(el) => {
                    pillRefs.current[index] = el;
                  }}
                  onClick={() => onSelect(index)}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={cn(
                    'group relative z-10 flex transform items-center justify-center rounded-full border-2 font-bold transition-all duration-300 hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none',
                    'px-2.5 py-1.5 text-[11px] min-w-[64px]',
                    'md:px-3 md:py-2 md:text-sm md:min-w-[84px]',
                    {
                      'bg-red-500 border-red-500 text-white shadow-lg ring-4 ring-red-500/20 dark:ring-red-500/30':
                        isCurrent,
                      'bg-red-500 border-red-500 text-white shadow-md hover:bg-red-600': isRead,
                      'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-muted-foreground hover:border-red-400':
                        !isCurrent && !isRead,
                    }
                  )}
                >
                  <span className="flex items-center gap-1 md:gap-2">
                    <span className="flex h-3 w-3 items-center justify-center md:h-4 md:w-4">
                      {isRead ? (
                        <Check className="h-3 w-3 stroke-[3] md:h-4 md:w-4" />
                      ) : (
                        <Icon className="h-3 w-3 stroke-2 md:h-4 md:w-4" />
                      )}
                    </span>
                    <span className="hidden truncate sm:inline">{t(step.pillKey)}</span>
                  </span>
                </button>

                {index < STEPS.length - 1 && (
                  <div className="relative mx-1.5 h-1 min-w-[12px] flex-1 md:mx-2 md:min-w-[12px]">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500 ease-out motion-reduce:transition-none',
                        visited.has(index) ? 'bg-red-500 dark:bg-red-600' : 'bg-gray-300 dark:bg-gray-600'
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Guide
// -----------------------------------------------------------------------------

interface GettingStartedGuideProps {
  variant?: 'page' | 'dialog';
  /** Fired when the reader reaches the end and taps the closing action. */
  onFinish?: () => void;
  /** Fired when a link inside the guide is followed (dialog closes itself). */
  onNavigate?: () => void;
  /** Rendered under the navigation row — e.g. "open the full page" in the modal. */
  footerSlot?: React.ReactNode;
  className?: string;
}

export function GettingStartedGuide({
  variant = 'page',
  onFinish,
  onNavigate,
  footerSlot,
  className,
}: GettingStartedGuideProps) {
  const { t } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));
  const contentRef = useRef<HTMLDivElement>(null);

  const step = STEPS[current];
  const isLast = current === STEPS.length - 1;

  const goTo = useCallback((index: number) => {
    const next = Math.min(Math.max(index, 0), STEPS.length - 1);
    setCurrent(next);
    setVisited((prev) => (prev.has(next) ? prev : new Set(prev).add(next)));
  }, []);

  // Arrow keys move between steps — cheap win for desktop readers. Ignored while
  // a text field has focus so it never fights with the rest of the app.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (e.key === 'ArrowRight') goTo(current + 1);
      else if (e.key === 'ArrowLeft') goTo(current - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, goTo]);

  // Land each step at its own beginning rather than wherever the previous one
  // was scrolled to: the modal scrolls its own body, the page scrolls the window
  // (and only when the step body has actually been pushed off the top).
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (variant === 'dialog') {
      const scroller = el.closest('[data-guide-scroll]');
      scroller?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (el.getBoundingClientRect().top < 0) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [current, variant]);

  const bullets = useMemo(
    () => Array.from({ length: step.bullets }, (_, i) => t(`gettingStarted.step.${step.id}.p${i + 1}`)),
    [step, t]
  );

  const Visual = step.visual;

  return (
    <div className={cn('space-y-5', className)}>
      <StepProgress current={current} visited={visited} onSelect={goTo} />

      {/* Step body */}
      <div
        ref={contentRef}
        key={step.id}
        className="animate-in fade-in-50 slide-in-from-bottom-1 duration-300 motion-reduce:animate-none"
      >
        <div className="grid gap-4 md:grid-cols-2 md:items-center md:gap-6">
          <div className="min-w-0 space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <step.icon className="h-4 w-4" />
              </span>
              <h3 className="text-lg font-bold leading-tight sm:text-xl">
                {t(`gettingStarted.step.${step.id}.title`)}
              </h3>
            </div>

            <p className="text-sm text-muted-foreground">
              {t(`gettingStarted.step.${step.id}.tagline`)}
            </p>

            <ul className="space-y-1.5">
              {bullets.map((line, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0">{line}</span>
                </li>
              ))}
            </ul>

            {/* Jump-straight-there links */}
            <div className="flex flex-wrap gap-2 pt-0.5">
              {step.links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={onNavigate}
                  className="group inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  {t(link.labelKey)}
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                </Link>
              ))}
            </div>
          </div>

          {/* Mini demo */}
          <div className="min-w-0">
            <Visual />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2 border-t border-gray-200 dark:border-zinc-700 pt-4">
        <Button
          variant="outline"
          onClick={() => goTo(current - 1)}
          disabled={current === 0}
          className="flex items-center gap-1.5 transition-all duration-200 hover:border-red-400 hover:bg-transparent hover:text-red-500 dark:hover:border-red-400 dark:hover:text-red-400"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{t('gettingStarted.prev')}</span>
        </Button>

        {isLast ? (
          <Button
            onClick={onFinish}
            className="flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md transition-all duration-200 hover:from-red-600 hover:to-red-700 hover:shadow-lg"
          >
            <PartyPopper className="h-4 w-4" />
            {t('gettingStarted.finish')}
          </Button>
        ) : (
          <Button
            onClick={() => goTo(current + 1)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md transition-all duration-200 hover:from-red-600 hover:to-red-700 hover:shadow-lg"
          >
            {t('gettingStarted.next')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {footerSlot}
    </div>
  );
}
