import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { getGPA } from '@/utils/gradeUtils';
import {
  HONOURS_TIERS,
  AWARD_LINES,
  GPA_BEARING_GRADES,
  NON_GPA_GRADES,
  classifyHonours,
  classifyYearAward,
  requiredRemainingAvg,
  isGpaBearingGrade,
  isAwardDisqualifyingGrade,
  MAX_GPA,
  type HonoursKey,
  type YearAwardKey,
} from '@/utils/honours';
import { loadGpaCourseCatalog, type GpaCourseCatalog, type GpaCourseInfo } from '@/services/gpaCourseCatalog';
import { GpaTrendChart, type GpaChartPoint } from '@/components/features/gpa/GpaTrendChart';
import { FirstClassHonoursSection } from '@/components/features/gpa/FirstClassHonoursSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Trash2,
  GraduationCap,
  TrendingUp,
  Target,
  Award,
  RotateCcw,
  ChevronsUpDown,
  ChevronDown,
  Maximize2,
  Minimize2,
  Info,
  Undo2,
  Redo2,
  Calculator,
  Trophy,
} from 'lucide-react';

// ----------------------------------------------------------------------------
// Types & persistence
// ----------------------------------------------------------------------------

type TermPart = 'term1' | 'term2' | 'summer' | 'other';
// Selectable term types — a year has at most these three terms (no "Other").
const PART_OPTIONS: TermPart[] = ['term1', 'term2', 'summer'];
const MAX_TERMS_PER_YEAR = PART_OPTIONS.length;
// At most 8 academic years can be added.
const MAX_YEARS = 8;
// Per-term course cap: 8 for Term 1 / Term 2, 2 for the Summer Term.
const maxCoursesForPart = (part: TermPart) => (part === 'summer' ? 2 : 8);
// 'other' kept in the ordering only so any legacy-saved term still sorts sanely.
const PART_ORDER: Record<TermPart, number> = { term1: 0, term2: 1, summer: 2, other: 3 };
// Short term codes for the trend chart's x-axis (e.g. "21/22-T1").
const PART_XAXIS: Record<TermPart, string> = { term1: 'T1', term2: 'T2', summer: 'S', other: 'T?' };
// Term names are not translated (used as-is across all languages).
const PART_LABEL: Record<TermPart, string> = { term1: 'Term 1', term2: 'Term 2', summer: 'Summer Term', other: 'Other' };

// Selectable academic years for each year block.
const ACADEMIC_YEARS = [
  '2022-2023',
  '2023-2024',
  '2024-2025',
  '2025-2026',
  '2026-2027',
  '2027-2028',
  '2028-2029',
  '2029-2030',
];
const defaultAcademic = (year: number) =>
  ACADEMIC_YEARS[Math.min(Math.max(year - 1, 0), ACADEMIC_YEARS.length - 1)];
/** "2021-2022" → "21/22" for compact chart labels. */
const shortAcademic = (ay: string) => {
  const m = /^(\d{4})-(\d{4})$/.exec(ay || '');
  return m ? `${m[1].slice(2)}/${m[2].slice(2)}` : ay;
};

interface CourseEntry {
  id: string;
  code: string;
  title?: string; // resolved English title (always English, persisted)
  credits: string;
  grade: string;
}

interface TermData {
  id: string;
  year: number; // academic year number
  part: TermPart;
  courses: CourseEntry[];
}

const STORAGE_KEY = 'gpa_planner_v2';

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
// Selectable credit values (0 / 1 / 3 only). New courses default to 3 credits.
const CREDIT_OPTIONS = ['0', '1', '3'];
const newCourse = (): CourseEntry => ({ id: uid(), code: '', credits: '3', grade: '' });
const defaultTerms = (): TermData[] => [{ id: uid(), year: 1, part: 'term1', courses: [newCourse()] }];

function loadTerms(): TermData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.terms) && parsed.terms.length > 0) return parsed.terms;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return defaultTerms();
}

/** Persisted academic-year choice per year block, keyed by year number. */
function loadYearAcademic(): Record<number, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.yearAcademic && typeof parsed.yearAcademic === 'object') return parsed.yearAcademic;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return {};
}

/** The full editable document (terms + their academic-year labels). */
interface Doc {
  terms: TermData[];
  yearAcademic: Record<number, string>;
}

const loadDoc = (): Doc => ({ terms: loadTerms(), yearAcademic: loadYearAcademic() });

/**
 * Undo/redo history for a single value. `set` records the previous value on an
 * undo stack (clearing the redo stack); consecutive edits sharing a `tag` are
 * coalesced into one history entry (so typing into a field is one undo step,
 * not one per keystroke). Structural edits pass no tag and always push.
 */
function useHistory<T>(init: () => T) {
  const [present, setPresent] = useState<T>(init);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const lastTag = useRef<string | null>(null);
  const lastTime = useRef(0);

  const set = (updater: (prev: T) => T, tag?: string, coalesce = false) => {
    const next = updater(present);
    if (Object.is(next, present)) return;
    const now = Date.now();
    const merge = coalesce && !!tag && tag === lastTag.current && now - lastTime.current < 1200;
    if (!merge) {
      past.current = [...past.current, present].slice(-100);
      future.current = [];
    }
    lastTag.current = tag ?? null;
    lastTime.current = now;
    setPresent(next);
  };

  const undo = () => {
    if (past.current.length === 0) return;
    const prior = past.current[past.current.length - 1];
    past.current = past.current.slice(0, -1);
    future.current = [present, ...future.current];
    lastTag.current = null;
    setPresent(prior);
  };

  const redo = () => {
    if (future.current.length === 0) return;
    const next = future.current[0];
    future.current = future.current.slice(1);
    past.current = [...past.current, present];
    lastTag.current = null;
    setPresent(next);
  };

  return { present, set, undo, redo, canUndo: past.current.length > 0, canRedo: future.current.length > 0 };
}

// ----------------------------------------------------------------------------
// Per-term / per-year computations
// ----------------------------------------------------------------------------

interface TermStats {
  points: number; // GPA points (gradePoint × credits)
  gpaCredits: number; // credits counted in GPA
  loadCredits: number; // all credit-bearing credits (for 12/24 thresholds)
  gpa: number | null;
  hasDisqualifying: boolean;
}

function computeTermStats(term: TermData): TermStats {
  let points = 0;
  let gpaCredits = 0;
  let loadCredits = 0;
  let hasDisqualifying = false;
  for (const c of term.courses) {
    if (isAwardDisqualifyingGrade(c.grade)) hasDisqualifying = true;
    const cr = parseFloat(c.credits);
    if (!Number.isFinite(cr) || cr <= 0) continue; // non-credit-bearing
    loadCredits += cr;
    if (!isGpaBearingGrade(c.grade)) continue;
    const gp = getGPA(c.grade);
    if (gp == null) continue;
    points += gp * cr;
    gpaCredits += cr;
  }
  return { points, gpaCredits, loadCredits, gpa: gpaCredits > 0 ? points / gpaCredits : null, hasDisqualifying };
}

// ----------------------------------------------------------------------------
// Smart course search + select
// ----------------------------------------------------------------------------

interface CourseSelectProps {
  entry: CourseEntry;
  catalog: GpaCourseCatalog;
  onPick: (info: { code: string; title?: string; credits?: number }) => void;
  placeholder: string;
  searchPlaceholder: string;
  useCustomLabel: (code: string) => string;
}

function CourseSelect({ entry, catalog, onPick, placeholder, searchPlaceholder, useCustomLabel }: CourseSelectProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const matches = useMemo(() => {
    const query = q.trim().toUpperCase();
    if (!query) return [] as GpaCourseInfo[];
    const prefix: GpaCourseInfo[] = [];
    const contains: GpaCourseInfo[] = [];
    for (const code in catalog) {
      const info = catalog[code];
      if (info.code.startsWith(query)) {
        prefix.push(info);
      } else {
        const hay = `${info.code} ${info.title} ${info.title_tc || ''} ${info.title_sc || ''}`.toUpperCase();
        if (hay.includes(query)) contains.push(info);
      }
      if (prefix.length >= 40) break;
    }
    return [...prefix, ...contains].slice(0, 40);
  }, [q, catalog]);

  // Always display the English title after the code (regardless of UI language).
  const resolvedTitle = entry.title || catalog[entry.code.trim().toUpperCase()]?.title;
  const display = entry.code ? (resolvedTitle ? `${entry.code} - ${resolvedTitle}` : entry.code) : '';
  const exactExists = !!catalog[q.trim().toUpperCase()];

  const pick = (info: { code: string; title?: string; credits?: number }) => {
    onPick(info);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setQ('');
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="grid h-9 w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 overflow-hidden font-normal"
        >
          <span className={cn('truncate text-left', !entry.code && 'text-muted-foreground')}>
            {entry.code ? display : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(460px,92vw)] p-0 bg-white dark:bg-gray-900" align="start">
        <div className="border-b p-2">
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8"
          />
        </div>
        <div className="max-h-72 overflow-auto py-1">
          {q.trim() === '' && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">{searchPlaceholder}</div>
          )}
          {matches.map((info) => (
            <button
              key={info.code}
              type="button"
              onClick={() => pick({ code: info.code, title: info.title, credits: info.credits })}
              className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm hover:bg-accent"
            >
              <span className="min-w-0 truncate">
                <span className="font-mono font-medium">{info.code}</span>
                <span className="text-muted-foreground"> - {info.title}</span>
              </span>
              <Badge className="shrink-0 border-transparent bg-primary text-primary-foreground text-[10px] tabular-nums">
                {info.credits}
              </Badge>
            </button>
          ))}
          {q.trim() !== '' && !exactExists && (
            <button
              type="button"
              onClick={() => pick({ code: q.trim().toUpperCase() })}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent"
            >
              <Plus className="h-3.5 w-3.5" /> {useCustomLabel(q.trim().toUpperCase())}
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

// hover:bg-* matches the base so the Badge's default hover styling is a no-op
// (these badges are non-interactive labels).
const HONOURS_BADGE_COLORS: Record<HonoursKey, string> = {
  first: 'bg-red-600 hover:bg-red-600',
  upperSecond: 'bg-orange-600 hover:bg-orange-600',
  lowerSecond: 'bg-yellow-600 hover:bg-yellow-600',
  third: 'bg-neutral-500 hover:bg-neutral-500',
  pass: 'bg-stone-500 hover:bg-stone-500',
};

// Match the chart legend colours: President's = amber, Dean's = cyan. Black
// text on the light fills in light theme; darker fills + white text in dark
// theme for enough contrast. No hover change.
const AWARD_BADGE_COLORS: Record<YearAwardKey, string> = {
  presidentsList:
    'bg-[#f59e0b] hover:bg-[#f59e0b] text-black dark:bg-[#b45309] dark:hover:bg-[#b45309] dark:text-white',
  deansList: 'bg-[#22d3ee] hover:bg-[#22d3ee] text-black dark:bg-[#0e7490] dark:hover:bg-[#0e7490] dark:text-white',
};

const GpaHons = () => {
  const { t, language } = useLanguage();

  const { present: doc, set: setDoc, undo, redo, canUndo, canRedo } = useHistory<Doc>(loadDoc);
  const { terms, yearAcademic } = doc;
  const [catalog, setCatalog] = useState<GpaCourseCatalog>({});

  const [targetCgpaInput, setTargetCgpaInput] = useState('3.50');
  const [remainingCreditsInput, setRemainingCreditsInput] = useState('');
  const [fullScale, setFullScale] = useState(false);
  const [showHonours, setShowHonours] = useState(true);
  const [showAwards, setShowAwards] = useState(true);
  const [collapsedYears, setCollapsedYears] = useState<Set<number>>(new Set());

  // The two sub-views behave like sibling sub-pages of /gpa-hons: only the
  // active one is rendered (no in-page scroll-to-section, which was unreliable
  // on real mobile browsers / installed PWAs). The active view is reflected in
  // the URL as `?tab=stats` so it survives refresh / can be linked & shared.
  const [searchParams, setSearchParams] = useSearchParams();
  const view: 'calculator' | 'stats' = searchParams.get('tab') === 'stats' ? 'stats' : 'calculator';
  const setView = (next: 'calculator' | 'stats') =>
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (next === 'stats') params.set('tab', 'stats');
        else params.delete('tab'); // calculator is the default → keep the URL clean
        return params;
      },
      { replace: true },
    );

  // On tab switch, jump to the top of the newly shown sub-view. Done after the
  // DOM swaps (and synchronously before paint, so there's no visible flash) with
  // an instant scroll — a smooth scroll would be stranded mid-animation when the
  // long calculator view collapses and the page height changes underneath it.
  // `html { scroll-behavior: smooth }` is overridden by passing behavior: 'auto'.
  const didMountRef = useRef(false);
  useLayoutEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return; // don't yank an initial / deep-linked load
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [view]);

  const toggleYear = (year: number) =>
    setCollapsedYears((prev) => {
      const next = new Set(prev);
      next.has(year) ? next.delete(year) : next.add(year);
      return next;
    });

  useEffect(() => {
    let cancelled = false;
    loadGpaCourseCatalog()
      .then((c) => !cancelled && setCatalog(c))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
    } catch {
      /* ignore quota errors */
    }
  }, [doc]);

  const academicForYear = (year: number) => yearAcademic[year] ?? defaultAcademic(year);

  // ---- Mutations (all routed through history for undo/redo) ----------------
  const updateTerms = (fn: (terms: TermData[]) => TermData[], tag?: string, coalesce = false) =>
    setDoc((d) => ({ ...d, terms: fn(d.terms) }), tag, coalesce);

  const setYearAcademic = (year: number, value: string) =>
    setDoc((d) => ({ ...d, yearAcademic: { ...d.yearAcademic, [year]: value } }), `ay:${year}`, true);

  const updateCourse = (termId: string, courseId: string, patch: Partial<CourseEntry>) =>
    updateTerms(
      (prev) =>
        prev.map((term) =>
          term.id !== termId
            ? term
            : { ...term, courses: term.courses.map((c) => (c.id === courseId ? { ...c, ...patch } : c)) },
        ),
      `edit:${courseId}:${Object.keys(patch).join(',')}`,
      true,
    );

  const pickCourse = (
    termId: string,
    courseId: string,
    info: { code: string; title?: string; credits?: number },
  ) =>
    updateTerms(
      (prev) =>
        prev.map((term) =>
          term.id !== termId
            ? term
            : {
                ...term,
                courses: term.courses.map((c) =>
                  c.id === courseId
                    ? { ...c, code: info.code, title: info.title, ...(info.credits != null ? { credits: String(info.credits) } : {}) }
                    : c,
                ),
              },
        ),
      `pick:${courseId}`,
    );

  const addCourse = (termId: string) =>
    updateTerms((prev) =>
      prev.map((term) => {
        if (term.id !== termId) return term;
        if (term.courses.length >= maxCoursesForPart(term.part)) return term; // at cap
        return { ...term, courses: [...term.courses, newCourse()] };
      }),
    );

  const removeCourse = (termId: string, courseId: string) =>
    updateTerms((prev) =>
      prev.map((term) =>
        term.id === termId ? { ...term, courses: term.courses.filter((c) => c.id !== courseId) } : term,
      ),
    );

  const addTerm = (year: number) =>
    updateTerms((prev) => {
      const used = new Set(prev.filter((tm) => tm.year === year).map((tm) => tm.part));
      if (used.size >= MAX_TERMS_PER_YEAR) return prev; // at most Term 1 / Term 2 / Summer
      const part = PART_OPTIONS.find((p) => !used.has(p)) ?? 'summer';
      return [...prev, { id: uid(), year, part, courses: [newCourse()] }];
    });

  // Default the new year's academic year to the one right after the current
  // last year's chosen academic year (e.g. last = 2022-2023 → new = 2023-2024).
  const addYear = () =>
    setDoc((d) => {
      const maxYear = d.terms.reduce((m, tm) => Math.max(m, tm.year), 0);
      if (maxYear >= MAX_YEARS) return d; // at most MAX_YEARS years
      const newYear = maxYear + 1;
      const lastAy = d.yearAcademic[maxYear] ?? defaultAcademic(maxYear);
      const idx = ACADEMIC_YEARS.indexOf(lastAy);
      const nextAy = idx >= 0 ? ACADEMIC_YEARS[Math.min(idx + 1, ACADEMIC_YEARS.length - 1)] : defaultAcademic(newYear);
      return {
        terms: [...d.terms, { id: uid(), year: newYear, part: 'term1', courses: [newCourse()] }],
        yearAcademic: maxYear > 0 ? { ...d.yearAcademic, [newYear]: nextAy } : d.yearAcademic,
      };
    });

  const removeTerm = (termId: string) => updateTerms((prev) => prev.filter((tm) => tm.id !== termId));

  const removeYear = (year: number) =>
    setDoc((d) => {
      const ya = { ...d.yearAcademic };
      delete ya[year];
      return { terms: d.terms.filter((tm) => tm.year !== year), yearAcademic: ya };
    });

  const resetAll = () => setDoc(() => ({ terms: defaultTerms(), yearAcademic: {} }));

  // ---- Derived -----------------------------------------------------------
  const sortedTerms = useMemo(
    () => [...terms].sort((a, b) => a.year - b.year || PART_ORDER[a.part] - PART_ORDER[b.part]),
    [terms],
  );
  const statsByTermId = useMemo(() => {
    const map = new Map<string, TermStats>();
    for (const term of terms) map.set(term.id, computeTermStats(term));
    return map;
  }, [terms]);

  const { chartData, earnedPoints, earnedCredits, cgpa } = useMemo(() => {
    let runPoints = 0;
    let runCredits = 0;
    const data: GpaChartPoint[] = sortedTerms.map((term) => {
      const s = statsByTermId.get(term.id)!;
      runPoints += s.points;
      runCredits += s.gpaCredits;
      return {
        term: `${shortAcademic(academicForYear(term.year))}-${PART_XAXIS[term.part]}`,
        termGpa: s.gpa,
        cgpa: runCredits > 0 ? runPoints / runCredits : null,
      };
    });
    return {
      chartData: data,
      earnedPoints: runPoints,
      earnedCredits: runCredits,
      cgpa: runCredits > 0 ? runPoints / runCredits : null,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedTerms, statsByTermId, yearAcademic]);

  // Academic years (grouped, ordered)
  const years = useMemo(() => {
    const order = [...new Set(sortedTerms.map((tm) => tm.year))].sort((a, b) => a - b);
    return order.map((year) => {
      const yearTerms = sortedTerms.filter((tm) => tm.year === year);
      let points = 0;
      let gpaCredits = 0;
      let loadCredits = 0;
      let maxTermCredits = 0;
      let hasDisqualifying = false;
      for (const term of yearTerms) {
        const s = statsByTermId.get(term.id)!;
        points += s.points;
        gpaCredits += s.gpaCredits;
        loadCredits += s.loadCredits;
        maxTermCredits = Math.max(maxTermCredits, s.loadCredits);
        if (s.hasDisqualifying) hasDisqualifying = true;
      }
      const yearGpa = gpaCredits > 0 ? points / gpaCredits : null;
      const award = classifyYearAward({ yearGpa, yearCredits: loadCredits, maxTermCredits, hasDisqualifying });
      return { year, terms: yearTerms, yearGpa, loadCredits, award };
    });
  }, [sortedTerms, statsByTermId]);

  const currentClass = classifyHonours(cgpa);

  // Academic years already assigned to a year block — used to disable them in
  // every other block's dropdown so the same academic year can't be picked twice.
  const usedAcademicYears = useMemo(
    () => new Set(years.map(({ year }) => academicForYear(year))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [years, yearAcademic],
  );

  // ---- Target calculator -------------------------------------------------
  // A typical undergraduate degree is ~120 credits, so default the remaining
  // credits to 120 minus the GPA credits already earned.
  const defaultRemainingCredits = Math.max(0, 120 - earnedCredits);
  const remainingCredits =
    remainingCreditsInput.trim() === ''
      ? defaultRemainingCredits
      : Math.max(0, parseInt(remainingCreditsInput, 10) || 0);
  const targetCgpa = Math.min(MAX_GPA, Math.max(0, parseFloat(targetCgpaInput) || 0));
  const targetClassKey = classifyHonours(targetCgpa);
  const targetLabel = targetCgpa.toFixed(2);
  const calc = requiredRemainingAvg({ earnedPoints, earnedCredits, remainingCredits, targetCgpa });

  const chartLabels = {
    termGpa: t('gpa.termGpa'),
    cgpa: t('gpa.cumulativeGpa'),
    first: t('gpa.honours.first'),
    upperSecond: t('gpa.honours.upperSecond'),
    lowerSecond: t('gpa.honours.lowerSecond'),
    third: t('gpa.honours.third'),
    pass: t('gpa.honours.pass'),
    deansList: t('gpa.deansList'),
    presidentsList: t('gpa.presidentsList'),
    empty: t('gpa.chartEmpty'),
  };

  const requiredColor =
    calc.status === 'feasible'
      ? 'text-emerald-600 dark:text-emerald-400'
      : calc.status === 'achieved'
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-red-600 dark:text-red-400';

  return (
    <div className="mx-auto max-w-6xl px-3 lg:px-4 pt-3 pb-12">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-1 md:flex-row md:flex-wrap md:items-baseline md:gap-5">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">{t('gpaHons.title')}</h1>
        </div>
        <p className="text-muted-foreground md:-translate-y-[3px]">{t('gpaHons.subtitle')}</p>
        <span className="flex items-center gap-1 text-xs text-muted-foreground md:ml-auto md:-translate-y-[3px]">
          <Info className="h-3.5 w-3.5 shrink-0" />
          {t('gpa.localOnlyNotice')}
        </span>
      </div>

      {/* Tab switcher between the two sub-views */}
      <SectionTabs
        value={view}
        onChange={(v) => setView(v)}
        items={[
          { id: 'calculator', label: t('gpaHons.navCalc'), icon: <Calculator className="h-3.5 w-3.5" /> },
          { id: 'stats', label: t('gpaHons.navStats'), icon: <Trophy className="h-3.5 w-3.5" /> },
        ]}
      />

      {/* Section 1 — GPA calculator & planner */}
      <section className={cn(view !== 'calculator' && 'hidden')}>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Calculator className="h-5 w-5 text-primary" /> {t('gpaHons.sectionCalc')}
        </h2>

      {/* Summary */}
      <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <SummaryCard icon={<GraduationCap className="h-4 w-4" />} label={t('gpa.cumulativeGpa')}>
          <span className="text-xl font-bold tabular-nums">{cgpa != null ? cgpa.toFixed(3) : '—'}</span>
        </SummaryCard>
        <SummaryCard icon={<Award className="h-4 w-4" />} label={t('gpa.classification')}>
          {currentClass ? (
            <Badge className={`${HONOURS_BADGE_COLORS[currentClass]} text-white`}>
              {t(`gpa.honoursFull.${currentClass}`)}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">{t('gpa.belowHonours')}</span>
          )}
        </SummaryCard>
        <SummaryCard icon={<TrendingUp className="h-4 w-4" />} label={t('gpa.gpaCredits')}>
          <span className="text-xl font-bold tabular-nums">{earnedCredits || 0}</span>
        </SummaryCard>
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-2 lg:items-stretch">
      {/* Chart */}
      <Card>
        <CardHeader className="px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" /> {t('gpa.trendTitle')}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-1.5">
              <ChartToggle
                active={showHonours}
                color="#94a3b8"
                label={t('gpa.honoursLines')}
                onClick={() => setShowHonours((v) => !v)}
              />
              <ChartToggle
                active={showAwards}
                color="#f59e0b"
                label={t('gpa.awardLines')}
                onClick={() => setShowAwards((v) => !v)}
              />
              <button
                type="button"
                onClick={() => setFullScale((v) => !v)}
                className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-primary/15 hover:text-foreground"
              >
                {fullScale ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                {fullScale ? t('gpa.scaleFull') : t('gpa.scaleAuto')}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <GpaTrendChart
            data={chartData}
            labels={chartLabels}
            fullScale={fullScale}
            showHonours={showHonours}
            showAwards={showAwards}
          />
          {/* Primary series + merit lists on one row; series are emphasised */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <SeriesLegend color="#3b82f6" label={t('gpa.cumulativeGpa')} />
            <SeriesLegend color="#10b981" label={t('gpa.termGpa')} />
            {showAwards && (
              <>
                <AwardLegend color="#f59e0b" label={t('gpa.presidentsList')} info={t('gpa.presidentsListReq')} />
                <AwardLegend color="#22d3ee" label={t('gpa.deansList')} info={t('gpa.deansListReq')} />
              </>
            )}
          </div>
          {showHonours && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted-foreground">
              <span className="inline-block h-0 w-5 shrink-0 border-t-2 border-dashed" style={{ borderColor: '#94a3b8' }} />
              <span className="font-medium">{t('gpa.honoursLines')}:</span>
              {HONOURS_TIERS.map((tr) => (
                <span key={tr.key} className="whitespace-nowrap">
                  {t(`gpa.honours.${tr.key}`)} <span className="tabular-nums">{tr.cgpa.toFixed(2)}</span>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Target calculator */}
      <Card className="flex flex-col border-primary/30">
        <CardHeader className="px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4" /> {t('gpa.targetTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col px-4 pb-4">
          <p className="mb-3 text-xs text-muted-foreground">{t('gpa.targetDesc')}</p>
          <div className="rounded-lg border bg-card/40 p-3 sm:p-4">
            <div className="space-y-3">
              {/* Target cumulative GPA */}
              <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2">
                <Label className="text-sm font-medium">{t('gpa.targetCgpa')}</Label>
                <div className="flex items-center justify-end gap-2">
                  {targetClassKey ? (
                    <Badge className={`${HONOURS_BADGE_COLORS[targetClassKey]} shrink-0 text-white`}>
                      {t(`gpa.honours.${targetClassKey}`)}
                    </Badge>
                  ) : (
                    <span className="shrink-0 text-xs text-muted-foreground">{t('gpa.belowHonours')}</span>
                  )}
                  <Input
                    inputMode="decimal"
                    className="h-9 w-24 text-right tabular-nums"
                    value={targetCgpaInput}
                    onChange={(e) => {
                      let v = e.target.value.replace(/[^0-9.]/g, '');
                      const parts = v.split('.');
                      if (parts.length > 2) v = `${parts[0]}.${parts.slice(1).join('')}`;
                      if (parseFloat(v) > MAX_GPA) v = String(MAX_GPA); // clamp to 0–4
                      setTargetCgpaInput(v);
                    }}
                  />
                </div>
              </div>

              {/* Quick set */}
              <div className="flex flex-wrap items-center gap-1.5 border-t pt-3">
                <span className="mr-0.5 text-xs font-medium text-muted-foreground">{t('gpa.quickSet')}</span>
                {HONOURS_TIERS.map((tr) => {
                  const activeChip = Math.abs(targetCgpa - tr.cgpa) < 1e-9;
                  return (
                    <button
                      key={tr.key}
                      type="button"
                      onClick={() => setTargetCgpaInput(tr.cgpa.toFixed(2))}
                      className={cn(
                        'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                        activeChip
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-muted-foreground hover:bg-primary/20 hover:text-foreground',
                      )}
                    >
                      {t(`gpa.honours.${tr.key}`)}
                    </button>
                  );
                })}
              </div>

              {/* Total remaining credits */}
              <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 border-t pt-3">
                <Label className="text-sm font-medium">{t('gpa.totalRemainingCredits')}</Label>
                <Input
                  inputMode="numeric"
                  className="h-9 w-24 text-right tabular-nums"
                  value={remainingCreditsInput}
                  placeholder={String(defaultRemainingCredits)}
                  onChange={(e) => setRemainingCreditsInput(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-lg bg-muted/40 p-4 text-center">
            {calc.status === 'feasible' && (
              <div className="space-y-1">
                <p className="text-xl text-muted-foreground">{t('gpa.resultFeasibleLine1', { target: targetLabel })}</p>
                <p className="text-xl text-muted-foreground">{t('gpa.resultFeasibleLine2')}</p>
                <p className="text-xl text-muted-foreground">
                  {t('gpa.resultFeasibleLine3')}{' '}
                  <span className={`align-baseline text-3xl font-bold tabular-nums ${requiredColor}`}>{calc.required.toFixed(3)}</span>
                  {language === 'en' ? '.' : ''}
                </p>
              </div>
            )}
            {calc.status === 'achieved' && (
              <p className="text-xl font-medium text-blue-600 dark:text-blue-400">
                {t('gpa.resultAchieved', { target: targetLabel })}
              </p>
            )}
            {calc.status === 'impossible' && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xl font-medium text-foreground">
                  {t('gpa.resultImpossible', { target: targetLabel })}
                </p>
                <p className="text-base text-muted-foreground">{t('gpa.bestPossible', { gpa: calc.projectedCgpa.toFixed(3) })}</p>
              </div>
            )}
            {calc.status === 'noRemaining' && (
              <p className="text-xl text-muted-foreground">
                {t('gpa.resultNoRemaining', { gpa: calc.projectedCgpa.toFixed(3), target: targetLabel })}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Terms editor */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('gpa.termsTitle')}</h2>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-foreground"
            disabled={!canUndo}
            onClick={undo}
            title={t('gpa.undo')}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-foreground"
            disabled={!canRedo}
            onClick={redo}
            title={t('gpa.redo')}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-muted-foreground hover:bg-primary/10 hover:text-foreground"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> {t('gpa.reset')}
              </Button>
            </AlertDialogTrigger>
          <AlertDialogContent className="bg-white dark:bg-gray-900">
            <AlertDialogHeader>
              <AlertDialogTitle>{t('gpa.resetConfirmTitle')}</AlertDialogTitle>
              <AlertDialogDescription>{t('gpa.resetConfirmDesc')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={resetAll}>{t('gpa.reset')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="space-y-4">
        {years.map(({ year, terms: yearTerms, yearGpa, loadCredits, award }) => {
          const collapsed = collapsedYears.has(year);
          return (
            <Card key={year} className="overflow-hidden">
              {/* Academic year header */}
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 bg-muted/40 px-2 py-1.5 sm:px-3">
                <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 hover:bg-primary/10 hover:text-foreground"
                    onClick={() => toggleYear(year)}
                    aria-expanded={!collapsed}
                    title={academicForYear(year)}
                  >
                    <ChevronDown
                      className={cn('h-4 w-4 text-muted-foreground transition-transform', collapsed && '-rotate-90')}
                    />
                  </Button>
                  <Select value={academicForYear(year)} onValueChange={(v) => setYearAcademic(year, v)}>
                    <SelectTrigger className="h-7 w-[136px] shrink-0 text-sm font-semibold" aria-label={t('gpa.academicYearLabel')}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900">
                      {ACADEMIC_YEARS.map((ay) => (
                        <SelectItem
                          key={ay}
                          value={ay}
                          disabled={ay !== academicForYear(year) && usedAcademicYears.has(ay)}
                        >
                          {ay}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {award && (
                    <Badge className={`${AWARD_BADGE_COLORS[award]} shrink-0`}>
                      {t(`gpa.${award}`)}
                    </Badge>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {t('gpa.yearGpa')}:{' '}
                    <span className="font-semibold tabular-nums text-foreground">
                      {yearGpa != null ? yearGpa.toFixed(3) : '—'}
                    </span>
                  </span>
                  <span className="hidden text-muted-foreground sm:inline">{t('gpa.creditsShort', { n: loadCredits })}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-destructive hover:bg-destructive/10"
                    onClick={() => removeYear(year)}
                    title={t('gpa.removeYear')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {!collapsed && (
                <CardContent className="p-3">
                  {/* Term 1 (left) and Term 2 (right) share a row; Summer spans full width */}
                  <div className="grid gap-2.5 md:grid-cols-2">
                    {yearTerms.map((term) => {
                      const s = statsByTermId.get(term.id)!;
                      return (
                        <div
                          key={term.id}
                          className={cn('rounded-lg bg-muted/40 p-2.5', term.part === 'summer' && 'md:col-span-2')}
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold">{PART_LABEL[term.part]}</span>
                            <div className="flex items-center gap-2">
                              <span className="whitespace-nowrap text-xs text-muted-foreground">
                                {t('gpa.termGpa')}:{' '}
                                <span className="font-semibold tabular-nums text-foreground">
                                  {s.gpa != null ? s.gpa.toFixed(3) : '—'}
                                </span>
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => removeTerm(term.id)}
                                title={t('gpa.removeTerm')}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* column headers (desktop only) */}
                          <div className="mb-1 hidden grid-cols-[minmax(0,1fr)_52px_76px_28px] gap-1.5 px-1 text-[11px] font-medium text-muted-foreground sm:grid">
                            <span>{t('gpa.colCourse')}</span>
                            <span className="text-center">{t('gpa.colCredits')}</span>
                            <span className="text-center">{t('gpa.colGrade')}</span>
                            <span />
                          </div>
                          <div className="space-y-2 sm:space-y-1.5">
                            {term.courses.map((course) => (
                              <div
                                key={course.id}
                                className="flex items-center gap-1.5 sm:grid sm:grid-cols-[minmax(0,1fr)_52px_76px_28px] sm:items-center sm:gap-1.5"
                              >
                                <div className="min-w-0 flex-1">
                                  <CourseSelect
                                    entry={course}
                                    catalog={catalog}
                                    onPick={(info) => pickCourse(term.id, course.id, info)}
                                    placeholder={t('gpa.coursePlaceholder')}
                                    searchPlaceholder={t('gpa.courseSearchPlaceholder')}
                                    useCustomLabel={(code) => t('gpa.useCustomCode', { code })}
                                  />
                                </div>
                                <div className="flex shrink-0 items-center gap-1.5 sm:contents">
                                  <Select
                                    value={course.credits || undefined}
                                    onValueChange={(v) => updateCourse(term.id, course.id, { credits: v })}
                                  >
                                    <SelectTrigger className="h-9 w-14 min-w-0 shrink-0 justify-center px-2 tabular-nums sm:w-auto">
                                      <span className={cn('truncate text-center', !course.credits && 'text-muted-foreground')}>
                                        {course.credits || '—'}
                                      </span>
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-gray-900">
                                      {CREDIT_OPTIONS.map((c) => (
                                        <SelectItem key={c} value={c}>
                                          {c}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Select
                                    value={course.grade || undefined}
                                    onValueChange={(v) =>
                                      updateCourse(term.id, course.id, { grade: v === '__none__' ? '' : v })
                                    }
                                  >
                                    <SelectTrigger className="h-9 w-16 min-w-0 shrink-0 justify-center px-2 sm:w-[76px] sm:flex-none">
                                      <span className={cn('truncate text-center', !course.grade && 'text-muted-foreground')}>
                                        {course.grade || t('gpa.gradePlaceholder')}
                                      </span>
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-gray-900">
                                      <SelectGroup>
                                        <SelectItem value="__none__" className="text-muted-foreground">
                                          {t('gpa.notGraded')}
                                        </SelectItem>
                                        <SelectLabel>{t('gpa.gpaGrades')}</SelectLabel>
                                        {GPA_BEARING_GRADES.map((g) => (
                                          <SelectItem key={g} value={g}>
                                            {g} <span className="text-muted-foreground">({getGPA(g)?.toFixed(2)})</span>
                                          </SelectItem>
                                        ))}
                                        <SelectLabel>{t('gpa.nonGpaGrades')}</SelectLabel>
                                        {NON_GPA_GRADES.map((g) => (
                                          <SelectItem key={g} value={g}>
                                            {g}
                                          </SelectItem>
                                        ))}
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-7 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => removeCourse(term.id, course.id)}
                                    title={t('gpa.removeCourse')}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                          {term.courses.length < maxCoursesForPart(term.part) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-1.5 h-7 text-xs hover:bg-primary/10 hover:text-foreground"
                              onClick={() => addCourse(term.id)}
                            >
                              <Plus className="mr-1 h-3.5 w-3.5" /> {t('gpa.addCourse')}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {yearTerms.length < MAX_TERMS_PER_YEAR && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2.5 w-full text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                      onClick={() => addTerm(year)}
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> {t('gpa.addTerm')}
                    </Button>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {years.length < MAX_YEARS && (
        <Button
          variant="outline"
          className="mt-4 w-full border-dashed hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
          onClick={addYear}
        >
          <Plus className="mr-1.5 h-4 w-4" /> {t('gpa.addYear')}
        </Button>
      )}

        <p className="mt-5 text-center text-xs text-muted-foreground">{t('gpa.disclaimer')}</p>
      </section>

      {/* Section 2 — University first-class honours statistics (static reference
          data). Only mounted while its tab is active so the page loads just the
          content for the selected sub-view. */}
      {view === 'stats' && (
        <section>
          <FirstClassHonoursSection />
        </section>
      )}
    </div>
  );
};

function SummaryCard({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-2 px-3 py-2.5">
        <span className="flex min-w-0 items-center gap-1.5 text-sm font-semibold">
          <span className="shrink-0 text-muted-foreground">{icon}</span>
          <span className="truncate">{label}</span>
        </span>
        <span className="flex shrink-0 items-center">{children}</span>
      </CardContent>
    </Card>
  );
}

function ChartToggle({
  active,
  color,
  label,
  onClick,
}: {
  active: boolean;
  color: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors',
        active
          ? 'bg-primary/15 text-foreground ring-1 ring-inset ring-primary/40 hover:bg-primary/25'
          : 'bg-muted text-muted-foreground hover:bg-primary/15 hover:text-foreground',
      )}
    >
      <span className="inline-block h-0 w-4 shrink-0 border-t-2 border-dashed" style={{ borderColor: color }} />
      {label}
    </button>
  );
}

function SeriesLegend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <span className="inline-block h-1.5 w-6 shrink-0 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function AwardLegend({ color, label, info }: { color: string; label: string; info: string }) {
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <span className="inline-block h-0 w-5 shrink-0 border-t-2 border-dashed" style={{ borderColor: color }} />
      {label}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="text-muted-foreground hover:text-foreground" aria-label={label}>
            <Info className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 bg-white dark:bg-gray-900 text-xs leading-relaxed" align="start">
          {info}
        </PopoverContent>
      </Popover>
    </span>
  );
}

/**
 * Sticky tab switcher between the page's two sub-views. Switching just toggles
 * which view is rendered (the old scroll-to-section behaviour was unreliable on
 * real mobile browsers / installed PWAs). The sticky `top` tracks the live
 * header height — on mobile the header is `height: fit-content`, not the
 * `--header-height` constant, so a hard-coded value left a visible gap.
 */
function SectionTabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { id: T; label: string; icon: ReactNode }[];
  value: T;
  onChange: (id: T) => void;
}) {
  const [top, setTop] = useState('var(--header-height)');

  useEffect(() => {
    const header = document.querySelector('.header-sticky') as HTMLElement | null;
    if (!header) return;
    const update = () => setTop(`${header.offsetHeight}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(header);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  // Scroll-to-top on switch is handled by the parent (after the view actually
  // changes) so it isn't disrupted by the page-height change.
  const select = (id: T) => {
    if (id !== value) onChange(id);
  };

  return (
    <div
      className="sticky z-30 -mx-3 mb-4 border-b bg-background/95 px-3 py-2 backdrop-blur lg:-mx-4 lg:px-4"
      style={{ top }}
    >
      <div className="flex gap-1.5">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => select(it.id)}
            aria-current={value === it.id}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none sm:text-sm',
              value === it.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-primary/20 hover:text-foreground',
            )}
          >
            {it.icon}
            {it.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default GpaHons;
