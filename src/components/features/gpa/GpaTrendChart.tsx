import { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
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
}

// Colours chosen to be legible in both light and dark themes.
const SERIES = {
  cgpa: '#2563eb', // blue-600
  termGpa: '#10b981', // emerald-500
};

const HONOURS_COLORS: Record<string, string> = {
  first: '#b91c1c', // red-700
  upperSecond: '#c2410c', // orange-700
  lowerSecond: '#a16207', // yellow-700
  third: '#525252', // neutral-600
  pass: '#78716c', // stone-500
};

const AWARD_COLORS = {
  presidentsList: '#7c3aed', // violet-600
  deansList: '#0891b2', // cyan-600
};

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

export function GpaTrendChart({ data, labels }: GpaTrendChartProps) {
  // Animate the lines drawing left-to-right ONLY on first mount. After the
  // initial reveal we disable animation so editing data updates the chart
  // smoothly instead of re-drawing from scratch every keystroke.
  const [animate, setAnimate] = useState(true);

  const hasData = data.some((d) => d.cgpa != null || d.termGpa != null);

  const refLineLabel = (text: string, value: number, color: string) => ({
    value: `${text} ${value.toFixed(2)}`,
    position: 'right' as const,
    fill: color,
    fontSize: 10,
    fontWeight: 600,
  });

  return (
    <div className="relative w-full" style={{ height: 340 }}>
      {!hasData && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-muted-foreground pointer-events-none">
          {labels.empty}
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 64, left: -8, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
          <XAxis
            dataKey="term"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={50}
            tickLine={false}
          />
          <YAxis
            domain={[0, 4]}
            ticks={[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4]}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip labels={labels} />} />

          {/* Honours classification cut-offs (dashed) */}
          {HONOURS_TIERS.map((tier) => (
            <ReferenceLine
              key={tier.key}
              y={tier.cgpa}
              stroke={HONOURS_COLORS[tier.key]}
              strokeDasharray="6 4"
              strokeOpacity={0.85}
              label={refLineLabel((labels as any)[tier.key], tier.cgpa, HONOURS_COLORS[tier.key])}
            />
          ))}

          {/* Merit lists (distinct colours + dash pattern) */}
          <ReferenceLine
            y={AWARD_LINES.presidentsList}
            stroke={AWARD_COLORS.presidentsList}
            strokeDasharray="2 4"
            strokeWidth={1.5}
            label={refLineLabel(labels.presidentsList, AWARD_LINES.presidentsList, AWARD_COLORS.presidentsList)}
          />
          <ReferenceLine
            y={AWARD_LINES.deansList}
            stroke={AWARD_COLORS.deansList}
            strokeDasharray="2 4"
            strokeWidth={1.5}
            label={refLineLabel(labels.deansList, AWARD_LINES.deansList, AWARD_COLORS.deansList)}
          />

          {/* Term GPA */}
          <Line
            type="monotone"
            dataKey="termGpa"
            name={labels.termGpa}
            stroke={SERIES.termGpa}
            strokeWidth={2}
            dot={{ r: 3, fill: SERIES.termGpa }}
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
            name={labels.cgpa}
            stroke={SERIES.cgpa}
            strokeWidth={3}
            dot={{ r: 4, fill: SERIES.cgpa }}
            activeDot={{ r: 6 }}
            connectNulls
            isAnimationActive={animate}
            animationDuration={1600}
            animationEasing="ease-out"
            onAnimationEnd={() => setAnimate(false)}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
