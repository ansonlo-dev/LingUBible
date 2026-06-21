import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Check, Minus, X, Search } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

type Tt = (key: string, params?: Record<string, string>) => string;

// Chinese names for the campus buildings, shown after the English code in the
// venue filter on zh sites (e.g. "LBY (林炳炎樓)").
const BUILDING_NAMES: Record<string, { tc: string; sc: string }> = {
  LBY: { tc: '林炳炎樓', sc: '林炳炎楼' },
  LCH: { tc: '劉仲謙樓', sc: '刘仲谦楼' },
  LKK: { tc: '梁銶琚樓', sc: '梁銶琚楼' },
  LYH: { tc: '劉李婉嫻康樂樓', sc: '刘李婉娴康乐楼' },
  MB: { tc: '李運強教學大樓', sc: '李运强教学大楼' },
  SEK: { tc: '郭少明伉儷樓', sc: '郭少明伉俪楼' },
  WYL: { tc: '黃玉蘭樓', sc: '黄玉兰楼' },
};

// ── Time filter ───────────────────────────────────────────────────────────
export type TimeMode = 'off' | 'within' | 'exclude';
export interface TimeFilterValue {
  days: string[];
  mode: TimeMode;
  from: string; // "HH:MM"
  to: string; // "HH:MM"
}

export const EMPTY_TIME_FILTER: TimeFilterValue = { days: [], mode: 'off', from: '', to: '' };

export function isTimeFilterActive(v: TimeFilterValue): boolean {
  return v.days.length > 0 || (v.mode !== 'off' && !!v.from && !!v.to && v.from < v.to);
}

interface TimeFilterProps {
  value: TimeFilterValue;
  onChange: (v: TimeFilterValue) => void;
  availableDays: string[];
  dayLabels: Record<string, string>;
  t: Tt;
  className?: string;
}

export function TimeFilter({ value, onChange, availableDays, dayLabels, t, className }: TimeFilterProps) {
  const [open, setOpen] = useState(false);

  const toggleDay = (d: string) =>
    onChange({ ...value, days: value.days.includes(d) ? value.days.filter((x) => x !== d) : [...value.days, d] });

  const setMode = (mode: TimeMode) => onChange({ ...value, mode });

  const summary = useMemo(() => {
    const parts: string[] = [];
    if (value.days.length) {
      const ordered = availableDays.filter((d) => value.days.includes(d));
      parts.push(ordered.map((d) => dayLabels[d]).join(', '));
    }
    if (value.mode !== 'off' && value.from && value.to && value.from < value.to) {
      const sign = value.mode === 'exclude' ? '✕ ' : '';
      parts.push(`${sign}${value.from}–${value.to}`);
    }
    return parts.join(' · ');
  }, [value, availableDays, dayLabels]);

  const active = isTimeFilterActive(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('h-9 w-auto justify-between gap-2 font-normal', !active && 'text-muted-foreground', className)}
        >
          <span className="truncate max-w-[180px]">{active ? summary : t('timetable.filter.time')}</span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[280px] p-3">
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t('timetable.filter.days')}</p>
            <div className="flex flex-wrap gap-1">
              {availableDays.map((d) => {
                const on = value.days.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={cn(
                      'rounded-md border px-2 py-1 text-xs transition-colors',
                      on ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent',
                    )}
                  >
                    {dayLabels[d]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t pt-3">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t('timetable.filter.timeRange')}</p>
            <div className="grid grid-cols-3 gap-1">
              {(['off', 'within', 'exclude'] as TimeMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    'rounded-md border px-2 py-1 text-xs transition-colors',
                    value.mode === m ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent',
                  )}
                >
                  {t(`timetable.filter.time${m === 'off' ? 'Off' : m === 'within' ? 'Within' : 'Exclude'}`)}
                </button>
              ))}
            </div>
            <div className={cn('mt-2 grid grid-cols-2 gap-2', value.mode === 'off' && 'opacity-50')}>
              <label className="space-y-1">
                <span className="text-[11px] text-muted-foreground">{t('timetable.filter.from')}</span>
                <Input
                  type="time"
                  value={value.from}
                  disabled={value.mode === 'off'}
                  onChange={(e) => onChange({ ...value, from: e.target.value })}
                  className="h-8 px-2 [color-scheme:light] dark:[color-scheme:dark]"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[11px] text-muted-foreground">{t('timetable.filter.to')}</span>
                <Input
                  type="time"
                  value={value.to}
                  disabled={value.mode === 'off'}
                  min={value.from || undefined}
                  onChange={(e) => onChange({ ...value, to: e.target.value })}
                  className="h-8 px-2 [color-scheme:light] dark:[color-scheme:dark]"
                />
              </label>
            </div>
            {value.mode !== 'off' && value.from && value.to && value.from >= value.to && (
              <p className="mt-1 text-[11px] text-destructive">{t('timetable.filter.timeInvalid')}</p>
            )}
          </div>

          {active && (
            <button
              type="button"
              onClick={() => onChange(EMPTY_TIME_FILTER)}
              className="flex w-full items-center justify-center gap-1 border-t pt-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              {t('timetable.filter.clear')}
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Venue filter ──────────────────────────────────────────────────────────
interface VenueGroup {
  building: string;
  rooms: string[];
}

interface VenueFilterProps {
  groups: VenueGroup[];
  value: string[]; // selected room codes
  onChange: (v: string[]) => void;
  t: Tt;
  className?: string;
}

export function VenueFilter({ groups, value, onChange, t, className }: VenueFilterProps) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const selected = useMemo(() => new Set(value), [value]);
  const q = query.trim().toLowerCase();

  // Chinese building name for the current language (undefined on the English site
  // or for an unknown building code).
  const buildingZh = (code: string): string | undefined => {
    const n = BUILDING_NAMES[code.toUpperCase()];
    if (!n) return undefined;
    return language === 'zh-TW' ? n.tc : language === 'zh-CN' ? n.sc : undefined;
  };

  // Apply the search filter to rooms; keep only buildings with surviving rooms.
  // A building also matches by its Chinese name (e.g. typing "林炳炎" finds LBY).
  const shownGroups = useMemo(() => {
    if (!q) return groups;
    const buildingMatches = (code: string) => {
      if (code.toLowerCase().includes(q)) return true;
      const n = BUILDING_NAMES[code.toUpperCase()];
      return !!n && (n.tc.includes(q) || n.sc.includes(q));
    };
    return groups
      .map((g) => ({
        building: g.building,
        rooms: buildingMatches(g.building)
          ? g.rooms
          : g.rooms.filter((r) => r.toLowerCase().includes(q)),
      }))
      .filter((g) => g.rooms.length > 0);
  }, [groups, q]);

  const toggleRoom = (room: string) => {
    const next = new Set(selected);
    next.has(room) ? next.delete(room) : next.add(room);
    onChange([...next]);
  };

  const toggleBuilding = (g: VenueGroup) => {
    const allOn = g.rooms.every((r) => selected.has(r));
    const next = new Set(selected);
    if (allOn) g.rooms.forEach((r) => next.delete(r));
    else g.rooms.forEach((r) => next.add(r));
    onChange([...next]);
  };

  const toggleExpand = (building: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(building) ? next.delete(building) : next.add(building);
      return next;
    });

  const active = value.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('h-9 w-auto justify-between gap-2 font-normal', !active && 'text-muted-foreground', className)}
        >
          <span className="truncate max-w-[160px]">
            {active ? t('timetable.filter.venueCount', { count: String(value.length) }) : t('timetable.filter.venue')}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[300px] p-0">
        <div className="border-b p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('timetable.filter.venueSearch')}
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>
        <div className="max-h-[320px] overflow-y-auto p-1 timetable-scroll">
          {shownGroups.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">{t('timetable.noResults')}</p>
          )}
          {shownGroups.map((g) => {
            const isOpen = expanded.has(g.building) || !!q;
            const selCount = g.rooms.filter((r) => selected.has(r)).length;
            const allOn = selCount === g.rooms.length;
            const someOn = selCount > 0 && !allOn;
            return (
              <div key={g.building}>
                <div className="flex items-center gap-1 rounded-md px-1 py-1 hover:bg-accent/60">
                  <button
                    type="button"
                    onClick={() => toggleExpand(g.building)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground"
                    aria-label={isOpen ? 'collapse' : 'expand'}
                    disabled={!!q}
                  >
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  {/* Tri-state building toggle: all / some / none. */}
                  <button
                    type="button"
                    onClick={() => toggleBuilding(g)}
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                      allOn || someOn ? 'border-primary bg-primary text-primary-foreground' : 'border-primary',
                    )}
                  >
                    {allOn ? <Check className="h-3.5 w-3.5" /> : someOn ? <Minus className="h-3.5 w-3.5" /> : null}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleExpand(g.building)}
                    disabled={!!q}
                    className="flex flex-1 items-center justify-between gap-2 text-left text-sm font-medium"
                  >
                    <span>
                      {g.building}
                      {buildingZh(g.building) ? ` (${buildingZh(g.building)})` : ''}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {selCount > 0 ? `${selCount}/${g.rooms.length}` : g.rooms.length}
                    </span>
                  </button>
                </div>
                {isOpen && (
                  <div className="ml-7 grid grid-cols-2 gap-x-2 gap-y-1 py-1">
                    {g.rooms.map((room) => (
                      <label
                        key={room}
                        className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-xs hover:bg-accent/60"
                      >
                        <Checkbox checked={selected.has(room)} onCheckedChange={() => toggleRoom(room)} />
                        <span className="truncate">{room}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {active && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="flex w-full items-center justify-center gap-1 border-t py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            {t('timetable.filter.clear')}
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
