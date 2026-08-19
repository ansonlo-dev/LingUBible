import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bug,
  CalendarRange,
  Database,
  ListFilter,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Wand2,
  Zap,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  History,
  Github,
} from 'lucide-react';

import { useLanguage } from '@/hooks/useLanguage';
import { DocumentHead } from '@/components/common/DocumentHead';
import { ShareButton } from '@/components/common/ShareButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  CHANGELOG,
  CHANGELOG_TYPES,
  type ChangelogEntry,
  type ChangelogType,
} from '@/data/changelog';

// -----------------------------------------------------------------------------
// Type presentation
// -----------------------------------------------------------------------------

/**
 * Tailwind classes are written out in full (no template interpolation) so the
 * JIT compiler can see them. Each type gets a hue that stays legible in both
 * themes; the site's own red is reserved for primary actions, so `security`
 * uses rose rather than the brand colour.
 */
const TYPE_STYLES: Record<
  ChangelogType,
  { icon: typeof Sparkles; dot: string; chip: string; badge: string }
> = {
  feature: {
    icon: Sparkles,
    dot: 'bg-emerald-500/15 text-emerald-600 ring-emerald-500/30 dark:text-emerald-400',
    chip: 'border-emerald-500/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  improvement: {
    icon: Wand2,
    dot: 'bg-violet-500/15 text-violet-600 ring-violet-500/30 dark:text-violet-400',
    chip: 'border-violet-500/60 bg-violet-500/15 text-violet-700 dark:text-violet-300',
    badge: 'bg-violet-500/12 text-violet-700 ring-violet-500/25 dark:bg-violet-500/15 dark:text-violet-300',
  },
  fix: {
    icon: Bug,
    dot: 'bg-amber-500/15 text-amber-600 ring-amber-500/30 dark:text-amber-400',
    chip: 'border-amber-500/60 bg-amber-500/15 text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-500/12 text-amber-700 ring-amber-500/25 dark:bg-amber-500/15 dark:text-amber-300',
  },
  performance: {
    icon: Zap,
    dot: 'bg-cyan-500/15 text-cyan-600 ring-cyan-500/30 dark:text-cyan-400',
    chip: 'border-cyan-500/60 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300',
    badge: 'bg-cyan-500/12 text-cyan-700 ring-cyan-500/25 dark:bg-cyan-500/15 dark:text-cyan-300',
  },
  data: {
    icon: Database,
    dot: 'bg-slate-500/15 text-slate-600 ring-slate-500/30 dark:text-slate-300',
    chip: 'border-slate-500/60 bg-slate-500/15 text-slate-700 dark:text-slate-300',
    badge: 'bg-slate-500/12 text-slate-700 ring-slate-500/25 dark:bg-slate-500/15 dark:text-slate-300',
  },
  security: {
    icon: ShieldCheck,
    dot: 'bg-rose-500/15 text-rose-600 ring-rose-500/30 dark:text-rose-400',
    chip: 'border-rose-500/60 bg-rose-500/15 text-rose-700 dark:text-rose-300',
    badge: 'bg-rose-500/12 text-rose-700 ring-rose-500/25 dark:bg-rose-500/15 dark:text-rose-300',
  },
};

type RangePreset = 'all' | '30d' | '90d' | '365d' | 'custom';

const RANGE_PRESETS: RangePreset[] = ['all', '30d', '90d', '365d', 'custom'];

const PRESET_DAYS: Partial<Record<RangePreset, number>> = {
  '30d': 30,
  '90d': 90,
  '365d': 365,
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const localeOf = (language: string) =>
  language === 'zh-TW' ? 'zh-TW' : language === 'zh-CN' ? 'zh-CN' : 'en-US';

/** `YYYY-MM-DD` → local Date at midnight (avoids the UTC shift of `new Date(str)`). */
const parseIsoDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const toIsoDate = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const pickTitle = (entry: ChangelogEntry, language: string) =>
  language === 'zh-TW' ? entry.title_tc : language === 'zh-CN' ? entry.title_sc : entry.title;

const pickDesc = (entry: ChangelogEntry, language: string) =>
  language === 'zh-TW' ? entry.desc_tc : language === 'zh-CN' ? entry.desc_sc : entry.desc;

/**
 * Tracks the live height of the app header so the sticky date headings park
 * right below it. On mobile the header is `height: fit-content`, so the
 * `--header-height` constant alone leaves a gap.
 */
function useHeaderHeight() {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const header = document.querySelector('.header-sticky') as HTMLElement | null;
    if (!header) return;
    const update = () => setHeight(header.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(header);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return height;
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function Changelog() {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const headerHeight = useHeaderHeight();

  // --- filter state, mirrored into the query string so a view can be shared ---
  const selectedTypes = useMemo(() => {
    const raw = searchParams.get('type');
    if (!raw) return new Set<ChangelogType>();
    const valid = raw
      .split(',')
      .filter((v): v is ChangelogType => (CHANGELOG_TYPES as string[]).includes(v));
    return new Set(valid);
  }, [searchParams]);

  const rangeParam = searchParams.get('range');
  const range: RangePreset = (RANGE_PRESETS as string[]).includes(rangeParam ?? '')
    ? (rangeParam as RangePreset)
    : 'all';
  const customFrom = searchParams.get('from') ?? '';
  const customTo = searchParams.get('to') ?? '';
  const sort: 'newest' | 'oldest' = searchParams.get('sort') === 'oldest' ? 'oldest' : 'newest';

  const patchParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next, { replace: true });
  };

  const toggleType = (type: ChangelogType) => {
    const next = new Set(selectedTypes);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    patchParams({ type: next.size ? CHANGELOG_TYPES.filter((x) => next.has(x)).join(',') : null });
  };

  const isFiltered =
    selectedTypes.size > 0 || range !== 'all' || sort !== 'newest' || !!customFrom || !!customTo;

  const resetFilters = () =>
    patchParams({ type: null, range: null, from: null, to: null, sort: null });

  // --- derived data -----------------------------------------------------------
  const total = CHANGELOG.length;

  const latestDate = useMemo(
    () => CHANGELOG.reduce((max, e) => (e.date > max ? e.date : max), CHANGELOG[0]?.date ?? ''),
    []
  );

  /** Entries inside the selected period — type counts are derived from this, so
   *  the numbers on the chips always describe what a click would actually do. */
  const inRange = useMemo(() => {
    let from: string | null = null;
    let to: string | null = null;

    if (range === 'custom') {
      from = customFrom || null;
      to = customTo || null;
    } else {
      const days = PRESET_DAYS[range];
      if (days) {
        const start = new Date();
        start.setDate(start.getDate() - days);
        from = toIsoDate(start);
      }
    }

    // A backwards custom range is treated as the same range typed either way
    // round, which is what people mean when they fill the fields out of order.
    if (from && to && from > to) [from, to] = [to, from];

    return CHANGELOG.filter((e) => (!from || e.date >= from) && (!to || e.date <= to));
  }, [range, customFrom, customTo]);

  const typeCounts = useMemo(() => {
    const counts = Object.fromEntries(CHANGELOG_TYPES.map((k) => [k, 0])) as Record<
      ChangelogType,
      number
    >;
    inRange.forEach((e) => (counts[e.type] += 1));
    return counts;
  }, [inRange]);

  const filtered = useMemo(
    () => (selectedTypes.size ? inRange.filter((e) => selectedTypes.has(e.type)) : inRange),
    [inRange, selectedTypes]
  );

  /** `[date, entries][]`, ordered by the chosen direction. */
  const groups = useMemo(() => {
    const byDate = new Map<string, ChangelogEntry[]>();
    filtered.forEach((entry) => {
      const bucket = byDate.get(entry.date);
      if (bucket) bucket.push(entry);
      else byDate.set(entry.date, [entry]);
    });
    return [...byDate.entries()].sort(([a], [b]) =>
      sort === 'newest' ? b.localeCompare(a) : a.localeCompare(b)
    );
  }, [filtered, sort]);

  // --- formatting -------------------------------------------------------------
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(localeOf(language), {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [language]
  );

  const shortDateFormatter = useMemo(
    () => new Intl.DateTimeFormat(localeOf(language), { year: 'numeric', month: 'short', day: 'numeric' }),
    [language]
  );

  const formatDate = (iso: string) => dateFormatter.format(parseIsoDate(iso));

  return (
    <div className="min-h-screen bg-background">
      <DocumentHead
        title={t('changelog.title')}
        description={t('changelog.subtitle')}
      />

      <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-8">
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                            */}
        {/* ---------------------------------------------------------------- */}
        <header className="mb-6">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <History className="h-7 w-7 shrink-0 text-primary" />
            <h1 className="text-2xl font-bold sm:text-3xl">{t('changelog.title')}</h1>
            <ShareButton
              title={`${t('changelog.title')} · LingUBible`}
              description={t('changelog.subtitle')}
              text={t('share.text.changelog')}
              hashtags={['LingUBible', 'LingnanU']}
            />
          </div>
          <p className="mt-2 text-center text-sm text-muted-foreground sm:text-left">
            {t('changelog.subtitle')}
          </p>
          <p className="mt-1 text-center text-xs text-muted-foreground sm:text-left">
            {t('changelog.meta', {
              count: total,
              date: latestDate ? shortDateFormatter.format(parseIsoDate(latestDate)) : '',
            })}
          </p>
        </header>

        {/* ---------------------------------------------------------------- */}
        {/* Filters                                                           */}
        {/* ---------------------------------------------------------------- */}
        <section
          aria-label={t('changelog.filters')}
          className="mb-6 rounded-xl border bg-card/60 p-3 sm:p-4"
        >
          {/* Type chips — horizontally scrollable on narrow phones so they
              never wrap into a tall block that pushes the list off-screen. */}
          <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
            <FilterChip
              active={selectedTypes.size === 0}
              count={inRange.length}
              label={t('changelog.filter.all')}
              icon={<ListFilter className="h-3.5 w-3.5" />}
              onClick={() => patchParams({ type: null })}
            />
            {CHANGELOG_TYPES.map((type) => {
              const Icon = TYPE_STYLES[type].icon;
              return (
                <FilterChip
                  key={type}
                  active={selectedTypes.has(type)}
                  activeClassName={TYPE_STYLES[type].chip}
                  count={typeCounts[type]}
                  label={t(`changelog.type.${type}`)}
                  icon={<Icon className="h-3.5 w-3.5" />}
                  onClick={() => toggleType(type)}
                />
              );
            })}
          </div>

          <div className="mt-3 flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Period */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <CalendarRange className="h-3.5 w-3.5" />
                {t('changelog.range.label')}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {RANGE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => patchParams({ range: preset === 'all' ? null : preset })}
                    aria-pressed={range === preset}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                      range === preset
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted text-muted-foreground hover:bg-primary/20 hover:text-foreground'
                    )}
                  >
                    {t(`changelog.range.${preset}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort + reset */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => patchParams({ sort: sort === 'newest' ? 'oldest' : null })}
              >
                {sort === 'newest' ? (
                  <ArrowDownWideNarrow className="h-3.5 w-3.5" />
                ) : (
                  <ArrowUpWideNarrow className="h-3.5 w-3.5" />
                )}
                {t(`changelog.sort.${sort}`)}
              </Button>
              {isFiltered && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs text-muted-foreground"
                  onClick={resetFilters}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t('changelog.reset')}
                </Button>
              )}
            </div>
          </div>

          {range === 'custom' && (
            <div className="mt-3 flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center">
              <label className="flex flex-1 items-center gap-2 text-xs text-muted-foreground">
                <span className="w-10 shrink-0 sm:w-auto">{t('changelog.range.from')}</span>
                <Input
                  type="date"
                  value={customFrom}
                  max={customTo || undefined}
                  onChange={(e) => patchParams({ from: e.target.value || null })}
                  className="h-8 flex-1 text-xs"
                />
              </label>
              <label className="flex flex-1 items-center gap-2 text-xs text-muted-foreground">
                <span className="w-10 shrink-0 sm:w-auto">{t('changelog.range.to')}</span>
                <Input
                  type="date"
                  value={customTo}
                  min={customFrom || undefined}
                  onChange={(e) => patchParams({ to: e.target.value || null })}
                  className="h-8 flex-1 text-xs"
                />
              </label>
            </div>
          )}

          {filtered.length !== total && (
            <p className="mt-3 text-xs text-muted-foreground">
              {t('changelog.showing', { count: filtered.length, total })}
            </p>
          )}
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Timeline                                                          */}
        {/* ---------------------------------------------------------------- */}
        {groups.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center">
            <ListFilter className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
            <p className="font-medium">{t('changelog.empty.title')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('changelog.empty.desc')}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              {t('changelog.reset')}
            </Button>
          </div>
        ) : (
          <div className="relative">
            {/* The rail sits behind the dots; it starts under the first dot and
                stops at the last one so it never dangles past the content. */}
            <div
              aria-hidden
              className="absolute bottom-6 left-[14px] top-6 w-px bg-border sm:left-[16px]"
            />

            {groups.map(([date, entries]) => (
              <section key={date} className="relative">
                <h2
                  className="sticky z-20 -mx-1 bg-background/95 px-1 py-2 text-sm font-semibold text-muted-foreground backdrop-blur"
                  style={{ top: headerHeight ? `${headerHeight}px` : 'var(--header-height)' }}
                >
                  {formatDate(date)}
                </h2>

                <ul className="space-y-3 pb-4">
                  {entries.map((entry) => {
                    const style = TYPE_STYLES[entry.type];
                    const Icon = style.icon;
                    const desc = pickDesc(entry, language);
                    return (
                      <li key={entry.id} id={entry.id} className="relative pl-10 sm:pl-12">
                        <span
                          aria-hidden
                          className={cn(
                            'absolute left-0 top-3 flex h-7 w-7 items-center justify-center rounded-full ring-1 sm:h-8 sm:w-8',
                            style.dot
                          )}
                        >
                          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </span>

                        <article className="rounded-xl border bg-card px-3 py-3 transition-colors hover:border-primary/40 sm:px-4">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                              style.badge
                            )}
                          >
                            {t(`changelog.type.${entry.type}`)}
                          </span>
                          <h3 className="mt-1.5 text-sm font-semibold leading-snug sm:text-base">
                            {pickTitle(entry, language)}
                          </h3>
                          {desc && (
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                              {desc}
                            </p>
                          )}
                        </article>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Footnote                                                          */}
        {/* ---------------------------------------------------------------- */}
        <p className="mt-8 border-t pt-4 text-center text-xs leading-relaxed text-muted-foreground">
          {t('changelog.note')}{' '}
          <a
            href="https://github.com/ansonlo-dev/LingUBible/commits/main"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
          >
            <Github className="h-3 w-3" />
            {t('changelog.viewCommits')}
          </a>
        </p>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Filter chip
// -----------------------------------------------------------------------------

function FilterChip({
  active,
  activeClassName,
  count,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  activeClassName?: string;
  count: number;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex shrink-0 snap-start items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? activeClassName ?? 'border-primary bg-primary text-primary-foreground'
          : 'border-transparent bg-muted text-muted-foreground hover:bg-primary/15 hover:text-foreground'
      )}
    >
      {icon}
      {label}
      <span
        className={cn(
          'rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums',
          active ? 'bg-background/25' : 'bg-background/70'
        )}
      >
        {count}
      </span>
    </button>
  );
}
