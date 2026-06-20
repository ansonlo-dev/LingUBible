import { useMemo } from 'react';
import { Palette, Trash2 } from 'lucide-react';
import { DAY_ORDER, meetingsOverlap, type TimetableSection } from '@/services/timetableService';

export type DayFormat = 'short' | 'long' | 'zh';

/** Which pieces of info to render inside each class block. */
export interface BlockFields {
  code: boolean;
  title: boolean;
  type: boolean;
  number: boolean;
  venue: boolean;
  instructor: boolean;
  time: boolean;
}

export const DEFAULT_BLOCK_FIELDS: BlockFields = {
  code: true,
  title: true,
  type: true,
  number: true,
  venue: true,
  instructor: true,
  time: true,
};

/** Block text-colour mode: auto-pick per background, or force white/black. */
export type TextColorMode = 'dynamic' | 'white' | 'black';

interface TimetableGridProps {
  sections: TimetableSection[];
  /** Section ids that clash with another selected section (rendered with a warning ring). */
  conflictIds?: Set<string>;
  /** Per-section colour (id → CSS colour). Falls back to a neutral grey. */
  colorMap?: Map<string, string>;
  /** When true, the grid renders at full width without horizontal scrolling (for image/PDF export). */
  forExport?: boolean;
  /** Export theme (only used with forExport) — drives explicit gridline colours so they
   *  stay clearly visible regardless of the live site theme. */
  exportDark?: boolean;
  /** Show the half-hour sub gridlines (default true). */
  showSubGrid?: boolean;
  /** Show per-day and weekly total hours in the header (default true). */
  showHours?: boolean;
  /** Block text colour: 'dynamic' picks white/black per background luminance (default). */
  textColor?: TextColorMode;
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
  /** Show per-block colour picker + delete controls (used when the side panel is collapsed). */
  editableColors?: boolean;
  /** Called when a block's colour is changed via its picker. */
  onColorChange?: (courseCode: string, color: string) => void;
  /** Called when a block's delete control is clicked. */
  onRemoveSection?: (sectionId: string) => void;
  /** Optional label transform for session types (e.g. localised LEC/TUT). */
  typeLabel?: (type: string) => string;
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

/** True when a hex colour is dark enough to need white text on top of it. */
function isDarkColor(hex: string): boolean {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return true; // unknown → assume dark background → white text
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  // Perceived luminance (0..1). Below the threshold ⇒ dark background.
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.6;
}

/** Resolve the on-block text colour for a given background + mode. */
function blockTextColor(bg: string, mode: TextColorMode): string {
  if (mode === 'white') return '#ffffff';
  if (mode === 'black') return '#000000';
  return isDarkColor(bg) ? '#ffffff' : '#000000';
}

/** Format a "HH:MM" string in either 24-hour or 12-hour notation. */
function formatTime(hhmm: string, use24: boolean): string {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(h)) return hhmm;
  if (use24) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/** Format a duration given in minutes as a compact hours label (e.g. "3h", "1.5h"). */
function formatHours(minutes: number): string {
  const rounded = Math.round((minutes / 60) * 10) / 10;
  return `${rounded}h`;
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
  exportDark,
  showSubGrid = true,
  showHours = true,
  textColor = 'dynamic',
  use24Hour = true,
  dayFormat = 'short',
  fields = DEFAULT_BLOCK_FIELDS,
  rangeStart,
  rangeEnd,
  days,
  firstDay = 'mon',
  editableColors,
  onColorChange,
  onRemoveSection,
  typeLabel,
}: TimetableGridProps) {
  const fmtType = (ty: string) => (typeLabel ? typeLabel(ty) : ty);
  const dayLabels = DAY_LABEL_SETS[dayFormat];

  const { visibleDays, blocksByDay, minsByDay, weekMins } = useMemo(() => {
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

    // Total lesson minutes per day, and for the whole week. The week total spans
    // every day in DAY_ORDER (not just the visible columns), so lessons on a
    // hidden day (e.g. a hidden Saturday) still count toward the weekly total.
    const minsByDay: Record<string, number> = {};
    let weekMins = 0;
    for (const day of DAY_ORDER) {
      let dayMins = 0;
      for (const b of byDay[day]) dayMins += b.endMinutes + 1 - b.startMinutes;
      minsByDay[day] = dayMins;
      weekMins += dayMins;
    }

    // Render exactly the chosen days, ordered by the chosen week start.
    const allowed = days && days.length ? days : DEFAULT_DAYS;
    const order =
      firstDay === 'sun'
        ? ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
        : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const visible = order.filter((d) => allowed.includes(d));
    return { visibleDays: visible, blocksByDay: byDay, minsByDay, weekMins };
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
    ? { code: 'text-[20px] font-extrabold', title: 'text-[17px] font-bold', meta: 'text-[15px] font-semibold', pad: 'px-2.5 py-2', gutter: 'text-[15px] font-bold', header: 'text-xl font-bold', headerH: 'h-14', hours: 'text-[13px] font-semibold', badge: 'text-[13px] font-bold' }
    : { code: 'text-[15px] font-bold', title: 'text-[14px] font-semibold', meta: 'text-[12px] font-medium', pad: 'px-2 py-1.5', gutter: 'text-[12px] font-semibold', header: 'text-sm font-semibold', headerH: 'h-10', hours: 'text-[10px] font-medium', badge: 'text-[10px] font-bold' };
  const hours: number[] = [];
  for (let h = startHour; h <= endHour; h++) hours.push(h);
  const gridHeight = ((dayEndMin - dayStartMin) / 60) * hourHeight;

  const TIME_COL = forExport ? 64 : 50; // px

  // Export gridlines use explicit colours (the live-site theme tokens / Tailwind
  // `dark:` variants don't track the chosen export theme, and the light token is
  // too faint on white). On-screen keeps its theme-token classes.
  const hourLineColor = exportDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.26)';
  const subLineColor = exportDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.13)';

  return (
    <div className={`${forExport ? 'overflow-visible' : 'overflow-hidden'} rounded-lg border bg-card`}>
      <div className="w-full">
        {/* Header row with day names */}
        <div
          className="grid border-b bg-muted/40"
          style={{ gridTemplateColumns: `${TIME_COL}px repeat(${visibleDays.length}, minmax(0, 1fr))` }}
        >
          <div
            className={`${sz.headerH} ${sz.hours} flex items-center justify-center text-muted-foreground`}
            title="Total hours this week (including hidden days)"
          >
            {showHours && weekMins > 0 ? formatHours(weekMins) : ''}
          </div>
          {visibleDays.map((day) => (
            <div
              key={day}
              className={`${sz.headerH} relative flex items-center justify-center border-l`}
            >
              <span
                className={`${sz.header} rounded-md bg-foreground/10 px-2 py-0.5 text-foreground`}
              >
                {dayLabels[day]}
              </span>
              {showHours && minsByDay[day] > 0 && (
                <span className={`absolute right-1.5 ${sz.hours} text-muted-foreground`}>
                  {formatHours(minsByDay[day])}
                </span>
              )}
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
                  className={`absolute left-0 right-0 border-t ${forExport ? '' : 'border-border/50'}`}
                  style={forExport ? { top: idx * hourHeight, borderTopColor: hourLineColor } : { top: idx * hourHeight }}
                />
              ))}

              {/* Half-hour sub gridlines — thinner, lighter grey, dashed */}
              {showSubGrid && hours.slice(0, -1).map((h, idx) => (
                <div
                  key={`half-${h}`}
                  className={`absolute left-0 right-0 border-t border-dashed ${forExport ? '' : 'border-gray-400/25 dark:border-gray-500/25'}`}
                  style={
                    forExport
                      ? { top: idx * hourHeight + hourHeight / 2, borderTopColor: subLineColor }
                      : { top: idx * hourHeight + hourHeight / 2 }
                  }
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
                const fg = blockTextColor(bg, textColor);
                const badgeBg = fg === '#ffffff' ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.4)';
                const badgeText = `${fields.type ? block.type : ''}${fields.number ? block.section.section : ''}`;
                return (
                  <div
                    key={`${block.section.id}-${idx}`}
                    className={`absolute rounded-md ${sz.pad} overflow-hidden shadow-sm`}
                    style={{
                      top,
                      height,
                      left: `calc(${leftPct}% + 2px)`,
                      width: `calc(${widthPct}% - 4px)`,
                      backgroundColor: bg,
                      color: fg,
                      outline: isConflict ? '2px solid #ef4444' : undefined,
                      outlineOffset: isConflict ? '-2px' : undefined,
                    }}
                    title={`${block.section.courseCode} (${block.type}) · ${block.section.courseTitle}\n${formatTime(block.start, use24Hour)} - ${formatTime(block.end, use24Hour)}${block.venues.length ? ` · ${block.venues.join(', ')}` : ''}\n${block.section.instructors.join(', ')}`}
                  >
                    {/* Session type + section number, e.g. "LEC9" / "TUT11" */}
                    {badgeText && (
                      <div
                        className={`absolute top-1 right-1 ${sz.badge} rounded px-1 leading-none`}
                        style={{ backgroundColor: badgeBg, color: fg }}
                      >
                        {badgeText}
                      </div>
                    )}
                    {fields.code && (
                      <div className={`${sz.code} leading-tight truncate ${forExport ? 'pr-14' : 'pr-9'}`}>
                        {block.section.courseCode}
                      </div>
                    )}
                    {fields.title && (
                      <div className={`${sz.title} leading-tight opacity-95 dark:opacity-100 line-clamp-2`}>
                        {block.section.courseTitle}
                      </div>
                    )}
                    {/* Session type lives in the top-right badge; show only the venue here. */}
                    {fields.venue && block.venues.length > 0 && (
                      <div className={`${sz.meta} leading-tight opacity-90 dark:opacity-100 mt-1.5`}>
                        {block.venues.join(', ')}
                      </div>
                    )}
                    {fields.instructor && block.section.instructors.length > 0 && (
                      <div className={`${sz.meta} leading-tight opacity-90 dark:opacity-100 mt-1 line-clamp-2`}>
                        {block.section.instructors.join(', ')}
                      </div>
                    )}
                    {fields.time && (
                      <div className={`${sz.meta} leading-tight opacity-80 dark:opacity-100 mt-1 truncate`}>
                        {formatTime(block.start, use24Hour)}–{formatTime(block.end, use24Hour)}
                      </div>
                    )}
                    {editableColors && !forExport && onColorChange && (
                      <label
                        className="absolute bottom-1 right-7 cursor-pointer"
                        title="Custom colour"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Palette className="h-4 w-4 opacity-90 drop-shadow" />
                        <input
                          type="color"
                          value={bg}
                          onChange={(e) => onColorChange(block.section.courseCode, e.target.value)}
                          className="absolute inset-0 h-4 w-4 opacity-0 cursor-pointer"
                        />
                      </label>
                    )}
                    {editableColors && !forExport && onRemoveSection && (
                      <button
                        type="button"
                        className="absolute bottom-1 right-1 cursor-pointer"
                        title="Remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveSection(block.section.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 opacity-90 drop-shadow" />
                      </button>
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
