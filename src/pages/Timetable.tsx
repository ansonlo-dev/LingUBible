import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useDebounce } from '@/hooks/useDebounce';
import {
  loadTimetableSections,
  findConflicts,
  colorForIndex,
  DAY_ORDER,
  TERMS,
  type TimetableSection,
} from '@/services/timetableService';
import { TimetableGrid } from '@/components/features/timetable/TimetableGrid';
import { Combobox, type ComboboxOption } from '@/components/features/timetable/Combobox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  CalendarDays,
  Loader2,
  Trash2,
  AlertTriangle,
  Search,
  X,
  Image as ImageIcon,
  FileDown,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  SlidersHorizontal,
} from 'lucide-react';

const STORAGE_KEY = 'timetable.selectedSectionIds';
const EXPORT_OPTS_KEY = 'timetable.exportOptions';
const MAX_RESULTS = 80;

interface ExportOptions {
  includeTitle: boolean;
  showSubGrid: boolean;
  orientation: 'portrait' | 'landscape';
  size: 'fit' | 'full';
  timeFormat: '24' | '12';
  theme: 'light' | 'dark';
}

const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  includeTitle: true,
  showSubGrid: true,
  orientation: 'landscape',
  size: 'fit',
  timeFormat: '24',
  theme: 'light',
};

// Theme tokens used by the timetable grid, mirrored from index.css so the
// export can be rendered in light or dark independently of the site theme.
function themeVars(dark: boolean): CSSProperties {
  const vars = dark
    ? { '--background': '0, 0, 0', '--foreground': '255, 255, 255', '--card': '24, 24, 27', '--border': '63, 63, 70', '--muted': '55, 65, 81', '--muted-foreground': '156, 163, 175' }
    : { '--background': '255, 255, 255', '--foreground': '0, 0, 0', '--card': '245, 245, 245', '--border': '209, 213, 219', '--muted': '243, 244, 246', '--muted-foreground': '107, 114, 128' };
  return {
    ...(vars as CSSProperties),
    backgroundColor: dark ? '#000000' : '#ffffff',
    color: dark ? '#ffffff' : '#000000',
  };
}

/** Compact segmented two-option toggle used for the export settings. */
function OptionToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex rounded-md border overflow-hidden">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 px-2 py-1 text-xs font-medium transition-colors ${
            value === o.value ? 'bg-primary text-white' : 'bg-transparent text-muted-foreground hover:bg-accent'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// A4 canvas pixel size (~150 dpi) for composing a full-page PNG.
function pageCanvasSize(orientation: 'portrait' | 'landscape') {
  return orientation === 'landscape' ? { w: 1754, h: 1240 } : { w: 1240, h: 1754 };
}

function loadSelectedIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function meetingSummary(section: TimetableSection, dayLabels: Record<string, string>): string {
  if (section.meetings.length === 0) return '';
  return [...section.meetings]
    .sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || a.startMinutes - b.startMinutes)
    .map((m) => `${dayLabels[m.day]} ${m.start}–${m.end}${m.venue ? ` @${m.venue}` : ''}`)
    .join(' · ');
}

const Timetable = () => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [allSections, setAllSections] = useState<TimetableSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Term selection (today there is one; the dropdown is future-proofed for more).
  const [termId, setTermId] = useState(TERMS[0].id);
  const term = useMemo(() => TERMS.find((tm) => tm.id === termId) ?? TERMS[0], [termId]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 250);
  const [courseCode, setCourseCode] = useState('');
  const [instructor, setInstructor] = useState('');
  const [type, setType] = useState('all');
  const [day, setDay] = useState('all');

  const [selectedIds, setSelectedIds] = useState<string[]>(() => loadSelectedIds());
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const [exportOptions, setExportOptions] = useState<ExportOptions>(() => {
    const siteDark =
      typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    const base: ExportOptions = { ...DEFAULT_EXPORT_OPTIONS, theme: siteDark ? 'dark' : 'light' };
    try {
      const raw = localStorage.getItem(EXPORT_OPTS_KEY);
      if (raw) return { ...base, ...JSON.parse(raw) };
    } catch {
      /* ignore */
    }
    return base;
  });
  const setOpt = (patch: Partial<ExportOptions>) => setExportOptions((prev) => ({ ...prev, ...patch }));
  useEffect(() => {
    try {
      localStorage.setItem(EXPORT_OPTS_KEY, JSON.stringify(exportOptions));
    } catch {
      /* ignore */
    }
  }, [exportOptions]);

  // Collapsible filter/results panel (default expanded). Persisted across visits.
  const [panelCollapsed, setPanelCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('timetable.panelCollapsed') === '1';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('timetable.panelCollapsed', panelCollapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [panelCollapsed]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadTimetableSections(term.csvUrl)
      .then((sections) => {
        if (!active) return;
        setAllSections(sections);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || 'Failed to load timetable data');
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [term.csvUrl]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
    } catch {
      /* ignore quota errors */
    }
  }, [selectedIds]);

  const dayLabels: Record<string, string> = {
    MON: t('timetable.day.mon'),
    TUE: t('timetable.day.tue'),
    WED: t('timetable.day.wed'),
    THU: t('timetable.day.thu'),
    FRI: t('timetable.day.fri'),
    SAT: t('timetable.day.sat'),
    SUN: t('timetable.day.sun'),
  };

  // Build dropdown option lists from the data.
  const courseOptions: ComboboxOption[] = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of allSections) {
      if (!map.has(s.courseCode)) map.set(s.courseCode, `${s.courseCode} · ${s.courseTitle}`);
    }
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [allSections]);

  const instructorOptions: ComboboxOption[] = useMemo(() => {
    const set = new Set<string>();
    for (const s of allSections) for (const name of s.instructors) set.add(name);
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ value: name, label: name }));
  }, [allSections]);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of allSections) for (const ty of s.types) set.add(ty);
    return Array.from(set).sort();
  }, [allSections]);

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return allSections.filter((s) => {
      if (courseCode && s.courseCode !== courseCode) return false;
      if (instructor && !s.instructors.includes(instructor)) return false;
      if (type !== 'all' && !s.types.includes(type)) return false;
      if (day !== 'all' && !s.meetings.some((m) => m.day === day)) return false;
      if (term) {
        const haystack = `${s.courseCode} ${s.courseTitle} ${s.crn} ${s.instructors.join(' ')}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [allSections, debouncedSearch, courseCode, instructor, type, day]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const sectionById = useMemo(() => {
    const map = new Map<string, TimetableSection>();
    for (const s of allSections) map.set(s.id, s);
    return map;
  }, [allSections]);

  const selectedSections = useMemo(
    () => selectedIds.map((id) => sectionById.get(id)).filter(Boolean) as TimetableSection[],
    [selectedIds, sectionById],
  );

  const conflictIds = useMemo(() => findConflicts(selectedSections), [selectedSections]);

  // Auto-assign a distinct colour to each section in the order it was added.
  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    selectedIds.forEach((id, i) => map.set(id, colorForIndex(i)));
    return map;
  }, [selectedIds]);

  const handleExport = async (format: 'png' | 'pdf') => {
    const node = exportRef.current;
    if (!node || selectedSections.length === 0) return;
    setExporting(true);
    try {
      const dark = exportOptions.theme === 'dark';
      const bgColor = dark ? '#000000' : '#ffffff';
      const { toPng } = await import('html-to-image');
      const contentUrl = await toPng(node, {
        pixelRatio: 2,
        backgroundColor: bgColor,
        cacheBust: true,
      });
      const imgW = node.scrollWidth;
      const imgH = node.scrollHeight;
      const safeName = `${term.name.replace(/[^\w一-鿿-]+/g, '_')}_timetable`;
      const fullPage = exportOptions.size === 'full';

      if (format === 'png') {
        let outUrl = contentUrl;
        if (fullPage) {
          // Stretch the timetable to fill an A4-shaped page (small margin).
          const img = await loadImage(contentUrl);
          const { w, h } = pageCanvasSize(exportOptions.orientation);
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, w, h);
          const margin = 40;
          ctx.drawImage(img, margin, margin, w - 2 * margin, h - 2 * margin);
          outUrl = canvas.toDataURL('image/png');
        }
        const link = document.createElement('a');
        link.download = `${safeName}.png`;
        link.href = outUrl;
        link.click();
      } else {
        const { jsPDF } = await import('jspdf');
        if (fullPage) {
          // Standard A4 in the chosen orientation; image stretched to fill the page.
          const pdf = new jsPDF({ orientation: exportOptions.orientation, unit: 'pt', format: 'a4' });
          const pageW = pdf.internal.pageSize.getWidth();
          const pageH = pdf.internal.pageSize.getHeight();
          const margin = 18;
          if (dark) {
            pdf.setFillColor(0, 0, 0);
            pdf.rect(0, 0, pageW, pageH, 'F');
          }
          pdf.addImage(contentUrl, 'PNG', margin, margin, pageW - 2 * margin, pageH - 2 * margin);
          pdf.save(`${safeName}.pdf`);
        } else {
          // Page sized exactly to the content (orientation follows the content).
          const orientation = imgW >= imgH ? 'landscape' : 'portrait';
          const pdf = new jsPDF({ orientation, unit: 'px', format: [imgW, imgH] });
          pdf.addImage(contentUrl, 'PNG', 0, 0, imgW, imgH);
          pdf.save(`${safeName}.pdf`);
        }
      }
    } catch (err) {
      console.error('Timetable export failed:', err);
      toast({
        title: t('timetable.exportError'),
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const hasActiveFilters =
    searchTerm !== '' || courseCode !== '' || instructor !== '' || type !== 'all' || day !== 'all';

  const toggleSection = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCourseCode('');
    setInstructor('');
    setType('all');
    setDay('all');
  };

  return (
    <div className="mx-auto px-4 lg:px-8 xl:px-16 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-1 md:flex-row md:flex-wrap md:items-baseline md:gap-5">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">{t('timetable.title')}</h1>
        </div>
        <p className="text-muted-foreground md:-translate-y-[3px]">{t('timetable.subtitle')}</p>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>{t('timetable.loading')}</span>
        </div>
      )}

      {!loading && error && (
        <Card className="border-destructive/40">
          <CardContent className="py-8 text-center text-destructive">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>{t('timetable.error')}</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && (
        <div
          className={`grid grid-cols-1 gap-6 items-start ${
            panelCollapsed ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(280px,340px)_1fr]'
          }`}
        >
          {/* Left: search / filters / results */}
          <div className={`space-y-4 ${panelCollapsed ? 'hidden' : ''}`}>
            <Card>
              <CardContent className="p-4 space-y-3">
                {/* Free-text search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('timetable.searchPlaceholder')}
                    className="pl-9"
                  />
                </div>

                {/* Dropdown filters */}
                <div className="space-y-2">
                  <Select value={termId} onValueChange={setTermId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('timetable.filter.term')} />
                    </SelectTrigger>
                    <SelectContent>
                      {TERMS.map((tm) => (
                        <SelectItem key={tm.id} value={tm.id}>
                          {tm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Combobox
                    options={courseOptions}
                    value={courseCode}
                    onChange={setCourseCode}
                    placeholder={t('timetable.filter.course')}
                    searchPlaceholder={t('timetable.filter.courseSearch')}
                    emptyText={t('timetable.noResults')}
                  />
                  <Combobox
                    options={instructorOptions}
                    value={instructor}
                    onChange={setInstructor}
                    placeholder={t('timetable.filter.instructor')}
                    searchPlaceholder={t('timetable.filter.instructorSearch')}
                    emptyText={t('timetable.noResults')}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('timetable.filter.type')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('timetable.filter.allTypes')}</SelectItem>
                        {typeOptions.map((ty) => (
                          <SelectItem key={ty} value={ty}>
                            {ty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={day} onValueChange={setDay}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('timetable.filter.day')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('timetable.filter.allDays')}</SelectItem>
                        {DAY_ORDER.map((d) => (
                          <SelectItem key={d} value={d}>
                            {dayLabels[d]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
                    <X className="h-4 w-4 mr-1" />
                    {t('timetable.clearFilters')}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Results */}
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-medium">{t('timetable.results')}</span>
              <span className="text-xs text-muted-foreground">
                {t('timetable.resultsCount', { count: String(filtered.length) })}
              </span>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 timetable-scroll">
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">{t('timetable.noResults')}</p>
              )}
              {filtered.slice(0, MAX_RESULTS).map((s) => {
                const added = selectedSet.has(s.id);
                return (
                  <div
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={added}
                    onClick={() => toggleSection(s.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleSection(s.id);
                      }
                    }}
                    title={added ? t('timetable.remove') : t('timetable.add')}
                    className={`flex items-start gap-2 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/40 ${
                      added ? 'bg-accent/40' : ''
                    }`}
                    style={added ? { borderColor: colorMap.get(s.id) } : undefined}
                  >
                    {added && (
                      <span
                        className="mt-1 h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: colorMap.get(s.id) }}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{s.courseCode}</span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 !bg-[rgb(var(--secondary))] !text-[rgb(var(--secondary-foreground))]"
                        >
                          {t('timetable.sectionLabel', { sect: s.section || '—' })}
                        </Badge>
                        {s.types.map((ty) => (
                          <Badge key={ty} variant="outline" className="text-[10px] px-1.5 py-0">
                            {ty}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm truncate">{s.courseTitle}</p>
                      {s.instructors.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate">{s.instructors.join(', ')}</p>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {meetingSummary(s, dayLabels) || t('timetable.noSchedule')}
                      </p>
                    </div>
                  </div>
                );
              })}
              {filtered.length > MAX_RESULTS && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  {t('timetable.moreResults', { count: String(filtered.length - MAX_RESULTS) })}
                </p>
              )}
            </div>
          </div>

          {/* Right: timetable + selected */}
          <div className="space-y-4">
            {/* Panel toggle + export actions */}
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPanelCollapsed((v) => !v)}
                title={panelCollapsed ? t('timetable.expandPanel') : t('timetable.collapsePanel')}
              >
                {panelCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4 mr-1" />
                ) : (
                  <PanelLeftClose className="h-4 w-4 mr-1" />
                )}
                {panelCollapsed ? t('timetable.expandPanel') : t('timetable.collapsePanel')}
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                {/* Timetable options — these update the on-screen preview instantly */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <SlidersHorizontal className="h-4 w-4 mr-1" />
                      {t('timetable.timetableSettings')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-72 bg-white dark:bg-gray-900 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-sm">{t('timetable.opt.title')}</Label>
                      <OptionToggle
                        value={exportOptions.includeTitle ? 'on' : 'off'}
                        onChange={(v) => setOpt({ includeTitle: v === 'on' })}
                        options={[
                          { value: 'on', label: t('timetable.opt.show') },
                          { value: 'off', label: t('timetable.opt.hide') },
                        ]}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">{t('timetable.opt.subGrid')}</Label>
                      <OptionToggle
                        value={exportOptions.showSubGrid ? 'on' : 'off'}
                        onChange={(v) => setOpt({ showSubGrid: v === 'on' })}
                        options={[
                          { value: 'on', label: t('timetable.opt.show') },
                          { value: 'off', label: t('timetable.opt.hide') },
                        ]}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">{t('timetable.opt.timeFormat')}</Label>
                      <OptionToggle
                        value={exportOptions.timeFormat}
                        onChange={(v) => setOpt({ timeFormat: v })}
                        options={[
                          { value: '24', label: t('timetable.opt.format24') },
                          { value: '12', label: t('timetable.opt.format12') },
                        ]}
                      />
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Export options — only affect the exported file */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings2 className="h-4 w-4 mr-1" />
                      {t('timetable.exportSettings')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-72 bg-white dark:bg-gray-900 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-sm">{t('timetable.opt.theme')}</Label>
                      <OptionToggle
                        value={exportOptions.theme}
                        onChange={(v) => setOpt({ theme: v })}
                        options={[
                          { value: 'light', label: t('timetable.opt.light') },
                          { value: 'dark', label: t('timetable.opt.dark') },
                        ]}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">{t('timetable.opt.orientation')}</Label>
                      <OptionToggle
                        value={exportOptions.orientation}
                        onChange={(v) => setOpt({ orientation: v })}
                        options={[
                          { value: 'portrait', label: t('timetable.opt.portrait') },
                          { value: 'landscape', label: t('timetable.opt.landscape') },
                        ]}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">{t('timetable.opt.size')}</Label>
                      <OptionToggle
                        value={exportOptions.size}
                        onChange={(v) => setOpt({ size: v })}
                        options={[
                          { value: 'fit', label: t('timetable.opt.fitContent') },
                          { value: 'full', label: t('timetable.opt.fullPage') },
                        ]}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('png')}
                  disabled={exporting || selectedSections.length === 0}
                >
                  {exporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ImageIcon className="h-4 w-4 mr-1" />}
                  {t('timetable.exportPng')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('pdf')}
                  disabled={exporting || selectedSections.length === 0}
                >
                  {exporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileDown className="h-4 w-4 mr-1" />}
                  {t('timetable.exportPdf')}
                </Button>
              </div>
            </div>

            {conflictIds.size > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {t('timetable.conflictWarning')}
              </div>
            )}

            {/* On-screen title + grid (reflects the timetable options live) */}
            {exportOptions.includeTitle && (
              <h2 className="text-xl font-bold text-center">{term.name}</h2>
            )}
            <TimetableGrid
              sections={selectedSections}
              conflictIds={conflictIds}
              colorMap={colorMap}
              showSubGrid={exportOptions.showSubGrid}
              use24Hour={exportOptions.timeFormat === '24'}
            />

            {/* Off-screen, full-width render used only for PNG/PDF export */}
            <div
              aria-hidden
              style={{ position: 'absolute', left: '-99999px', top: 0, width: 1320, pointerEvents: 'none' }}
            >
              <div
                ref={exportRef}
                className="p-6"
                style={themeVars(exportOptions.theme === 'dark')}
              >
                {exportOptions.includeTitle && (
                  <h2 className="text-2xl font-bold text-center mb-4">{term.name}</h2>
                )}
                <TimetableGrid
                  sections={selectedSections}
                  conflictIds={conflictIds}
                  colorMap={colorMap}
                  forExport
                  showSubGrid={exportOptions.showSubGrid}
                  use24Hour={exportOptions.timeFormat === '24'}
                />
              </div>
            </div>

            {/* Selected sections list */}
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-medium">
                {t('timetable.selected', { count: String(selectedSections.length) })}
              </span>
              {selectedSections.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  {t('timetable.clearAll')}
                </Button>
              )}
            </div>

            {selectedSections.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6 border rounded-lg border-dashed">
                {t('timetable.emptySelection')}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedSections.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 rounded-full pl-2 pr-1 py-1 text-xs text-white"
                    style={{ backgroundColor: colorMap.get(s.id) }}
                  >
                    {conflictIds.has(s.id) && <AlertTriangle className="h-3 w-3" />}
                    <span className="font-semibold">{s.courseCode}</span>
                    <span className="opacity-90">·{s.section}</span>
                    <button
                      onClick={() => toggleSection(s.id)}
                      className="rounded-full hover:bg-black/20 p-0.5"
                      title={t('timetable.remove')}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
