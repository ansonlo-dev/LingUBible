import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { getGPA } from '@/utils/gradeUtils';
import {
  HONOURS_TIERS,
  HONOURS_TARGETS,
  AWARD_LINES,
  GPA_BEARING_GRADES,
  NON_GPA_GRADES,
  classifyHonours,
  nextHonoursTier,
  classifyYearAward,
  requiredRemainingAvg,
  isGpaBearingGrade,
  isAwardDisqualifyingGrade,
  type HonoursKey,
  type YearAwardKey,
} from '@/utils/honours';
import { loadGpaCourseCatalog, type GpaCourseCatalog, type GpaCourseInfo } from '@/services/gpaCourseCatalog';
import { GpaTrendChart, type GpaChartPoint } from '@/components/features/gpa/GpaTrendChart';
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
  Calculator,
  Plus,
  Trash2,
  GraduationCap,
  TrendingUp,
  Target,
  Award,
  RotateCcw,
  ChevronsUpDown,
} from 'lucide-react';

// ----------------------------------------------------------------------------
// Types & persistence
// ----------------------------------------------------------------------------

type TermPart = 'term1' | 'term2' | 'summer' | 'other';
const PART_OPTIONS: TermPart[] = ['term1', 'term2', 'summer', 'other'];
const PART_ORDER: Record<TermPart, number> = { term1: 0, term2: 1, summer: 2, other: 3 };

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
const newCourse = (): CourseEntry => ({ id: uid(), code: '', credits: '', grade: '' });
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
          className="h-9 w-full justify-between font-normal"
        >
          <span className={cn('truncate', !entry.code && 'text-muted-foreground')}>{entry.code ? display : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
              <Badge variant="secondary" className="shrink-0 text-[10px] tabular-nums">
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

const HONOURS_BADGE_COLORS: Record<HonoursKey, string> = {
  first: 'bg-red-600',
  upperSecond: 'bg-orange-600',
  lowerSecond: 'bg-yellow-600',
  third: 'bg-neutral-500',
  pass: 'bg-stone-500',
};

const AWARD_BADGE_COLORS: Record<YearAwardKey, string> = {
  presidentsList: 'bg-violet-600',
  deansList: 'bg-cyan-600',
};

const GpaHons = () => {
  const { t, language } = useLanguage();

  const [terms, setTerms] = useState<TermData[]>(() => loadTerms());
  const [catalog, setCatalog] = useState<GpaCourseCatalog>({});

  const [targetKey, setTargetKey] = useState<HonoursKey>('first');
  const [creditsPerTerm, setCreditsPerTerm] = useState('15');
  const [remainingTermsInput, setRemainingTermsInput] = useState('');

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
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ terms }));
    } catch {
      /* ignore quota errors */
    }
  }, [terms]);

  // ---- Mutations ---------------------------------------------------------
  const updateCourse = (termId: string, courseId: string, patch: Partial<CourseEntry>) =>
    setTerms((prev) =>
      prev.map((term) =>
        term.id !== termId
          ? term
          : { ...term, courses: term.courses.map((c) => (c.id === courseId ? { ...c, ...patch } : c)) },
      ),
    );

  const pickCourse = (
    termId: string,
    courseId: string,
    info: { code: string; title?: string; credits?: number },
  ) =>
    updateCourse(termId, courseId, {
      code: info.code,
      title: info.title,
      ...(info.credits != null ? { credits: String(info.credits) } : {}),
    });

  const addCourse = (termId: string) =>
    setTerms((prev) =>
      prev.map((term) => (term.id === termId ? { ...term, courses: [...term.courses, newCourse()] } : term)),
    );

  const removeCourse = (termId: string, courseId: string) =>
    setTerms((prev) =>
      prev.map((term) =>
        term.id === termId ? { ...term, courses: term.courses.filter((c) => c.id !== courseId) } : term,
      ),
    );

  const updateTermPart = (termId: string, part: TermPart) =>
    setTerms((prev) => prev.map((term) => (term.id === termId ? { ...term, part } : term)));

  const addTerm = (year: number) =>
    setTerms((prev) => {
      const inYear = prev.filter((tm) => tm.year === year).length;
      const part: TermPart = inYear === 0 ? 'term1' : inYear === 1 ? 'term2' : 'summer';
      return [...prev, { id: uid(), year, part, courses: [newCourse()] }];
    });

  const addYear = () =>
    setTerms((prev) => {
      const maxYear = prev.reduce((m, tm) => Math.max(m, tm.year), 0);
      return [...prev, { id: uid(), year: maxYear + 1, part: 'term1', courses: [newCourse()] }];
    });

  const removeTerm = (termId: string) => setTerms((prev) => prev.filter((tm) => tm.id !== termId));
  const removeYear = (year: number) => setTerms((prev) => prev.filter((tm) => tm.year !== year));
  const resetAll = () => setTerms(defaultTerms());

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

  const partShort = (p: TermPart) => t(`gpa.partShort.${p}`);

  const { chartData, earnedPoints, earnedCredits, cgpa, autoRemainingTerms } = useMemo(() => {
    let runPoints = 0;
    let runCredits = 0;
    let remaining = 0;
    const data: GpaChartPoint[] = sortedTerms.map((term) => {
      const s = statsByTermId.get(term.id)!;
      runPoints += s.points;
      runCredits += s.gpaCredits;
      if (s.gpa == null) remaining += 1;
      return {
        term: `Y${term.year}·${partShort(term.part)}`,
        termGpa: s.gpa,
        cgpa: runCredits > 0 ? runPoints / runCredits : null,
      };
    });
    return {
      chartData: data,
      earnedPoints: runPoints,
      earnedCredits: runCredits,
      cgpa: runCredits > 0 ? runPoints / runCredits : null,
      autoRemainingTerms: remaining,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedTerms, statsByTermId, language]);

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
  const nextTier = nextHonoursTier(cgpa);

  // ---- Target calculator -------------------------------------------------
  const remainingTerms =
    remainingTermsInput.trim() === '' ? autoRemainingTerms : Math.max(0, parseInt(remainingTermsInput, 10) || 0);
  const perTerm = Math.max(0, parseFloat(creditsPerTerm) || 0);
  const remainingCredits = remainingTerms * perTerm;
  const targetTier = HONOURS_TIERS.find((tr) => tr.key === targetKey)!;
  const calc = requiredRemainingAvg({ earnedPoints, earnedCredits, remainingCredits, targetCgpa: targetTier.cgpa });

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
      <div className="mb-4 flex flex-col gap-1 md:flex-row md:flex-wrap md:items-baseline md:gap-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">{t('gpaHons.title')}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{t('gpaHons.subtitle')}</p>
      </div>

      {/* Summary */}
      <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <SummaryCard icon={<GraduationCap className="h-4 w-4" />} label={t('gpa.cumulativeGpa')}>
          <span className="text-2xl font-bold tabular-nums">{cgpa != null ? cgpa.toFixed(3) : '—'}</span>
        </SummaryCard>
        <SummaryCard icon={<Award className="h-4 w-4" />} label={t('gpa.classification')}>
          {currentClass ? (
            <Badge className={`${HONOURS_BADGE_COLORS[currentClass]} text-white hover:opacity-90`}>
              {t(`gpa.honours.${currentClass}`)}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">{t('gpa.belowHonours')}</span>
          )}
        </SummaryCard>
        <SummaryCard icon={<TrendingUp className="h-4 w-4" />} label={t('gpa.gpaCredits')}>
          <span className="text-2xl font-bold tabular-nums">{earnedCredits || 0}</span>
        </SummaryCard>
        <SummaryCard icon={<Target className="h-4 w-4" />} label={t('gpa.nextMilestone')}>
          {nextTier ? (
            <span className="text-sm font-medium">
              {t(`gpa.honours.${nextTier.key}`)}{' '}
              <span className="text-muted-foreground tabular-nums">({nextTier.cgpa.toFixed(2)})</span>
            </span>
          ) : (
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{t('gpa.topReached')}</span>
          )}
        </SummaryCard>
      </div>

      {/* Chart */}
      <Card className="mb-4">
        <CardHeader className="px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" /> {t('gpa.trendTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <GpaTrendChart data={chartData} labels={chartLabels} />
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <LegendDot color="#2563eb" label={t('gpa.cumulativeGpa')} />
            <LegendDot color="#10b981" label={t('gpa.termGpa')} />
            <LegendDot color="#b91c1c" dashed label={t('gpa.honoursLines')} />
            <LegendDot color="#7c3aed" dashed label={`${t('gpa.presidentsList')} ${AWARD_LINES.presidentsList.toFixed(2)}`} />
            <LegendDot color="#0891b2" dashed label={`${t('gpa.deansList')} ${AWARD_LINES.deansList.toFixed(2)}`} />
          </div>
        </CardContent>
      </Card>

      {/* Target calculator */}
      <Card className="mb-5 border-primary/30">
        <CardHeader className="px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4" /> {t('gpa.targetTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="mb-3 text-xs text-muted-foreground">{t('gpa.targetDesc')}</p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">{t('gpa.targetClass')}</Label>
              <Select value={targetKey} onValueChange={(v) => setTargetKey(v as HonoursKey)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900">
                  {HONOURS_TARGETS.map((tr) => (
                    <SelectItem key={tr.key} value={tr.key}>
                      {t(`gpa.honours.${tr.key}`)} ({tr.cgpa.toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('gpa.remainingTerms')}</Label>
              <Input
                type="number"
                min={0}
                className="h-9"
                value={remainingTermsInput}
                placeholder={String(autoRemainingTerms)}
                onChange={(e) => setRemainingTermsInput(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">{t('gpa.autoDetected', { n: autoRemainingTerms })}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('gpa.creditsPerTerm')}</Label>
              <Input
                type="number"
                min={0}
                className="h-9"
                value={creditsPerTerm}
                onChange={(e) => setCreditsPerTerm(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">{t('gpa.remainingCreditsLabel', { n: remainingCredits })}</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border bg-muted/40 p-3">
            {calc.status === 'feasible' && (
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-sm text-muted-foreground">
                  {t('gpa.resultFeasiblePrefix', { target: t(`gpa.honours.${targetKey}`) })}
                </span>
                <span className={`text-3xl font-bold tabular-nums ${requiredColor}`}>{calc.required.toFixed(3)}</span>
                <span className="text-sm text-muted-foreground">{t('gpa.perRemainingCredit')}</span>
              </div>
            )}
            {calc.status === 'achieved' && (
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {t('gpa.resultAchieved', { target: t(`gpa.honours.${targetKey}`) })}
              </p>
            )}
            {calc.status === 'impossible' && (
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  {t('gpa.resultImpossible', { target: t(`gpa.honours.${targetKey}`) })}
                </p>
                <p className="text-sm text-muted-foreground">{t('gpa.bestPossible', { gpa: calc.projectedCgpa.toFixed(3) })}</p>
              </div>
            )}
            {calc.status === 'noRemaining' && (
              <p className="text-sm text-muted-foreground">
                {t('gpa.resultNoRemaining', { gpa: calc.projectedCgpa.toFixed(3), target: t(`gpa.honours.${targetKey}`) })}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Terms editor */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('gpa.termsTitle')}</h2>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 text-muted-foreground">
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

      <div className="space-y-4">
        {years.map(({ year, terms: yearTerms, yearGpa, loadCredits, award }) => (
          <Card key={year} className="overflow-hidden">
            {/* Academic year header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{t('gpa.academicYear', { n: year })}</span>
                {award && (
                  <Badge className={`${AWARD_BADGE_COLORS[award]} text-white hover:opacity-90`}>
                    {t(`gpa.${award}`)}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">
                  {t('gpa.yearGpa')}:{' '}
                  <span className="font-semibold tabular-nums text-foreground">
                    {yearGpa != null ? yearGpa.toFixed(3) : '—'}
                  </span>
                </span>
                <span className="hidden text-muted-foreground sm:inline">
                  {t('gpa.creditsShort', { n: loadCredits })}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                  onClick={() => removeYear(year)}
                  title={t('gpa.removeYear')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <CardContent className="space-y-3 p-3">
              {yearTerms.map((term) => {
                const s = statsByTermId.get(term.id)!;
                return (
                  <div key={term.id} className="rounded-lg border">
                    <div className="flex items-center justify-between gap-2 border-b bg-muted/20 px-3 py-1.5">
                      <Select value={term.part} onValueChange={(v) => updateTermPart(term.id, v as TermPart)}>
                        <SelectTrigger className="h-7 w-[130px] border-0 bg-transparent px-1 text-sm font-medium shadow-none focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-900">
                          {PART_OPTIONS.map((p) => (
                            <SelectItem key={p} value={p}>
                              {t(`gpa.part.${p}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {t('gpa.termGpa')}:{' '}
                          <span className="font-semibold tabular-nums text-foreground">
                            {s.gpa != null ? s.gpa.toFixed(3) : '—'}
                          </span>
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => removeTerm(term.id)}
                          title={t('gpa.removeTerm')}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-2">
                      {/* header row (desktop) */}
                      <div className="mb-1 hidden grid-cols-[1fr_72px_104px_32px] gap-2 px-1 text-[11px] font-medium text-muted-foreground sm:grid">
                        <span>{t('gpa.colCourse')}</span>
                        <span>{t('gpa.colCredits')}</span>
                        <span>{t('gpa.colGrade')}</span>
                        <span />
                      </div>
                      <div className="space-y-1.5">
                        {term.courses.map((course) => (
                          <div
                            key={course.id}
                            className="grid grid-cols-[1fr_60px_auto] items-center gap-2 sm:grid-cols-[1fr_72px_104px_32px]"
                          >
                            <CourseSelect
                              entry={course}
                              catalog={catalog}
                              onPick={(info) => pickCourse(term.id, course.id, info)}
                              placeholder={t('gpa.coursePlaceholder')}
                              searchPlaceholder={t('gpa.courseSearchPlaceholder')}
                              useCustomLabel={(code) => t('gpa.useCustomCode', { code })}
                            />
                            <Input
                              type="number"
                              min={0}
                              step="0.5"
                              value={course.credits}
                              placeholder="—"
                              onChange={(e) => updateCourse(term.id, course.id, { credits: e.target.value })}
                              className="h-9 tabular-nums"
                            />
                            <Select
                              value={course.grade || undefined}
                              onValueChange={(v) => updateCourse(term.id, course.id, { grade: v === '__none__' ? '' : v })}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder={t('gpa.gradePlaceholder')} />
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
                              className="h-9 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() => removeCourse(term.id, course.id)}
                              title={t('gpa.removeCourse')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button variant="ghost" size="sm" className="mt-1.5 h-7 text-xs" onClick={() => addCourse(term.id)}>
                        <Plus className="mr-1 h-3.5 w-3.5" /> {t('gpa.addCourse')}
                      </Button>
                    </div>
                  </div>
                );
              })}

              <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => addTerm(year)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> {t('gpa.addTerm')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" className="mt-4 w-full border-dashed" onClick={addYear}>
        <Plus className="mr-1.5 h-4 w-4" /> {t('gpa.addYear')}
      </Button>

      <p className="mt-5 text-center text-xs text-muted-foreground">{t('gpa.disclaimer')}</p>
    </div>
  );
};

function SummaryCard({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {icon} {label}
        </div>
        <div className="mt-1.5 flex min-h-[32px] items-center">{children}</div>
      </CardContent>
    </Card>
  );
}

function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block h-0 w-5 border-t-2"
        style={{ borderColor: color, borderStyle: dashed ? 'dashed' : 'solid' }}
      />
      {label}
    </span>
  );
}

export default GpaHons;
