import { useEffect, useState } from 'react';
import { Lock, FileText, Search, Star, Heart, CheckCircle2 } from 'lucide-react';

import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

/**
 * Miniature, hand-drawn-in-CSS "screenshots" for the Getting Started guide.
 *
 * They are deliberately *not* real screenshots: real ones go stale the moment
 * the UI changes, need three localized copies each, and cost a few hundred KB
 * on a page most people read once. These mocks re-use the app's own tokens, so
 * they follow the theme, stay crisp on every screen, and weigh nothing.
 *
 * Every visual is mounted fresh with the step (`key={step.id}` in the guide),
 * so `useAnimateIn` replays the reveal each time a step is opened.
 */

/** Flips to `true` one frame after mount so width/opacity transitions play. */
function useAnimateIn() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return on;
}

/** Fake browser chrome so the mock reads as "a part of the site", not a chart. */
function Frame({ path, children }: { path: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-700 bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-zinc-700 bg-muted/60 px-3 py-2">
        <span className="flex gap-1" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-red-400/70" />
          <span className="h-2 w-2 rounded-full bg-amber-400/70" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded-full bg-card px-2 py-0.5 text-center font-mono text-[10px] text-muted-foreground">
          lingubible.com{path}
        </span>
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </div>
  );
}

/** A 0–5 rating rendered as a filling bar. Green = better, matching the cards. */
function MetricBar({
  label,
  value,
  tone,
  delay,
  on,
}: {
  label: string;
  value: number;
  tone: 'good' | 'mid' | 'bad';
  delay: number;
  on: boolean;
}) {
  const fill =
    tone === 'good' ? 'bg-emerald-500' : tone === 'mid' ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 truncate text-[10px] text-muted-foreground sm:w-20 sm:text-xs">
        {label}
      </span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <span
          className={cn('block h-full rounded-full transition-all duration-700 ease-out motion-reduce:transition-none', fill)}
          style={{ width: on ? `${(value / 5) * 100}%` : '0%', transitionDelay: `${delay}ms` }}
        />
      </span>
      <span className="w-6 shrink-0 text-right text-[10px] font-semibold tabular-nums sm:text-xs">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 1. Welcome — search finds a course in one box
// -----------------------------------------------------------------------------

export function WelcomeVisual() {
  const on = useAnimateIn();
  const rows = [
    { code: 'BUS1102', hit: true },
    { code: 'CHI2210', hit: false },
    { code: 'CLB9001', hit: false },
  ];
  return (
    <Frame path="/courses">
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-card px-2.5 py-2">
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="font-mono text-xs text-foreground">
          BUS
          <span className="ml-px inline-block h-3 w-px animate-pulse bg-primary align-middle motion-reduce:animate-none" />
        </span>
      </div>
      <div className="mt-2 space-y-1.5">
        {rows.map((row, i) => (
          <div
            key={row.code}
            className={cn(
              'flex items-center gap-2 rounded-lg border border-gray-200 dark:border-zinc-700 px-2.5 py-2 transition-all duration-500 ease-out motion-reduce:transition-none',
              row.hit ? 'border-primary/40 bg-primary/5' : 'bg-muted/30',
              on ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            )}
            style={{ transitionDelay: `${120 + i * 90}ms` }}
          >
            <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
              {row.code}
            </span>
            <span className="h-1.5 flex-1 rounded-full bg-muted-foreground/15" />
            <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
              <Star className="h-3 w-3 fill-current" />
              {row.hit ? '4.2' : '3.6'}
            </span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

// -----------------------------------------------------------------------------
// 2. Reviews — the three ratings plus a grade distribution
// -----------------------------------------------------------------------------

export function ReviewsVisual() {
  const on = useAnimateIn();
  const { t } = useLanguage();
  const grades = [
    { label: 'A', h: 62 },
    { label: 'B', h: 100 },
    { label: 'C', h: 74 },
    { label: 'D', h: 26 },
    { label: 'F', h: 10 },
  ];
  return (
    <Frame path="/courses/BUS1102">
      <div className="space-y-2">
        <MetricBar label={t('card.workload')} value={2.8} tone="mid" delay={100} on={on} />
        <MetricBar label={t('card.difficulty')} value={2.4} tone="good" delay={200} on={on} />
        <MetricBar label={t('card.usefulness')} value={4.3} tone="good" delay={300} on={on} />
      </div>
      <div className="mt-3 flex h-14 items-end justify-center gap-2 border-t border-gray-200 dark:border-zinc-700 pt-3">
        {grades.map((g, i) => (
          <div key={g.label} className="flex w-6 flex-col items-center gap-1">
            <span
              className="w-full rounded-t bg-primary/70 transition-all duration-700 ease-out motion-reduce:transition-none"
              style={{ height: on ? `${g.h * 0.34}px` : '0px', transitionDelay: `${300 + i * 70}ms` }}
            />
            <span className="text-[9px] font-medium text-muted-foreground">{g.label}</span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

// -----------------------------------------------------------------------------
// 3. Materials — syllabus + past papers behind a student-only lock
// -----------------------------------------------------------------------------

export function MaterialsVisual() {
  const on = useAnimateIn();
  const { t } = useLanguage();
  const files = [
    { name: t('pages.courseDetail.viewSyllabus'), meta: 'PDF · 2024–25', locked: false },
    { name: 'Final Exam', meta: 'PDF · 2023–24', locked: true },
    { name: 'Midterm', meta: 'PDF · 2022–23', locked: true },
  ];
  return (
    <Frame path="/courses/BUS1102">
      <div className="space-y-1.5">
        {files.map((f, i) => (
          <div
            key={f.name + f.meta}
            className={cn(
              'flex items-center gap-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-muted/30 px-2.5 py-2 transition-all duration-500 ease-out motion-reduce:transition-none',
              on ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            )}
            style={{ transitionDelay: `${100 + i * 100}ms` }}
          >
            <FileText className="h-4 w-4 shrink-0 text-primary" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-medium">{f.name}</span>
              <span className="block truncate font-mono text-[9px] text-muted-foreground">{f.meta}</span>
            </span>
            {f.locked && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 dark:text-amber-300">
                <Lock className="h-2.5 w-2.5" />
                @ln.hk
              </span>
            )}
          </div>
        ))}
      </div>
    </Frame>
  );
}

// -----------------------------------------------------------------------------
// 4. Planner — a week grid with one clash highlighted
// -----------------------------------------------------------------------------

export function PlannerVisual() {
  const on = useAnimateIn();
  const days = ['M', 'T', 'W', 'T', 'F'];
  const ROW = 14; // px per half-hour-ish slot
  const ROWS = 5;
  /** One entry per weekday: the blocks sitting in that column. */
  const columns: { row: number; span: number; clash?: boolean }[][] = [
    [{ row: 0, span: 2 }],
    [{ row: 2, span: 1 }],
    [{ row: 1, span: 2, clash: true }],
    [{ row: 3, span: 1 }],
    [{ row: 0, span: 1 }, { row: 2, span: 2 }],
  ];
  return (
    <Frame path="/planner">
      <div className="grid grid-cols-5 gap-1.5">
        {days.map((d, i) => (
          <div key={`h${i}`} className="text-center text-[9px] font-semibold text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-5 gap-1.5">
        {columns.map((blocks, col) => (
          <div
            key={`c${col}`}
            className="relative rounded bg-muted/40"
            style={{ height: `${ROW * ROWS}px` }}
          >
            {blocks.map((b, i) => (
              <span
                key={i}
                className={cn(
                  'absolute inset-x-0.5 rounded transition-all duration-500 ease-out motion-reduce:transition-none',
                  b.clash ? 'bg-red-500/25 ring-1 ring-red-500' : 'bg-primary/30 ring-1 ring-primary/40',
                  on ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
                )}
                style={{
                  top: `${b.row * ROW + 1}px`,
                  height: `${b.span * ROW - 2}px`,
                  transitionDelay: `${100 + (col * 2 + i) * 60}ms`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </Frame>
  );
}

// -----------------------------------------------------------------------------
// 5. GPA — a dial plus the honours band it lands in
// -----------------------------------------------------------------------------

export function GpaVisual() {
  const on = useAnimateIn();
  const { t } = useLanguage();
  const gpa = 3.42;
  const R = 30;
  const C = 2 * Math.PI * R;
  const pct = gpa / 4;
  return (
    <Frame path="/gpa-hons">
      <div className="flex items-center gap-4">
        <div className="relative h-[76px] w-[76px] shrink-0">
          <svg viewBox="0 0 76 76" className="h-full w-full -rotate-90">
            <circle cx="38" cy="38" r={R} fill="none" strokeWidth="7" className="stroke-muted" />
            <circle
              cx="38"
              cy="38"
              r={R}
              fill="none"
              strokeWidth="7"
              strokeLinecap="round"
              className="stroke-primary transition-all duration-1000 ease-out motion-reduce:transition-none"
              strokeDasharray={C}
              strokeDashoffset={on ? C * (1 - pct) : C}
            />
          </svg>
          <span className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-bold tabular-nums leading-none">{gpa.toFixed(2)}</span>
            <span className="text-[8px] text-muted-foreground">/ 4.00</span>
          </span>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="text-[10px] text-muted-foreground">{t('gpa.cumulativeGpa')}</div>
          <div className="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
            Second Class (Upper)
          </div>
          <div className="flex h-8 items-end gap-1 pt-1">
            {[52, 61, 58, 72, 80].map((h, i) => (
              <span
                key={i}
                className="w-full rounded-t bg-primary/40 transition-all duration-700 ease-out motion-reduce:transition-none"
                style={{ height: on ? `${h * 0.3}px` : '0px', transitionDelay: `${200 + i * 80}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

// -----------------------------------------------------------------------------
// 6. Calendar — a month with the dates that actually matter tinted
// -----------------------------------------------------------------------------

export function CalendarVisual() {
  const on = useAnimateIn();
  const { t } = useLanguage();
  /** index → category tint; everything else is a plain day. */
  const marks: Record<number, string> = {
    2: 'bg-primary/70',
    3: 'bg-primary/70',
    9: 'bg-amber-500/70',
    15: 'bg-emerald-500/70',
    16: 'bg-emerald-500/70',
    22: 'bg-violet-500/70',
    25: 'bg-amber-500/70',
  };
  const legend = [
    { color: 'bg-primary/70', label: t('calendar.cat.term') },
    { color: 'bg-amber-500/70', label: t('calendar.cat.exam') },
    { color: 'bg-emerald-500/70', label: t('calendar.cat.addDrop') },
  ];
  return (
    <Frame path="/calendar">
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 28 }, (_, i) => (
          <span
            key={i}
            className={cn(
              'aspect-square rounded-[3px] transition-all duration-500 ease-out motion-reduce:transition-none',
              marks[i] ?? 'bg-muted/50',
              on ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
            )}
            style={{ transitionDelay: `${i * 12}ms` }}
          />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 border-t border-gray-200 dark:border-zinc-700 pt-2">
        {legend.map((l) => (
          <span key={l.label} className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <span className={cn('h-2 w-2 rounded-[2px]', l.color)} />
            <span className="truncate">{l.label}</span>
          </span>
        ))}
      </div>
    </Frame>
  );
}

// -----------------------------------------------------------------------------
// 7. Contribute — the review form's own step pills, half-stars and anonymity
// -----------------------------------------------------------------------------

export function ContributeVisual() {
  const on = useAnimateIn();
  const { t } = useLanguage();
  return (
    <Frame path="/write-review">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-1 items-center gap-1.5">
            <span
              className={cn(
                'flex h-4 flex-1 items-center justify-center rounded-full text-[8px] font-bold transition-all duration-500 ease-out motion-reduce:transition-none',
                i === 0
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-gray-200 dark:border-zinc-700 bg-card text-muted-foreground',
                on ? 'opacity-100' : 'opacity-0'
              )}
              style={{ transitionDelay: `${i * 90}ms` }}
            >
              {i === 0 ? <CheckCircle2 className="h-2.5 w-2.5" /> : i + 1}
            </span>
            {i < 2 && <span className="h-0.5 w-2 rounded-full bg-muted" />}
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {[
          { label: t('card.workload'), stars: 3 },
          { label: t('card.usefulness'), stars: 4 },
        ].map((row, ri) => (
          <div key={row.label} className="flex items-center gap-2">
            <span className="w-16 shrink-0 truncate text-[10px] text-muted-foreground sm:w-20">
              {row.label}
            </span>
            <span className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    'h-3 w-3 transition-all duration-300 ease-out motion-reduce:transition-none',
                    s < row.stars ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30',
                    on ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                  )}
                  style={{ transitionDelay: `${200 + ri * 150 + s * 50}ms` }}
                />
              ))}
            </span>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-gray-200 dark:border-zinc-700 pt-2">
          <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[9px] text-muted-foreground">
            <Lock className="h-2.5 w-2.5" />
            {t('review.anonymous')}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[9px] text-muted-foreground">
            <Heart className="h-2.5 w-2.5" />
            {t('sidebar.myFavorites')}
          </span>
        </div>
      </div>
    </Frame>
  );
}
