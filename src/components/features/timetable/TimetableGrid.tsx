import { useMemo } from 'react';
import { DAY_ORDER, meetingsOverlap, type TimetableSection } from '@/services/timetableService';

export type DayFormat = 'short' | 'long' | 'zh';

/** Which pieces of info to render inside each class block. */
export interface BlockFields {
  code: boolean;
  title: boolean;
  type: boolean;
  venue: boolean;
  instructor: boolean;
  time: boolean;
}

export const DEFAULT_BLOCK_FIELDS: BlockFields = {
  code: true,
  title: true,
  type: true,
  venue: true,
  instructor: true,
  time: true,
};

interface TimetableGridProps {
  sections: TimetableSection[];
  /** Section ids that clash with another selected section (rendered with a warning ring). */
  conflictIds?: Set<string>;
  /** Per-section colour (id → CSS colour). Falls back to a neutral grey. */
  colorMap?: Map<string, string>;
  /** When true, the grid renders at full width without horizontal scrolling (for image/PDF export). */
  forExport?: boolean;
  /** Show the half-hour sub gridlines (default true). */
  showSubGrid?: boolean;
  /** Use 24-hour time labels; false → 12-hour AM/PM (default true). */
  use24Hour?: boolean;
  /** Day-header label style (default 'short'). */
  dayFormat?: DayFormat;
  /** Which info lines to render inside each block (default: all). */
  fields?: BlockFields;
  /** Manual vertical range (whole-hour). When omitted, the range is auto-cropped. */
  rangeStart?: number;
  rangeEnd?: number;
  /** Which days to render as columns (default Mon–Fri). */
  days?: string[];
  /** Week start — 'sun' puts Sunday first (default 'mon'). */
  firstDay?: 'sun' | 'mon';
}

const DEFAULT_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

const DAY_LABEL_SETS: Record<DayFormat, Record<string, string>> = {
  short: { MON: 'MON', TUE: 'TUE', WED: 'WED', THU: 'THU', FRI: 'FRI', SAT: 'SAT', SUN: 'SUN' },
  long: {
    MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday',
    FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday',
  },
  zh: {
    MON: '星期一', TUE: '星期二', WED: '星期三', THU: '星期四',
    FRI: '星期五', SAT: '星期六', SUN: '星期日',
  },
};

interface PositionedBlock {
  section: TimetableSection;
  day: string;
  start: string;
  end: string;
  startMinutes: number;
  endMinutes: number;
  venues: string[];
  type: string;
  conflict: boolean;
  // layout (computed per day)
  column: number;
  columns: number;
}

// Fallback range used only when nothing is selected yet.
const DEFAULT_START_MIN = 8 * 60; // 08:00
const DEFAULT_END_MIN = 18 * 60; // 18:00

const FALLBACK_COLOR = '#64748b';

/** Format a "HH:MM" string in either 24-hour or 12-hour notation. */
function formatTime(hhmm: string, use24: boolean): string {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(h)) return hhmm;
  if (use24) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/** Format a whole-hour tick label (e.g. "13:00" or "1 PM"). */
function formatHourTick(h: number, use24: boolean): string {
  if (use24) return `${String(h).padStart(2, '0')}:00`;
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12} ${period}`;
}

/** Lay out overlapping blocks in a day into side-by-side columns. */
function layoutDay(blocks: PositionedBlock[]): PositionedBlock[] {
  const sorted = [...blocks].sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);
  // Greedy interval colouring: assign each block to the first column whose last
  // block does not overlap it.
  const columnEnds: number[] = [];
  for (const block of sorted) {
    let placed = false;
    for (let c = 0; c < columnEnds.length; c++) {
      if (block.startMinutes >= columnEnds[c]) {
        block.column = c;
        columnEnds[c] = block.endMinutes + 1;
        placed = true;
        break;
      }
    }
    if (!placed) {
      block.column = columnEnds.length;
      columnEnds.push(block.endMinutes + 1);
    }
  }
  const totalColumns = Math.max(1, columnEnds.length);
  for (const block of sorted) block.columns = totalColumns;
  return sorted;
}

export function TimetableGrid({
  sections,
  conflictIds,
  colorMap,
  forExport,
  showSubGrid = true,
  use24Hour = true,
  dayFormat = 'short',
  fields = DEFAULT_BLOCK_FIELDS,
  rangeStart,
  rangeEnd,
  days,
  firstDay = 'mon',
}: TimetableGridProps) {
  const dayLabels = DAY_LABEL_SETS[dayFormat];

  const { visibleDays, blocksByDay } = useMemo(() => {
    const byDay: Record<string, PositionedBlock[]> = {};
    for (const day of DAY_ORDER) byDay[day] = [];

    for (const section of sections) {
      // Merge meetings that share the same day+time (different venues) into one block.
      const grouped = new Map<string, PositionedBlock>();
      for (const m of section.meetings) {
        const key = `${m.day}-${m.startMinutes}-${m.endMinutes}`;
        const existing = grouped.get(key);
        if (existing) {
          if (m.venue && !existing.venues.includes(m.venue)) existing.venues.push(m.venue);
        } else {
          grouped.set(key, {
            section,
            day: m.day,
            start: m.start,
            end: m.end,
            startMinutes: m.startMinutes,
            endMinutes: m.endMinutes,
            venues: m.venue ? [m.venue] : [],
            type: m.type,
            conflict: false,
            column: 0,
            columns: 1,
          });
        }
      }
      for (const block of grouped.values()) byDay[block.day].push(block);
    }

    // Mark conflicting blocks (cell-level) so users see exactly which slots clash.
    const allBlocks = DAY_ORDER.flatMap((d) => byDay[d]);
    for (let i = 0; i < allBlocks.length; i++) {
      for (let j = i + 1; j < allBlocks.length; j++) {
        const a = allBlocks[i];
        const b = allBlocks[j];
        if (a.section.id === b.section.id) continue;
        if (meetingsOverlap(
          { day: a.day, startMinutes: a.startMinutes, endMinutes: a.endMinutes } as any,
          { day: b.day, startMinutes: b.startMinutes, endMinutes: b.endMinutes } as any,
        )) {
          a.conflict = true;
          b.conflict = true;
        }
      }
    }

    for (const day of DAY_ORDER) byDay[day] = layoutDay(byDay[day]);

    // Render exactly the chosen days, ordered by the chosen week start.
    const allowed = days && days.length ? days : DEFAULT_DAYS;
    const order =
      firstDay === 'sun'
        ? ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
        : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const visible = order.filter((d) => allowed.includes(d));
    return { visibleDays: visible, blocksByDay: byDay };
  }, [sections, days, firstDay]);

  // Dynamic vertical range: span only the hours actually used by the selected
  // sections (rounded to whole hours). Falls back to a default when empty.
  const { startHour, endHour } = useMemo(() => {
    // Manual whole-hour range overrides the auto-cropped range.
    if (rangeStart != null && rangeEnd != null) {
      const s = Math.floor(rangeStart);
      const e = Math.max(s + 1, Math.ceil(rangeEnd));
      return { startHour: s, endHour: e };
    }
    let minStart = Infinity;
    let maxEnd = -Infinity;
    for (const section of sections) {
      for (const m of section.meetings) {
        minStart = Math.min(minStart, m.startMinutes);
        maxEnd = Math.max(maxEnd, m.endMinutes + 1); // inclusive end (16:29 → 16:30)
      }
    }
    if (!Number.isFinite(minStart) || !Number.isFinite(maxEnd)) {
      return { startHour: DEFAULT_START_MIN / 60, endHour: DEFAULT_END_MIN / 60 };
    }
    return { startHour: Math.floor(minStart / 60), endHour: Math.ceil(maxEnd / 60) };
  }, [sections, rangeStart, rangeEnd]);

  const dayStartMin = startHour * 60;
  const dayEndMin = endHour * 60;

  // Sizing — the exported (PDF/PNG) grid is rendered much taller with large,
  // bold text for readability; the on-screen grid is a touch larger too.
  const hourHeight = forExport ? 108 : 60;
  const sz = forExport
    ? { code: 'text-[20px] font-extrabold', title: 'text-[17px] font-bold', meta: 'text-[15px] font-semibold', pad: 'px-2.5 py-2', gutter: 'text-[15px] font-bold', header: 'text-xl font-bold', headerH: 'h-14' }
    : { code: 'text-[13px] font-bold', title: 'text-[12px] font-semibold', meta: 'text-[11px] font-medium', pad: 'px-1.5 py-1', gutter: 'text-[12px] font-semibold', header: 'text-sm font-semibold', headerH: 'h-10' };
  // Minimum block height before each extra line of text is shown (scaled for export).
  const show = forExport
    ? { type: 88, instructor: 124, time: 160 }
    : { type: 48, instructor: 68, time: 92 };

  const hours: number[] = [];
  for (let h = startHour; h <= endHour; h++) hours.push(h);
  const gridHeight = ((dayEndMin - dayStartMin) / 60) * hourHeight;

  const TIME_COL = forExport ? 64 : 50; // px

  return (
    <div className={`${forExport ? 'overflow-visible' : 'overflow-hidden'} rounded-lg border bg-card`}>
      <div className="w-full">
        {/* Header row with day names */}
        <div
          className="grid border-b bg-muted/40"
          style={{ gridTemplateColumns: `${TIME_COL}px repeat(${visibleDays.length}, minmax(0, 1fr))` }}
        >
          <div className={sz.headerH} />
          {visibleDays.map((day) => (
            <div key={day} className={`${sz.headerH} ${sz.header} flex items-center justify-center border-l`}>
              {dayLabels[day]}
            </div>
          ))}
        </div>

        {/* Body */}
        <div
          className="grid"
          style={{ gridTemplateColumns: `${TIME_COL}px repeat(${visibleDays.length}, minmax(0, 1fr))` }}
        >
          {/* Time gutter */}
          <div className="relative" style={{ height: gridHeight }}>
            {hours.map((h, idx) => {
              // Hide the first and last labels (they sit on the grid edges).
              if (idx === 0 || idx === hours.length - 1) return null;
              return (
                <div
                  key={h}
                  className={`absolute left-0 right-1 ${sz.gutter} text-muted-foreground text-right pr-1`}
                  style={{ top: idx * hourHeight - 6 }}
                >
                  {formatHourTick(h, use24Hour)}
                </div>
              );
            })}
          </div>

          {/* Day columns */}
          {visibleDays.map((day) => (
            <div key={day} className="relative border-l overflow-hidden" style={{ height: gridHeight }}>
              {/* Hour gridlines */}
              {hours.map((h, idx) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-border/50"
                  style={{ top: idx * hourHeight }}
                />
              ))}

              {/* Half-hour sub gridlines — thinner, lighter grey, dashed */}
              {showSubGrid && hours.slice(0, -1).map((h, idx) => (
                <div
                  key={`half-${h}`}
                  className="absolute left-0 right-0 border-t border-dashed border-gray-400/25 dark:border-gray-500/25"
                  style={{ top: idx * hourHeight + hourHeight / 2 }}
                />
              ))}

              {/* Class blocks */}
              {blocksByDay[day].map((block, idx) => {
                const top = ((block.startMinutes - dayStartMin) / 60) * hourHeight;
                const height = Math.max(
                  ((block.endMinutes + 1 - block.startMinutes) / 60) * hourHeight - 2,
                  forExport ? 36 : 22,
                );
                const widthPct = 100 / block.columns;
                const leftPct = block.column * widthPct;
                const bg = colorMap?.get(block.section.id) ?? FALLBACK_COLOR;
                const isConflict = block.conflict || conflictIds?.has(block.section.id);
                return (
                  <div
                    key={`${block.section.id}-${idx}`}
                    className={`absolute rounded-md ${sz.pad} text-white overflow-hidden shadow-sm`}
                    style={{
                      top,
                      height,
                      left: `calc(${leftPct}% + 2px)`,
                      width: `calc(${widthPct}% - 4px)`,
                      backgroundColor: bg,
                      outline: isConflict ? '2px solid #ef4444' : undefined,
                      outlineOffset: isConflict ? '-2px' : undefined,
                    }}
                    title={`${block.section.courseCode} (${block.type}) · ${block.section.courseTitle}\n${formatTime(block.start, use24Hour)} - ${formatTime(block.end, use24Hour)}${block.venues.length ? ` · ${block.venues.join(', ')}` : ''}\n${block.section.instructors.join(', ')}`}
                  >
                    {fields.code && (
                      <div className={`${sz.code} leading-tight truncate`}>
                        {block.section.courseCode}
                      </div>
                    )}
                    {fields.title && (
                      <div className={`${sz.title} leading-tight opacity-95 dark:opacity-100 line-clamp-2`}>
                        {block.section.courseTitle}
                      </div>
                    )}
                    {(fields.type || (fields.venue && block.venues.length > 0)) && height > show.type && (
                      <div className={`${sz.meta} leading-tight opacity-90 dark:opacity-100 mt-0.5`}>
                        {fields.type && <span className="font-semibold">{block.type}</span>}
                        {fields.type && fields.venue && block.venues.length > 0 && ' · '}
                        {fields.venue && block.venues.length > 0 && block.venues.join(', ')}
                      </div>
                    )}
                    {fields.instructor && height > show.instructor && block.section.instructors.length > 0 && (
                      <div className={`${sz.meta} leading-tight opacity-90 dark:opacity-100 mt-0.5 line-clamp-2`}>
                        {block.section.instructors.join(', ')}
                      </div>
                    )}
                    {fields.time && height > show.time && (
                      <div className={`${sz.meta} leading-tight opacity-80 dark:opacity-100 mt-0.5 truncate`}>
                        {formatTime(block.start, use24Hour)}–{formatTime(block.end, use24Hour)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
