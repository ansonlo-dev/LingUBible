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
import { buildTimetableIcs } from '@/services/timetableIcs';
import {
  TimetableGrid,
  blockTextColor,
  DEFAULT_BLOCK_FIELDS,
  type BlockFields,
  type DayFormat,
  type TextColorMode,
} from '@/components/features/timetable/TimetableGrid';
import { Combobox, type ComboboxOption } from '@/components/features/timetable/Combobox';
import { ColorPicker } from '@/components/features/timetable/ColorPicker';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  Download,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Pencil,
  ExternalLink,
  Undo2,
  Redo2,
} from 'lucide-react';

const STORAGE_KEY = 'timetable.selectedSectionIds';
const EXPORT_OPTS_KEY = 'timetable.exportOptions';
const MAX_RESULTS = 80;

interface ExportOptions {
  // Timetable options (affect on-screen preview + export)
  includeTitle: boolean;
  showSubGrid: boolean;
  showHours: boolean;
  timeFormat: '24' | '12';
  dayFormat: DayFormat;
  textColor: TextColorMode;
  showIcons: boolean;
  fields: BlockFields;
  rangeMode: 'auto' | 'custom';
  startHour: number;
  endHour: number;
  days: string[];
  // Manual weekend overrides: when the user explicitly toggles SAT/SUN, the choice
  // is remembered here so it survives the auto include/exclude based on lessons.
  weekendInclude: Record<string, boolean>;
  firstDay: 'sun' | 'mon';
  customTitle: string;
  customColors: Record<string, string>;
  // Export-only options
  resolution: 'low' | 'standard' | 'high';
  theme: 'light' | 'dark';
  // .ics calendar export date range ("YYYY-MM-DD").
  icsStart: string;
  icsEnd: string;
}

const RESOLUTION_SCALE: Record<ExportOptions['resolution'], number> = {
  low: 1,
  standard: 2,
  high: 3,
};

const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  includeTitle: true,
  showSubGrid: true,
  showHours: true,
  timeFormat: '24',
  dayFormat: 'short',
  textColor: 'dynamic',
  showIcons: true,
  fields: { ...DEFAULT_BLOCK_FIELDS },
  rangeMode: 'auto',
  startHour: 8,
  endHour: 18,
  days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
  weekendInclude: {},
  firstDay: 'mon',
  customTitle: '',
  customColors: {},
  resolution: 'standard',
  theme: 'light',
  icsStart: '',
  icsEnd: '',
};

const SESSION_TYPE_LABELS: Record<string, { 'zh-TW': string; 'zh-CN': string }> = {
  LEC: { 'zh-TW': '講課', 'zh-CN': '讲课' },
  TUT: { 'zh-TW': '導修', 'zh-CN': '导修' },
};

const WEEK_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_PILL_LABEL: Record<string, string> = {
  MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun',
};

/** Subject-area prefix of a course code, e.g. "CDS1001" → "CDS", "ABCT1D14" → "ABCT". */
const codePrefix = (code: string) => code.match(/^[A-Za-z]+/)?.[0] ?? code;

// Theme tokens used by the timetable grid, mirrored from index.css so the
// export can be rendered in light or dark independently of the site theme.
function themeVars(dark: boolean): CSSProperties {
  const vars = dark
    ? { '--background': '0, 0, 0', '--foreground': '255, 255, 255', '--card': '24, 24, 27', '--border': '63, 63, 70', '--muted': '55, 65, 81', '--muted-foreground': '156, 163, 175' }
    : { '--background': '255, 255, 255', '--foreground': '0, 0, 0', '--card': '245, 245, 245', '--border': '156, 163, 175', '--muted': '243, 244, 246', '--muted-foreground': '107, 114, 128' };
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

// Selected sections are saved per term (a section id only exists within its term),
// so each term keeps its own last-saved timetable in localStorage.
function loadSelections(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    // Legacy shape: a flat array of ids → migrate under the first term.
    if (Array.isArray(parsed)) {
      return { [TERMS[0].id]: parsed.filter((x) => typeof x === 'string') };
    }
    if (parsed && typeof parsed === 'object') {
      const out: Record<string, string[]> = {};
      for (const [termId, ids] of Object.entries(parsed)) {
        if (Array.isArray(ids)) out[termId] = ids.filter((x) => typeof x === 'string');
      }
      return out;
    }
    return {};
  } catch {
    return {};
  }
}

function loadSelectedIds(termId: string): string[] {
  return loadSelections()[termId] ?? [];
}

function saveSelectedIds(termId: string, ids: string[]) {
  try {
    const all = loadSelections();
    all[termId] = ids;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore quota errors */
  }
}

function meetingSummary(section: TimetableSection, dayLabels: Record<string, string>): string {
  if (section.meetings.length === 0) return '';
  // Merge meetings that share the same day + time but differ only by venue, so a
  // class taught in several rooms reads e.g. "Wed 17:00–18:29 @SEK205/LCH213".
  const groups = new Map<string, { day: string; start: string; end: string; startMinutes: number; venues: string[] }>();
  for (const m of section.meetings) {
    const key = `${m.day}-${m.start}-${m.end}`;
    const g = groups.get(key);
    if (g) {
      if (m.venue && !g.venues.includes(m.venue)) g.venues.push(m.venue);
    } else {
      groups.set(key, {
        day: m.day,
        start: m.start,
        end: m.end,
        startMinutes: m.startMinutes,
        venues: m.venue ? [m.venue] : [],
      });
    }
  }
  return [...groups.values()]
    .sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || a.startMinutes - b.startMinutes)
    .map((g) => `${dayLabels[g.day]} ${g.start}–${g.end}${g.venues.length ? ` @${g.venues.join('/')}` : ''}`)
    .join(' · ');
}

const Timetable = () => {
  const { t, language } = useLanguage();
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
  const [subjectArea, setSubjectArea] = useState('all');
  const [courseCode, setCourseCode] = useState('');
  const [instructor, setInstructor] = useState('');
  const [type, setType] = useState('all');
  const [day, setDay] = useState('all');

  // Selection with undo/redo history (max 10 steps each way) so an accidental
  // add/remove can be reverted. `past`/`future` hold prior/undone selections;
  // `present` is the live selection used everywhere else.
  const [selHistory, setSelHistory] = useState<{
    past: string[][];
    present: string[];
    future: string[][];
  }>(() => ({ past: [], present: loadSelectedIds(TERMS[0].id), future: [] }));
  const selectedIds = selHistory.present;
  const MAX_HISTORY = 10;
  const sameIds = (a: string[], b: string[]) =>
    a.length === b.length && a.every((x, i) => x === b[i]);
  // Record an undoable change to the selection.
  const commitSelection = (updater: string[] | ((prev: string[]) => string[])) =>
    setSelHistory((h) => {
      const next = typeof updater === 'function' ? updater(h.present) : updater;
      if (sameIds(next, h.present)) return h;
      return { past: [...h.past, h.present].slice(-MAX_HISTORY), present: next, future: [] };
    });
  // Replace the selection without recording history (e.g. switching term).
  const resetSelection = (ids: string[]) => setSelHistory({ past: [], present: ids, future: [] });
  const undoSelection = () =>
    setSelHistory((h) => {
      if (h.past.length === 0) return h;
      const prev = h.past[h.past.length - 1];
      return {
        past: h.past.slice(0, -1),
        present: prev,
        future: [h.present, ...h.future].slice(0, MAX_HISTORY),
      };
    });
  const redoSelection = () =>
    setSelHistory((h) => {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      return {
        past: [...h.past, h.present].slice(-MAX_HISTORY),
        present: next,
        future: h.future.slice(1),
      };
    });
  const canUndo = selHistory.past.length > 0;
  const canRedo = selHistory.future.length > 0;
  // Tracks the term the current selection belongs to, so saves always target the
  // right term even when selectedIds updates lag a term switch by a render.
  const termIdRef = useRef(termId);
  useEffect(() => {
    termIdRef.current = termId;
  }, [termId]);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [pendingExport, setPendingExport] = useState<'png' | 'pdf' | null>(null);

  const [exportOptions, setExportOptions] = useState<ExportOptions>(() => {
    const siteDark =
      typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    const base: ExportOptions = { ...DEFAULT_EXPORT_OPTIONS, theme: siteDark ? 'dark' : 'light' };
    try {
      const raw = localStorage.getItem(EXPORT_OPTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Deep-merge `fields` so newly-added field keys keep their defaults.
        return { ...base, ...parsed, fields: { ...base.fields, ...(parsed.fields ?? {}) } };
      }
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
        // Drop sections with no scheduled meeting (e.g. PRJ) — not useful here.
        setAllSections(sections.filter((s) => s.meetings.length > 0));
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

  // Persist the current term's selection whenever it changes.
  useEffect(() => {
    saveSelectedIds(termIdRef.current, selectedIds);
  }, [selectedIds]);

  // When the term changes, load that term's last-saved selection (empty if none).
  // Skip the very first run — the initial term is already loaded in useState above.
  const firstTermLoad = useRef(true);
  useEffect(() => {
    if (firstTermLoad.current) {
      firstTermLoad.current = false;
      return;
    }
    resetSelection(loadSelectedIds(termId));
  }, [termId]);

  // Keyboard shortcuts: Ctrl/Cmd+Z to undo, Ctrl/Cmd+Shift+Z or Ctrl+Y to redo.
  // Ignored while typing in an input/textarea so native text-undo still works.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undoSelection();
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        redoSelection();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

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
  const subjectAreaOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of allSections) set.add(codePrefix(s.courseCode));
    return Array.from(set).sort();
  }, [allSections]);

  const courseOptions: ComboboxOption[] = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of allSections) {
      if (subjectArea !== 'all' && codePrefix(s.courseCode) !== subjectArea) continue;
      if (!map.has(s.courseCode)) map.set(s.courseCode, `${s.courseCode} · ${s.courseTitle}`);
    }
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [allSections, subjectArea]);

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
    const result = allSections.filter((s) => {
      if (subjectArea !== 'all' && codePrefix(s.courseCode) !== subjectArea) return false;
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
    // Rank CRN matches first (exact > prefix > substring), so e.g. searching
    // "22" surfaces sections with that CRN before course-code matches like ACT2200.
    if (term) {
      const crnRank = (s: TimetableSection) => {
        const crn = String(s.crn).toLowerCase();
        if (crn === term) return 0;
        if (crn.startsWith(term)) return 1;
        if (crn.includes(term)) return 2;
        return 3;
      };
      result.sort((a, b) => crnRank(a) - crnRank(b));
    }
    return result;
  }, [allSections, debouncedSearch, subjectArea, courseCode, instructor, type, day]);

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

  // Search results excluding already-selected sections (those are pinned on top).
  const unselectedResults = useMemo(
    () => filtered.filter((s) => !selectedSet.has(s.id)),
    [filtered, selectedSet],
  );

  const conflictIds = useMemo(() => findConflicts(selectedSections), [selectedSections]);

  // Auto-manage the weekend columns (SAT/SUN): show one when a selected lesson
  // lands on it, hide it again once none do — unless the user has manually forced
  // it on (tracked in weekendInclude). Mon–Fri are always present by default.
  useEffect(() => {
    const daysWithLessons = new Set<string>();
    for (const s of selectedSections) {
      for (const m of s.meetings) daysWithLessons.add(m.day);
    }
    setExportOptions((prev) => {
      let days = prev.days;
      for (const wd of ['SAT', 'SUN']) {
        const shouldShow = daysWithLessons.has(wd) || prev.weekendInclude[wd] === true;
        const has = days.includes(wd);
        if (shouldShow && !has) days = [...days, wd];
        else if (!shouldShow && has) days = days.filter((x) => x !== wd);
      }
      return days === prev.days ? prev : { ...prev, days };
    });
  }, [selectedSections]);

  // Assign a distinct colour per course code, so all sections of the same course
  // (e.g. its lecture and tutorial) share a colour. The colour-slot assignment is
  // kept stable in a ref: a course code holds its slot for as long as it stays
  // selected, so removing one section never recolours the remaining ones. A slot
  // is only freed once its course code leaves the selection entirely (then it may
  // be reused by a newly-added course). A user-picked custom colour always wins.
  const colorSlotRef = useRef<Map<string, number>>(new Map());
  const colorMap = useMemo(() => {
    const slots = colorSlotRef.current;

    const presentCodes = new Set<string>();
    for (const id of selectedIds) {
      const s = sectionById.get(id);
      if (s) presentCodes.add(s.courseCode);
    }
    // Free slots for course codes no longer selected.
    for (const code of [...slots.keys()]) {
      if (!presentCodes.has(code)) slots.delete(code);
    }
    // Assign the lowest free slot to any newly-present course code (first-added order).
    const used = new Set(slots.values());
    const nextFreeSlot = () => {
      let n = 0;
      while (used.has(n)) n++;
      used.add(n);
      return n;
    };
    for (const id of selectedIds) {
      const s = sectionById.get(id);
      if (!s || slots.has(s.courseCode)) continue;
      slots.set(s.courseCode, nextFreeSlot());
    }

    const map = new Map<string, string>();
    for (const id of selectedIds) {
      const s = sectionById.get(id);
      if (!s) continue;
      map.set(id, exportOptions.customColors[s.courseCode] ?? colorForIndex(slots.get(s.courseCode)!));
    }
    return map;
  }, [selectedIds, sectionById, exportOptions.customColors]);

  const setCourseColor = (courseCode: string, color: string) =>
    setOpt({ customColors: { ...exportOptions.customColors, [courseCode]: color } });

  const displayTitle = exportOptions.customTitle.trim() ? exportOptions.customTitle : term.name;

  // Dropdown-only label: append the Chinese name on zh sites, e.g. "LEC (講課)".
  // Search results and the timetable keep the raw English code.
  const typeOptionLabel = (ty: string) => {
    const zh =
      language === 'zh-TW'
        ? SESSION_TYPE_LABELS[ty]?.['zh-TW']
        : language === 'zh-CN'
          ? SESSION_TYPE_LABELS[ty]?.['zh-CN']
          : null;
    return zh ? `${ty} (${zh})` : ty;
  };

  const handleExport = async (format: 'png' | 'pdf') => {
    const node = exportRef.current;
    if (!node || selectedSections.length === 0) return;
    setExporting(true);
    try {
      const dark = exportOptions.theme === 'dark';
      const bgColor = dark ? '#000000' : '#ffffff';
      const pixelRatio = RESOLUTION_SCALE[exportOptions.resolution];
      const htmlToImage = await import('html-to-image');
      const imgW = node.scrollWidth;
      const imgH = node.scrollHeight;
      const safeName = `${term.name.replace(/[^\w一-鿿-]+/g, '_')}_timetable`;

      if (format === 'png') {
        const dataUrl = await htmlToImage.toPng(node, { pixelRatio, backgroundColor: bgColor, cacheBust: true });
        const link = document.createElement('a');
        link.download = `${safeName}.png`;
        link.href = dataUrl;
        link.click();
      } else {
        // Use a JPEG (lossy) image + stream compression to keep the PDF small —
        // a PNG-based PDF can be ~10× larger for the same timetable.
        const dataUrl = await htmlToImage.toJpeg(node, {
          pixelRatio,
          backgroundColor: bgColor,
          quality: 0.82,
          cacheBust: true,
        });
        const { jsPDF } = await import('jspdf');
        const orientation = imgW >= imgH ? 'landscape' : 'portrait';
        const pdf = new jsPDF({ orientation, unit: 'px', format: [imgW, imgH], compress: true });
        pdf.addImage(dataUrl, 'JPEG', 0, 0, imgW, imgH, undefined, 'FAST');
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

  const handleExportIcs = () => {
    const { icsStart, icsEnd } = exportOptions;
    if (!icsStart || !icsEnd || selectedSections.length === 0) return;
    try {
      const ics = buildTimetableIcs(selectedSections, icsStart, icsEnd, displayTitle);
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(displayTitle || term.name).replace(/[^\w-]+/g, '_')}.ics`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: t('timetable.exportError'), variant: 'destructive' });
    }
  };

  // Confirm before exporting when there are clashing sections.
  const requestExport = (format: 'png' | 'pdf') => {
    if (conflictIds.size > 0) {
      setPendingExport(format);
    } else {
      handleExport(format);
    }
  };

  const hasActiveFilters =
    searchTerm !== '' || subjectArea !== 'all' || courseCode !== '' ||
    instructor !== '' || type !== 'all' || day !== 'all';

  const toggleSection = (id: string) => {
    commitSelection((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSubjectArea('all');
    setCourseCode('');
    setInstructor('');
    setType('all');
    setDay('all');
  };

  const renderResultItem = (s: TimetableSection) => {
    const added = selectedSet.has(s.id);
    const color = colorMap.get(s.id);
    // Pick the text colour by background lightness (same logic as the timetable
    // blocks), so a light section colour gets dark text instead of unreadable white.
    const fg = added ? blockTextColor(color || '', exportOptions.textColor) : undefined;
    const lightBg = added && fg === '#000000';
    const hoverOverlay = lightBg ? 'hover:bg-black/10' : 'hover:bg-white/20';
    // Combined session type + section number, matching the timetable blocks (e.g. "LEC1").
    const typeNumber = `${s.types.join('/')}${s.section}`;
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
        className={`relative rounded-lg border p-3 cursor-pointer transition-colors ${
          added ? 'border-transparent' : 'hover:bg-accent/40'
        }`}
        style={added ? { backgroundColor: color, color: fg } : undefined}
      >
        {/* Top-right: session type + number badge (same look as the timetable blocks) */}
        {typeNumber && (
          <div
            className={`absolute top-2 right-2 text-[10px] font-bold rounded px-1 py-0.5 leading-none ${
              added ? '' : 'bg-foreground/10 text-foreground'
            }`}
            style={added ? { backgroundColor: lightBg ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.28)' } : undefined}
          >
            {typeNumber}
          </div>
        )}
        <div className="min-w-0 pr-12">
          {/* Course code + a dedicated link icon to the course page. The icon is the
              only link target (the text stays part of the add/remove card tap area);
              its padding gives a comfortable, accurate hit area on touch screens. */}
          <div className="flex items-center gap-1">
            <span className="font-semibold text-sm">{s.courseCode}</span>
            <a
              href={`/courses/${s.courseCode}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              title={t('timetable.openCourse')}
              aria-label={`${t('timetable.openCourse')}: ${s.courseCode}`}
              className={`-my-1.5 p-1.5 rounded shrink-0 transition-colors ${
                added ? `opacity-80 ${hoverOverlay}` : 'text-muted-foreground hover:bg-foreground/10'
              }`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <p className="text-sm truncate">{s.courseTitle}</p>
          {s.instructors.length > 0 && (
            <div className={`mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs ${added ? 'opacity-80' : 'text-muted-foreground'}`}>
              {s.instructors.map((name) => (
                <span key={name} className="inline-flex items-center gap-0.5">
                  <span className="truncate max-w-[160px]">{name}</span>
                  <a
                    href={`/instructors/${encodeURIComponent(name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    title={t('timetable.openInstructor')}
                    aria-label={`${t('timetable.openInstructor')}: ${name}`}
                    className={`-my-1.5 p-1.5 rounded shrink-0 transition-colors ${
                      added ? `opacity-80 ${hoverOverlay}` : 'text-muted-foreground hover:bg-foreground/10'
                    }`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </span>
              ))}
            </div>
          )}
          <p className={`text-[11px] mt-0.5 ${added ? 'opacity-80' : 'text-muted-foreground'}`}>
            {meetingSummary(s, dayLabels) || t('timetable.noSchedule')}
          </p>
        </div>
        {added && (
          <ColorPicker
            className="absolute bottom-2 right-2"
            iconClassName={lightBg ? 'text-black/80' : 'text-white/90'}
            value={color}
            onChange={(c) => setCourseColor(s.courseCode, c)}
          />
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto px-3 lg:px-4 pt-3 pb-8">
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
          className={`grid grid-cols-1 gap-3 items-stretch ${
            panelCollapsed ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(280px,340px)_1fr]'
          }`}
        >
          {/* Left: smart search + results (filters live in the action row) */}
          <div className={`flex flex-col gap-3 min-h-0 ${panelCollapsed ? 'hidden' : ''}`}>
            {/* Free-text search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('timetable.smartSearch')}
                className="pl-9 h-9"
              />
            </div>

            {/* Results */}
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-medium">{t('timetable.results')}</span>
              <span className="text-xs text-muted-foreground">
                {t('timetable.selectedCount', { count: String(selectedSections.length) })}
              </span>
              <span className="text-xs text-muted-foreground">
                {t('timetable.resultsCount', { count: String(filtered.length) })}
              </span>
            </div>

            {/* On desktop the inner list is absolutely positioned so its content
                doesn't drive the column height — the timetable column does — letting
                the results area match the timetable's height and scroll within it. */}
            <div className="relative lg:flex-1 lg:min-h-0">
              <div className="space-y-2 max-h-[60vh] lg:max-h-none lg:absolute lg:inset-0 overflow-y-auto pr-1 timetable-scroll">
                {/* Pinned: currently-selected sections, always visible at the top */}
                {selectedSections.length > 0 && (
                  <>
                    {selectedSections.map((s) => renderResultItem(s))}
                    <div className="border-t border-dashed my-1" />
                  </>
                )}

                {unselectedResults.length === 0 && selectedSections.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">{t('timetable.noResults')}</p>
                )}
                {unselectedResults.slice(0, MAX_RESULTS).map((s) => renderResultItem(s))}
                {unselectedResults.length > MAX_RESULTS && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    {t('timetable.moreResults', { count: String(unselectedResults.length - MAX_RESULTS) })}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right: timetable + selected */}
          <div className="space-y-4">
            {/* Panel toggle + search/filters + export actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* The icon itself is the button (no surrounding chrome); sized h-9 to
                  line up with the filter dropdowns next to it. */}
              <button
                type="button"
                onClick={() => setPanelCollapsed((v) => !v)}
                title={panelCollapsed ? t('timetable.expandPanel') : t('timetable.collapsePanel')}
                className="flex h-9 shrink-0 items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                {panelCollapsed ? (
                  <Eye className="h-5 w-5" />
                ) : (
                  <EyeOff className="h-5 w-5" />
                )}
              </button>

              {/* Filters (hidden while the results panel is collapsed) */}
              {!panelCollapsed && (
                <>
                  <Select value={termId} onValueChange={setTermId}>
                    <SelectTrigger className="h-9 w-auto min-w-[90px]">
                      {/* Always show the generic "Terms" label, not the picked term. */}
                      <span className="truncate">{t('timetable.filter.term')}</span>
                    </SelectTrigger>
                    <SelectContent>
                      {TERMS.map((tm) => (
                        <SelectItem key={tm.id} value={tm.id}>
                          {tm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={subjectArea}
                    onValueChange={(v) => {
                      setSubjectArea(v);
                      setCourseCode('');
                    }}
                  >
                    <SelectTrigger className="h-9 w-auto min-w-[110px]">
                      <SelectValue placeholder={t('timetable.filter.subject')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('timetable.filter.allSubjects')}</SelectItem>
                      {subjectAreaOptions.map((sa) => (
                        <SelectItem key={sa} value={sa}>
                          {sa}
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
                    className="h-9 flex-1 min-w-[150px] max-w-[260px]"
                  />
                  <Combobox
                    options={instructorOptions}
                    value={instructor}
                    onChange={setInstructor}
                    placeholder={t('timetable.filter.instructor')}
                    searchPlaceholder={t('timetable.filter.instructorSearch')}
                    emptyText={t('timetable.noResults')}
                    className="h-9 flex-1 min-w-[150px] max-w-[260px]"
                  />
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="h-9 w-auto min-w-[100px]">
                      <SelectValue placeholder={t('timetable.filter.type')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('timetable.filter.allTypes')}</SelectItem>
                      {typeOptions.map((ty) => (
                        <SelectItem key={ty} value={ty}>
                          {typeOptionLabel(ty)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={day} onValueChange={setDay}>
                    <SelectTrigger className="h-9 w-auto min-w-[100px]">
                      <SelectValue placeholder={t('timetable.filter.day')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('timetable.filter.allDays')}</SelectItem>
                      {DAY_ORDER.filter((d) => d !== 'SUN').map((d) => (
                        <SelectItem key={d} value={d}>
                          {dayLabels[d]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearFilters}
                      title={t('timetable.clearFilters')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}

              <div className="ml-auto flex flex-wrap items-center gap-2">
                {/* Undo / redo the selection (works whether the panel is shown or
                    hidden, since this action row is always rendered). */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={undoSelection}
                  disabled={!canUndo}
                  title={t('timetable.undo')}
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={redoSelection}
                  disabled={!canRedo}
                  title={t('timetable.redo')}
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
                {/* Timetable options — these update the on-screen preview instantly */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" title={t('timetable.customize')}>
                      <SlidersHorizontal className="h-4 w-4" />
                      {/* Label appears when the panel is hidden (the filters make room
                          on desktop); kept on mobile too where the row wraps. */}
                      <span className={`ml-1 ${panelCollapsed ? '' : 'lg:hidden'}`}>
                        {t('timetable.customize')}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="w-[580px] max-w-[calc(100vw-1.5rem)] bg-white dark:bg-gray-900 max-h-[85vh] overflow-y-auto timetable-scroll"
                  >
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                      <div className="space-y-1">
                        <Label className="text-xs">{t('timetable.opt.title')}</Label>
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
                        <Label className="text-xs">{t('timetable.opt.subGrid')}</Label>
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
                        <Label className="text-xs">{t('timetable.opt.hours')}</Label>
                        <OptionToggle
                          value={exportOptions.showHours ? 'on' : 'off'}
                          onChange={(v) => setOpt({ showHours: v === 'on' })}
                          options={[
                            { value: 'on', label: t('timetable.opt.show') },
                            { value: 'off', label: t('timetable.opt.hide') },
                          ]}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('timetable.opt.timeFormat')}</Label>
                        <OptionToggle
                          value={exportOptions.timeFormat}
                          onChange={(v) => setOpt({ timeFormat: v })}
                          options={[
                            { value: '24', label: t('timetable.opt.format24') },
                            { value: '12', label: t('timetable.opt.format12') },
                          ]}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('timetable.opt.dayFormat')}</Label>
                        <OptionToggle
                          value={exportOptions.dayFormat}
                          onChange={(v) => setOpt({ dayFormat: v })}
                          options={[
                            { value: 'short', label: 'MON' },
                            { value: 'long', label: 'Monday' },
                            { value: 'zh', label: '中文' },
                          ]}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('timetable.opt.firstDay')}</Label>
                        <OptionToggle
                          value={exportOptions.firstDay}
                          onChange={(v) => setOpt({ firstDay: v })}
                          options={[
                            { value: 'sun', label: t('timetable.opt.sunday') },
                            { value: 'mon', label: t('timetable.opt.monday') },
                          ]}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('timetable.opt.timeRange')}</Label>
                        <OptionToggle
                          value={exportOptions.rangeMode}
                          onChange={(v) => setOpt({ rangeMode: v })}
                          options={[
                            { value: 'auto', label: t('timetable.opt.rangeAuto') },
                            { value: 'custom', label: t('timetable.opt.rangeCustom') },
                          ]}
                        />
                        {exportOptions.rangeMode === 'custom' && (
                          <div className="flex items-center gap-2 pt-1">
                            <Select
                              value={String(exportOptions.startHour)}
                              onValueChange={(v) => setOpt({ startHour: parseInt(v, 10) })}
                            >
                              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => (
                                  <SelectItem key={h} value={String(h)} disabled={h >= exportOptions.endHour}>
                                    {`${String(h).padStart(2, '0')}:00`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-muted-foreground">–</span>
                            <Select
                              value={String(exportOptions.endHour)}
                              onValueChange={(v) => setOpt({ endHour: parseInt(v, 10) })}
                            >
                              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 17 }, (_, i) => i + 7).map((h) => (
                                  <SelectItem key={h} value={String(h)} disabled={h <= exportOptions.startHour}>
                                    {`${String(h).padStart(2, '0')}:00`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('timetable.opt.textColor')}</Label>
                        <OptionToggle
                          value={exportOptions.textColor}
                          onChange={(v) => setOpt({ textColor: v })}
                          options={[
                            { value: 'dynamic', label: t('timetable.opt.textAuto') },
                            { value: 'white', label: t('timetable.opt.textWhite') },
                            { value: 'black', label: t('timetable.opt.textBlack') },
                          ]}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('timetable.opt.icons')}</Label>
                        <OptionToggle
                          value={exportOptions.showIcons ? 'on' : 'off'}
                          onChange={(v) => setOpt({ showIcons: v === 'on' })}
                          options={[
                            { value: 'on', label: t('timetable.opt.show') },
                            { value: 'off', label: t('timetable.opt.hide') },
                          ]}
                        />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <Label className="text-xs">{t('timetable.opt.days')}</Label>
                        <div className="flex flex-wrap gap-1">
                          {(exportOptions.firstDay === 'sun'
                            ? ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
                            : WEEK_DAYS
                          ).map((d) => {
                            const active = exportOptions.days.includes(d);
                            const isWeekend = d === 'SAT' || d === 'SUN';
                            return (
                              <button
                                key={d}
                                type="button"
                                onClick={() =>
                                  setOpt({
                                    days: active
                                      ? exportOptions.days.filter((x) => x !== d)
                                      : [...exportOptions.days, d],
                                    // Remember a manual weekend choice so it overrides
                                    // the lesson-based auto include/exclude.
                                    ...(isWeekend && {
                                      weekendInclude: { ...exportOptions.weekendInclude, [d]: !active },
                                    }),
                                  })
                                }
                                className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                                  active
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-transparent text-muted-foreground hover:bg-accent'
                                }`}
                              >
                                {DAY_PILL_LABEL[d]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <Label className="text-xs">{t('timetable.opt.fields')}</Label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {([
                            { key: 'code', label: t('timetable.opt.fCode') },
                            { key: 'title', label: t('timetable.opt.fTitle') },
                            { key: 'type', label: t('timetable.opt.fType') },
                            { key: 'number', label: t('timetable.opt.fNumber') },
                            { key: 'venue', label: t('timetable.opt.fVenue') },
                            { key: 'instructor', label: t('timetable.opt.fInstructor') },
                            { key: 'time', label: t('timetable.opt.fTime') },
                          ] as { key: keyof BlockFields; label: string }[]).map((f) => (
                            <label key={f.key} className="flex items-center gap-2 text-xs cursor-pointer">
                              <Checkbox
                                checked={exportOptions.fields[f.key]}
                                onCheckedChange={(v) =>
                                  setOpt({ fields: { ...exportOptions.fields, [f.key]: !!v } })
                                }
                              />
                              {f.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Export — the red button now carries its own options (theme,
                    resolution, file type); picking a file type runs the export. */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      size="sm"
                      disabled={exporting || selectedSections.length === 0}
                      title={t('timetable.export')}
                    >
                      {exporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      {/* Label appears when the panel is hidden (extra room available). */}
                      <span className={`ml-1 ${panelCollapsed ? '' : 'lg:hidden'}`}>
                        {t('timetable.export')}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 bg-white dark:bg-gray-900 space-y-3">
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
                      <Label className="text-sm">{t('timetable.opt.resolution')}</Label>
                      <OptionToggle
                        value={exportOptions.resolution}
                        onChange={(v) => setOpt({ resolution: v })}
                        options={[
                          { value: 'low', label: t('timetable.opt.resLow') },
                          { value: 'standard', label: t('timetable.opt.resStandard') },
                          { value: 'high', label: t('timetable.opt.resHigh') },
                        ]}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">{t('timetable.opt.fileType')}</Label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={exporting || selectedSections.length === 0}
                          onClick={() => requestExport('png')}
                        >
                          <ImageIcon className="h-4 w-4 mr-1" />
                          {t('timetable.exportPng')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={exporting || selectedSections.length === 0}
                          onClick={() => requestExport('pdf')}
                        >
                          <FileDown className="h-4 w-4 mr-1" />
                          {t('timetable.exportPdf')}
                        </Button>
                      </div>
                    </div>
                    {/* Calendar (.ics) — recurring weekly events over a custom date range. */}
                    <div className="space-y-1.5">
                      <Label className="text-sm">{t('timetable.exportIcs')}</Label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">{t('timetable.icsStart')}</Label>
                          <Input
                            type="date"
                            value={exportOptions.icsStart}
                            onChange={(e) => setOpt({ icsStart: e.target.value })}
                            className="h-8 px-2 [color-scheme:light] dark:[color-scheme:dark]"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">{t('timetable.icsEnd')}</Label>
                          <Input
                            type="date"
                            value={exportOptions.icsEnd}
                            min={exportOptions.icsStart || undefined}
                            onChange={(e) => setOpt({ icsEnd: e.target.value })}
                            className="h-8 px-2 [color-scheme:light] dark:[color-scheme:dark]"
                          />
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={
                          selectedSections.length === 0 ||
                          !exportOptions.icsStart ||
                          !exportOptions.icsEnd ||
                          exportOptions.icsEnd < exportOptions.icsStart
                        }
                        onClick={handleExportIcs}
                      >
                        <CalendarDays className="h-4 w-4 mr-1" />
                        {t('timetable.exportIcs')}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => commitSelection([])}
                  disabled={selectedSections.length === 0}
                  title={t('timetable.clearAll')}
                  className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* On-screen title + grid (reflects the timetable options live) */}
            {exportOptions.includeTitle && (
              <div className="flex items-center justify-center gap-2">
                {editingTitle ? (
                  <Input
                    autoFocus
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={() => {
                      setOpt({ customTitle: titleDraft.trim() });
                      setEditingTitle(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setOpt({ customTitle: titleDraft.trim() });
                        setEditingTitle(false);
                      } else if (e.key === 'Escape') {
                        setEditingTitle(false);
                      }
                    }}
                    className="h-9 max-w-xs text-center text-xl font-bold"
                  />
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-center">{displayTitle}</h2>
                    <button
                      onClick={() => {
                        setTitleDraft(displayTitle);
                        setEditingTitle(true);
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title={t('timetable.editTitle')}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            )}
            <TimetableGrid
              sections={selectedSections}
              conflictIds={conflictIds}
              colorMap={colorMap}
              showSubGrid={exportOptions.showSubGrid}
              showHours={exportOptions.showHours}
              textColor={exportOptions.textColor}
              showIcons={exportOptions.showIcons}
              use24Hour={exportOptions.timeFormat === '24'}
              dayFormat={exportOptions.dayFormat}
              fields={exportOptions.fields}
              rangeStart={exportOptions.rangeMode === 'custom' ? exportOptions.startHour : undefined}
              rangeEnd={exportOptions.rangeMode === 'custom' ? exportOptions.endHour : undefined}
              days={exportOptions.days}
              firstDay={exportOptions.firstDay}
              editableColors={panelCollapsed}
              onColorChange={setCourseColor}
              onRemoveSection={toggleSection}
            />

            {/* Off-screen, full-width render used only for PNG/PDF export */}
            <div
              aria-hidden
              style={{ position: 'absolute', left: '-99999px', top: 0, width: 1320, height: 0, overflow: 'hidden', pointerEvents: 'none' }}
            >
              <div
                ref={exportRef}
                className="p-6"
                style={themeVars(exportOptions.theme === 'dark')}
              >
                {exportOptions.includeTitle && (
                  <h2 className="text-2xl font-bold text-center mb-4">{displayTitle}</h2>
                )}
                <TimetableGrid
                  sections={selectedSections}
                  conflictIds={conflictIds}
                  colorMap={colorMap}
                  forExport
                  exportDark={exportOptions.theme === 'dark'}
                  showSubGrid={exportOptions.showSubGrid}
                  showHours={exportOptions.showHours}
                  textColor={exportOptions.textColor}
                  showIcons={exportOptions.showIcons}
                  use24Hour={exportOptions.timeFormat === '24'}
                  dayFormat={exportOptions.dayFormat}
                  fields={exportOptions.fields}
                  rangeStart={exportOptions.rangeMode === 'custom' ? exportOptions.startHour : undefined}
                  rangeEnd={exportOptions.rangeMode === 'custom' ? exportOptions.endHour : undefined}
                  days={exportOptions.days}
                  firstDay={exportOptions.firstDay}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm export when there are time conflicts */}
      <AlertDialog open={pendingExport !== null} onOpenChange={(open) => !open && setPendingExport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('timetable.exportConflictTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('timetable.exportConflictDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('timetable.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const fmt = pendingExport;
                setPendingExport(null);
                if (fmt) handleExport(fmt);
              }}
            >
              {t('timetable.exportAnyway')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Timetable;
