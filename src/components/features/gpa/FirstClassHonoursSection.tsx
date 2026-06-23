import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
import { Award, GraduationCap, Medal, Trophy, ArrowDownUp, ArrowDownAZ } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  HONOURS_PROGRAMME_STATS,
  HONOURS_SUMMARY,
  HONOURS_YEARS,
  HONOURS_SOURCES,
  type HonoursProgrammeStat,
} from '@/data/firstClassHonours';

type Metric = 'rate' | 'first' | 'total';
type SortMode = 'value' | 'name';
type Lang = 'en' | 'zh-TW' | 'zh-CN';

// Categorical palette — the most recent cohort takes the brand red (emphasis),
// earlier cohorts take cooler, harmonious hues. Index 0 = latest year.
const PALETTE = ['#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ec4899'];

const YEARS_ASC = [...HONOURS_YEARS].sort((a, b) => a - b);
const LATEST_YEAR = YEARS_ASC[YEARS_ASC.length - 1];
const PREV_YEAR = YEARS_ASC[YEARS_ASC.length - 2];

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

const valueOf = (p: HonoursProgrammeStat, year: number, metric: Metric): number | null => {
  const s = p.years[year];
  if (!s) return null;
  return metric === 'rate' ? s.pct : metric === 'first' ? s.first : s.total;
};
const fmtMetric = (v: number | null | undefined, metric: Metric) =>
  v == null ? '—' : metric === 'rate' ? pct(v) : String(v);

interface Row {
  name: string;
  full: string;
  p: HonoursProgrammeStat;
  [k: `y${number}`]: number | null | string | HonoursProgrammeStat;
}

export function FirstClassHonoursSection() {
  const { t, language } = useLanguage();
  const lang = language as Lang;
  const isDark = useIsDark();
  const axisColor = isDark ? '#d1d5db' : '#111827';
  const labelColor = isDark ? '#cbd5e1' : '#475569';

  const [metric, setMetric] = useState<Metric>('rate');
  const [sort, setSort] = useState<SortMode>('value');
  const [selectedYears, setSelectedYears] = useState<Set<number>>(() => new Set(YEARS_ASC));

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

  const rows = useMemo<Row[]>(() => {
    const built = HONOURS_PROGRAMME_STATS.map((p) => {
      const row: Row = { name: shortName(p, lang), full: fullName(p, lang), p };
      for (const y of activeYears) row[`y${y}`] = valueOf(p, y, metric);
      return row;
    });
    if (sort === 'name') {
      built.sort((a, b) => a.name.localeCompare(b.name, lang === 'en' ? 'en' : 'zh'));
    } else {
      built.sort((a, b) => ((b[`y${sortYear}`] as number | null) ?? -1) - ((a[`y${sortYear}`] as number | null) ?? -1));
    }
    return built;
  }, [metric, lang, sort, activeYears, sortYear]);

  // Compact rows; height scales with how many cohorts are shown.
  const perRow = activeYears.length * 12 + 12;
  const chartHeight = rows.length * perRow + 36;
  const yAxisWidth = lang === 'en' ? 176 : 132;
  const maxLabelChars = lang === 'en' ? 26 : 11;

  const renderYTick = ({ x, y, payload }: any) => {
    const label: string = payload.value;
    const shown = label.length > maxLabelChars ? `${label.slice(0, maxLabelChars - 1)}…` : label;
    return (
      <text x={x} y={y} dy={4} textAnchor="end" fontSize={11} fill={axisColor}>
        {shown}
      </text>
    );
  };

  const metricButtons: { key: Metric; label: string }[] = [
    { key: 'rate', label: t('gpa.honStats.metricRate') },
    { key: 'first', label: t('gpa.honStats.metricFirst') },
    { key: 'total', label: t('gpa.honStats.metricTotal') },
  ];

  // One university-average line per selected cohort (rate mode only).
  const avgLines = isRate
    ? activeYears
        .map((y) => ({ year: y, value: HONOURS_SUMMARY[y]?.pct }))
        .filter((a): a is { year: number; value: number } => a.value != null)
    : [];

  return (
    <div className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <Trophy className="h-5 w-5 text-red-500" /> {t('gpa.honStats.title')}
      </h2>

      {/* University-wide summary (latest cohort) */}
      <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <SummaryStat
          icon={<Award className="h-4 w-4" />}
          label={t('gpa.honStats.summaryRate')}
          value={pct(HONOURS_SUMMARY[LATEST_YEAR]?.pct)}
          prev={pct(HONOURS_SUMMARY[PREV_YEAR]?.pct)}
        />
        <SummaryStat
          icon={<Medal className="h-4 w-4" />}
          label={t('gpa.honStats.summaryFirst')}
          value={String(HONOURS_SUMMARY[LATEST_YEAR]?.first ?? '—')}
          prev={String(HONOURS_SUMMARY[PREV_YEAR]?.first ?? '—')}
        />
        <SummaryStat
          icon={<GraduationCap className="h-4 w-4" />}
          label={t('gpa.honStats.summaryGrads')}
          value={String(HONOURS_SUMMARY[LATEST_YEAR]?.total ?? '—')}
          prev={String(HONOURS_SUMMARY[PREV_YEAR]?.total ?? '—')}
        />
      </div>

      <Card>
        <CardHeader className="gap-2 px-4 py-3">
          <CardTitle className="text-base">{t('gpa.honStats.chartTitle')}</CardTitle>
          {/* Metric + cohort selection + sort, all on one row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
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
                      on ? 'border-transparent text-white' : 'border-border text-muted-foreground hover:bg-accent',
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
              className="ml-auto flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {sort === 'value' ? <ArrowDownUp className="h-3.5 w-3.5" /> : <ArrowDownAZ className="h-3.5 w-3.5" />}
              {sort === 'value' ? t('gpa.honStats.sortValue', { year: String(sortYear) }) : t('gpa.honStats.sortName')}
            </button>
          </div>
        </CardHeader>
        <CardContent className="px-2 pb-3 sm:px-3">
          <div style={{ height: chartHeight }} className="w-full">
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
                  cursor={{ fill: '#94a3b8', fillOpacity: 0.1 }}
                  content={<HonoursTooltip metric={metric} activeYears={activeYears} t={t} />}
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

          {/* Sources */}
          <div className="mt-3 space-y-1 border-t pt-3">
            <p className="text-[11px] font-medium text-muted-foreground">{t('gpa.honStats.sources')}</p>
            {activeYears.map((y) => {
              const src = HONOURS_SOURCES[y];
              if (!src) return null;
              // English UI shows only the English source title; zh UIs append the
              // localized graduate-list name.
              const localized = lang === 'zh-CN' ? src.sc : src.tc;
              const label = lang === 'en' ? src.en : `${src.en} · ${localized}`;
              return (
                <p key={y} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: colorForYear(y) }}
                  />
                  <span className="tabular-nums font-medium text-foreground/80">{y}</span>
                  <span>· {label}</span>
                </p>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Tooltip — shows every active cohort plus year-over-year change.
// ----------------------------------------------------------------------------
function HonoursTooltip({ active, payload, metric, activeYears, t }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const row: Row = payload[0].payload;
  const p = row.p;
  const isRate = metric === 'rate';
  return (
    <div className="max-w-[280px] rounded-lg border bg-white px-3 py-2 text-sm shadow-md dark:bg-gray-900">
      <div className="mb-1.5 font-semibold leading-snug">{row.full}</div>
      <div className="space-y-1">
        {activeYears.map((y: number, i: number) => {
          const s = p.years[y];
          const val = valueOf(p, y, metric);
          const prevY = activeYears[i - 1];
          const prevVal = prevY != null ? valueOf(p, prevY, metric) : null;
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
    <div className="inline-flex rounded-lg bg-muted/60 p-0.5">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          aria-pressed={value === o.key}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            value === o.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SummaryStat({
  icon,
  label,
  value,
  prev,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  prev?: string;
}) {
  return (
    <Card>
      <CardContent className="px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <span className="shrink-0 text-muted-foreground">{icon}</span>
          <span className="truncate">{label}</span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums">{value}</span>
          <span className="text-xs text-muted-foreground">{LATEST_YEAR}</span>
          {prev != null && (
            <span className="ml-auto text-xs tabular-nums text-muted-foreground">
              {PREV_YEAR}: <span className="font-medium text-foreground/70">{prev}</span>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default FirstClassHonoursSection;
