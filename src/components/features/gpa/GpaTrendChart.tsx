import { useEffect, useRef, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { HONOURS_TIERS, AWARD_LINES } from '@/utils/honours';

export interface GpaChartPoint {
  term: string;
  termGpa: number | null;
  cgpa: number | null;
}

export interface GpaTrendLabels {
  termGpa: string;
  cgpa: string;
  first: string;
  upperSecond: string;
  lowerSecond: string;
  third: string;
  pass: string;
  deansList: string;
  presidentsList: string;
  empty: string;
}

interface GpaTrendChartProps {
  data: GpaChartPoint[];
  labels: GpaTrendLabels;
  /** When true, force the Y axis to span the full 0–4 range. */
  fullScale?: boolean;
  /** Show the honours classification cut-off lines. */
  showHonours?: boolean;
  /** Show the Dean's / President's List lines. */
  showAwards?: boolean;
}

// Series colours — bright enough to read on both light and dark backgrounds.
const SERIES = {
  cgpa: '#3b82f6', // blue-500
  termGpa: '#10b981', // emerald-500
};

// Reference lines use only THREE colours to avoid clutter: a single neutral
// tone for every honours cut-off (the labels tell them apart) plus one accent
// each for the two merit lists. All three read clearly in dark mode.
const HONOURS_LINE = '#94a3b8'; // slate-400
const AWARD_COLORS = {
  presidentsList: '#f59e0b', // amber-500
  deansList: '#22d3ee', // cyan-400
};

/** Reactively track the active theme so SVG axis text (which can't read CSS
 *  variables) stays high-contrast: near-black in light mode, light-grey in dark. */
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

function CustomTooltip({ active, payload, label, labels }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const cgpa = payload.find((p: any) => p.dataKey === 'cgpa')?.value;
  const termGpa = payload.find((p: any) => p.dataKey === 'termGpa')?.value;
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 px-3 py-2 shadow-md text-sm">
      <div className="font-semibold mb-1">{label}</div>
      {termGpa != null && (
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: SERIES.termGpa }} />
          <span className="text-muted-foreground">{labels.termGpa}:</span>
          <span className="font-medium tabular-nums">{Number(termGpa).toFixed(3)}</span>
        </div>
      )}
      {cgpa != null && (
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: SERIES.cgpa }} />
          <span className="text-muted-foreground">{labels.cgpa}:</span>
          <span className="font-medium tabular-nums">{Number(cgpa).toFixed(3)}</span>
        </div>
      )}
    </div>
  );
}

export function GpaTrendChart({ data, labels, fullScale, showHonours = true, showAwards = true }: GpaTrendChartProps) {
  // Animate the lines drawing left-to-right ONLY on first mount.
  const [animate, setAnimate] = useState(true);
  const isDark = useIsDark();
  const axisColor = isDark ? '#d1d5db' : '#111827'; // gray-300 in dark, near-black in light

  // Measure the chart width so we only rotate x-axis labels (to a full 90°)
  // when keeping them horizontal would make them overlap.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const values = data.flatMap((d) => [d.termGpa, d.cgpa]).filter((v): v is number => v != null);
  const hasData = values.length > 0;

  // ~52px is enough for a horizontal "22/23-T1" label; rotate to vertical only
  // when the per-tick width drops below that.
  const perTick = data.length > 0 ? Math.max(0, width - 52) / data.length : Infinity;
  const rotate = width > 0 && perTick < 56;

  // Dynamic lower bound: when GPAs are clustered high, zoom in so the trend is
  // legible; capped at 3.0 so there's always at least a 1.0 window, and never
  // below 0. The user can override with the full-scale toggle.
  let lower = 0;
  if (!fullScale && hasData) {
    const minVal = Math.min(...values);
    lower = Math.min(3, Math.max(0, Math.floor((minVal - 0.5) * 2) / 2));
  }
  const span = 4 - lower;
  const step = span <= 1 ? 0.25 : 0.5;
  const ticks: number[] = [];
  for (let v = lower; v <= 4 + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);

  // Value-only labels keep the right margin compact so nothing overflows on
  // mobile; the legend below the chart maps each colour to its name.
  const refLabel = (value: number, color: string) => ({
    value: value.toFixed(2),
    position: 'right' as const,
    fill: color,
    fontSize: 10,
    fontWeight: 700,
  });

  return (
    <div ref={wrapRef} className="relative w-full" style={{ height: 340 }}>
      {!hasData && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-muted-foreground pointer-events-none">
          {labels.empty}
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 40, left: -6, bottom: rotate ? 6 : 4 }}>
          <defs>
            <linearGradient id="gpaCgpaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES.cgpa} stopOpacity={0.28} />
              <stop offset="100%" stopColor={SERIES.cgpa} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.18} vertical={false} />
          <XAxis
            dataKey="term"
            tick={{ fontSize: 11, fill: axisColor }}
            interval={0}
            angle={rotate ? -90 : 0}
            textAnchor={rotate ? 'end' : 'middle'}
            height={rotate ? 60 : 22}
            tickMargin={8}
            tickLine={false}
            axisLine={{ stroke: '#94a3b8', strokeOpacity: 0.3 }}
          />
          <YAxis
            domain={[lower, 4]}
            ticks={ticks}
            tick={{ fontSize: 11, fill: axisColor }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip labels={labels} />} />

          {/* Honours classification cut-offs — all one neutral colour */}
          {showHonours &&
            HONOURS_TIERS.map((tier) => (
              <ReferenceLine
                key={tier.key}
                y={tier.cgpa}
                stroke={HONOURS_LINE}
                strokeDasharray="5 5"
                strokeOpacity={0.7}
                label={refLabel(tier.cgpa, HONOURS_LINE)}
              />
            ))}

          {/* Merit lists — one accent colour each */}
          {showAwards && (
            <ReferenceLine
              y={AWARD_LINES.presidentsList}
              stroke={AWARD_COLORS.presidentsList}
              strokeDasharray="2 3"
              strokeWidth={1.5}
              label={refLabel(AWARD_LINES.presidentsList, AWARD_COLORS.presidentsList)}
            />
          )}
          {showAwards && (
            <ReferenceLine
              y={AWARD_LINES.deansList}
              stroke={AWARD_COLORS.deansList}
              strokeDasharray="2 3"
              strokeWidth={1.5}
              label={refLabel(AWARD_LINES.deansList, AWARD_COLORS.deansList)}
            />
          )}

          {/* Cumulative GPA gradient fill */}
          <Area
            type="monotone"
            dataKey="cgpa"
            stroke="none"
            fill="url(#gpaCgpaFill)"
            connectNulls
            isAnimationActive={animate}
            animationDuration={1600}
            animationEasing="ease-out"
          />
          {/* Term GPA */}
          <Line
            type="monotone"
            dataKey="termGpa"
            stroke={SERIES.termGpa}
            strokeWidth={2}
            dot={{ r: 3, fill: SERIES.termGpa, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls
            isAnimationActive={animate}
            animationDuration={1400}
            animationEasing="ease-out"
          />
          {/* Cumulative GPA (primary) */}
          <Line
            type="monotone"
            dataKey="cgpa"
            stroke={SERIES.cgpa}
            strokeWidth={3}
            dot={{ r: 3.5, fill: SERIES.cgpa, strokeWidth: 0 }}
            activeDot={{ r: 6 }}
            connectNulls
            isAnimationActive={animate}
            animationDuration={1600}
            animationEasing="ease-out"
            onAnimationEnd={() => setAnimate(false)}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
