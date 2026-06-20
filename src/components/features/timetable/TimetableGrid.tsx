import { useMemo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { DAY_ORDER, meetingsOverlap, type TimetableSection } from '@/services/timetableService';

interface TimetableGridProps {
  sections: TimetableSection[];
  /** Section ids that clash with another selected section (rendered with a warning ring). */
  conflictIds?: Set<string>;
  /** Per-section colour (id → CSS colour). Falls back to a neutral grey. */
  colorMap?: Map<string, string>;
  /** When true, the grid renders at full width without horizontal scrolling (for image/PDF export). */
  forExport?: boolean;
}

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

const HOUR_HEIGHT = 56; // px per hour
// Fallback range used only when nothing is selected yet.
const DEFAULT_START_MIN = 8 * 60; // 08:00
const DEFAULT_END_MIN = 18 * 60; // 18:00

const FALLBACK_COLOR = '#64748b';

function fmt(hhmm: string): string {
  // Reference timetable shows 12-hour times; keep it compact.
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(h)) return hhmm;
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
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

export function TimetableGrid({ sections, conflictIds, colorMap, forExport }: TimetableGridProps) {
  const { t } = useLanguage();

  const dayLabels: Record<string, string> = {
    MON: t('timetable.day.mon'),
    TUE: t('timetable.day.tue'),
    WED: t('timetable.day.wed'),
    THU: t('timetable.day.thu'),
    FRI: t('timetable.day.fri'),
    SAT: t('timetable.day.sat'),
    SUN: t('timetable.day.sun'),
  };

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

    // Show Mon–Fri always; weekend columns only when used.
    const visible = DAY_ORDER.filter(
      (d) => ['MON', 'TUE', 'WED', 'THU', 'FRI'].includes(d) || byDay[d].length > 0,
    );
    return { visibleDays: visible, blocksByDay: byDay };
  }, [sections]);

  // Dynamic vertical range: span only the hours actually used by the selected
  // sections (rounded to whole hours). Falls back to a default when empty.
  const { startHour, endHour } = useMemo(() => {
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
  }, [sections]);

  const dayStartMin = startHour * 60;
  const dayEndMin = endHour * 60;

  const hours: number[] = [];
  for (let h = startHour; h <= endHour; h++) hours.push(h);
  const gridHeight = ((dayEndMin - dayStartMin) / 60) * HOUR_HEIGHT;

  const TIME_COL = 64; // px

  return (
    <div className={`${forExport ? 'overflow-visible' : 'overflow-x-auto'} rounded-lg border bg-card`}>
      <div className="min-w-[760px]">
        {/* Header row with day names */}
        <div
          className="grid border-b bg-muted/40"
          style={{ gridTemplateColumns: `${TIME_COL}px repeat(${visibleDays.length}, minmax(0, 1fr))` }}
        >
          <div className="h-10" />
          {visibleDays.map((day) => (
            <div key={day} className="h-10 flex items-center justify-center text-sm font-semibold border-l">
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
                  className="absolute left-0 right-1 text-[11px] text-muted-foreground text-right pr-1"
                  style={{ top: idx * HOUR_HEIGHT - 6 }}
                >
                  {fmt(`${String(h).padStart(2, '0')}:00`)}
                </div>
              );
            })}
          </div>

          {/* Day columns */}
          {visibleDays.map((day) => (
            <div key={day} className="relative border-l" style={{ height: gridHeight }}>
              {/* Hour gridlines */}
              {hours.map((h, idx) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-border/50"
                  style={{ top: idx * HOUR_HEIGHT }}
                />
              ))}

              {/* Class blocks */}
              {blocksByDay[day].map((block, idx) => {
                const top = ((block.startMinutes - dayStartMin) / 60) * HOUR_HEIGHT;
                const height = Math.max(
                  ((block.endMinutes + 1 - block.startMinutes) / 60) * HOUR_HEIGHT - 2,
                  20,
                );
                const widthPct = 100 / block.columns;
                const leftPct = block.column * widthPct;
                const bg = colorMap?.get(block.section.id) ?? FALLBACK_COLOR;
                const isConflict = block.conflict || conflictIds?.has(block.section.id);
                return (
                  <div
                    key={`${block.section.id}-${idx}`}
                    className="absolute rounded-md px-1.5 py-1 text-white overflow-hidden shadow-sm"
                    style={{
                      top,
                      height,
                      left: `calc(${leftPct}% + 2px)`,
                      width: `calc(${widthPct}% - 4px)`,
                      backgroundColor: bg,
                      outline: isConflict ? '2px solid #ef4444' : undefined,
                      outlineOffset: isConflict ? '-2px' : undefined,
                    }}
                    title={`${block.section.courseCode} (${block.type}) · ${block.section.courseTitle}\n${fmt(block.start)} - ${fmt(block.end)}${block.venues.length ? ` · ${block.venues.join(', ')}` : ''}\n${block.section.instructors.join(', ')}`}
                  >
                    <div className="text-[11px] font-bold leading-tight truncate">
                      {block.section.courseCode}
                    </div>
                    <div className="text-[10px] leading-tight opacity-95 line-clamp-2">
                      {block.section.courseTitle}
                    </div>
                    {height > 44 && (
                      <div className="text-[9px] leading-tight opacity-90 mt-0.5">
                        <span className="font-semibold">{block.type}</span>
                        {block.venues.length > 0 && <> · {block.venues.join(', ')}</>}
                      </div>
                    )}
                    {height > 60 && block.section.instructors.length > 0 && (
                      <div className="text-[9px] leading-tight opacity-90 mt-0.5 line-clamp-2">
                        {block.section.instructors.join(', ')}
                      </div>
                    )}
                    {height > 82 && (
                      <div className="text-[9px] leading-tight opacity-80 mt-0.5 truncate">
                        {fmt(block.start)}–{fmt(block.end)}
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
