import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { getGPA } from '@/utils/gradeUtils';
import {
  HONOURS_TIERS,
  AWARD_LINES,
  GPA_BEARING_GRADES,
  classifyHonours,
  nextHonoursTier,
  requiredRemainingAvg,
  isGpaBearingGrade,
  type HonoursKey,
} from '@/utils/honours';
import { loadGpaCourseCatalog, type GpaCourseCatalog, type GpaCourseInfo } from '@/services/gpaCourseCatalog';
import { GpaTrendChart, type GpaChartPoint } from '@/components/features/gpa/GpaTrendChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';

// ----------------------------------------------------------------------------
// Types & persistence
// ----------------------------------------------------------------------------

interface CourseEntry {
  id: string;
  code: string;
  credits: string; // kept as string for editable input; parsed when computing
  grade: string; // '' = not graded yet
}

interface TermData {
  id: string;
  label: string;
  courses: CourseEntry[];
}

const STORAGE_KEY = 'gpa_planner_v1';

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const newCourse = (): CourseEntry => ({ id: uid(), code: '', credits: '', grade: '' });

function makeDefaultTerms(termLabel: (year: number, part: number) => string): TermData[] {
  const terms: TermData[] = [];
  for (let year = 1; year <= 4; year++) {
    for (let part = 1; part <= 2; part++) {
      terms.push({ id: uid(), label: termLabel(year, part), courses: [newCourse()] });
    }
  }
  return terms;
}

function loadTerms(termLabel: (year: number, part: number) => string): TermData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.terms) && parsed.terms.length > 0) return parsed.terms;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return makeDefaultTerms(termLabel);
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

const pickTitle = (info: GpaCourseInfo, language: string): string => {
  if (language === 'zh-TW') return info.title_tc || info.title;
  if (language === 'zh-CN') return info.title_sc || info.title;
  return info.title;
};

interface TermStats {
  points: number;
  credits: number;
  gpa: number | null;
}

function computeTermStats(term: TermData): TermStats {
  let points = 0;
  let credits = 0;
  for (const c of term.courses) {
    const cr = parseFloat(c.credits);
    if (!Number.isFinite(cr) || cr <= 0) continue; // non-credit-bearing → excluded
    if (!isGpaBearingGrade(c.grade)) continue; // P / not-yet-graded → excluded
    const gp = getGPA(c.grade);
    if (gp == null) continue;
    points += gp * cr;
    credits += cr;
  }
  return { points, credits, gpa: credits > 0 ? points / credits : null };
}

// ----------------------------------------------------------------------------
// Course code autocomplete input
// ----------------------------------------------------------------------------

interface CourseCodeInputProps {
  value: string;
  onChange: (code: string) => void;
  catalog: GpaCourseCatalog;
  language: string;
  placeholder: string;
}

function CourseCodeInput({ value, onChange, catalog, language, placeholder }: CourseCodeInputProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = value.trim().toUpperCase();
    if (q.length < 2) return [] as GpaCourseInfo[];
    const prefix: GpaCourseInfo[] = [];
    const contains: GpaCourseInfo[] = [];
    for (const code in catalog) {
      const info = catalog[code];
      if (code.startsWith(q)) prefix.push(info);
      else if (code.includes(q) || pickTitle(info, language).toUpperCase().includes(q)) contains.push(info);
      if (prefix.length >= 8) break;
    }
    return [...prefix, ...contains].slice(0, 8);
  }, [value, catalog, language]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const known = catalog[value.trim().toUpperCase()];

  const pick = (info: GpaCourseInfo) => {
    onChange(info.code);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value.toUpperCase());
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || matches.length === 0) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, matches.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            pick(matches[active]);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
        className="font-mono uppercase"
      />
      {known && !open && (
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 max-w-[45%] truncate text-xs text-muted-foreground">
          {pickTitle(known, language)}
        </span>
      )}
      {open && matches.length > 0 && (
        <div className="absolute z-50 mt-1 w-[min(420px,80vw)] max-h-72 overflow-auto rounded-md border bg-white dark:bg-gray-900 shadow-lg">
          {matches.map((info, i) => (
            <button
              key={info.code}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(info)}
              className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
                i === active ? 'bg-accent' : ''
              }`}
            >
              <span className="flex min-w-0 flex-col">
                <span className="font-mono font-medium">{info.code}</span>
                <span className="truncate text-xs text-muted-foreground">{pickTitle(info, language)}</span>
              </span>
              <Badge variant="secondary" className="shrink-0 tabular-nums">
                {info.credits}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
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
};

const GpaHons = () => {
  const { t, language } = useLanguage();

  const termLabelFor = (year: number, part: number) => t('gpa.defaultTermLabel', { year, part });

  const [terms, setTerms] = useState<TermData[]>(() => loadTerms(termLabelFor));
  const [catalog, setCatalog] = useState<GpaCourseCatalog>({});

  // Target calculator inputs
  const [targetKey, setTargetKey] = useState<HonoursKey>('first');
  const [creditsPerTerm, setCreditsPerTerm] = useState('15');
  const [remainingTermsInput, setRemainingTermsInput] = useState('');

  useEffect(() => {
    let cancelled = false;
    loadGpaCourseCatalog()
      .then((c) => {
        if (!cancelled) setCatalog(c);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ terms }));
    } catch {
      /* ignore quota errors */
    }
  }, [terms]);

  // ---- Mutations ---------------------------------------------------------
  const updateCourse = (termId: string, courseId: string, patch: Partial<CourseEntry>) => {
    setTerms((prev) =>
      prev.map((term) =>
        term.id !== termId
          ? term
          : {
              ...term,
              courses: term.courses.map((c) => {
                if (c.id !== courseId) return c;
                const next = { ...c, ...patch };
                // Auto-fill credits when a known course code is entered.
                if (patch.code !== undefined) {
                  const info = catalog[patch.code.trim().toUpperCase()];
                  if (info) next.credits = String(info.credits);
                }
                return next;
              }),
            },
      ),
    );
  };

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

  const updateTermLabel = (termId: string, label: string) =>
    setTerms((prev) => prev.map((term) => (term.id === termId ? { ...term, label } : term)));

  const addTerm = () =>
    setTerms((prev) => [
      ...prev,
      { id: uid(), label: t('gpa.newTermLabel', { n: prev.length + 1 }), courses: [newCourse()] },
    ]);

  const removeTerm = (termId: string) => setTerms((prev) => prev.filter((term) => term.id !== termId));

  const resetAll = () => setTerms(makeDefaultTerms(termLabelFor));

  // ---- Derived stats -----------------------------------------------------
  const termStats = useMemo(() => terms.map(computeTermStats), [terms]);

  const { chartData, earnedPoints, earnedCredits, cgpa, autoRemainingTerms } = useMemo(() => {
    let runPoints = 0;
    let runCredits = 0;
    let remaining = 0;
    const data: GpaChartPoint[] = terms.map((term, i) => {
      const s = termStats[i];
      runPoints += s.points;
      runCredits += s.credits;
      if (s.credits === 0) remaining += 1; // term with no graded GPA-bearing courses
      return {
        term: term.label,
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
  }, [terms, termStats]);

  const currentClass = classifyHonours(cgpa);
  const nextTier = nextHonoursTier(cgpa);

  // ---- Target calculator -------------------------------------------------
  const remainingTerms =
    remainingTermsInput.trim() === '' ? autoRemainingTerms : Math.max(0, parseInt(remainingTermsInput, 10) || 0);
  const perTerm = Math.max(0, parseFloat(creditsPerTerm) || 0);
  const remainingCredits = remainingTerms * perTerm;
  const targetTier = HONOURS_TIERS.find((tr) => tr.key === targetKey)!;
  const calc = requiredRemainingAvg({
    earnedPoints,
    earnedCredits,
    remainingCredits,
    targetCgpa: targetTier.cgpa,
  });

  const gradeOptions = GPA_BEARING_GRADES;

  const chartLabels = {
    termGpa: t('gpa.termGpa'),
    cgpa: t('gpa.cumulativeGpa'),
    first: t('gpa.honours.first'),
    upperSecond: t('gpa.honours.upperSecond'),
    lowerSecond: t('gpa.honours.lowerSecond'),
    third: t('gpa.honours.third'),
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
      <div className="mb-6 flex flex-col gap-1 md:flex-row md:flex-wrap md:items-baseline md:gap-5">
        <div className="flex items-center gap-2">
          <Calculator className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">{t('gpaHons.title')}</h1>
        </div>
        <p className="text-muted-foreground md:-translate-y-[3px]">{t('gpaHons.subtitle')}</p>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <GraduationCap className="h-4 w-4" /> {t('gpa.cumulativeGpa')}
            </div>
            <div className="mt-1 text-3xl font-bold tabular-nums">{cgpa != null ? cgpa.toFixed(3) : '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Award className="h-4 w-4" /> {t('gpa.classification')}
            </div>
            <div className="mt-2">
              {currentClass ? (
                <Badge className={`${HONOURS_BADGE_COLORS[currentClass]} text-white hover:opacity-90`}>
                  {t(`gpa.honours.${currentClass}`)}
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">{t('gpa.belowHonours')}</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-4 w-4" /> {t('gpa.gpaCredits')}
            </div>
            <div className="mt-1 text-3xl font-bold tabular-nums">{earnedCredits || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Target className="h-4 w-4" /> {t('gpa.nextMilestone')}
            </div>
            <div className="mt-1 text-sm font-medium">
              {nextTier ? (
                <>
                  {t(`gpa.honours.${nextTier.key}`)}{' '}
                  <span className="text-muted-foreground tabular-nums">({nextTier.cgpa.toFixed(2)})</span>
                </>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400">{t('gpa.topReached')}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend chart */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" /> {t('gpa.trendTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GpaTrendChart data={chartData} labels={chartLabels} />
          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <LegendDot color="#2563eb" label={t('gpa.cumulativeGpa')} />
            <LegendDot color="#10b981" label={t('gpa.termGpa')} />
            <LegendDot color="#b91c1c" dashed label={t('gpa.honoursLines')} />
            <LegendDot color="#7c3aed" dashed label={`${t('gpa.presidentsList')} ${AWARD_LINES.presidentsList.toFixed(2)}`} />
            <LegendDot color="#0891b2" dashed label={`${t('gpa.deansList')} ${AWARD_LINES.deansList.toFixed(2)}`} />
          </div>
        </CardContent>
      </Card>

      {/* Target calculator */}
      <Card className="mb-6 border-primary/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5" /> {t('gpa.targetTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">{t('gpa.targetDesc')}</p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('gpa.targetClass')}</Label>
              <Select value={targetKey} onValueChange={(v) => setTargetKey(v as HonoursKey)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900">
                  {HONOURS_TIERS.map((tr) => (
                    <SelectItem key={tr.key} value={tr.key}>
                      {t(`gpa.honours.${tr.key}`)} ({tr.cgpa.toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('gpa.remainingTerms')}</Label>
              <Input
                type="number"
                min={0}
                value={remainingTermsInput}
                placeholder={String(autoRemainingTerms)}
                onChange={(e) => setRemainingTermsInput(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">{t('gpa.autoDetected', { n: autoRemainingTerms })}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('gpa.creditsPerTerm')}</Label>
              <Input
                type="number"
                min={0}
                value={creditsPerTerm}
                onChange={(e) => setCreditsPerTerm(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                {t('gpa.remainingCreditsLabel', { n: remainingCredits })}
              </p>
            </div>
          </div>

          {/* Result */}
          <div className="mt-5 rounded-lg border bg-muted/40 p-4">
            {calc.status === 'feasible' && (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">
                  {t('gpa.resultFeasiblePrefix', { target: t(`gpa.honours.${targetKey}`) })}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold tabular-nums ${requiredColor}`}>{calc.required.toFixed(3)}</span>
                  <span className="text-sm text-muted-foreground">{t('gpa.perRemainingCredit')}</span>
                </div>
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
                <p className="text-sm text-muted-foreground">
                  {t('gpa.bestPossible', { gpa: calc.projectedCgpa.toFixed(3) })}
                </p>
              </div>
            )}
            {calc.status === 'noRemaining' && (
              <p className="text-sm text-muted-foreground">
                {t('gpa.resultNoRemaining', {
                  gpa: calc.projectedCgpa.toFixed(3),
                  target: t(`gpa.honours.${targetKey}`),
                })}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Terms editor */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('gpa.termsTitle')}</h2>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <RotateCcw className="mr-1.5 h-4 w-4" /> {t('gpa.reset')}
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
        {terms.map((term, ti) => {
          const stats = termStats[ti];
          return (
            <Card key={term.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={term.label}
                    onChange={(e) => updateTermLabel(term.id, e.target.value)}
                    className="h-8 max-w-[200px] font-semibold"
                  />
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[11px] text-muted-foreground">{t('gpa.termGpa')}</div>
                      <div className="text-lg font-bold tabular-nums leading-none">
                        {stats.gpa != null ? stats.gpa.toFixed(3) : '—'}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => removeTerm(term.id)}
                      title={t('gpa.removeTerm')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Column headers */}
                <div className="mb-1.5 hidden grid-cols-[1fr_90px_120px_40px] gap-2 px-1 text-[11px] font-medium text-muted-foreground sm:grid">
                  <span>{t('gpa.colCourse')}</span>
                  <span>{t('gpa.colCredits')}</span>
                  <span>{t('gpa.colGrade')}</span>
                  <span />
                </div>
                <div className="space-y-2">
                  {term.courses.map((course) => (
                    <div
                      key={course.id}
                      className="grid grid-cols-[1fr_70px_auto] items-center gap-2 sm:grid-cols-[1fr_90px_120px_40px]"
                    >
                      <CourseCodeInput
                        value={course.code}
                        onChange={(code) => updateCourse(term.id, course.id, { code })}
                        catalog={catalog}
                        language={language}
                        placeholder={t('gpa.codePlaceholder')}
                      />
                      <Input
                        type="number"
                        min={0}
                        step="0.5"
                        value={course.credits}
                        placeholder="—"
                        onChange={(e) => updateCourse(term.id, course.id, { credits: e.target.value })}
                        className="tabular-nums"
                      />
                      <Select
                        value={course.grade || undefined}
                        onValueChange={(v) => updateCourse(term.id, course.id, { grade: v === '__none__' ? '' : v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('gpa.gradePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-900">
                          <SelectGroup>
                            <SelectItem value="__none__" className="text-muted-foreground">
                              {t('gpa.notGraded')}
                            </SelectItem>
                            <SelectLabel>{t('gpa.gpaGrades')}</SelectLabel>
                            {gradeOptions.map((g) => (
                              <SelectItem key={g} value={g}>
                                {g} <span className="text-muted-foreground">({getGPA(g)?.toFixed(2)})</span>
                              </SelectItem>
                            ))}
                            <SelectLabel>{t('gpa.nonGpaGrades')}</SelectLabel>
                            <SelectItem value="P">P</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeCourse(term.id, course.id)}
                        title={t('gpa.removeCourse')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => addCourse(term.id)}>
                  <Plus className="mr-1.5 h-4 w-4" /> {t('gpa.addCourse')}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button variant="outline" className="mt-4 w-full border-dashed" onClick={addTerm}>
        <Plus className="mr-1.5 h-4 w-4" /> {t('gpa.addTerm')}
      </Button>

      <p className="mt-6 text-center text-xs text-muted-foreground">{t('gpa.disclaimer')}</p>
    </div>
  );
};

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
