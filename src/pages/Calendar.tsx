import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useResponsive } from '@/hooks/useEnhancedResponsive';
import { DocumentHead } from '@/components/common/DocumentHead';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  Columns3,
  Grid3x3,
  Info,
} from 'lucide-react';
import {
  ACADEMIC_EVENTS,
  ACADEMIC_YEAR_LABEL,
  CATEGORY_ORDER,
  TERM_START_DATE,
  type AcademicEvent,
  type CalendarCategory,
} from '@/data/academicCalendar';

// ────────────────────────────── Date helpers ──────────────────────────────
// Parse an ISO "YYYY-MM-DD" as a *local* midnight date (avoid UTC shift).
const parseISO = (s: string): Date => {
  const [y, m, d] = s.split('-').map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d);
};
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => {
  const r = startOfDay(d);
  r.setDate(r.getDate() + n);
  return r;
};
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const startOfWeekSun = (d: Date) => addDays(d, -startOfDay(d).getDay()); // Sunday-first (matches official calendar)
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const dayDiff = (a: Date, b: Date) =>
  Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000);

// ────────────────────────────── Category styling ──────────────────────────
// Solid colour bars (Outlook-like) that read well in both light and dark themes.
const CATEGORY_STYLES: Record<
  CalendarCategory,
  { bar: string; dot: string; soft: string }
> = {
  term: {
    bar: 'bg-red-600 text-white dark:bg-red-600',
    dot: 'bg-red-600',
    soft: 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-200',
  },
  exam: {
    bar: 'bg-amber-500 text-white dark:bg-amber-600',
    dot: 'bg-amber-500',
    soft: 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200',
  },
  holiday: {
    bar: 'bg-violet-500 text-white dark:bg-violet-600',
    dot: 'bg-violet-500',
    soft: 'bg-violet-100 text-violet-900 dark:bg-violet-950/70 dark:text-violet-200',
  },
  addDrop: {
    bar: 'bg-emerald-500 text-white dark:bg-emerald-600',
    dot: 'bg-emerald-500',
    soft: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200',
  },
  registration: {
    bar: 'bg-sky-500 text-white dark:bg-sky-600',
    dot: 'bg-sky-500',
    soft: 'bg-sky-100 text-sky-900 dark:bg-sky-950/70 dark:text-sky-200',
  },
  deadline: {
    bar: 'bg-orange-500 text-white dark:bg-orange-600',
    dot: 'bg-orange-500',
    soft: 'bg-orange-100 text-orange-900 dark:bg-orange-950/70 dark:text-orange-200',
  },
  event: {
    bar: 'bg-slate-500 text-white dark:bg-slate-600',
    dot: 'bg-slate-500',
    soft: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
  },
};

const eventStart = (e: AcademicEvent) => parseISO(e.start);
const eventEnd = (e: AcademicEvent) => parseISO(e.end ?? e.start);

// ────────────────────────────── Layout (lanes) ─────────────────────────────
interface PositionedEvent {
  event: AcademicEvent;
  lane: number;
  startCol: number; // 0-based, inclusive
  endCol: number; // 0-based, inclusive (clamped to this strip)
  clippedLeft: boolean; // event began before this strip
  clippedRight: boolean; // event continues after this strip
}

// Assign overlapping multi-day events to stacked lanes within a strip of `days`.
function layoutStrip(days: Date[], events: AcademicEvent[]): PositionedEvent[] {
  const first = days[0];
  const last = days[days.length - 1];
  const catRank = (c: CalendarCategory) => CATEGORY_ORDER.indexOf(c);

  const overlapping = events
    .filter((e) => eventEnd(e) >= first && eventStart(e) <= last)
    .map((e) => {
      const s = eventStart(e);
      const en = eventEnd(e);
      const startCol = Math.max(0, dayDiff(s, first));
      const endCol = Math.min(days.length - 1, dayDiff(en, first));
      return {
        event: e,
        startCol,
        endCol,
        clippedLeft: s < first,
        clippedRight: en > last,
      };
    })
    .sort((a, b) => {
      if (a.startCol !== b.startCol) return a.startCol - b.startCol;
      const spanA = a.endCol - a.startCol;
      const spanB = b.endCol - b.startCol;
      if (spanA !== spanB) return spanB - spanA; // longer events first
      return catRank(a.event.category) - catRank(b.event.category);
    });

  const laneEnds: number[] = []; // last occupied endCol per lane
  const positioned: PositionedEvent[] = [];
  for (const item of overlapping) {
    let lane = 0;
    while (lane < laneEnds.length && laneEnds[lane] >= item.startCol) lane++;
    laneEnds[lane] = item.endCol;
    positioned.push({ ...item, lane });
  }
  return positioned;
}

// ────────────────────────────── View types ────────────────────────────────
type ViewMode = 'day3' | 'week' | 'month';

export default function Calendar() {
  const { t, language } = useLanguage();
  const { isMobile } = useResponsive();

  const today = useMemo(() => startOfDay(new Date()), []);
  // Land on the academic-year start if today is before it; otherwise on today.
  const initialRef = useMemo(() => {
    const termStart = parseISO(TERM_START_DATE);
    return today < termStart ? termStart : today;
  }, [today]);

  const [view, setView] = useState<ViewMode>(() => (isMobile ? 'day3' : 'month'));
  const [refDate, setRefDate] = useState<Date>(initialRef);
  const [selectedDate, setSelectedDate] = useState<Date>(initialRef);

  const locale = language === 'zh-TW' ? 'zh-TW' : language === 'zh-CN' ? 'zh-CN' : 'en-US';

  // ── Visible day range for the active view ─────────────────────────────────
  const { weeks, stripDays } = useMemo(() => {
    if (view === 'month') {
      const monthStart = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
      const gridStart = startOfWeekSun(monthStart);
      const out: Date[][] = [];
      let cursor = gridStart;
      // 6 weeks covers any month layout.
      for (let w = 0; w < 6; w++) {
        const row: Date[] = [];
        for (let i = 0; i < 7; i++) {
          row.push(cursor);
          cursor = addDays(cursor, 1);
        }
        out.push(row);
        // Stop after we've passed the month end and completed the week.
        if (row[6].getMonth() !== refDate.getMonth() && w >= 3) break;
      }
      return { weeks: out, stripDays: [] as Date[] };
    }
    if (view === 'week') {
      const start = startOfWeekSun(refDate);
      return { weeks: [], stripDays: Array.from({ length: 7 }, (_, i) => addDays(start, i)) };
    }
    // day3
    return { weeks: [], stripDays: Array.from({ length: 3 }, (_, i) => addDays(refDate, i)) };
  }, [view, refDate]);

  // ── Navigation ────────────────────────────────────────────────────────────
  // `anim` re-keys the calendar surface so a slide-in animation replays on each
  // page change (dir: 1 = forward/next slides in from right, -1 = back).
  const [anim, setAnim] = useState<{ key: number; dir: -1 | 0 | 1 }>({ key: 0, dir: 0 });

  const navigate = (dir: -1 | 1) => {
    setAnim((a) => ({ key: a.key + 1, dir }));
    setRefDate((prev) => {
      if (view === 'month') return addMonths(prev, dir);
      if (view === 'week') return addDays(prev, dir * 7);
      return addDays(prev, dir * 3);
    });
  };
  // Left / right arrow keys page the calendar (desktop). Ignored while typing
  // in a form field or when a modifier key is held.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const el = document.activeElement as HTMLElement | null;
      if (
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT' ||
          el.isContentEditable)
      ) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigate(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigate(1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // `navigate` closes over `view`, so re-subscribe when the view changes.
  }, [view]);

  // Touch drag (mobile): the calendar content follows the finger in real time so
  // it's obvious the calendar can be dragged. Released past a threshold pages to
  // the previous/next period; otherwise it springs back. Implemented with native
  // listeners (non-passive touchmove) and direct DOM writes on `trackRef` to keep
  // the drag smooth without a re-render per frame.
  const surfaceRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;

    let startX = 0;
    let startY = 0;
    let decided = false; // axis decided yet?
    let locked = false; // committed to a horizontal drag
    let active = false; // a single-finger gesture is in progress

    const widthOf = () => surface.clientWidth || window.innerWidth;
    const setTrack = (x: number | null, animate: boolean) => {
      const track = trackRef.current;
      if (!track) return;
      track.style.transition = animate ? 'transform 0.22s cubic-bezier(0.22,1,0.36,1)' : 'none';
      track.style.transform = x === null ? '' : `translateX(${x}px)`;
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        active = false;
        return;
      }
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      decided = false;
      locked = false;
      active = true;
    };

    const onMove = (e: TouchEvent) => {
      if (!active) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (!decided) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        decided = true;
        // Engage horizontal drag only when the motion is clearly horizontal,
        // otherwise leave the gesture to normal vertical scrolling.
        if (Math.abs(dx) > Math.abs(dy)) {
          locked = true;
        } else {
          active = false;
          return;
        }
      }
      if (locked) {
        e.preventDefault(); // stop the page from scrolling while dragging
        setTrack(dx, false);
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (!active || !locked) {
        active = false;
        return;
      }
      active = false;
      locked = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const threshold = Math.min(72, widthOf() * 0.22);
      if (Math.abs(dx) >= threshold) {
        // Commit: clear the drag transform and let the keyed slide-in play.
        setTrack(null, false);
        navigateRef.current(dx < 0 ? 1 : -1);
      } else {
        // Spring back to centre.
        setTrack(0, true);
        window.setTimeout(() => setTrack(null, false), 240);
      }
    };

    surface.addEventListener('touchstart', onStart, { passive: true });
    surface.addEventListener('touchmove', onMove, { passive: false });
    surface.addEventListener('touchend', onEnd, { passive: true });
    surface.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      surface.removeEventListener('touchstart', onStart);
      surface.removeEventListener('touchmove', onMove);
      surface.removeEventListener('touchend', onEnd);
      surface.removeEventListener('touchcancel', onEnd);
    };
  }, []);

  const goToday = () => {
    setRefDate(today);
    setSelectedDate(today);
  };
  const jumpToStart = () => {
    const ts = parseISO(TERM_START_DATE);
    setRefDate(view === 'month' ? new Date(ts.getFullYear(), ts.getMonth(), 1) : ts);
    setSelectedDate(ts);
  };

  // ── Header title for the current range ────────────────────────────────────
  const rangeTitle = useMemo(() => {
    if (view === 'month') {
      return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(refDate);
    }
    const days = stripDays;
    const a = days[0];
    const b = days[days.length - 1];
    const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
    // Mobile: drop the year to avoid truncation in the narrow toolbar.
    if (isMobile) {
      const fmt = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' });
      const fmtDay = new Intl.DateTimeFormat(locale, { day: 'numeric' });
      return sameMonth ? `${fmt.format(a)} – ${fmtDay.format(b)}` : `${fmt.format(a)} – ${fmt.format(b)}`;
    }
    const fmtFull = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });
    const fmtDay = new Intl.DateTimeFormat(locale, { day: 'numeric' });
    return sameMonth ? `${fmtFull.format(a)} – ${fmtDay.format(b)}` : `${fmtFull.format(a)} – ${fmtFull.format(b)}`;
  }, [view, refDate, stripDays, locale, isMobile]);

  // ── Selected day's events (detail panel) ──────────────────────────────────
  const selectedEvents = useMemo(() => {
    return ACADEMIC_EVENTS.filter((e) => {
      const s = eventStart(e);
      const en = eventEnd(e);
      return selectedDate >= startOfDay(s) && selectedDate <= startOfDay(en);
    }).sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));
  }, [selectedDate]);

  const titleOf = (e: AcademicEvent) =>
    language === 'zh-TW' ? e.title_tc : language === 'zh-CN' ? e.title_sc : e.title;

  const fmtRange = (e: AcademicEvent) => {
    const s = eventStart(e);
    const fmt = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' });
    if (!e.end || e.start === e.end) return fmt.format(s);
    return `${fmt.format(s)} – ${fmt.format(eventEnd(e))}`;
  };

  const weekdayShort = (d: Date) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d);

  const maxLanesMonth = isMobile ? 2 : 3;

  return (
    <div className="mx-auto max-w-6xl px-3 lg:px-4 pt-3 pb-12">
      <DocumentHead title={`${t('calendar.title')} ${ACADEMIC_YEAR_LABEL}`} />

      {/* Header */}
      <div className="mb-4 flex flex-col gap-1 md:flex-row md:flex-wrap md:items-baseline md:gap-5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h1 className="text-2xl font-bold sm:text-3xl">{t('calendar.title')}</h1>
          <span className="whitespace-nowrap rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground sm:text-sm">
            {ACADEMIC_YEAR_LABEL}
          </span>
        </div>
        <p className="text-sm text-muted-foreground sm:text-base md:-translate-y-[3px]">
          {t('calendar.subtitle')}
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Nav row: Today + prev/next on the left, month/range title on the right */}
        <div className="flex items-center justify-between gap-2 sm:justify-start sm:gap-1.5">
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={goToday} className="h-8">
              {t('calendar.today')}
            </Button>
            <div className="flex items-center rounded-md border">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    aria-label={t('calendar.prev')}
                    className="flex h-8 w-8 items-center justify-center rounded-l-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {t('calendar.prev')} <kbd className="ml-1 font-mono">←</kbd>
                </TooltipContent>
              </Tooltip>
              <div className="h-5 w-px bg-border" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => navigate(1)}
                    aria-label={t('calendar.next')}
                    className="flex h-8 w-8 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {t('calendar.next')} <kbd className="ml-1 font-mono">→</kbd>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <h2 className="min-w-0 truncate text-right text-base font-bold sm:ml-1 sm:text-left sm:text-lg">
            {rangeTitle}
          </h2>
        </div>

        {/* View switcher — full-width segmented control on mobile, compact on desktop */}
        <div className="flex w-full items-center gap-1 rounded-lg border bg-card p-1 sm:w-auto">
          {([
            { id: 'day3', label: t('calendar.view.day3'), icon: Columns3 },
            { id: 'week', label: t('calendar.view.week'), icon: CalendarRange },
            { id: 'month', label: t('calendar.view.month'), icon: Grid3x3 },
          ] as { id: ViewMode; label: string; icon: typeof Columns3 }[]).map((v) => {
            const Icon = v.icon;
            const active = view === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                aria-pressed={active}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-semibold transition-colors sm:flex-none sm:py-1',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{v.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Calendar surface. `data-no-sidebar-swipe` tells the global swipe-to-open
          gesture to ignore touches starting here, so dragging the calendar back
          to a previous period never opens the sidebar. */}
      <div
        ref={surfaceRef}
        data-no-sidebar-swipe
        className="overflow-hidden rounded-xl border bg-card shadow-sm"
      >
        {/* Drag track: transformed in real time while the finger is down. */}
        <div ref={trackRef} className="touch-pan-y will-change-transform">
        {/* Keyed wrapper: remounts on navigation so the slide-in animation replays. */}
        <div
          key={anim.key}
          className={cn(
            anim.dir === 1 && 'cal-slide-next',
            anim.dir === -1 && 'cal-slide-prev'
          )}
        >
        {view === 'month' ? (
          <MonthView
            weeks={weeks}
            refMonth={refDate.getMonth()}
            today={today}
            selectedDate={selectedDate}
            maxLanes={maxLanesMonth}
            onSelectDay={setSelectedDate}
            onSelectEvent={(e) => setSelectedDate(eventStart(e))}
            titleOf={titleOf}
            weekdayShort={weekdayShort}
            isMobile={isMobile}
          />
        ) : (
          <StripView
            days={stripDays}
            today={today}
            selectedDate={selectedDate}
            onSelectDay={setSelectedDate}
            onSelectEvent={(e) => setSelectedDate(eventStart(e))}
            titleOf={titleOf}
            weekdayShort={weekdayShort}
            locale={locale}
            allDayLabel={t('calendar.allDay')}
            emptyLabel={t('calendar.noEvents')}
          />
        )}
        </div>
        </div>
      </div>

      {/* Bottom row: selected-day detail + legend */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
        {/* Selected day detail */}
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              {t('calendar.selectedDay')}
            </h3>
            <span className="text-sm font-semibold">
              {new Intl.DateTimeFormat(locale, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }).format(selectedDate)}
            </span>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t('calendar.noEventsOnDay')}
            </p>
          ) : (
            <ul className="space-y-2">
              {selectedEvents.map((e) => {
                const st = CATEGORY_STYLES[e.category];
                return (
                  <li
                    key={e.id}
                    className="flex items-start gap-3 rounded-lg border bg-background/60 p-3"
                  >
                    <span className={cn('mt-1 h-3 w-3 flex-shrink-0 rounded-full', st.dot)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-snug">{titleOf(e)}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">{fmtRange(e)}</span>
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 font-semibold',
                            st.soft
                          )}
                        >
                          {t(`calendar.cat.${e.category}`)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Legend */}
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <Info className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              {t('calendar.legend')}
            </h3>
          </div>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {CATEGORY_ORDER.map((cat) => (
              <li key={cat} className="flex items-center gap-2 text-sm">
                <span className={cn('h-3 w-3 flex-shrink-0 rounded-sm', CATEGORY_STYLES[cat].dot)} />
                <span className="text-foreground">{t(`calendar.cat.${cat}`)}</span>
              </li>
            ))}
          </ul>
          <Button variant="outline" size="sm" onClick={jumpToStart} className="mt-4 w-full">
            <CalendarDays className="mr-1.5 h-4 w-4" />
            {t('calendar.jumpToStart')}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────── Month view ────────────────────────────────
interface MonthViewProps {
  weeks: Date[][];
  refMonth: number;
  today: Date;
  selectedDate: Date;
  maxLanes: number;
  onSelectDay: (d: Date) => void;
  onSelectEvent: (e: AcademicEvent) => void;
  titleOf: (e: AcademicEvent) => string;
  weekdayShort: (d: Date) => string;
  isMobile: boolean;
}

function MonthView({
  weeks,
  refMonth,
  today,
  selectedDate,
  maxLanes,
  onSelectDay,
  onSelectEvent,
  titleOf,
  weekdayShort,
  isMobile,
}: MonthViewProps) {
  const laneH = 22;
  const headerH = 26;
  const overflowH = 18;
  const cellMinH = headerH + maxLanes * laneH + overflowH + 6;

  return (
    <div>
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {weeks[0].map((d, i) => (
          <div
            key={i}
            className="px-1 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-muted-foreground sm:text-xs"
          >
            {weekdayShort(d)}
          </div>
        ))}
      </div>

      {/* Week rows */}
      {weeks.map((week, wi) => {
        const positioned = layoutStrip(week, ACADEMIC_EVENTS);
        const visible = positioned.filter((p) => p.lane < maxLanes);
        // Overflow count per column.
        const overflowPerCol = new Array(7).fill(0);
        positioned
          .filter((p) => p.lane >= maxLanes)
          .forEach((p) => {
            for (let c = p.startCol; c <= p.endCol; c++) overflowPerCol[c]++;
          });

        return (
          <div key={wi} className="relative" style={{ minHeight: cellMinH }}>
            {/* Day cells (background + numbers, click targets) */}
            <div className="grid h-full grid-cols-7">
              {week.map((d, di) => {
                const inMonth = d.getMonth() === refMonth;
                const isToday = isSameDay(d, today);
                const isSelected = isSameDay(d, selectedDate);
                return (
                  <button
                    key={di}
                    type="button"
                    onClick={() => onSelectDay(d)}
                    style={{ minHeight: cellMinH }}
                    className={cn(
                      'group flex flex-col items-start border-b border-r text-left transition-colors last:border-r-0',
                      di === 6 && 'border-r-0',
                      // Background priority: selected fill > in/out of month > hover.
                      isSelected
                        ? 'bg-primary/10'
                        : inMonth
                        ? 'bg-card hover:bg-accent/40'
                        : 'bg-muted/30 hover:bg-accent/40'
                    )}
                  >
                    <span
                      className={cn(
                        'm-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                        isToday
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground',
                        // Out-of-month days are dimmed via element opacity (the
                        // theme's colour tokens don't support the /alpha modifier).
                        !inMonth && !isToday && 'opacity-30'
                      )}
                    >
                      {d.getDate()}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Event bars overlay */}
            <div
              className="pointer-events-none absolute inset-x-0 px-1"
              style={{ top: headerH }}
            >
              <div
                className="grid gap-y-1"
                style={{
                  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                  gridAutoRows: `${laneH - 4}px`,
                }}
              >
                {visible.map((p) => {
                  const st = CATEGORY_STYLES[p.event.category];
                  return (
                    <button
                      key={p.event.id}
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onSelectEvent(p.event);
                      }}
                      title={titleOf(p.event)}
                      className={cn(
                        'pointer-events-auto mx-0.5 flex items-center overflow-hidden rounded px-1.5 text-left text-[10px] font-semibold leading-tight shadow-sm transition-transform hover:brightness-110 active:scale-[0.98] sm:text-[11px]',
                        st.bar,
                        p.clippedLeft && 'rounded-l-none',
                        p.clippedRight && 'rounded-r-none'
                      )}
                      style={{
                        gridColumn: `${p.startCol + 1} / ${p.endCol + 2}`,
                        gridRow: p.lane + 1,
                      }}
                    >
                      <span className="truncate">{titleOf(p.event)}</span>
                    </button>
                  );
                })}
                {/* Overflow indicators */}
                {overflowPerCol.map((count, c) =>
                  count > 0 ? (
                    <button
                      key={`of-${c}`}
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onSelectDay(week[c]);
                      }}
                      className="pointer-events-auto mx-0.5 truncate rounded px-1 text-left text-[10px] font-bold text-muted-foreground hover:text-foreground"
                      style={{ gridColumn: `${c + 1} / ${c + 2}`, gridRow: maxLanes + 1 }}
                    >
                      +{count}
                    </button>
                  ) : null
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ────────────────────────────── Strip view (week / 3-day) ──────────────────
interface StripViewProps {
  days: Date[];
  today: Date;
  selectedDate: Date;
  onSelectDay: (d: Date) => void;
  onSelectEvent: (e: AcademicEvent) => void;
  titleOf: (e: AcademicEvent) => string;
  weekdayShort: (d: Date) => string;
  locale: string;
  allDayLabel: string;
  emptyLabel: string;
}

function StripView({
  days,
  today,
  selectedDate,
  onSelectDay,
  onSelectEvent,
  titleOf,
  weekdayShort,
  allDayLabel,
  emptyLabel,
}: StripViewProps) {
  const positioned = layoutStrip(days, ACADEMIC_EVENTS);
  const laneCount = positioned.reduce((m, p) => Math.max(m, p.lane + 1), 0);
  const laneH = 30;
  const gridMinH = Math.max(laneCount, 4) * laneH + 8;
  const cols = days.length;

  return (
    <div>
      {/* Column headers — shares the same left gutter as the body so the
          day columns line up exactly with the event grid below. */}
      <div className="flex border-b">
        <div className="w-12 flex-shrink-0 border-r sm:w-16" />
        <div
          className="grid flex-1"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
        >
          {days.map((d, i) => {
            const isToday = isSameDay(d, today);
            const isSelected = isSameDay(d, selectedDate);
            return (
              <button
                key={i}
                type="button"
                onClick={() => onSelectDay(d)}
                className={cn(
                  'flex flex-col items-center gap-0.5 border-r py-2 transition-colors last:border-r-0',
                  isSelected ? 'bg-primary/10' : 'hover:bg-accent/40'
                )}
              >
                <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  {weekdayShort(d)}
                </span>
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-base font-bold',
                    isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
                  )}
                >
                  {d.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* All-day events area */}
      <div className="flex">
        <div className="flex w-12 flex-shrink-0 items-start justify-center border-r py-2 sm:w-16">
          <span className="text-[10px] font-semibold uppercase text-muted-foreground sm:text-xs">
            {allDayLabel}
          </span>
        </div>
        <div className="relative flex-1">
          {/* Column separators */}
          <div
            className="pointer-events-none absolute inset-0 grid"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
          >
            {days.map((_, i) => (
              <div key={i} className="border-r last:border-r-0" />
            ))}
          </div>

          {positioned.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              {emptyLabel}
            </div>
          ) : (
            <div
              className="relative grid gap-y-1.5 p-1.5"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`,
                gridAutoRows: `${laneH - 6}px`,
                minHeight: gridMinH,
              }}
            >
              {positioned.map((p) => {
                const st = CATEGORY_STYLES[p.event.category];
                return (
                  <button
                    key={p.event.id}
                    type="button"
                    onClick={() => onSelectEvent(p.event)}
                    title={titleOf(p.event)}
                    className={cn(
                      'mx-0.5 flex items-center overflow-hidden rounded-md px-2 text-left text-xs font-semibold shadow-sm transition-transform hover:brightness-110 active:scale-[0.98]',
                      st.bar,
                      p.clippedLeft && 'rounded-l-none',
                      p.clippedRight && 'rounded-r-none'
                    )}
                    style={{
                      gridColumn: `${p.startCol + 1} / ${p.endCol + 2}`,
                      gridRow: p.lane + 1,
                    }}
                  >
                    <span className="truncate">{titleOf(p.event)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
