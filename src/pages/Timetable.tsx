import { useEffect, useMemo, useRef, useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import {
  CalendarDays,
  Loader2,
  Plus,
  Check,
  Trash2,
  AlertTriangle,
  Search,
  X,
  Image as ImageIcon,
  FileDown,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

const STORAGE_KEY = 'timetable.selectedSectionIds';
const MAX_RESULTS = 80;

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
      const isDark = document.documentElement.classList.contains('dark');
      const bgColor = isDark ? '#18181b' : '#ffffff';
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        backgroundColor: bgColor,
        cacheBust: true,
      });
      const safeName = `${term.name.replace(/[^\w一-鿿-]+/g, '_')}_timetable`;

      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `${safeName}.png`;
        link.href = dataUrl;
        link.click();
      } else {
        const { jsPDF } = await import('jspdf');
        const width = node.scrollWidth;
        const height = node.scrollHeight;
        const pdf = new jsPDF({
          orientation: width >= height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [width, height],
        });
        pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
        pdf.save(`${safeName}.pdf`);
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
                    className="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/40 transition-colors"
                  >
                    <span
                      className="mt-1 h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: added ? colorMap.get(s.id) : '#94a3b8' }}
                    />
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
                    <Button
                      size="icon"
                      variant={added ? 'secondary' : 'default'}
                      className="h-8 w-8 shrink-0"
                      onClick={() => toggleSection(s.id)}
                      title={added ? t('timetable.remove') : t('timetable.add')}
                    >
                      {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </Button>
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
              <div className="flex items-center gap-2">
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

            {/* On-screen title + grid */}
            <h2 className="text-xl font-bold text-center">{term.name}</h2>
            <TimetableGrid sections={selectedSections} conflictIds={conflictIds} colorMap={colorMap} />

            {/* Off-screen, full-width render used only for PNG/PDF export */}
            <div
              aria-hidden
              style={{ position: 'absolute', left: '-99999px', top: 0, width: 1320, pointerEvents: 'none' }}
            >
              <div ref={exportRef} className="bg-background text-foreground p-6">
                <h2 className="text-2xl font-bold text-center mb-4">{term.name}</h2>
                <TimetableGrid
                  sections={selectedSections}
                  conflictIds={conflictIds}
                  colorMap={colorMap}
                  forExport
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
