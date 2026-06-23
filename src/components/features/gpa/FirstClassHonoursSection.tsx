import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  LabelList,
} from 'recharts';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Award, GraduationCap, Medal, ArrowDownUp, ArrowDownAZ } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  HONOURS_PROGRAMME_STATS,
  HONOURS_SUMMARY,
  HONOURS_YEARS,
  HONOURS_FACULTY_ORDER,
  PROGRAMME_FACULTY,
  type HonoursProgrammeStat,
  type YearStat,
} from '@/data/firstClassHonours';

type Metric = 'rate' | 'first' | 'total';
type SortMode = 'value' | 'name';
type GroupBy = 'programme' | 'faculty';
type Lang = 'en' | 'zh-TW' | 'zh-CN';

// Categorical palette — the most recent cohort takes the brand red (emphasis),
// earlier cohorts take cooler, harmonious hues. Index 0 = latest year.
const PALETTE = ['#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ec4899'];

const YEARS_ASC = [...HONOURS_YEARS].sort((a, b) => a - b);
const LATEST_YEAR = YEARS_ASC[YEARS_ASC.length - 1];

/** Colour for a cohort: newest year → PALETTE[0], next → PALETTE[1], … */
const colorForYear = (year: number) => {
  const fromNewest = YEARS_ASC.length - 1 - YEARS_ASC.indexOf(year);
  return PALETTE[fromNewest % PALETTE.length];
};

/** Reactively track the active theme so SVG axis text stays high-contrast. */
function useIsDark() {
  const [isDark, setIsDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  );
  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains('dark'));
    window.addEventListener('themechange', update);
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      window.removeEventListener('themechange', update);
      obs.disconnect();
    };
  }, []);
  return isDark;
}

/** Track whether the primary pointer is coarse (touch) so the chart tooltip can
 *  switch to a click trigger and stop flashing on tap. */
function useIsTouch() {
  const [isTouch, setIsTouch] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const update = () => setIsTouch(mq.matches);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return isTouch;
}

/** Short, distinctive label for a programme in the active language. */
function shortName(p: HonoursProgrammeStat, lang: Lang): string {
  if (lang === 'en') {
    const i = p.en.indexOf(' in ');
    return (i >= 0 ? p.en.slice(i + 4) : p.en).trim();
  }
  const full = lang === 'zh-CN' ? p.sc : p.tc;
  const dash = full.indexOf(' - ');
  if (dash >= 0) return full.slice(dash + 3).trim(); // BBA / SocSc concentration
  const paren = full.indexOf('（');
  return (paren >= 0 ? full.slice(0, paren) : full).trim();
}

const fullName = (p: HonoursProgrammeStat, lang: Lang) =>
  lang === 'en' ? p.en : lang === 'zh-CN' ? p.sc : p.tc;

const pct = (v: number | null | undefined) => (v == null ? '—' : `${(v * 100).toFixed(1)}%`);

const valueOf = (years: Record<number, YearStat>, year: number, metric: Metric): number | null => {
  const s = years[year];
  if (!s) return null;
  return metric === 'rate' ? s.pct : metric === 'first' ? s.first : s.total;
};
const fmtMetric = (v: number | null | undefined, metric: Metric) =>
  v == null ? '—' : metric === 'rate' ? pct(v) : String(v);

/**
 * Wrap a programme name into lines that fit `maxChars` per line, so the y-axis
 * shows the full name across multiple rows instead of truncating with "…".
 * CJK has no spaces, so it wraps by character; Latin text wraps on word breaks.
 */
function wrapLabel(text: string, maxChars: number, cjk: boolean): string[] {
  if (maxChars <= 0 || text.length <= maxChars) return [text];
  if (cjk) {
    const lines: string[] = [];
    for (let i = 0; i < text.length; i += maxChars) lines.push(text.slice(i, i + maxChars));
    return lines;
  }
  const lines: string[] = [];
  let cur = '';
  for (const word of text.split(' ')) {
    if (!cur) cur = word;
    else if ((cur + ' ' + word).length <= maxChars) cur += ' ' + word;
    else {
      lines.push(cur);
      cur = word;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

interface Row {
  name: string;
  full: string;
  years: Record<number, YearStat>;
  [k: `y${number}`]: number | null | string | Record<number, YearStat>;
}

export function FirstClassHonoursSection({
  summaryYear,
  onSummaryYearChange,
}: {
  // Cohort year for the summary cards; controlled by the parent so its picker
  // can live in the page's sticky tab row. Falls back to the latest cohort.
  summaryYear?: number;
  onSummaryYearChange?: (year: number) => void;
} = {}) {
  const { t, language } = useLanguage();
  const lang = language as Lang;
  const isDark = useIsDark();
  const axisColor = isDark ? '#d1d5db' : '#111827';
  const labelColor = isDark ? '#cbd5e1' : '#475569';

  const isTouch = useIsTouch();
  const [metric, setMetric] = useState<Metric>('rate');
  const [sort, setSort] = useState<SortMode>('value');
  const [groupBy, setGroupBy] = useState<GroupBy>('programme');
  const [selectedYears, setSelectedYears] = useState<Set<number>>(() => new Set(YEARS_ASC));
  // Whether the summary cards show the year-on-year change vs the previous
  // graduate year (default off).
  const [showChange, setShowChange] = useState(false);
  // Cohort year shown in the university-wide summary cards (controlled by parent;
  // its picker lives in the page's sticky tab row). Falls back to the latest.
  const cohortYear = summaryYear ?? LATEST_YEAR;
  // The graduate year immediately before the selected one (for the change), if any.
  const prevCohortYear = YEARS_ASC[YEARS_ASC.indexOf(cohortYear) - 1];

  // Active cohorts in ascending order; never empty (last one can't be removed).
  const activeYears = useMemo(
    () => YEARS_ASC.filter((y) => selectedYears.has(y)),
    [selectedYears],
  );
  const sortYear = activeYears[activeYears.length - 1] ?? LATEST_YEAR;

  const toggleYear = (year: number) =>
    setSelectedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) {
        if (next.size > 1) next.delete(year); // keep at least one cohort visible
      } else {
        next.add(year);
      }
      return next;
    });

  const isRate = metric === 'rate';

  // Source entries for the chart: either each programme, or programmes summed
  // into their faculty/school. Faculty figures are aggregated per cohort (total
  // and first-class summed; rate recomputed as first/total).
  const entries = useMemo<{ name: string; full: string; years: Record<number, YearStat> }[]>(() => {
    if (groupBy === 'faculty') {
      return HONOURS_FACULTY_ORDER.map((fac) => {
        const members = HONOURS_PROGRAMME_STATS.filter((p) => PROGRAMME_FACULTY[p.en] === fac);
        const years: Record<number, YearStat> = {};
        for (const y of YEARS_ASC) {
          let total = 0;
          let first = 0;
          let hasData = false;
          for (const m of members) {
            const s = m.years[y];
            if (!s) continue;
            if (s.total != null) {
              total += s.total;
              hasData = true;
            }
            if (s.first != null) first += s.first;
          }
          years[y] = hasData
            ? { total, first, pct: total > 0 ? first / total : null }
            : { total: null, first: null, pct: null };
        }
        const label = t(`faculty.${fac}`);
        return { name: label, full: label, years };
      });
    }
    return HONOURS_PROGRAMME_STATS.map((p) => ({
      name: shortName(p, lang),
      full: fullName(p, lang),
      years: p.years,
    }));
  }, [groupBy, lang, t]);

  const rows = useMemo<Row[]>(() => {
    const built = entries.map((e) => {
      const row: Row = { name: e.name, full: e.full, years: e.years };
      for (const y of activeYears) row[`y${y}`] = valueOf(e.years, y, metric);
      return row;
    });
    if (sort === 'name') {
      built.sort((a, b) => a.name.localeCompare(b.name, lang === 'en' ? 'en' : 'zh'));
    } else {
      built.sort((a, b) => ((b[`y${sortYear}`] as number | null) ?? -1) - ((a[`y${sortYear}`] as number | null) ?? -1));
    }
    return built;
  }, [entries, metric, lang, sort, activeYears, sortYear]);

  // The programme-name axis must fit inside the chart on every width — on a
  // narrow phone a fixed 176px axis lets the (truncated) names spill past the
  // card's left edge. Track the real chart width and size the axis + truncation
  // length to whatever space is actually available.
  const chartWrapRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);
  useEffect(() => {
    const el = chartWrapRef.current;
    if (!el) return;
    const update = () => setContainerW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const maxYAxis = lang === 'en' ? 176 : 132;
  // Cap to maxYAxis on desktop; on narrow screens take ~42% of the width so the
  // bars still get room. Fall back to the cap until the first measurement.
  const yAxisWidth = containerW > 0 ? Math.round(Math.min(maxYAxis, Math.max(84, containerW * 0.42))) : maxYAxis;
  // Approx. glyph width at fontSize 11 (CJK glyphs are ~2× a Latin char). Derive
  // the truncation length from the axis pixel budget so labels never overflow.
  const charPx = lang === 'en' ? 6.2 : 12.5;
  const maxLabelChars = Math.max(5, Math.floor((yAxisWidth - 6) / charPx));

  // Wrap each name and find the tallest label so rows can be sized to fit the
  // wrapped lines (otherwise multi-line names overlap the neighbouring bars).
  const LINE_H = 13;
  const maxLabelLines = useMemo(() => {
    let max = 1;
    for (const r of rows) max = Math.max(max, wrapLabel(r.name, maxLabelChars, lang !== 'en').length);
    return max;
  }, [rows, maxLabelChars, lang]);

  // Row height = whichever is taller, the cohort bars or the wrapped label.
  const perRow = Math.max(activeYears.length * 12 + 12, maxLabelLines * LINE_H + 8);
  const chartHeight = rows.length * perRow + 36;

  // Cap the hover tooltip to the space actually available to the right of the
  // y-axis. Otherwise a fixed-width box gets clamped to the plot's left edge by
  // recharts and overflows the right of the screen on a narrow phone.
  const tooltipMaxW =
    containerW > 0 ? Math.max(150, Math.min(280, containerW - yAxisWidth - 12)) : 280;

  const renderYTick = ({ x, y, payload }: any) => {
    const lines = wrapLabel(payload.value, maxLabelChars, lang !== 'en');
    // Vertically centre the block of lines on the tick.
    const firstDy = -((lines.length - 1) / 2) * LINE_H + 4;
    return (
      <text x={x} y={y} textAnchor="end" fontSize={11} fill={axisColor}>
        {lines.map((ln, i) => (
          <tspan key={i} x={x} dy={i === 0 ? firstDy : LINE_H}>
            {ln}
          </tspan>
        ))}
      </text>
    );
  };

  const metricButtons: { key: Metric; label: string }[] = [
    { key: 'rate', label: t('gpa.honStats.metricRate') },
    { key: 'first', label: t('gpa.honStats.metricFirst') },
    { key: 'total', label: t('gpa.honStats.metricTotal') },
  ];
  const groupButtons: { key: GroupBy; label: string }[] = [
    { key: 'programme', label: t('gpa.honStats.groupProgramme') },
    { key: 'faculty', label: t('gpa.honStats.groupFaculty') },
  ];

  // Year-on-year change badge for a summary card. `kind` controls formatting:
  // a 'rate' shows the percentage-point difference (e.g. ▼0.9%), a 'count' the
  // absolute difference (e.g. ▲10). Returns null when the toggle is off or the
  // previous year is unavailable.
  const summaryDelta = (curr?: number | null, prev?: number | null, kind: 'rate' | 'count' = 'count') => {
    if (!showChange || curr == null || prev == null) return null;
    const diff = curr - prev;
    const flat = Math.abs(diff) < (kind === 'rate' ? 1e-9 : 0.5);
    const text = kind === 'rate' ? `${Math.abs(diff * 100).toFixed(1)}%` : String(Math.abs(Math.round(diff)));
    return (
      <span
        className={cn(
          'flex items-center gap-0.5 text-xs font-medium tabular-nums',
          flat ? 'text-muted-foreground' : diff > 0 ? 'text-emerald-500' : 'text-red-500',
        )}
      >
        {flat ? '–' : diff > 0 ? '▲' : '▼'}
        {flat ? '' : text}
      </span>
    );
  };

  // One university-average line per selected cohort (rate mode only).
  const avgLines = isRate
    ? activeYears
        .map((y) => ({ year: y, value: HONOURS_SUMMARY[y]?.pct }))
        .filter((a): a is { year: number; value: number } => a.value != null)
    : [];

  return (
    <div>
      {/* University-wide summary for the cohort selected in the tab row */}
      <div className="mb-4">
        <label className="mb-2 flex items-center justify-end gap-2">
          <span className="text-xs font-medium text-muted-foreground">{t('gpa.honStats.showChange')}</span>
          <Switch checked={showChange} onCheckedChange={setShowChange} aria-label={t('gpa.honStats.showChange')} />
        </label>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <SummaryStat
            icon={<Award className="h-4 w-4" />}
            label={t('gpa.honStats.summaryRate')}
            value={pct(HONOURS_SUMMARY[cohortYear]?.pct)}
            change={summaryDelta(HONOURS_SUMMARY[cohortYear]?.pct, HONOURS_SUMMARY[prevCohortYear]?.pct, 'rate')}
          />
          <SummaryStat
            icon={<Medal className="h-4 w-4" />}
            label={t('gpa.honStats.summaryFirst')}
            value={String(HONOURS_SUMMARY[cohortYear]?.first ?? '—')}
            change={summaryDelta(HONOURS_SUMMARY[cohortYear]?.first, HONOURS_SUMMARY[prevCohortYear]?.first, 'count')}
          />
          <SummaryStat
            icon={<GraduationCap className="h-4 w-4" />}
            label={t('gpa.honStats.summaryGrads')}
            value={String(HONOURS_SUMMARY[cohortYear]?.total ?? '—')}
            change={summaryDelta(HONOURS_SUMMARY[cohortYear]?.total, HONOURS_SUMMARY[prevCohortYear]?.total, 'count')}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="gap-2 px-4 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <CardTitle className="text-base">{t('gpa.honStats.chartTitle')}</CardTitle>
            <span className="shrink-0 text-right text-xs text-muted-foreground">{t('gpa.honStats.sources')}</span>
          </div>
          {/* Group-by + metric + cohort selection + sort, all on one row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Segmented options={groupButtons} value={groupBy} onChange={setGroupBy} />
            <span className="h-5 w-px bg-border" aria-hidden />
            <Segmented options={metricButtons} value={metric} onChange={setMetric} />
            <span className="h-5 w-px bg-border" aria-hidden />
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">{t('gpa.honStats.cohorts')}</span>
              {YEARS_ASC.map((y) => {
                const on = selectedYears.has(y);
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => toggleYear(y)}
                    aria-pressed={on}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                      on
                        ? 'border-transparent text-white'
                        : 'border-border text-muted-foreground hover:bg-primary/20 hover:text-foreground',
                    )}
                    style={on ? { backgroundColor: colorForYear(y) } : undefined}
                  >
                    {!on && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colorForYear(y) }} />}
                    {y}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setSort((s) => (s === 'value' ? 'name' : 'value'))}
              className="ml-auto flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-primary/15 hover:text-foreground"
            >
              {sort === 'value' ? <ArrowDownUp className="h-3.5 w-3.5" /> : <ArrowDownAZ className="h-3.5 w-3.5" />}
              {sort === 'value' ? t('gpa.honStats.sortValue', { year: String(sortYear) }) : t('gpa.honStats.sortName')}
            </button>
          </div>
        </CardHeader>
        <CardContent className="px-2 pb-3 sm:px-3">
          <div ref={chartWrapRef} style={{ height: chartHeight }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rows}
                layout="vertical"
                margin={{ top: 4, right: 48, left: 4, bottom: 4 }}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.18} horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 'dataMax']}
                  tick={{ fontSize: 11, fill: axisColor }}
                  tickLine={false}
                  axisLine={{ stroke: '#94a3b8', strokeOpacity: 0.3 }}
                  tickFormatter={(v) => (isRate ? `${Math.round(v * 100)}%` : String(v))}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={yAxisWidth}
                  tick={renderYTick}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <Tooltip
                  // On touch devices a hover trigger makes the tooltip flash
                  // (it shows on touch then clears on release). Use click so a
                  // tap shows it and it stays until the next tap; keep hover for
                  // mouse pointers.
                  trigger={isTouch ? 'click' : 'hover'}
                  cursor={{ fill: '#94a3b8', fillOpacity: 0.1 }}
                  allowEscapeViewBox={{ x: false, y: false }}
                  content={<HonoursTooltip metric={metric} activeYears={activeYears} t={t} maxWidth={tooltipMaxW} />}
                />
                {avgLines.map((a) => (
                  <ReferenceLine
                    key={`avg-${a.year}`}
                    x={a.value}
                    stroke={colorForYear(a.year)}
                    strokeDasharray="5 5"
                    strokeWidth={1.5}
                  />
                ))}
                {activeYears.map((y) => (
                  <Bar
                    key={y}
                    dataKey={`y${y}`}
                    fill={colorForYear(y)}
                    radius={[0, 3, 3, 0]}
                    isAnimationActive
                    animationDuration={500}
                  >
                    <LabelList
                      dataKey={`y${y}`}
                      position="right"
                      fontSize={10}
                      fill={labelColor}
                      formatter={(v: number | null) => (v == null ? '' : isRate ? `${(v * 100).toFixed(0)}%` : String(v))}
                    />
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {avgLines.length > 0 && (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 px-2 text-[11px] text-muted-foreground">
              {avgLines.map((a) => (
                <span key={a.year} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-0 w-5 border-t-2 border-dashed"
                    style={{ borderColor: colorForYear(a.year) }}
                  />
                  {t('gpa.honStats.uniAvg', { year: String(a.year), value: pct(a.value) })}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Tooltip — shows every active cohort plus year-over-year change.
// ----------------------------------------------------------------------------
function HonoursTooltip({ active, payload, metric, activeYears, t, maxWidth }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const row: Row = payload[0].payload;
  const years = row.years;
  const isRate = metric === 'rate';
  return (
    <div
      className="rounded-lg border bg-white px-3 py-2 text-sm shadow-md dark:bg-gray-900"
      style={{ maxWidth: maxWidth ?? 280 }}
    >
      <div className="mb-1.5 font-semibold leading-snug">{row.full}</div>
      <div className="space-y-1">
        {activeYears.map((y: number, i: number) => {
          const s = years[y];
          const val = valueOf(years, y, metric);
          const prevY = activeYears[i - 1];
          const prevVal = prevY != null ? valueOf(years, prevY, metric) : null;
          const diff = val != null && prevVal != null ? val - prevVal : null;
          return (
            <div key={y} className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: colorForYear(y) }} />
              <span className="tabular-nums font-medium">{y}</span>
              <span className="font-semibold tabular-nums">{fmtMetric(val, metric)}</span>
              {diff != null && Math.abs(diff) > 1e-9 && (
                <span
                  className={cn(
                    'text-xs tabular-nums',
                    diff > 0 ? 'text-emerald-500' : 'text-red-500',
                  )}
                >
                  {diff > 0 ? '▲' : '▼'}
                  {isRate ? `${Math.abs(diff * 100).toFixed(1)}%` : Math.abs(diff)}
                </span>
              )}
              {s && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {t('gpa.honStats.tipCounts', { first: String(s.first ?? '—'), total: String(s.total ?? '—') })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Small UI helpers
// ----------------------------------------------------------------------------
function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex gap-1">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          aria-pressed={value === o.key}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            // Note: --accent == --muted in this theme, so a hover:bg-accent would
            // be invisible. Use a primary (brand red) tint instead — clearly
            // visible and on-brand in both light and dark themes.
            value === o.key
              ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
              : 'bg-muted text-muted-foreground hover:bg-primary/20 hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Mirrors the calculator's SummaryCard layout: label on the left, value on the
// right, on a single row.
function SummaryStat({
  icon,
  label,
  value,
  change,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  change?: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-2 px-3 py-2.5">
        <span className="flex min-w-0 items-center gap-1.5 text-sm font-semibold">
          <span className="shrink-0 text-muted-foreground">{icon}</span>
          <span className="truncate">{label}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end leading-tight">
          <span className="text-xl font-bold tabular-nums">{value}</span>
          {change}
        </span>
      </CardContent>
    </Card>
  );
}

export default FirstClassHonoursSection;
