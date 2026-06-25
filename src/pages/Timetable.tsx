import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useDebounce } from '@/hooks/useDebounce';
import { useEnhancedResponsive } from '@/hooks/useEnhancedResponsive';
import {
  loadTimetableSections,
  findConflicts,
  meetingsOverlap,
  parseVenueRooms,
  groupVenues,
  DAY_ORDER,
  TERMS,
  type TimetableSection,
} from '@/services/timetableService';
import {
  TimeFilter,
  VenueFilter,
  EMPTY_TIME_FILTER,
  isTimeFilterActive,
  type TimeFilterValue,
} from '@/components/features/timetable/TimeVenueFilters';
import { buildTimetableIcs } from '@/services/timetableIcs';
import { loadTimetableCatalog, normInstructorName, type TimetableCatalog } from '@/services/timetableCatalog';
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
import { defaultCourseColor } from '@/components/features/timetable/palette';
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
  ClockAlert,
  Slash,
  Menu,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  Pencil,
  ExternalLink,
  Undo2,
  Redo2,
  Info,
} from 'lucide-react';

const STORAGE_KEY = 'timetable.selectedSectionIds';
const EXPORT_OPTS_KEY = 'timetable.exportOptions';
const CUSTOM_TITLES_KEY = 'timetable.customTitles';
const MAX_RESULTS = 80;

interface ExportOptions {
  // Timetable options (affect on-screen preview + export)
  includeTitle: boolean;
  showSubGrid: boolean;
  showHours: boolean;
  showCredits: boolean;
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
  showCredits: true,
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
  customColors: {},
  resolution: 'standard',
  theme: 'light',
  icsStart: '',
  icsEnd: '',
};

const SESSION_TYPE_LABELS: Record<string, { 'zh-TW': string; 'zh-CN': string }> = {
  LEC: { 'zh-TW': '講課', 'zh-CN': '讲课' },
  TUT: { 'zh-TW': '導修', 'zh-CN': '导修' },
  SEM: { 'zh-TW': '研討', 'zh-CN': '研讨' },
};

// Full English name per subject-area code, shown after the code in the subject
// filter (e.g. "ACT · Accounting"). Intentionally always English regardless of
// site language (unlike the catalog page's translated subject names).
const SUBJECT_FULL_NAMES: Record<string, string> = {
  ACT: 'Accounting',
  ADA: 'Animation and Digital Arts',
  ARS: 'Arts',
  BAI: 'Business Analytics and Innovation',
  BUS: 'General Business',
  CCC: 'Common Core',
  CDS: 'Computing and Data Sciences',
  CHI: 'Chinese',
  CLA: 'Creativity and Innovation',
  CLB: 'Humanities and the Arts',
  CLC: 'Management and Society',
  CLD: 'Science, Technology, Mathematics and Society',
  CLE: 'Values, Cultures and Societies',
  CMI: 'Creative Media Industries',
  CRE: 'Creativity',
  CUS: 'Cultural Studies',
  ECO: 'Economics',
  ENG: 'English',
  FIN: 'Finance',
  FRE: 'French',
  FVA: 'Film and Visual Arts',
  GDS: 'Global Development and Sustainability',
  GER: 'German',
  GLA: 'Global Liberal Arts',
  GOV: 'Government and International Affairs',
  HRM: 'Human Resource Management',
  HSM: 'Health and Social Services Management',
  HST: 'History',
  ISM: 'Information Systems',
  JAP: 'Japanese',
  KOR: 'Korean',
  LCC: 'Language and Communication - Chinese',
  LCE: 'Language and Communication - English',
  LUE: 'Lingnan University English',
  MGT: 'Management',
  MKT: 'Marketing',
  MPA: 'Music and Performing Arts',
  ORM: 'Operations and Risk Management',
  PAI: 'Philosophy and Artificial Intelligence',
  PHI: 'Philosophy',
  PMS: 'Public Management and Smart Governance',
  POL: 'Political Science',
  PSY: 'Psychology',
  RIM: 'Risk and Insurance Management',
  RUS: 'Russian',
  SCE: 'Sports Coaching and Event Management',
  SCI: 'Science',
  SDA: 'Social Data Science',
  SLP: 'Service Learning Programmes',
  SOC: 'Sociology',
  SPA: 'Spanish',
  SSC: 'Social Sciences',
  TRA: 'Translation',
  VIS: 'Visual Studies',
  MGSL: 'Service Leadership',
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
  const navigate = useNavigate();
  // Mobile portrait gets a tighter layout: filter dropdowns fill each row and
  // split it equally, and the action buttons (customize/export/delete) go
  // icon-only.
  const { isMobilePortrait } = useEnhancedResponsive();

  // Detect whether we're running inside an installed PWA (standalone display
  // mode). In a standalone PWA, `target="_blank"` on a same-origin link gets
  // handed off to the OS browser, which re-launches the PWA at its start URL
  // instead of jumping to the route — so for PWA users we navigate in-app via
  // the router instead. In a normal browser tab we keep the open-in-new-tab
  // behaviour. Detected once at mount.
  const [isStandalonePWA] = useState(
    () =>
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true),
  );

  // Click handler for the "open course/instructor" link icons. In a PWA we
  // intercept the click and route in-app (no reload); in a browser we let the
  // native `target="_blank"` anchor open a new tab as usual.
  const openInternalLink = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    if (isStandalonePWA) {
      e.preventDefault();
      navigate(path);
    }
  };

  const [allSections, setAllSections] = useState<TimetableSection[]>([]);
  // The term `allSections` currently holds data for. Section ids (CRNs) are
  // reused across terms, so until this matches the selected term the grid must
  // not map the (already-switched) selection through the previous term's data —
  // doing so briefly renders a wrong timetable. See `sectionsReady` below.
  const [loadedTermId, setLoadedTermId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Term selection (today there is one; the dropdown is future-proofed for more).
  // Default to the newest term and list terms newest-first in the dropdown.
  const [termId, setTermId] = useState(TERMS[TERMS.length - 1].id);
  const term = useMemo(() => TERMS.find((tm) => tm.id === termId) ?? TERMS[TERMS.length - 1], [termId]);
  const isSummer = !!term.summer;
  const termsNewestFirst = useMemo(() => [...TERMS].reverse(), []);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 250);
  const [subjectArea, setSubjectArea] = useState('all');
  const [courseCode, setCourseCode] = useState('');
  const [instructor, setInstructor] = useState('');
  const [type, setType] = useState('all');
  // Time filter: multi-day + optional time-range (within / exclude). Venue
  // filter: a set of selected room codes (empty = no restriction).
  const [timeFilter, setTimeFilter] = useState<TimeFilterValue>(EMPTY_TIME_FILTER);
  const [venueFilter, setVenueFilter] = useState<string[]>([]);

  // Selection with undo/redo history (max 10 steps each way) so an accidental
  // add/remove can be reverted. `past`/`future` hold prior/undone selections;
  // `present` is the live selection used everywhere else.
  const [selHistory, setSelHistory] = useState<{
    past: string[][];
    present: string[];
    future: string[][];
  }>(() => ({ past: [], present: loadSelectedIds(TERMS[TERMS.length - 1].id), future: [] }));
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
  const exportPageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [pendingExport, setPendingExport] = useState<'png' | 'pdf' | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  // Whether to show results that clash with the current timetable (red-bordered).
  const [showConflicts, setShowConflicts] = useState(true);
  // Collapsible state for the two result groups (chosen / available).
  const [chosenCollapsed, setChosenCollapsed] = useState(false);
  const [availableCollapsed, setAvailableCollapsed] = useState(false);

  const [exportOptions, setExportOptions] = useState<ExportOptions>(() => {
    // Export defaults to a light theme even when the site is in dark mode (a
    // light timetable prints/shares better); the user can still switch it.
    const base: ExportOptions = { ...DEFAULT_EXPORT_OPTIONS, theme: 'light' };
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

  // Custom timetable titles are remembered per term, so switching terms restores
  // that term's own title (or falls back to the term name) instead of leaking the
  // previous term's custom title.
  const [customTitles, setCustomTitles] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_TITLES_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_TITLES_KEY, JSON.stringify(customTitles));
    } catch {
      /* ignore */
    }
  }, [customTitles]);
  const setCustomTitle = (title: string) =>
    setCustomTitles((prev) => ({ ...prev, [termId]: title }));

  // Collapsible filter/results panel. On entry, default to *collapsed* when the
  // newest term already has selected courses (land the user straight on their
  // timetable); otherwise default to *expanded* so they can start adding. Same
  // rule on mobile and desktop.
  const [panelCollapsed, setPanelCollapsed] = useState<boolean>(() => {
    try {
      const newestTermId = TERMS[TERMS.length - 1].id;
      return loadSelectedIds(newestTermId).length > 0;
    } catch {
      return false;
    }
  });

  // The results list no longer matches the timetable's height exactly. Instead it
  // gets a minimum height equal to the tallest it can be without forcing the page
  // to scroll, so users can browse more results even when only a few sections are
  // selected (a short timetable). Desktop only; recomputed on resize/layout.
  const resultsRef = useRef<HTMLDivElement>(null);
  const [resultsMinH, setResultsMinH] = useState<number | undefined>(undefined);
  useEffect(() => {
    const recompute = () => {
      const el = resultsRef.current;
      if (!el || panelCollapsed || window.innerWidth < 1024) {
        setResultsMinH(undefined);
        return;
      }
      const docTop = el.getBoundingClientRect().top + window.scrollY;
      const h = Math.round(window.innerHeight - docTop - 16);
      setResultsMinH(h > 240 ? h : undefined);
    };
    recompute();
    const raf = requestAnimationFrame(recompute);
    window.addEventListener('resize', recompute);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', recompute);
    };
  }, [panelCollapsed, loading, error]);

  useEffect(() => {
    let active = true;
    const loadingTermId = term.id;
    setLoading(true);
    loadTimetableSections(term.csvUrl)
      .then((sections) => {
        if (!active) return;
        // Drop sections with no scheduled meeting (e.g. PRJ) — not useful here.
        setAllSections(sections.filter((s) => s.meetings.length > 0));
        // Tag the loaded data with its term so the grid only renders once the
        // selection and the section data refer to the same term.
        setLoadedTermId(loadingTermId);
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

  // Multilingual catalog (Chinese course titles, instructor Chinese names &
  // nicknames) for richer search and instructor display. Loaded once and served
  // from a 24h localStorage cache — see loadTimetableCatalog for the read budget.
  const [catalog, setCatalog] = useState<TimetableCatalog | null>(null);
  useEffect(() => {
    let active = true;
    loadTimetableCatalog()
      .then((c) => active && setCatalog(c))
      .catch(() => {
        /* search/display gracefully fall back to English-only */
      });
    return () => {
      active = false;
    };
  }, []);

  // UPPER course code → credits, distilled from the same already-cached catalog
  // (0 extra Appwrite reads). Drives the credit badges + total-credits count.
  const creditsByCode = useMemo(() => {
    const map: Record<string, string> = {};
    if (catalog) {
      for (const [code, info] of Object.entries(catalog.courses)) {
        if (info.credits) map[code] = info.credits;
      }
    }
    return map;
  }, [catalog]);

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

  // Track the live site theme so default course colours pick the contrasting
  // Catppuccin variant (dark theme → Latte, light theme → Mocha) and re-colour
  // if the user switches theme.
  const [siteDark, setSiteDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  );
  useEffect(() => {
    const update = () => setSiteDark(document.documentElement.classList.contains('dark'));
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

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
    const map = new Map<string, ComboboxOption>();
    for (const s of allSections) {
      if (subjectArea !== 'all' && codePrefix(s.courseCode) !== subjectArea) continue;
      if (!map.has(s.courseCode)) {
        // Chinese titles go into keywords so the dropdown is searchable by them
        // (e.g. typing "中文" surfaces CHI3219) while the label stays compact.
        const ch = catalog?.courses[s.courseCode.toUpperCase()];
        const keywords = [s.courseTitle, ch?.tc, ch?.sc].filter(Boolean) as string[];
        map.set(s.courseCode, {
          value: s.courseCode,
          label: `${s.courseCode} · ${s.courseTitle}`,
          keywords,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.value.localeCompare(b.value));
  }, [allSections, subjectArea, catalog]);

  const instructorOptions: ComboboxOption[] = useMemo(() => {
    const set = new Set<string>();
    for (const s of allSections) for (const name of s.instructors) set.add(name);
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => {
        const ci = catalog?.instructors[normInstructorName(name)];
        // Show the Chinese name after the English one on zh sites, e.g.
        // "TANG Lili (湯莉莉)"; searchable by Chinese name and nickname too.
        const zh = language === 'zh-TW' ? ci?.tc : language === 'zh-CN' ? ci?.sc : undefined;
        const label = zh ? `${name} (${zh})` : name;
        const keywords = [ci?.tc, ci?.sc, ci?.nickname].filter(Boolean) as string[];
        return { value: name, label, keywords };
      });
  }, [allSections, catalog, language]);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of allSections) for (const ty of s.types) set.add(ty);
    return Array.from(set).sort();
  }, [allSections]);

  // Days present in the data (in week order) — drives the Time filter's chips.
  const availableDays = useMemo(() => {
    const set = new Set<string>();
    for (const s of allSections) for (const m of s.meetings) set.add(m.day);
    return DAY_ORDER.filter((d) => set.has(d));
  }, [allSections]);

  // Venue rooms grouped by building (rooms naturally ordered) for the Venue filter.
  const venueGroups = useMemo(() => {
    const codes = new Set<string>();
    for (const s of allSections) for (const m of s.meetings) for (const r of parseVenueRooms(m.venue)) codes.add(r);
    return groupVenues(codes);
  }, [allSections]);

  // Extra multilingual search text per section (Chinese course title, instructor
  // Chinese names & nicknames), so the smart search box matches them too.
  const sectionSearchText = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of allSections) {
      let extra = '';
      const ch = catalog?.courses[s.courseCode.toUpperCase()];
      if (ch) extra += ` ${ch.tc ?? ''} ${ch.sc ?? ''}`;
      for (const name of s.instructors) {
        const ci = catalog?.instructors[normInstructorName(name)];
        if (ci) extra += ` ${ci.tc ?? ''} ${ci.sc ?? ''} ${ci.nickname ?? ''}`;
      }
      map.set(s.id, extra.toLowerCase());
    }
    return map;
  }, [allSections, catalog]);

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    // Pre-parse the time-range bounds once (minutes from midnight).
    const toMin = (hhmm: string) => {
      const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
      return Number.isNaN(h) ? null : h * 60 + (m || 0);
    };
    const timeActive = isTimeFilterActive(timeFilter);
    const from = timeFilter.from ? toMin(timeFilter.from) : null;
    const to = timeFilter.to ? toMin(timeFilter.to) : null;
    const rangeOn = timeFilter.mode !== 'off' && from != null && to != null && from < to;
    const venueSet = venueFilter.length ? new Set(venueFilter) : null;
    const result = allSections.filter((s) => {
      if (subjectArea !== 'all' && codePrefix(s.courseCode) !== subjectArea) return false;
      if (courseCode && s.courseCode !== courseCode) return false;
      if (instructor && !s.instructors.includes(instructor)) return false;
      if (type !== 'all' && !s.types.includes(type)) return false;
      // Day restriction: keep sections with a meeting on any selected day.
      if (timeFilter.days.length && !s.meetings.some((m) => timeFilter.days.includes(m.day))) return false;
      // Time-range restriction:
      //  - within:  every meeting must fall entirely inside [from, to)
      //  - exclude: no meeting may overlap [from, to)
      if (timeActive && rangeOn) {
        if (timeFilter.mode === 'within') {
          if (!s.meetings.every((m) => m.startMinutes >= from! && m.endMinutes + 1 <= to!)) return false;
        } else {
          if (s.meetings.some((m) => m.startMinutes < to! && from! < m.endMinutes + 1)) return false;
        }
      }
      // Venue restriction: keep sections with a meeting in a selected room.
      if (venueSet && !s.meetings.some((m) => parseVenueRooms(m.venue).some((r) => venueSet.has(r)))) return false;
      if (term) {
        const haystack = `${s.courseCode} ${s.courseTitle} ${s.crn} ${s.instructors.join(' ')} ${sectionSearchText.get(s.id) ?? ''}`.toLowerCase();
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
  }, [allSections, debouncedSearch, subjectArea, courseCode, instructor, type, timeFilter, venueFilter, sectionSearchText]);

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

  // Summer terms split the selection into two independent sessions (1st / 2nd),
  // each rendered as its own timetable. A section with no session falls back to 1.
  const summerSel1 = useMemo(
    () => selectedSections.filter((s) => (s.summerSession ?? 1) === 1),
    [selectedSections],
  );
  const summerSel2 = useMemo(
    () => selectedSections.filter((s) => s.summerSession === 2),
    [selectedSections],
  );

  // Conflicts are computed within each session (the two sessions never overlap in
  // real time), then combined for the export-clash warning.
  const conf1 = useMemo(() => findConflicts(summerSel1), [summerSel1]);
  const conf2 = useMemo(() => findConflicts(summerSel2), [summerSel2]);
  const conflictIds = useMemo(
    () => (isSummer ? new Set<string>([...conf1, ...conf2]) : findConflicts(selectedSections)),
    [isSummer, conf1, conf2, selectedSections],
  );

  // Per-session date ranges (from the CSV) used in the sub-titles and as the
  // default .ics date range for each summer session.
  const summerRanges = useMemo(() => {
    const r: Record<number, { start?: string; end?: string }> = {};
    for (const s of allSections) {
      if (!s.summerSession) continue;
      const cur = r[s.summerSession] ?? {};
      if (s.startDate && (!cur.start || s.startDate < cur.start)) cur.start = s.startDate;
      if (s.endDate && (!cur.end || s.endDate > cur.end)) cur.end = s.endDate;
      r[s.summerSession] = cur;
    }
    return r;
  }, [allSections]);

  const fmtDate = (iso?: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    // YYYY/MM/DD to avoid the ambiguous DD/MM vs MM/DD reading.
    return `${y}/${m}/${d}`;
  };

  // "Session 1 (2025/05/27 - 2025/07/08)" — range appended when known.
  const summerLabel = (session: number) => {
    const base = t(session === 1 ? 'timetable.summerSession1' : 'timetable.summerSession2');
    const r = summerRanges[session];
    return r?.start && r?.end ? `${base} (${fmtDate(r.start)} - ${fmtDate(r.end)})` : base;
  };

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
      map.set(
        id,
        exportOptions.customColors[s.courseCode] ?? defaultCourseColor(slots.get(s.courseCode)!, siteDark),
      );
    }
    return map;
  }, [selectedIds, sectionById, exportOptions.customColors, siteDark]);

  const setCourseColor = (courseCode: string, color: string) =>
    setOpt({ customColors: { ...exportOptions.customColors, [courseCode]: color } });

  const customTitle = customTitles[termId] ?? '';
  const displayTitle = customTitle.trim() ? customTitle : term.name;

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
    // One node per page (summer can have two; otherwise one).
    const nodes = exportPageRefs.current.filter((n): n is HTMLDivElement => !!n);
    if (nodes.length === 0 || selectedSections.length === 0) return;
    setExporting(true);
    try {
      const dark = exportOptions.theme === 'dark';
      const bgColor = dark ? '#000000' : '#ffffff';
      const pixelRatio = RESOLUTION_SCALE[exportOptions.resolution];
      const htmlToImage = await import('html-to-image');
      const safeName = `${term.name.replace(/[^\w一-鿿-]+/g, '_')}_timetable`;
      const multi = nodes.length > 1;

      if (format === 'png') {
        // PNG has no pages — export one file per page (suffixed when multiple).
        for (let i = 0; i < nodes.length; i++) {
          const dataUrl = await htmlToImage.toPng(nodes[i], { pixelRatio, backgroundColor: bgColor, cacheBust: true });
          const link = document.createElement('a');
          link.download = multi ? `${safeName}_S${i + 1}.png` : `${safeName}.png`;
          link.href = dataUrl;
          link.click();
        }
      } else {
        // Use a JPEG (lossy) image + stream compression to keep the PDF small —
        // a PNG-based PDF can be ~10× larger for the same timetable. Each page
        // becomes its own PDF page.
        const { jsPDF } = await import('jspdf');
        let pdf: import('jspdf').jsPDF | null = null;
        for (const node of nodes) {
          const imgW = node.scrollWidth;
          const imgH = node.scrollHeight;
          const dataUrl = await htmlToImage.toJpeg(node, { pixelRatio, backgroundColor: bgColor, quality: 0.82, cacheBust: true });
          const orientation = imgW >= imgH ? 'landscape' : 'portrait';
          if (!pdf) pdf = new jsPDF({ orientation, unit: 'px', format: [imgW, imgH], compress: true });
          else pdf.addPage([imgW, imgH], orientation);
          pdf.addImage(dataUrl, 'JPEG', 0, 0, imgW, imgH, undefined, 'FAST');
        }
        pdf!.save(`${safeName}.pdf`);
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
    if (selectedSections.length === 0) return;
    // Summer sections carry their own per-session date range (from the CSV), so
    // the manual start/end inputs aren't required there.
    if (!isSummer && (!icsStart || !icsEnd)) return;
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
    instructor !== '' || type !== 'all' || isTimeFilterActive(timeFilter) || venueFilter.length > 0;

  const toggleSection = (id: string) => {
    commitSelection((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSubjectArea('all');
    setCourseCode('');
    setInstructor('');
    setType('all');
    setTimeFilter(EMPTY_TIME_FILTER);
    setVenueFilter([]);
  };

  // True if adding this section would clash (time-overlap) with the current
  // selection. Used to warn in the results list; users may still add it. In
  // summer terms only same-session selections can clash.
  const conflictsWithSelection = (s: TimetableSection) => {
    const pool = isSummer
      ? selectedSections.filter((x) => (x.summerSession ?? 1) === (s.summerSession ?? 1))
      : selectedSections;
    return pool.some(
      (sel) =>
        sel.id !== s.id &&
        sel.meetings.some((m) => s.meetings.some((sm) => meetingsOverlap(m, sm))),
    );
  };

  // Results actually shown: optionally drop the clashing (red-bordered) ones.
  const visibleResults = showConflicts
    ? unselectedResults
    : unselectedResults.filter((s) => !conflictsWithSelection(s));

  const renderResultItem = (s: TimetableSection) => {
    const added = selectedSet.has(s.id);
    const color = colorMap.get(s.id);
    // Pick the text colour by background lightness (same logic as the timetable
    // blocks), so a light section colour gets dark text instead of unreadable white.
    const fg = added ? blockTextColor(color || '', exportOptions.textColor) : undefined;
    const lightBg = added && fg === '#000000';
    const hoverOverlay = lightBg ? 'hover:bg-black/10' : 'hover:bg-white/20';
    // Flag time clashes: for added items reuse the computed conflict set; for
    // results, check against the current selection (so users see the warning
    // before adding). A red border marks it — adding is still allowed.
    const conflicts = added ? conflictIds.has(s.id) : conflictsWithSelection(s);
    // Combined session type + section number, matching the timetable blocks (e.g. "LEC1").
    const typeNumber = `${s.types.join('/')}${s.section}`;
    // Credit badge text (e.g. "3 Cred"); "Cred" stays untranslated. Gated by the
    // same show-credits customize toggle as the timetable blocks.
    const creditVal = exportOptions.showCredits ? creditsByCode[s.courseCode.toUpperCase()] : undefined;
    const creditText = creditVal ? `${creditVal} Cred` : '';
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
        title={added ? t('timetable.remove') : conflicts ? t('timetable.conflictAddHint') : t('timetable.add')}
        className={`relative rounded-lg border p-3 cursor-pointer transition-colors ${
          conflicts ? 'border-2 border-red-500' : added ? 'border-transparent' : ''
        } ${added ? '' : 'hover:bg-accent/40'}`}
        style={added ? { backgroundColor: color, color: fg } : undefined}
      >
        {/* Top-right badges: credits (e.g. "3 Cred"), then summer session (S1/S2),
            then session type + number. */}
        {(creditText || typeNumber || (isSummer && s.summerSession)) && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
            {creditText && (
              <span
                className={`text-[10px] font-bold rounded px-1 py-0.5 leading-none whitespace-nowrap ${
                  added ? '' : 'bg-foreground/10 text-foreground'
                }`}
                style={added ? { backgroundColor: lightBg ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.28)' } : undefined}
              >
                {creditText}
              </span>
            )}
            {isSummer && s.summerSession && (
              <span
                className={`text-[10px] font-bold rounded px-1 py-0.5 leading-none ${
                  added ? '' : 'bg-foreground/10 text-foreground'
                }`}
                style={added ? { backgroundColor: lightBg ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.28)' } : undefined}
              >
                S{s.summerSession}
              </span>
            )}
            {typeNumber && (
              <span
                className={`text-[10px] font-bold rounded px-1 py-0.5 leading-none ${
                  added ? '' : 'bg-foreground/10 text-foreground'
                }`}
                style={added ? { backgroundColor: lightBg ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.28)' } : undefined}
              >
                {typeNumber}
              </span>
            )}
          </div>
        )}
        <div className={`min-w-0 ${creditText ? 'pr-[6.5rem]' : 'pr-12'}`}>
          {/* Course code + a dedicated link icon to the course page. The icon is the
              only link target (the text stays part of the add/remove card tap area);
              its padding gives a comfortable, accurate hit area on touch screens. */}
          <div className="flex items-center gap-1">
            <span className="font-semibold text-sm">{s.courseCode}</span>
            <a
              href={`/courses/${s.courseCode}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => openInternalLink(e, `/courses/${s.courseCode}`)}
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
                    onClick={(e) => openInternalLink(e, `/instructors/${encodeURIComponent(name)}`)}
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
        {/* Time-clash marker — a red clock-alert in the bottom-right corner.
            For added (coloured) cards the colour picker already sits there, so
            nudge the icon to its left. */}
        {conflicts && (
          <ClockAlert
            aria-hidden
            className={`pointer-events-none absolute bottom-2 h-4 w-4 text-red-500 ${added ? 'right-9' : 'right-2'}`}
          />
        )}
      </div>
    );
  };

  // A live (on-screen, editable) timetable grid for a given subset of sections.
  const renderLiveGrid = (sections: TimetableSection[], conflicts: Set<string>) => (
    <TimetableGrid
      sections={sections}
      conflictIds={conflicts}
      colorMap={colorMap}
      showSubGrid={exportOptions.showSubGrid}
      showHours={exportOptions.showHours}
      showCredits={exportOptions.showCredits}
      creditsByCode={creditsByCode}
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
  );

  // Pages to export: non-summer → one page; summer → one page per session that
  // actually has lessons (so an empty session is never exported).
  const exportPages = isSummer
    ? ([
        summerSel1.length ? { label: summerLabel(1), sections: summerSel1, conflicts: conf1 } : null,
        summerSel2.length ? { label: summerLabel(2), sections: summerSel2, conflicts: conf2 } : null,
      ].filter(Boolean) as { label: string; sections: TimetableSection[]; conflicts: Set<string> }[])
    : [{ label: '', sections: selectedSections, conflicts: conflictIds }];

  // Editable timetable title (used in both the mobile title row and, on desktop,
  // the combined title + actions row).
  const titleContent = editingTitle ? (
    <Input
      autoFocus
      value={titleDraft}
      onChange={(e) => setTitleDraft(e.target.value)}
      onBlur={() => {
        setCustomTitle(titleDraft.trim());
        setEditingTitle(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          setCustomTitle(titleDraft.trim());
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
  );

  // Undo / redo / customize / export / clear. Rendered in the action row on
  // mobile, but moved onto the title row on desktop so the filter dropdowns can
  // use the full action row (see the lg: visibility toggles below).
  const actionButtons = (
    <>
      {/* Undo / redo the selection. */}
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
                on desktop). Always hidden on mobile portrait (icon-only). */}
            <span className={`ml-1 ${isMobilePortrait ? 'hidden' : panelCollapsed ? '' : 'lg:hidden'}`}>
              {t('timetable.customize')}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          collisionPadding={8}
          className="w-[580px] max-w-[calc(100vw-1.5rem)] bg-white dark:bg-gray-900 max-h-[min(85vh,var(--radix-popover-content-available-height))] overflow-y-auto timetable-scroll"
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
              <Label className="text-xs">{t('timetable.opt.credits')}</Label>
              <OptionToggle
                value={exportOptions.showCredits ? 'on' : 'off'}
                onChange={(v) => setOpt({ showCredits: v === 'on' })}
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
            {/* Label appears when the panel is hidden (extra room available).
                Always hidden on mobile portrait (icon-only). */}
            <span className={`ml-1 ${isMobilePortrait ? 'hidden' : panelCollapsed ? '' : 'lg:hidden'}`}>
              {t('timetable.export')}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          collisionPadding={8}
          className="w-80 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-gray-900 space-y-3 max-h-[min(85vh,var(--radix-popover-content-available-height))] overflow-y-auto timetable-scroll"
        >
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
          {/* Calendar (.ics) — recurring weekly events over a date range.
              Summer terms use each session's own range from the CSV. */}
          <div className="space-y-1.5">
            <Label className="text-sm">{t('timetable.exportIcs')}</Label>
            {isSummer ? (
              <div className="space-y-0.5 text-[11px] text-muted-foreground">
                {summerRanges[1]?.start && (
                  <p>{summerLabel(1)}</p>
                )}
                {summerRanges[2]?.start && (
                  <p>{summerLabel(2)}</p>
                )}
              </div>
            ) : (
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
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={
                selectedSections.length === 0 ||
                (!isSummer &&
                  (!exportOptions.icsStart ||
                    !exportOptions.icsEnd ||
                    exportOptions.icsEnd < exportOptions.icsStart))
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
        onClick={() => setConfirmClear(true)}
        disabled={selectedSections.length === 0}
        title={t('timetable.clearAll')}
        className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </>
  );

  // Year / term dropdown. Rendered in a couple of places (above the search box
  // on mobile portrait, and in the action row otherwise) and kept visible even
  // when the panel is collapsed, so it lives here as a small helper.
  const renderTermSelect = (triggerClassName: string) => (
    <Select value={termId} onValueChange={setTermId}>
      <SelectTrigger className={`h-9 ${triggerClassName}`}>
        {/* Show the picked term's short form (e.g. "2425-T1"). */}
        <span className="truncate">{term.short}</span>
      </SelectTrigger>
      <SelectContent>
        {termsNewestFirst.map((tm) => (
          <SelectItem key={tm.id} value={tm.id}>
            {tm.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  // True once the loaded section data belongs to the currently-selected term.
  // While a term switch is in flight (new selection, old section data still in
  // memory) this is false, so we keep the spinner up instead of flashing a
  // wrong timetable built from the previous term's reused CRNs.
  const sectionsReady = loadedTermId === termId;
  const showSpinner = loading || (!error && !sectionsReady);

  return (
    <div className="mx-auto px-3 lg:px-4 pt-3 pb-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-1 md:flex-row md:flex-wrap md:items-baseline md:gap-5">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">{t('timetable.title')}</h1>
        </div>
        <p className="text-muted-foreground md:-translate-y-[3px]">{t('timetable.subtitle')}</p>
        <span className="flex items-center gap-1 text-xs text-muted-foreground md:ml-auto md:-translate-y-[3px]">
          <Info className="h-3.5 w-3.5 shrink-0" />
          {t('gpa.localOnlyNotice')}
        </span>
      </div>

      {showSpinner && (
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

      {!loading && !error && sectionsReady && (
        <div
          className={`grid grid-cols-1 gap-3 items-stretch ${
            panelCollapsed ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(280px,340px)_1fr]'
          }`}
        >
          {/* Left: smart search + results (filters live in the action row) */}
          <div className={`flex flex-col gap-3 min-h-0 ${panelCollapsed ? 'hidden' : ''}`}>
            {/* Mobile portrait only: the year dropdown sits above the search box.
                On larger screens it lives in the action row instead. */}
            {isMobilePortrait && renderTermSelect('w-full min-w-0')}
            {/* Free-text search + conflict toggle + hide-panel button */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('timetable.smartSearch')}
                  className="pl-9 h-9"
                />
              </div>
              {/* Show/hide results that would clash with the current timetable
                  (the ones marked with a red border). */}
              <button
                type="button"
                onClick={() => setShowConflicts((v) => !v)}
                title={showConflicts ? t('timetable.hideConflicts') : t('timetable.showConflicts')}
                className="flex h-9 shrink-0 items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                {/* Combine clock-alert with a slash (nested SVG) to convey the
                    hidden state — see lucide.dev combining-icons guide. The
                    nested Slash fills the full 24×24 viewBox (h-full w-full,
                    not h-5 w-5) so its corner-to-corner diagonal stays centred
                    both horizontally and vertically over the clock-alert. */}
                {showConflicts ? (
                  <ClockAlert className="h-5 w-5" />
                ) : (
                  <ClockAlert className="h-5 w-5">
                    <Slash className="h-full w-full" />
                  </ClockAlert>
                )}
              </button>
              {/* Hide the panel. Hamburger + left arrow = collapse. */}
              <button
                type="button"
                onClick={() => setPanelCollapsed(true)}
                title={t('timetable.collapsePanel')}
                className="flex h-9 shrink-0 items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Menu className="h-5 w-5" />
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>

            {/* On desktop the inner list is absolutely positioned so its content
                doesn't drive the column height — the timetable column does — letting
                the results area match the timetable's height and scroll within it. */}
            <div
              ref={resultsRef}
              className="relative lg:flex-1 lg:min-h-0"
              style={resultsMinH ? { minHeight: resultsMinH } : undefined}
            >
              <div className="space-y-1 max-h-[60vh] lg:max-h-none lg:absolute lg:inset-0 overflow-y-auto pr-1 timetable-scroll">
                {/* Group 1: chosen (currently-selected) sessions */}
                <button
                  type="button"
                  onClick={() => setChosenCollapsed((v) => !v)}
                  className="sticky top-0 z-10 flex w-full items-center gap-1.5 bg-background/[0.97] backdrop-blur-md px-1 py-1.5 text-sm font-medium"
                >
                  {chosenCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <span>{t('timetable.chosenSessions')}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{selectedSections.length}</span>
                </button>
                {!chosenCollapsed && (
                  <div className="space-y-2 pb-1">
                    {selectedSections.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">{t('timetable.noChosen')}</p>
                    ) : (
                      selectedSections.map((s) => renderResultItem(s))
                    )}
                  </div>
                )}

                {/* Group 2: available (search result) sessions */}
                <button
                  type="button"
                  onClick={() => setAvailableCollapsed((v) => !v)}
                  className="sticky top-0 z-10 flex w-full items-center gap-1.5 bg-background/[0.97] backdrop-blur-md px-1 py-1.5 text-sm font-medium"
                >
                  {availableCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <span>{t('timetable.availableSessions')}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{visibleResults.length}</span>
                </button>
                {!availableCollapsed && (
                  <div className="space-y-2 pb-1">
                    {visibleResults.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">{t('timetable.noResults')}</p>
                    ) : (
                      <>
                        {visibleResults.slice(0, MAX_RESULTS).map((s) => renderResultItem(s))}
                        {visibleResults.length > MAX_RESULTS && (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            {t('timetable.moreResults', { count: String(visibleResults.length - MAX_RESULTS) })}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: timetable + selected */}
          <div className="space-y-4">
            {/* Panel toggle + search/filters + export actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Show-panel button — only when collapsed (the hide button lives
                  inside the panel itself). Hamburger + right arrow = expand. */}
              {panelCollapsed && (
                <button
                  type="button"
                  onClick={() => setPanelCollapsed(false)}
                  title={t('timetable.expandPanel')}
                  className="flex h-9 shrink-0 items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Menu className="h-5 w-5" />
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}

              {/* Year dropdown — always visible, even when the panel is
                  collapsed. On mobile portrait (when the panel is open) it's
                  shown above the search box instead, so hide this copy there to
                  avoid a duplicate. */}
              {!(isMobilePortrait && !panelCollapsed) &&
                renderTermSelect('w-auto min-w-[90px]')}

              {/* Filters (hidden while the results panel is collapsed). On
                  mobile portrait they become a 2-column grid so each row fills
                  the full width and splits it equally; on larger screens the
                  wrapper is `display:contents` so the original flex-wrap row is
                  untouched. */}
              {!panelCollapsed && (
                <div className={isMobilePortrait ? 'grid w-full grid-cols-2 gap-2' : 'contents'}>
                  <Select
                    value={subjectArea}
                    onValueChange={(v) => {
                      setSubjectArea(v);
                      setCourseCode('');
                    }}
                  >
                    <SelectTrigger className={`h-9 ${isMobilePortrait ? 'w-full min-w-0' : 'w-auto min-w-[110px]'}`}>
                      {/* Trigger shows just the code (or "All subjects"); the full
                          English name only appears in the dropdown items. */}
                      <span className="truncate">
                        {subjectArea === 'all' ? t('timetable.filter.allSubjects') : subjectArea}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('timetable.filter.allSubjects')}</SelectItem>
                      {subjectAreaOptions.map((sa) => (
                        <SelectItem key={sa} value={sa}>
                          {SUBJECT_FULL_NAMES[sa] ? `${sa} · ${SUBJECT_FULL_NAMES[sa]}` : sa}
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
                    className={`h-9 px-3 ${isMobilePortrait ? 'w-full min-w-0 max-w-none' : 'flex-1 min-w-[150px] max-w-[260px]'}`}
                  />
                  <Combobox
                    options={instructorOptions}
                    value={instructor}
                    onChange={setInstructor}
                    placeholder={t('timetable.filter.instructor')}
                    searchPlaceholder={t('timetable.filter.instructorSearch')}
                    emptyText={t('timetable.noResults')}
                    className={`h-9 px-3 ${isMobilePortrait ? 'w-full min-w-0 max-w-none' : 'flex-1 min-w-[150px] max-w-[260px]'}`}
                  />
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className={`h-9 ${isMobilePortrait ? 'w-full min-w-0' : 'w-auto min-w-[100px]'}`}>
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
                  <TimeFilter
                    value={timeFilter}
                    onChange={setTimeFilter}
                    availableDays={availableDays}
                    dayLabels={dayLabels}
                    t={t}
                    className={`px-3 ${isMobilePortrait ? 'w-full min-w-0' : ''}`}
                  />
                  <VenueFilter
                    groups={venueGroups}
                    value={venueFilter}
                    onChange={setVenueFilter}
                    t={t}
                    className={`px-3 ${isMobilePortrait ? 'w-full min-w-0' : ''}`}
                  />
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearFilters}
                      title={t('timetable.clearFilters')}
                      className={isMobilePortrait ? 'w-full min-w-0' : undefined}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}

              {/* Actions: on mobile they sit in this action row; on desktop
                  they move to the title row (below) so the filter dropdowns
                  get the full action row. */}
              <div className="ml-auto flex flex-wrap items-center gap-2 lg:hidden">
                {actionButtons}
              </div>
            </div>

            {/* On-screen title + grid (reflects the timetable options live) */}
            {/* Mobile/tablet: centered title only (actions stay in the action row). */}
            {exportOptions.includeTitle && (
              <div className="flex items-center justify-center gap-2 lg:hidden">
                {titleContent}
              </div>
            )}
            {/* Desktop: title centered with the action buttons on the same row, so
                the action row above is free for the full-width filter dropdowns. */}
            <div className="hidden lg:grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <span aria-hidden />
              <div className="flex items-center justify-center gap-2 min-h-9">
                {exportOptions.includeTitle && titleContent}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {actionButtons}
              </div>
            </div>
            {isSummer ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">{summerLabel(1)}</p>
                  {renderLiveGrid(summerSel1, conf1)}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">{summerLabel(2)}</p>
                  {renderLiveGrid(summerSel2, conf2)}
                </div>
              </div>
            ) : (
              renderLiveGrid(selectedSections, conflictIds)
            )}

            {/* Off-screen, full-width render used only for PNG/PDF export. One
                node per export page (summer terms can produce two). */}
            <div
              aria-hidden
              style={{ position: 'absolute', left: '-99999px', top: 0, width: 1320, height: 0, overflow: 'hidden', pointerEvents: 'none' }}
            >
              {exportPages.map((page, i) => (
                <div
                  key={i}
                  ref={(el) => (exportPageRefs.current[i] = el)}
                  className="p-6"
                  style={themeVars(exportOptions.theme === 'dark')}
                >
                  {exportOptions.includeTitle && (
                    <h2 className="text-2xl font-bold text-center mb-4">
                      {displayTitle}
                      {page.label ? ` — ${page.label}` : ''}
                    </h2>
                  )}
                  <TimetableGrid
                    sections={page.sections}
                    conflictIds={page.conflicts}
                    colorMap={colorMap}
                    forExport
                    exportDark={exportOptions.theme === 'dark'}
                    showSubGrid={exportOptions.showSubGrid}
                    showHours={exportOptions.showHours}
                    showCredits={exportOptions.showCredits}
                    creditsByCode={creditsByCode}
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
              ))}
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

      {/* Confirm before clearing the whole timetable (guards an accidental tap) */}
      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('timetable.clearConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('timetable.clearConfirmDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('timetable.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                commitSelection([]);
                setConfirmClear(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('timetable.clearAll')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Timetable;
