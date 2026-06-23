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
} from 'recharts';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, GraduationCap, Medal, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  HONOURS_PROGRAMME_STATS,
  HONOURS_SUMMARY,
  type HonoursProgrammeStat,
} from '@/data/firstClassHonours';

type Metric = 'rate' | 'first' | 'total';
type Lang = 'en' | 'zh-TW' | 'zh-CN';

// Two cohort colours — red shades echo the "first-class" theme and read on
// both light and dark backgrounds. 2024 is the muted shade, 2025 the accent.
const YEAR_COLORS = {
  y2024: '#fca5a5', // red-300
  y2025: '#ef4444', // red-500
};
const AVG_LINE = '#6366f1'; // indigo-500 — the university-average reference line

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

function fullName(p: HonoursProgrammeStat, lang: Lang): string {
  return lang === 'en' ? p.en : lang === 'zh-CN' ? p.sc : p.tc;
}

const pct = (v: number | null) => (v == null ? '—' : `${(v * 100).toFixed(1)}%`);

interface Row {
  name: string;
  full: string;
  v2024: number | null;
  v2025: number | null;
  total2024: number | null;
  first2024: number | null;
  pct2024: number | null;
  total2025: number | null;
  first2025: number | null;
  pct2025: number | null;
}

function CustomTooltip({ active, payload, metric, t }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const r: Row = payload[0].payload;
  const line = (year: string, total: number | null, first: number | null, p: number | null, color: string) => (
    <div className="mt-1.5 first:mt-0">
      <div className="flex items-center gap-2 font-semibold">
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
        {year}
      </div>
      <div className="ml-4 grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        <span>{t('gpa.honStats.tipRate')}</span>
        <span className="text-right font-medium tabular-nums text-foreground">{pct(p)}</span>
        <span>{t('gpa.honStats.tipFirst')}</span>
        <span className="text-right font-medium tabular-nums text-foreground">{first ?? '—'}</span>
        <span>{t('gpa.honStats.tipTotal')}</span>
        <span className="text-right font-medium tabular-nums text-foreground">{total ?? '—'}</span>
      </div>
    </div>
  );
  return (
    <div className="max-w-[260px] rounded-lg border bg-white px-3 py-2 text-sm shadow-md dark:bg-gray-900">
      <div className="mb-1.5 font-semibold leading-snug">{r.full}</div>
      {line('2024', r.total2024, r.first2024, r.pct2024, YEAR_COLORS.y2024)}
      {line('2025', r.total2025, r.first2025, r.pct2025, YEAR_COLORS.y2025)}
    </div>
  );
}

export function FirstClassHonoursSection() {
  const { t, language } = useLanguage();
  const lang = language as Lang;
  const isDark = useIsDark();
  const axisColor = isDark ? '#d1d5db' : '#111827';
  const [metric, setMetric] = useState<Metric>('rate');

  const rows = useMemo<Row[]>(() => {
    const pick = (p: HonoursProgrammeStat, year: '2024' | '2025') =>
      metric === 'rate'
        ? year === '2024'
          ? p.pct2024
          : p.pct2025
        : metric === 'first'
          ? year === '2024'
            ? p.first2024
            : p.first2025
          : year === '2024'
            ? p.total2024
            : p.total2025;
    return HONOURS_PROGRAMME_STATS.map((p) => ({
      name: shortName(p, lang),
      full: fullName(p, lang),
      v2024: pick(p, '2024'),
      v2025: pick(p, '2025'),
      total2024: p.total2024,
      first2024: p.first2024,
      pct2024: p.pct2024,
      total2025: p.total2025,
      first2025: p.first2025,
      pct2025: p.pct2025,
    }))
      // Sort by the latest year (2025) descending; programmes without 2025 data sink.
      .sort((a, b) => (b.v2025 ?? -1) - (a.v2025 ?? -1));
  }, [metric, lang]);

  const isRate = metric === 'rate';
  const avg2025 = HONOURS_SUMMARY.firstClassPct.y2025;

  // One band per programme; tall enough for two grouped bars to stay readable.
  const chartHeight = rows.length * 34 + 48;
  const yAxisWidth = lang === 'en' ? 176 : 132;
  const maxLabelChars = lang === 'en' ? 26 : 11;

  // Truncate long programme names with an ellipsis (full name is in the tooltip)
  // so they never clip into the plot area.
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

  return (
    <div className="mt-8">
      <div className="mb-2 flex flex-col gap-0.5">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Trophy className="h-5 w-5 text-red-500" /> {t('gpa.honStats.title')}
        </h2>
        <p className="text-xs text-muted-foreground">{t('gpa.honStats.subtitle')}</p>
      </div>

      {/* University-wide summary */}
      <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <SummaryStat
          icon={<Award className="h-4 w-4" />}
          label={t('gpa.honStats.summaryRate')}
          value={pct(HONOURS_SUMMARY.firstClassPct.y2025)}
          sub={t('gpa.honStats.trendNote', {
            y2013: pct(HONOURS_SUMMARY.firstClassPct.y2013),
            y2024: pct(HONOURS_SUMMARY.firstClassPct.y2024),
          })}
        />
        <SummaryStat
          icon={<Medal className="h-4 w-4" />}
          label={t('gpa.honStats.summaryFirst')}
          value={String(HONOURS_SUMMARY.firstClass.y2025)}
          sub={t('gpa.honStats.vsPrev', { value: String(HONOURS_SUMMARY.firstClass.y2024) })}
        />
        <SummaryStat
          icon={<GraduationCap className="h-4 w-4" />}
          label={t('gpa.honStats.summaryGrads')}
          value={String(HONOURS_SUMMARY.totalStudents.y2025)}
          sub={t('gpa.honStats.vsPrev', { value: String(HONOURS_SUMMARY.totalStudents.y2024) })}
        />
      </div>

      <Card>
        <CardHeader className="px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">{t('gpa.honStats.chartTitle')}</CardTitle>
            <div className="flex flex-wrap items-center gap-1">
              {metricButtons.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => setMetric(b.key)}
                  aria-pressed={metric === b.key}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs transition-colors',
                    metric === b.key
                      ? 'bg-accent text-foreground'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 pb-3 sm:px-3">
          {/* Legend */}
          <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-2 text-sm">
            <LegendDot color={YEAR_COLORS.y2024} label="2024" />
            <LegendDot color={YEAR_COLORS.y2025} label="2025" />
            {isRate && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="inline-block h-0 w-5 border-t-2 border-dashed" style={{ borderColor: AVG_LINE }} />
                {t('gpa.honStats.uniAvg', { value: pct(avg2025) })}
              </span>
            )}
          </div>
          <div style={{ height: chartHeight }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rows}
                layout="vertical"
                margin={{ top: 4, right: 44, left: 4, bottom: 4 }}
                barCategoryGap="22%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.18} horizontal={false} />
                <XAxis
                  type="number"
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
                  content={<CustomTooltip metric={metric} t={t} />}
                />
                {isRate && (
                  <ReferenceLine
                    x={avg2025}
                    stroke={AVG_LINE}
                    strokeDasharray="5 5"
                    strokeWidth={1.5}
                  />
                )}
                <Bar dataKey="v2024" name="2024" fill={YEAR_COLORS.y2024} radius={[0, 3, 3, 0]} isAnimationActive={false} />
                <Bar dataKey="v2025" name="2025" fill={YEAR_COLORS.y2025} radius={[0, 3, 3, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 px-2 text-[11px] text-muted-foreground">{t('gpa.honStats.source')}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
      <span className="inline-block h-3 w-3 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

function SummaryStat({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
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
          <span className="text-xs text-muted-foreground">2025</span>
        </div>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default FirstClassHonoursSection;
