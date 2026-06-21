import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelectDropdown, SelectOption } from '@/components/ui/multi-select-dropdown';
import { useLoginRequired } from '@/contexts/LoginRequiredContext';
import { 
  ArrowLeft, 
  Star, 
  MessageSquare, 
  Calendar, 
  Mail, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  UserCheck,
  GraduationCap,
  Info,
  CalendarDays,
  BookOpen,
  BookText,
  FileText,
  Download,
  ExternalLink,
  Lock,
  ListChecks,
  Layers,
  Ban,
  ShieldCheck,
  ThumbsUp,
  ShieldAlert,
  Clock,
  Tags,
  Languages,
  Presentation
} from 'lucide-react';
import { storage } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useCourseDetailOptimized } from '@/hooks/useCourseDetailOptimized';
import { useIsMobile } from '@/hooks/use-mobile';
import { CourseService, type Course, type CourseReviewInfo, type CourseTeachingInfo, type Instructor } from '@/services/api/courseService';
import { CourseReviewsList } from '@/components/features/reviews/CourseReviewsList';
import { Pagination } from '@/components/features/reviews/Pagination';
import { getCourseTitle, translateDepartmentName, getTeachingLanguageName, extractInstructorNameForSorting, getFacultiesForMultiDepartment, getFormattedInstructorName } from '@/utils/textUtils';
import { getCurrentTermName, getCurrentTermCode, isCurrentTerm } from '@/utils/dateUtils';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { PersistentCollapsibleSection } from '@/components/ui/PersistentCollapsibleSection';
import GradeDistributionChart from '@/components/features/reviews/GradeDistributionChart';
import { calculateGradeDistributionFromReviews } from '@/utils/gradeUtils';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { PdfViewerDialog } from '@/components/pdf/PdfViewerDialog';
import { cn } from '@/lib/utils';

// Faculty mapping function - copied from Lecturers.tsx
const getFacultyByDepartment = (department: string): string => {
  // First try to extract raw department name if it's translated
  const rawDepartment = extractRawDepartmentName(department);
  
  const facultyMapping: { [key: string]: string } = {
    // mark update
    // Affiliated Units
    'LIFE': 'faculty.affiliatedUnits',
    // Faculty of Arts
    'AIGCS': 'faculty.arts',
    'CEAL': 'faculty.arts',
    'CFCI': 'faculty.arts',
    'CLEAC': 'faculty.arts',
    'CHI': 'faculty.arts',
    'CS': 'faculty.arts',
    'DACI': 'faculty.arts',
    'ENG': 'faculty.arts',
    'HIST': 'faculty.arts',
    'PHILO': 'faculty.arts',
    'TRAN': 'faculty.arts',
    // Faculty of Business
    'ACCT': 'faculty.business',
    'BUS': 'faculty.business',
    'FIN': 'faculty.business',
    'MGT': 'faculty.business',
    'MKT': 'faculty.business',
    'ORM': 'faculty.business',
    'HKIBS': 'faculty.business',
    'IIRM': 'faculty.business',
    // Faculty of Social Sciences
    'ECON': 'faculty.socialSciences',
    'GOV': 'faculty.socialSciences',
    'PSY': 'faculty.socialSciences',
    'SOCSC': 'faculty.socialSciences',
    'SOCSP': 'faculty.socialSciences',
    // School of Data Science
    'DAI': 'faculty.dataScience',
    'DIDS': 'faculty.dataScience',
    'LEODCIDS': 'faculty.dataScience',
    'SDS': 'faculty.dataScience',
    // School of Graduate Studies
    'GS': 'faculty.graduateStudies',
    // School of Interdisciplinary Studies
    'DoS': 'faculty.interdisciplinaryStudies',
    'WJYSIS': 'faculty.interdisciplinaryStudies',
    'WBLMP': 'faculty.interdisciplinaryStudies',
    // Research Institutes, Centres and Programmes
    'APIAS': 'faculty.researchInstitutes',
    'IPS': 'faculty.researchInstitutes',
    // Units and Offices
    'OSL': 'faculty.unitsOffices',
    'CITAL': 'faculty.unitsOffices'
  };
  
  return facultyMapping[rawDepartment] || '';
};

// Helper function to extract raw department name from translated names
const extractRawDepartmentName = (department: string): string => {
  // If it's already a raw department name, return as is
  const rawDepartmentNames = [
    'Chinese', 'Cultural Studies', 'Digital Arts and Creative Industries', 'English', 
    'History', 'Philosophy', 'Translation', 'Centre for English and Additional Languages',
    'Chinese Language Education and Assessment Centre', 'Accountancy', 'Finance', 
    'Management', 'Marketing and International Business', 'Operations and Risk Management',
    'Psychology', 'Economics', 'Government and International Affairs', 
    'Sociology and Social Policy', 'Division of Science',
    'Wong Bing Lai Music and Performing Arts Unit', 'LEO Dr David P. Chan Institute of Data Science'
  ];
  
  if (rawDepartmentNames.includes(department)) {
    return department;
  }
  
  // Create mapping from translated names back to raw names
  const translatedToRawMapping: { [key: string]: string } = {
    // English translations
    'Department of Chinese': 'Chinese',
    'Department of Cultural Studies': 'Cultural Studies',
    'Department of Digital Arts and Creative Industries': 'Digital Arts and Creative Industries',
    'Department of English': 'English',
    'Department of History': 'History',
    'Department of Philosophy': 'Philosophy',
    'Department of Translation': 'Translation',
    'Centre for English and Additional Languages': 'Centre for English and Additional Languages',
    'Chinese Language Education and Assessment Centre': 'Chinese Language Education and Assessment Centre',
    'Department of Accountancy': 'Accountancy',
    'Department of Finance': 'Finance',
    'Department of Management': 'Management',
    'Department of Marketing and International Business': 'Marketing and International Business',
    'Department of Operations and Risk Management': 'Operations and Risk Management',
    'Department of Psychology': 'Psychology',
    'Department of Economics': 'Economics',
    'Department of Government and International Affairs': 'Government and International Affairs',
    'Department of Sociology and Social Policy': 'Sociology and Social Policy',
    'Division of Science': 'Division of Science',
    'Wong Bing Lai Music and Performing Arts Unit': 'Wong Bing Lai Music and Performing Arts Unit',
    'LEO Dr David P. Chan Institute of Data Science': 'LEO Dr David P. Chan Institute of Data Science',
    
    // Chinese Traditional translations
    '中文系': 'Chinese',
    '文化研究系': 'Cultural Studies',
    '數碼藝術及創意產業系': 'Digital Arts and Creative Industries',
    '英文系': 'English',
    '歷史系': 'History',
    '哲學系': 'Philosophy',
    '翻譯系': 'Translation',
    '英語及外語教學中心': 'Centre for English and Additional Languages',
    '中國語文教學與測試中心': 'Chinese Language Education and Assessment Centre',
    '會計學系': 'Accountancy',
    '金融學系': 'Finance',
    '管理學學系': 'Management',
    '市場及國際企業學系': 'Marketing and International Business',
    '運營與風險管理學系': 'Operations and Risk Management',
    '心理學系': 'Psychology',
    '經濟學系': 'Economics',
    '政府與國際事務學系': 'Government and International Affairs',
    '社會學及社會政策系': 'Sociology and Social Policy',
    '科學教研組': 'Division of Science',
    '黃炳禮音樂及演藝部': 'Wong Bing Lai Music and Performing Arts Unit',
    '嶺南教育機構陳斌博士數據科學研究所': 'LEO Dr David P. Chan Institute of Data Science',
    
    // Chinese Simplified translations (only unique ones)
    '数码艺术及创意产业系': 'Digital Arts and Creative Industries',
    '历史系': 'History',
    '哲学系': 'Philosophy',
    '翻译系': 'Translation',
    '英语及外语教学中心': 'Centre for English and Additional Languages',
    '中国语文教学与测试中心': 'Chinese Language Education and Assessment Centre',
    '会计学系': 'Accountancy',
    '金融学系': 'Finance',
    '管理学学系': 'Management',
    '市场及国际企业学系': 'Marketing and International Business',
    '运营与风险管理学系': 'Operations and Risk Management',
    '心理学系': 'Psychology',
    '经济学系': 'Economics',
    '政府与国际事务学系': 'Government and International Affairs',
    '社会学及社会政策系': 'Sociology and Social Policy',
    '科学教研组': 'Division of Science',
    '黄炳礼音乐及演艺部': 'Wong Bing Lai Music and Performing Arts Unit',
    '岭南教育机构陈斌博士数据科学研究所': 'LEO Dr David P. Chan Institute of Data Science'
  };
  
  return translatedToRawMapping[department] || department;
};

// Parse the term-code suffix used in past-exam-paper filenames such as
// "CDS2004_24252.pdf" → { startYear: 2024, term: '2', ... }. Returns null
// when the filename (excluding the course-code prefix and extension) is
// not a recognized 5-digit YYYYT code.
type ExamPaperTermInfo = {
  startYear: number;        // e.g. 2024
  endYearShort: string;     // e.g. "25"
  term: '1' | '2' | 'S';    // term 1, term 2, or summer
  academicYear: string;     // e.g. "2024-25"
  termSortKey: number;      // larger = newer (used for sorting)
  label: string;            // localized human label
  termCodes: string[];      // candidate DB term_codes for joining (e.g. ["2024-T2"])
  instructorNameFromFile?: string; // optional name encoded after the term code
};

const parseExamPaperTermCode = (fileName: string, coursePrefixLen: number): ExamPaperTermInfo | null => {
  const dot = fileName.lastIndexOf('.');
  const stem = dot > 0 ? fileName.slice(0, dot) : fileName;
  const suffix = stem.slice(coursePrefixLen + 1); // +1 to skip the underscore
  // Accept either "YYYYT" or "YYYYT_<instructor name>" (the latter is used by
  // courses like CCC8011 that have many parallel sections in one term).
  const match = /^(\d{2})(\d{2})([0-9])(?:_(.+))?$/.exec(suffix);
  if (!match) return null;
  const startYear = 2000 + parseInt(match[1], 10);
  const endYearShort = match[2];
  const termDigit = match[3];
  const instructorNameFromFile = match[4]?.trim() || undefined;
  let term: '1' | '2' | 'S';
  let termRank: number;
  let termLabel: string;
  let termCodes: string[];
  switch (termDigit) {
    case '1':
      term = '1'; termRank = 1; termLabel = 'Term 1';
      termCodes = [`${startYear}-T1`];
      break;
    case '2':
      term = '2'; termRank = 2; termLabel = 'Term 2';
      termCodes = [`${startYear}-T2`];
      break;
    case '0':
    case '3':
      term = 'S'; termRank = 3; termLabel = 'Summer Term';
      // The DB has been seen using either "-S" or "-Summer" for summer terms.
      termCodes = [`${startYear}-S`, `${startYear}-Summer`];
      break;
    default: return null;
  }
  const academicYear = `${startYear}-${endYearShort}`;
  return {
    startYear,
    endYearShort,
    term,
    academicYear,
    termSortKey: startYear * 10 + termRank,
    label: `${academicYear}, ${termLabel}`,
    termCodes,
    instructorNameFromFile,
  };
};

const formatExamPaperSize = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Course codes are 3 capital letters + 4 digits, optionally followed by a
// single trailing letter (e.g. HST3366e). MGSL is the one and only 4-letter
// prefix, so it's special-cased rather than allowing any 4 letters generally.
const COURSE_CODE_REGEX = /\b(?:MGSL|[A-Z]{3})\d{4}[a-z]?\b/g;

// Normalise separators between course codes so they read cleanly:
//  - "/"  → spaces before & after  (CDS1003/BUS1102 → CDS1003 / BUS1102)
//  - ","  → space after only       (CDS1003,BUS1102 → CDS1003, BUS1102)
const formatRequirementSeparators = (text: string): string =>
  text
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s*,\s*/g, ', ');

// Lookup of referenced course codes → their titles (English + localized),
// used to append the course name after each detected course code.
type CourseTitleInfo = { title?: string; title_tc?: string; title_sc?: string };
type CourseTitleMap = Record<string, CourseTitleInfo>;

// Build the text shown after a course code, e.g. " - Calculus" (en) or
// " - Calculus (微積分)" (zh-TW) / " - Calculus (微积分)" (zh-CN). Returns an
// empty string when the referenced course's title is not available.
const buildCourseCodeNameSuffix = (
  code: string,
  titleMap: CourseTitleMap,
  language: string,
): string => {
  const info = titleMap[code];
  if (!info || !info.title) return '';
  let suffix = ` - ${info.title}`;
  if (language === 'zh-TW' && info.title_tc) suffix += ` (${info.title_tc})`;
  else if (language === 'zh-CN' && info.title_sc) suffix += ` (${info.title_sc})`;
  return suffix;
};

const renderTextWithCourseLinks = (
  text: string,
  currentCourseCode?: string,
  titleMap: CourseTitleMap = {},
  language: string = 'en',
): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  COURSE_CODE_REGEX.lastIndex = 0;
  while ((match = COURSE_CODE_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const code = match[0];
    const suffix = buildCourseCodeNameSuffix(code, titleMap, language);
    const inner = (
      <>
        <span className="font-mono font-semibold">{code}</span>
        {suffix && <span className="font-medium">{suffix}</span>}
      </>
    );
    if (currentCourseCode && code === currentCourseCode) {
      nodes.push(
        <span key={`code-${key++}`} className="text-muted-foreground">
          {inner}
        </span>,
      );
    } else {
      nodes.push(
        <Link
          key={`code-${key++}`}
          to={`/courses/${code}`}
          className="text-primary hover:underline underline-offset-2 transition-colors"
        >
          {inner}
        </Link>,
      );
    }
    lastIndex = match.index + code.length;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
};

interface CourseBasicInfoSectionProps {
  course: Course;
  t: (key: string, params?: Record<string, any>) => string;
  language: string;
  titleMap: CourseTitleMap;
}

const CourseBasicInfoSection: React.FC<CourseBasicInfoSectionProps> = ({ course, t, language, titleMap }) => {
  // 依目前語言挑選對應的本地化欄位，缺值時退回英文原文
  const pickLocalized = (en?: string, tc?: string, sc?: string): string => {
    if (language === 'zh-TW') return (tc || en || '');
    if (language === 'zh-CN') return (sc || en || '');
    return en || '';
  };
  const items: Array<{
    key: string;
    label: string;
    value: string;
    icon: React.ReactNode;
    accent: string;
  }> = [
    {
      key: 'recommendedStudyYear',
      label: t('pages.courseDetail.recommendedStudyYear'),
      value: pickLocalized(course.course_recommended_study_year, course.course_recommended_study_year_tc, course.course_recommended_study_year_sc).trim(),
      icon: <GraduationCap className="h-4 w-4" />,
      accent: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
    },
    {
      key: 'modeOfTuition',
      label: t('pages.courseDetail.modeOfTuition'),
      value: pickLocalized(course.course_mode_of_tuition, course.course_mode_of_tuition_tc, course.course_mode_of_tuition_sc).trim(),
      icon: <Presentation className="h-4 w-4" />,
      accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    },
    {
      key: 'classContactHours',
      label: t('pages.courseDetail.classContactHours'),
      value: pickLocalized(course.course_class_contact_hours, course.course_class_contact_hours_tc, course.course_class_contact_hours_sc).trim(),
      icon: <Clock className="h-4 w-4" />,
      accent: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
    },
    {
      key: 'category',
      label: t('pages.courseDetail.category'),
      value: pickLocalized(course.course_category, course.course_category_tc, course.course_category_sc).trim(),
      icon: <Tags className="h-4 w-4" />,
      accent: 'text-violet-600 dark:text-violet-400 bg-violet-500/10',
    },
    {
      key: 'discipline',
      label: t('pages.courseDetail.discipline'),
      value: pickLocalized(course.course_discipline, course.course_discipline_tc, course.course_discipline_sc).trim(),
      icon: <BookText className="h-4 w-4" />,
      accent: 'text-rose-600 dark:text-rose-400 bg-rose-500/10',
    },
    {
      key: 'languageOfInstruction',
      label: t('pages.courseDetail.languageOfInstruction'),
      value: pickLocalized(course.course_language_of_instruction, course.course_language_of_instruction_tc, course.course_language_of_instruction_sc).trim(),
      icon: <Languages className="h-4 w-4" />,
      accent: 'text-teal-600 dark:text-teal-400 bg-teal-500/10',
    },
  ].filter(item => item.value);

  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        {t('pages.courseDetail.basicInfo')}
      </h3>
      <div className="flex flex-col">
        {items.map(item => (
          <div
            key={item.key}
            className="flex items-start gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted/40 transition-colors"
          >
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${item.accent}`}>
              {item.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-muted-foreground leading-tight">{item.label}</div>
              <p className="text-sm leading-snug text-foreground whitespace-pre-line break-words">
                {renderTextWithCourseLinks(item.value, course.course_code, titleMap, language)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface CourseRequirementsSectionProps {
  course: Course;
  t: (key: string, params?: Record<string, any>) => string;
  language: string;
  titleMap: CourseTitleMap;
}

const CourseRequirementsSection: React.FC<CourseRequirementsSectionProps> = ({ course, t, language, titleMap }) => {
  // 依目前語言挑選對應的本地化欄位，缺值時退回英文原文
  const pickLocalized = (en?: string, tc?: string, sc?: string): string => {
    if (language === 'zh-TW') return (tc || en || '');
    if (language === 'zh-CN') return (sc || en || '');
    return en || '';
  };
  const items: Array<{
    key: string;
    label: string;
    value: string;
    icon: React.ReactNode;
    accent: string;
  }> = [
    {
      key: 'prerequisites',
      label: t('pages.courseDetail.prerequisites'),
      value: formatRequirementSeparators(pickLocalized(course.course_prerequisites, course.course_prerequisites_tc, course.course_prerequisites_sc).trim()),
      icon: <ListChecks className="h-4 w-4" />,
      accent: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
    },
    {
      key: 'corequisites',
      label: t('pages.courseDetail.corequisites'),
      value: formatRequirementSeparators(pickLocalized(course.course_corequisites, course.course_corequisites_tc, course.course_corequisites_sc).trim()),
      icon: <Layers className="h-4 w-4" />,
      accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    },
    {
      key: 'exclusions',
      label: t('pages.courseDetail.exclusions'),
      value: formatRequirementSeparators(pickLocalized(course.course_exclusions, course.course_exclusions_tc, course.course_exclusions_sc).trim()),
      icon: <Ban className="h-4 w-4" />,
      accent: 'text-rose-600 dark:text-rose-400 bg-rose-500/10',
    },
    {
      key: 'exemptionRequirements',
      label: t('pages.courseDetail.exemptionRequirements'),
      value: formatRequirementSeparators(pickLocalized(course.course_exemption_requirements, course.course_exemption_requirements_tc, course.course_exemption_requirements_sc).trim()),
      icon: <ShieldCheck className="h-4 w-4" />,
      accent: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
    },
    {
      key: 'recommended',
      label: t('pages.courseDetail.recommended'),
      value: formatRequirementSeparators(pickLocalized(course.course_recommended, course.course_recommended_tc, course.course_recommended_sc).trim()),
      icon: <ThumbsUp className="h-4 w-4" />,
      accent: 'text-violet-600 dark:text-violet-400 bg-violet-500/10',
    },
    {
      key: 'restriction',
      label: t('pages.courseDetail.restriction'),
      value: formatRequirementSeparators(pickLocalized(course.course_restriction, course.course_restriction_tc, course.course_restriction_sc).trim()),
      icon: <ShieldAlert className="h-4 w-4" />,
      accent: 'text-orange-600 dark:text-orange-400 bg-orange-500/10',
    },
  ].filter(item => item.value);

  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        {t('pages.courseDetail.requirements')}
      </h3>
      <div className="flex flex-col">
        {items.map(item => (
          <div
            key={item.key}
            className="flex items-start gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted/40 transition-colors"
          >
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${item.accent}`}>
              {item.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-muted-foreground leading-tight">{item.label}</div>
              <p className="text-sm leading-snug text-foreground whitespace-pre-line break-words">
                {renderTextWithCourseLinks(item.value, course.course_code, titleMap, language)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CourseDetail = () => {
  const { courseCode } = useParams<{ courseCode: string }>();
  const navigate = useNavigate();
  const promptLogin = useLoginRequired();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const [pendingTeachingLanguageFilter, setPendingTeachingLanguageFilter] = useState<string | null>(null);
  const [pendingTermFilter, setPendingTermFilter] = useState<string | null>(null);
  
  // Teaching language tooltip states for mobile
  const [teachingLanguageTooltipStates, setTeachingLanguageTooltipStates] = useState<{[key: string]: boolean}>({});
  const [teachingLanguageTapCounts, setTeachingLanguageTapCounts] = useState<{[key: string]: number}>({});
  const [termTooltipStates, setTermTooltipStates] = useState<{[key: string]: boolean}>({});
  const [termTapCounts, setTermTapCounts] = useState<{[key: string]: number}>({});
  
  // Refs for tooltip elements to handle click outside
  const tooltipRefs = useRef<{[key: string]: HTMLElement | null}>({});
  const timeoutRefs = useRef<{[key: string]: NodeJS.Timeout | null}>({});

  // Clear pending states when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setPendingTeachingLanguageFilter(null);
      setPendingTermFilter(null);
    };

    // Add a small delay to avoid clearing immediately when clicking the badge itself
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Clear pending states after timeout
  useEffect(() => {
    if (pendingTeachingLanguageFilter || pendingTermFilter) {
      const timer = setTimeout(() => {
        setPendingTeachingLanguageFilter(null);
        setPendingTermFilter(null);
      }, 3000); // Clear after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [pendingTeachingLanguageFilter, pendingTermFilter]);

  // Handle clicks outside tooltips to close them (same pattern as MyReviews.tsx)
  useEffect(() => {
    if (!isMobile) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      
      // Get all currently active tooltip keys from both term and teaching language states
      const activeTermKeys = Object.keys(termTooltipStates).filter(key => termTooltipStates[key]).map(key => `term-${key}`);
      const activeLanguageKeys = Object.keys(teachingLanguageTooltipStates).filter(key => teachingLanguageTooltipStates[key]).map(key => `lang-${key}`);
      const allActiveKeys = [...activeTermKeys, ...activeLanguageKeys];
      
      if (allActiveKeys.length === 0) return;

      // Add a small delay to allow onClick handlers to process first
      // This prevents interference with the two-tap functionality
      setTimeout(() => {
        // Check if click is outside all active tooltips
        let clickedInsideAnyTooltip = false;
        
        for (const key of allActiveKeys) {
          const tooltipElement = tooltipRefs.current[key];
          if (tooltipElement && tooltipElement.contains(target)) {
            clickedInsideAnyTooltip = true;
            break;
          }
        }

        // If clicked outside all tooltips, close all active tooltips
        if (!clickedInsideAnyTooltip) {
          // Close term tooltips
          Object.keys(termTooltipStates).filter(key => termTooltipStates[key]).forEach(termKey => {
            const refKey = `term-${termKey}`;
            // Clear timeout
            if (timeoutRefs.current[refKey]) {
              clearTimeout(timeoutRefs.current[refKey]);
              timeoutRefs.current[refKey] = null;
            }
            
            // Reset states
            setTermTapCounts(prev => ({ ...prev, [termKey]: 0 }));
            setTermTooltipStates(prev => ({ ...prev, [termKey]: false }));
          });
          
          // Close teaching language tooltips
          Object.keys(teachingLanguageTooltipStates).filter(key => teachingLanguageTooltipStates[key]).forEach(langKey => {
            const refKey = `lang-${langKey}`;
            // Clear timeout
            if (timeoutRefs.current[refKey]) {
              clearTimeout(timeoutRefs.current[refKey]);
              timeoutRefs.current[refKey] = null;
            }
            
            // Reset states
            setTeachingLanguageTapCounts(prev => ({ ...prev, [langKey]: 0 }));
            setTeachingLanguageTooltipStates(prev => ({ ...prev, [langKey]: false }));
          });
        }
      }, 10); // Small delay to let onClick handlers process first
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobile, termTooltipStates, teachingLanguageTooltipStates]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  // Helper function to generate responsive teaching language labels
  const getResponsiveTeachingLanguageLabel = (languageCode: string): string => {
    const languageName = getTeachingLanguageName(languageCode, t);
    // Always use dash separator for consistency with catalog pages
    return `${languageCode} - ${languageName}`;
  };

  // 根據評分獲取漸變背景色（0-5分，紅色到綠色）
  const getRatingGradientColor = (value: number) => {
    // 確保評分在0-5範圍內
    const clampedValue = Math.max(0, Math.min(5, value));
    
    // 將0-5的評分映射到0-1的範圍
    const ratio = clampedValue / 5;
    
    // 使用HSL色彩空間創建從紅色(0°)到綠色(120°)的漸變
    const hue = ratio * 120; // 0到120度
    const saturation = 95; // 提高飽和度到95%，讓顏色更鮮艷
    
    // 統一使用深色主題的亮度設定，確保白色文字可讀性
    const lightness = 30; // 統一使用30%亮度，讓顏色更深更突出
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // 統計框組件 - 評分類型在框外，只有數字在框內
  const StatBox = ({ value, label, labelShort, hasValidData = true }: { 
    value: number | string, 
    label: string,
    labelShort?: string,
    hasValidData?: boolean
  }) => {
    const numericValue = typeof value === 'number' ? value : parseFloat(value.toString());
    const isValid = hasValidData && numericValue > 0;
    
    const backgroundColor = isValid 
      ? getRatingGradientColor(numericValue) 
      : '#4B5563'; // 統一使用深色灰色
    
    const displayValue = isValid ? numericValue.toFixed(2).replace(/\.?0+$/, '') : 'N/A';
    
    return (
      <div className="flex flex-col items-center min-w-0">
        <div className="text-xs sm:text-sm text-muted-foreground text-center leading-tight">
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{labelShort || label}</span>
        </div>
        <div 
          className="flex items-center justify-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-white font-bold text-xs sm:text-sm mt-1"
          style={{ backgroundColor }}
        >
          {displayValue}
        </div>
      </div>
    );
  };
  
  // Get current term info for offer badge
  const currentTermName = getCurrentTermName();
  const currentTermCode = getCurrentTermCode();
  
  // 使用優化的 hook
  const { data, loading, error, teachingInfoLoading, reviewsLoading } = useCourseDetailOptimized(
    courseCode || null,
    user?.$id,
    language,
    currentTermCode
  );

  // 篩選狀態
  const [selectedGradeChartFilter, setSelectedGradeChartFilter] = useState<string | string[]>('all');
  const [activeTeachingTab, setActiveTeachingTab] = useState<string>('lecture');
  const [activeMainTab, setActiveMainTab] = useState<string>('overview');
  // Whether the tab row overflows horizontally (tabs wider than the screen).
  // When it does, the content's top-right corner is covered by a tab, so we
  // drop the top-right border radius; otherwise we round it.
  const tabsListRef = useRef<HTMLDivElement>(null);
  const [tabsScrollable, setTabsScrollable] = useState<boolean>(false);
  const [externalGradeFilter, setExternalGradeFilter] = useState<string>('');
  const [selectedServiceLearningFilter, setSelectedServiceLearningFilter] = useState<string[]>([]);

  // Grade distribution chart filter state
  const [selectedTermFilter, setSelectedTermFilter] = useState<string | string[]>('all');
  const [selectedTeachingLanguageFilter, setSelectedTeachingLanguageFilter] = useState<string | string[]>('all');
  
  // N/A grades toggle state
  const [showNAGrades, setShowNAGrades] = useState<boolean>(true);

  // Titles (en + localized) of course codes referenced in the description /
  // requirements, so we can render "CODE - Title (本地化標題)" next to each code.
  const [referencedCourseTitles, setReferencedCourseTitles] = useState<CourseTitleMap>({});

  // Past exam papers state (lazy-loaded when the tab is opened)
  type ExamPaper = {
    id: string;
    name: string;
    sizeOriginal: number;
    term: ExamPaperTermInfo | null;
  };
  const [examPapers, setExamPapers] = useState<ExamPaper[]>([]);
  const [examPapersLoading, setExamPapersLoading] = useState<boolean>(false);
  const [examPapersError, setExamPapersError] = useState<string | null>(null);
  const [examPapersLoaded, setExamPapersLoaded] = useState<boolean>(false);
  const [examPapersSort, setExamPapersSort] = useState<'newest' | 'oldest'>('newest');
  const [examPapersYearFilter, setExamPapersYearFilter] = useState<string[]>([]);
  const [examPapersInstructorFilter, setExamPapersInstructorFilter] = useState<string[]>([]);
  const [examPapersCurrentPage, setExamPapersCurrentPage] = useState<number>(1);
  // Multi-select for bulk download of past exam papers.
  const [selectedExamPaperIds, setSelectedExamPaperIds] = useState<Set<string>>(new Set());
  const [examPapersDownloading, setExamPapersDownloading] = useState<boolean>(false);
  const EXAM_PAPERS_PAGE_SIZE = 12;

  // Study materials state — reads from the `study_materials` bucket. Unlike
  // past exam papers, these have no term-code convention and no filters: the
  // displayed name is just the filename minus the course-code prefix and the
  // extension (e.g. "LCC1010_book.pdf" → "book"), while downloads keep the
  // original filename.
  type StudyMaterial = {
    id: string;
    name: string;        // original filename (used for download)
    displayName: string; // filename without course-code prefix or extension
    sizeOriginal: number;
  };
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [studyMaterialsLoading, setStudyMaterialsLoading] = useState<boolean>(false);
  const [studyMaterialsError, setStudyMaterialsError] = useState<string | null>(null);
  const [studyMaterialsLoaded, setStudyMaterialsLoaded] = useState<boolean>(false);
  const [studyMaterialsCurrentPage, setStudyMaterialsCurrentPage] = useState<number>(1);
  // Multi-select for bulk download of study materials.
  const [selectedStudyMaterialIds, setSelectedStudyMaterialIds] = useState<Set<string>>(new Set());
  const [studyMaterialsDownloading, setStudyMaterialsDownloading] = useState<boolean>(false);
  const STUDY_MATERIALS_PAGE_SIZE = 12;

  // Detect whether the tab row overflows its container so we can toggle the
  // content's top-right border radius. Re-checked on resize and whenever the
  // tab set / labels change (tab count depends on user + study materials/exam
  // papers; label widths depend on language).
  useEffect(() => {
    const el = tabsListRef.current;
    if (!el) return;
    const update = () => setTabsScrollable(el.scrollWidth > el.clientWidth + 1);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [language, user, studyMaterials.length, examPapers.length]);
  // Latest course syllabus PDF (bucket: course_syllabus). Filenames are prefixed
  // with the course code and suffixed with a term number, e.g. CDS2004-202601.pdf;
  // we surface the largest suffix (most recent version). Open to all visitors.
  const [syllabusFile, setSyllabusFile] = useState<{ id: string; name: string } | null>(null);
  // Whether we're still resolving the syllabus file (logged-in users only —
  // the bucket is readable by authenticated users, so guests never list it).
  const [syllabusLoading, setSyllabusLoading] = useState(false);
  // In-app PDF viewer (syllabus / exam papers open here instead of a new tab).
  // `persist` controls whether the viewer remembers last-read page + annotations:
  // only study materials persist; syllabus & exam papers always open clean.
  const [pdfViewer, setPdfViewer] = useState<{ src: string; title: string; persist?: boolean } | null>(null);
  // Instructor records resolved by name from filename suffixes (e.g. CCC8011's
  // per-section files). Seeded by a single batched query so we never query the
  // instructors collection per-paper.
  const [filenameInstructorsByName, setFilenameInstructorsByName] = useState<Map<string, Instructor>>(new Map());

  // Lecture-only instructor index built from teachingInfo (which is already
  // loaded by useCourseDetailOptimized — no extra teaching_records reads).
  // Map: term_code -> unique Instructor[] who taught lectures in that term.
  // Unique instructors from teaching records — fed to CourseReviewsList so it
  // doesn't have to re-query the instructors collection for names already loaded.
  const courseTeachingInstructors = React.useMemo<Instructor[]>(() => {
    const seen = new Map<string, Instructor>();
    (data?.teachingInfo || []).forEach(info => {
      if (info.instructor?.name && info.instructor.name !== 'UNKNOWN') {
        seen.set(info.instructor.name, info.instructor);
      }
    });
    return Array.from(seen.values());
  }, [data?.teachingInfo]);

  const lectureInstructorsByTermCode = React.useMemo(() => {
    const map = new Map<string, Instructor[]>();
    const rows = data?.teachingInfo;
    if (!rows) return map;
    rows.forEach(info => {
      if (info.sessionType !== 'Lecture') return;
      if (!info.instructor || info.instructor.name === 'UNKNOWN') return;
      const list = map.get(info.term.term_code) || [];
      if (!list.some(i => i.name === info.instructor.name)) {
        list.push(info.instructor);
        map.set(info.term.term_code, list);
      }
    });
    return map;
  }, [data?.teachingInfo]);

  // Quick lookup: instructor name → Instructor (drawn from teaching records).
  const teachingInstructorByName = React.useMemo(() => {
    const map = new Map<string, Instructor>();
    (data?.teachingInfo || []).forEach(info => {
      if (info.instructor?.name && info.instructor.name !== 'UNKNOWN') {
        map.set(info.instructor.name, info.instructor);
      }
    });
    return map;
  }, [data?.teachingInfo]);

  // Build a "shell" Instructor record for filename-encoded names that aren't
  // in the DB at all — keeps the badge renderable without extra fetches.
  const makeShellInstructor = React.useCallback((name: string): Instructor => ({
    $id: `shell:${name}`,
    name,
    email: '',
    department: '',
    $createdAt: '',
    $updatedAt: '',
  }), []);

  // Enrich each paper with its lecture instructor(s). Prefer the name encoded
  // in the filename (one-to-one mapping for multi-section courses like CCC8011);
  // fall back to all term lecturers from teaching records.
  type EnrichedExamPaper = ExamPaper & { lectureInstructors: Instructor[] };
  const enrichedExamPapers = React.useMemo<EnrichedExamPaper[]>(() => {
    return examPapers.map(p => {
      const fromFile = p.term?.instructorNameFromFile;
      if (fromFile) {
        const resolved =
          teachingInstructorByName.get(fromFile) ||
          filenameInstructorsByName.get(fromFile) ||
          makeShellInstructor(fromFile);
        return { ...p, lectureInstructors: [resolved] };
      }
      let lectureInstructors: Instructor[] = [];
      if (p.term) {
        for (const code of p.term.termCodes) {
          const hit = lectureInstructorsByTermCode.get(code);
          if (hit && hit.length > 0) {
            lectureInstructors = hit;
            break;
          }
        }
      }
      return { ...p, lectureInstructors };
    });
  }, [examPapers, lectureInstructorsByTermCode, teachingInstructorByName, filenameInstructorsByName, makeShellInstructor]);

  // Year filter options for past exam papers — derived from parsed term info.
  // The synthetic value '__unknown__' groups files whose names can't be parsed.
  const UNKNOWN_YEAR_KEY = '__unknown__';
  const examPapersYearOptions = React.useMemo<SelectOption[]>(() => {
    const counts = new Map<string, number>();
    let unknownCount = 0;
    examPapers.forEach(p => {
      if (p.term) {
        const key = String(p.term.startYear);
        counts.set(key, (counts.get(key) || 0) + 1);
      } else {
        unknownCount += 1;
      }
    });
    const years = Array.from(counts.entries())
      .sort((a, b) => parseInt(b[0], 10) - parseInt(a[0], 10))
      .map(([startYearStr, count]) => {
        const startYear = parseInt(startYearStr, 10);
        const endYearShort = String((startYear + 1) % 100).padStart(2, '0');
        return { value: startYearStr, label: `${startYear}-${endYearShort}`, count };
      });
    if (unknownCount > 0) {
      years.push({ value: UNKNOWN_YEAR_KEY, label: t('pages.courseDetail.examPapersYearUnknown'), count: unknownCount });
    }
    return years;
  }, [examPapers, t]);

  // Instructor filter options — only instructors who actually have at least
  // one paper attached, sorted by the existing "last name first" rule.
  const examPapersInstructorOptions = React.useMemo<SelectOption[]>(() => {
    const counts = new Map<string, { instructor: Instructor; count: number }>();
    enrichedExamPapers.forEach(p => {
      p.lectureInstructors.forEach(ins => {
        const entry = counts.get(ins.name);
        if (entry) entry.count += 1;
        else counts.set(ins.name, { instructor: ins, count: 1 });
      });
    });
    return Array.from(counts.values())
      .sort((a, b) => extractInstructorNameForSorting(a.instructor.name)
        .localeCompare(extractInstructorNameForSorting(b.instructor.name)))
      .map(({ instructor, count }) => {
        const formatted = getFormattedInstructorName(instructor, language);
        return {
          value: instructor.name,
          label: formatted.secondary ? `${formatted.primary} · ${formatted.secondary}` : formatted.primary,
          count,
        };
      });
  }, [enrichedExamPapers, language]);

  // Filtered + sorted list applied to the rendered grid.
  const filteredExamPapers = React.useMemo<EnrichedExamPaper[]>(() => {
    const yearSet = new Set(examPapersYearFilter);
    const instructorSet = new Set(examPapersInstructorFilter);
    const filtered = enrichedExamPapers.filter(p => {
      if (yearSet.size > 0) {
        const key = p.term ? String(p.term.startYear) : UNKNOWN_YEAR_KEY;
        if (!yearSet.has(key)) return false;
      }
      if (instructorSet.size > 0) {
        if (!p.lectureInstructors.some(i => instructorSet.has(i.name))) return false;
      }
      return true;
    });
    const dir = examPapersSort === 'newest' ? -1 : 1;
    return [...filtered].sort((a, b) => {
      // Files without a parseable term always sink to the bottom so the toolbar
      // sort still makes intuitive sense for the dated majority.
      if (!a.term && !b.term) return a.name.localeCompare(b.name);
      if (!a.term) return 1;
      if (!b.term) return -1;
      if (a.term.termSortKey !== b.term.termSortKey) {
        return dir * (a.term.termSortKey - b.term.termSortKey);
      }
      return a.name.localeCompare(b.name);
    });
  }, [enrichedExamPapers, examPapersSort, examPapersYearFilter, examPapersInstructorFilter]);

  // Study materials sorted alphabetically by display name (no filters).
  const sortedStudyMaterials = React.useMemo<StudyMaterial[]>(() => {
    return [...studyMaterials].sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [studyMaterials]);

  // 解構數據
  const { course, courseStats, teachingInfo, reviews: allReviews, allReviewsForChart, isOfferedInCurrentTerm, detailedStats } = data;

  // 收集課程描述與修讀要求中提及的課程代碼，批次抓取其名稱（含繁/簡），
  // 以便在代碼後附上課程名稱並建立連結。
  useEffect(() => {
    if (!course) {
      setReferencedCourseTitles({});
      return;
    }
    const sources = [
      course.course_description, course.course_description_tc, course.course_description_sc,
      course.course_prerequisites, course.course_prerequisites_tc, course.course_prerequisites_sc,
      course.course_corequisites, course.course_corequisites_tc, course.course_corequisites_sc,
      course.course_exclusions, course.course_exclusions_tc, course.course_exclusions_sc,
      course.course_exemption_requirements, course.course_exemption_requirements_tc, course.course_exemption_requirements_sc,
      course.course_recommended, course.course_recommended_tc, course.course_recommended_sc,
      course.course_restriction, course.course_restriction_tc, course.course_restriction_sc,
    ].filter(Boolean) as string[];

    const codes = new Set<string>();
    const re = new RegExp(COURSE_CODE_REGEX.source, 'g');
    for (const s of sources) {
      let m: RegExpExecArray | null;
      re.lastIndex = 0;
      while ((m = re.exec(s)) !== null) codes.add(m[0]);
    }
    // 當前課程的名稱直接取自已載入的 course，毋須再向後端查詢。
    const selfInfo: CourseTitleInfo = {
      title: course.course_title,
      title_tc: course.course_title_tc,
      title_sc: course.course_title_sc,
    };
    codes.delete(course.course_code);

    const codeList = [...codes];
    if (codeList.length === 0) {
      setReferencedCourseTitles({ [course.course_code]: selfInfo });
      return;
    }

    let cancelled = false;
    CourseService.getCoursesByCodes(codeList)
      .then(list => {
        if (cancelled) return;
        const map: CourseTitleMap = { [course.course_code]: selfInfo };
        for (const c of list) {
          map[c.course_code] = {
            title: c.course_title,
            title_tc: c.course_title_tc,
            title_sc: c.course_title_sc,
          };
        }
        setReferencedCourseTitles(map);
      })
      .catch(() => {
        if (!cancelled) setReferencedCourseTitles({ [course.course_code]: selfInfo });
      });
    return () => { cancelled = true; };
  }, [course?.$id]);

  // ---- Past exam papers: bulk-download selection -------------------------
  const selectedExamPaperCount = selectedExamPaperIds.size;
  const allExamPapersSelected =
    filteredExamPapers.length > 0 && selectedExamPaperCount === filteredExamPapers.length;
  const someExamPapersSelected = selectedExamPaperCount > 0 && !allExamPapersSelected;
  // Total bytes of the currently-selected papers, so users can gauge the download size.
  const selectedExamPapersSize = filteredExamPapers.reduce(
    (sum, p) => (selectedExamPaperIds.has(p.id) ? sum + (p.sizeOriginal || 0) : sum),
    0,
  );

  const toggleExamPaperSelection = (id: string) => {
    setSelectedExamPaperIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllExamPapers = () => {
    setSelectedExamPaperIds(prev =>
      prev.size === filteredExamPapers.length ? new Set() : new Set(filteredExamPapers.map(p => p.id))
    );
  };

  const triggerBrowserDownload = (href: string, filename: string) => {
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDownloadSelectedExamPapers = async () => {
    if (examPapersDownloading) return;
    const selected = filteredExamPapers.filter(p => selectedExamPaperIds.has(p.id));
    if (selected.length === 0) return;

    setExamPapersDownloading(true);
    try {
      // Single file: stream straight to the browser, no zip needed.
      if (selected.length === 1) {
        const url = storage.getFileDownload({ bucketId: 'past_exam_papers', fileId: selected[0].id });
        triggerBrowserDownload(url.toString(), selected[0].name);
        return;
      }

      // Multiple files: fetch each blob and bundle into a single zip.
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const usedNames = new Set<string>();
      await Promise.all(selected.map(async paper => {
        const url = storage.getFileDownload({ bucketId: 'past_exam_papers', fileId: paper.id }).toString();
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) throw new Error(`Failed to fetch ${paper.name} (${res.status})`);
        const blob = await res.blob();
        // De-dupe filenames so a collision doesn't drop a file from the archive.
        let name = paper.name;
        let counter = 1;
        while (usedNames.has(name)) {
          const dot = paper.name.lastIndexOf('.');
          name = dot > 0
            ? `${paper.name.slice(0, dot)} (${counter})${paper.name.slice(dot)}`
            : `${paper.name} (${counter})`;
          counter++;
        }
        usedNames.add(name);
        zip.file(name, blob);
      }));
      const content = await zip.generateAsync({ type: 'blob' });
      const objectUrl = URL.createObjectURL(content);
      triggerBrowserDownload(objectUrl, `${course.course_code}_past_exam_papers.zip`);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('Failed to download selected exam papers', err);
      toast({
        title: t('pages.courseDetail.examPapersDownloadFailed'),
        variant: 'destructive',
      });
    } finally {
      setExamPapersDownloading(false);
    }
  };

  // ---- Study materials: bulk-download selection --------------------------
  const selectedStudyMaterialCount = selectedStudyMaterialIds.size;
  const allStudyMaterialsSelected =
    sortedStudyMaterials.length > 0 && selectedStudyMaterialCount === sortedStudyMaterials.length;
  const someStudyMaterialsSelected = selectedStudyMaterialCount > 0 && !allStudyMaterialsSelected;
  const selectedStudyMaterialsSize = sortedStudyMaterials.reduce(
    (sum, p) => (selectedStudyMaterialIds.has(p.id) ? sum + (p.sizeOriginal || 0) : sum),
    0,
  );

  const toggleStudyMaterialSelection = (id: string) => {
    setSelectedStudyMaterialIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllStudyMaterials = () => {
    setSelectedStudyMaterialIds(prev =>
      prev.size === sortedStudyMaterials.length ? new Set() : new Set(sortedStudyMaterials.map(p => p.id))
    );
  };

  const handleDownloadSelectedStudyMaterials = async () => {
    if (studyMaterialsDownloading) return;
    const selected = sortedStudyMaterials.filter(p => selectedStudyMaterialIds.has(p.id));
    if (selected.length === 0) return;

    setStudyMaterialsDownloading(true);
    try {
      // Single file: stream straight to the browser, no zip needed.
      if (selected.length === 1) {
        const url = storage.getFileDownload({ bucketId: 'study_materials', fileId: selected[0].id });
        triggerBrowserDownload(url.toString(), selected[0].name);
        return;
      }

      // Multiple files: fetch each blob and bundle into a single zip.
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const usedNames = new Set<string>();
      await Promise.all(selected.map(async paper => {
        const url = storage.getFileDownload({ bucketId: 'study_materials', fileId: paper.id }).toString();
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) throw new Error(`Failed to fetch ${paper.name} (${res.status})`);
        const blob = await res.blob();
        let name = paper.name;
        let counter = 1;
        while (usedNames.has(name)) {
          const dot = paper.name.lastIndexOf('.');
          name = dot > 0
            ? `${paper.name.slice(0, dot)} (${counter})${paper.name.slice(dot)}`
            : `${paper.name} (${counter})`;
          counter++;
        }
        usedNames.add(name);
        zip.file(name, blob);
      }));
      const content = await zip.generateAsync({ type: 'blob' });
      const objectUrl = URL.createObjectURL(content);
      triggerBrowserDownload(objectUrl, `${course.course_code}_study_materials.zip`);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('Failed to download selected study materials', err);
      toast({
        title: t('pages.courseDetail.studyMaterialsDownloadFailed'),
        variant: 'destructive',
      });
    } finally {
      setStudyMaterialsDownloading(false);
    }
  };

  // Generate filter options for grade distribution chart (instructors)
  const gradeChartFilterOptions = React.useMemo(() => {
    if (!allReviewsForChart || allReviewsForChart.length === 0) return [];

    // Count occurrences of each instructor-session combination
    const instructorSessionCounts = new Map<string, number>();
    const instructorSessionLabels = new Map<string, string>();

    allReviewsForChart.forEach(reviewInfo => {
      try {
        const instructorDetails = JSON.parse(reviewInfo.review.instructor_details);
        
        instructorDetails.forEach((detail: any) => {
          const key = `${detail.instructor_name}|${detail.session_type}`;
          const count = instructorSessionCounts.get(key) || 0;
          instructorSessionCounts.set(key, count + 1);
          
          // Store the formatted label
          const getSessionTypeTranslated = (sessionType: string) => {
            switch (sessionType) {
              case 'Lecture': return t('sessionType.lecture');
              case 'Tutorial': return t('sessionType.tutorial');
              case 'Lab': return t('sessionType.lab');
              case 'Project': return t('sessionType.project');
              case 'Seminar': return t('sessionType.seminar');
              default: return sessionType;
            }
          };
          
          const sessionTypeTranslated = getSessionTypeTranslated(detail.session_type);
          const instructorDisplayName = detail.instructor_name === 'UNKNOWN' 
            ? (language === 'en' ? 'Unknown instructor' : '未知教師')
            : detail.instructor_name;
          
          // Only show translated session type without English for Chinese languages
          const sessionTypeDisplay = (language === 'zh-TW' || language === 'zh-CN') 
            ? sessionTypeTranslated.replace(/ \([^)]+\)$/, '') // Remove English part in parentheses
            : sessionTypeTranslated;
          instructorSessionLabels.set(key, `${instructorDisplayName} (${sessionTypeDisplay})`);
        });
      } catch (error) {
        console.warn('Failed to parse instructor details:', error);
      }
    });

    return Array.from(instructorSessionCounts.entries())
      .map(([key, count]) => ({
        value: key,
        label: instructorSessionLabels.get(key) || key,
        count,
        // Add sorting helpers
        instructorName: key.split('|')[0],
        sessionType: key.split('|')[1]
      }))
      .sort((a, b) => {
        // First sort by session type (Lecture, Tutorial, Project, Seminar)
        if (a.sessionType !== b.sessionType) {
          const sessionTypeOrder = ['Lecture', 'Tutorial', 'Project', 'Seminar'];
          const aIndex = sessionTypeOrder.indexOf(a.sessionType);
          const bIndex = sessionTypeOrder.indexOf(b.sessionType);
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
          }
          return a.sessionType.localeCompare(b.sessionType);
        }
        
        // Within same session type, sort by instructor name alphabetically
        return a.instructorName.localeCompare(b.instructorName);
      })
      .map(({ value, label, count }) => ({ value, label, count })); // Remove extra sorting fields
  }, [allReviewsForChart, t]);

  // Filter reviews for grade distribution chart based on selected instructor(s)
  const filteredReviewsForChart = React.useMemo(() => {
    if (!allReviewsForChart || allReviewsForChart.length === 0) return [];
    
    // Handle both single and multiple selections
    const selectedValues = Array.isArray(selectedGradeChartFilter) ? selectedGradeChartFilter : [selectedGradeChartFilter];
    
    if (selectedValues.length === 0 || selectedValues.includes('all')) {
      return allReviewsForChart;
    }
    
    // Parse all selected instructor-session combinations
    const targetInstructorSessions = selectedValues.map(value => {
      const [targetInstructor, targetSessionType] = value.split('|');
      return { targetInstructor, targetSessionType };
    });
    
    return allReviewsForChart.filter(reviewInfo => {
      try {
        const instructorDetails = JSON.parse(reviewInfo.review.instructor_details);
        
        // Check if any of the instructor details match any of the selected combinations
        return instructorDetails.some((detail: any) => 
          targetInstructorSessions.some(({ targetInstructor, targetSessionType }) =>
            detail.instructor_name === targetInstructor && 
            detail.session_type === targetSessionType
          )
        );
      } catch (error) {
        console.warn('Failed to parse instructor details:', error);
        return false;
      }
    });
  }, [allReviewsForChart, selectedGradeChartFilter]);

  // 獲取所有可用的學期及其計數
  const availableTermsWithCounts = React.useMemo(() => {
    // Count teaching records per term
    const termCountMap = new Map<string, { term: any; count: number }>();
    
    teachingInfo.forEach(info => {
      const termCode = info.term.term_code;
      if (termCountMap.has(termCode)) {
        termCountMap.get(termCode)!.count++;
      } else {
        termCountMap.set(termCode, { term: info.term, count: 1 });
      }
    });
    
    // Convert to array and sort by term code (descending)
    return Array.from(termCountMap.values())
      .sort((a, b) => b.term.term_code.localeCompare(a.term.term_code));
  }, [teachingInfo]);

  // 獲取所有可用的教學語言及其計數
  const availableTeachingLanguagesWithCounts = React.useMemo(() => {
    // Count teaching records per teaching language
    const languageCountMap = new Map<string, { language: string; count: number }>();
    
    teachingInfo.forEach(info => {
      const languageCode = info.teachingLanguage;
      if (languageCountMap.has(languageCode)) {
        languageCountMap.get(languageCode)!.count++;
      } else {
        languageCountMap.set(languageCode, { language: languageCode, count: 1 });
      }
    });
    
    // Define the desired order: E, C, P, 1, 2, 3, 4, 5
    const teachingLanguageOrder = ['E', 'C', 'P', '1', '2', '3', '4', '5'];
    
    // Convert to array and sort by custom order
    return Array.from(languageCountMap.values())
      .sort((a, b) => {
        const aIndex = teachingLanguageOrder.indexOf(a.language);
        const bIndex = teachingLanguageOrder.indexOf(b.language);
        
        // If both languages are in the order list, sort by their position
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        
        // If only one is in the order list, it comes first
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        // If neither is in the order list, sort alphabetically
        return a.language.localeCompare(b.language);
      });
  }, [teachingInfo]);

  // 根據選定的學期和教學語言篩選教學信息
  const filteredTeachingInfo = React.useMemo(() => {
    // Handle both single and multiple selections for terms
    const selectedTermValues = Array.isArray(selectedTermFilter) ? selectedTermFilter : [selectedTermFilter];
    // Handle both single and multiple selections for teaching languages
    const selectedLanguageValues = Array.isArray(selectedTeachingLanguageFilter) ? selectedTeachingLanguageFilter : [selectedTeachingLanguageFilter];
    
    let filtered = teachingInfo;
    
    // Filter by terms
    if (selectedTermValues.length > 0 && !selectedTermValues.includes('all')) {
      filtered = filtered.filter(info => selectedTermValues.includes(info.term.term_code));
    }
    
    // Filter by teaching languages
    if (selectedLanguageValues.length > 0 && !selectedLanguageValues.includes('all')) {
      filtered = filtered.filter(info => selectedLanguageValues.includes(info.teachingLanguage));
    }
    
    return filtered;
  }, [teachingInfo, selectedTermFilter, selectedTeachingLanguageFilter]);

  // 教學語言徽章點擊處理器
  const handleTeachingLanguageBadgeClick = (languageCode: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (isMobile) {
      // Mobile/tablet: require 2 taps to apply filter
      const currentTapCount = teachingLanguageTapCounts[languageCode] || 0;
      const newTapCount = currentTapCount + 1;
      
      // Clear existing timeout for this key
      const refKey = `lang-${languageCode}`;
      if (timeoutRefs.current[refKey]) {
        clearTimeout(timeoutRefs.current[refKey]);
      }
      
      setTeachingLanguageTapCounts(prev => ({
        ...prev,
        [languageCode]: newTapCount
      }));
      
      if (newTapCount === 1) {
        // First tap: show tooltip
        setTeachingLanguageTooltipStates(prev => ({
          ...prev,
          [languageCode]: true
        }));
        
        // Reset after 3 seconds
        timeoutRefs.current[refKey] = setTimeout(() => {
          setTeachingLanguageTapCounts(prev => ({
            ...prev,
            [languageCode]: 0
          }));
          setTeachingLanguageTooltipStates(prev => ({
            ...prev,
            [languageCode]: false
          }));
        }, 3000);
      } else if (newTapCount === 2) {
        // Second tap: apply filter and close tooltip
        applyTeachingLanguageFilter(languageCode);
        resetTeachingLanguageTooltipState(languageCode);
      }
    } else {
      // Desktop: 1 tap to apply filter
      applyTeachingLanguageFilter(languageCode);
    }
  };
  
  // Apply teaching language filter
  const applyTeachingLanguageFilter = (languageCode: string) => {
    const currentValues = Array.isArray(selectedTeachingLanguageFilter) ? selectedTeachingLanguageFilter : (selectedTeachingLanguageFilter === 'all' ? [] : [selectedTeachingLanguageFilter]);
    const isSelected = currentValues.includes(languageCode);
    
    if (isSelected) {
      // Remove from selection
      const newValues = currentValues.filter(v => v !== languageCode);
      setSelectedTeachingLanguageFilter(newValues.length === 0 ? 'all' : newValues);
    } else {
      // Add to selection
      setSelectedTeachingLanguageFilter([...currentValues, languageCode]);
    }
  };
  
  // Reset teaching language tooltip state
  const resetTeachingLanguageTooltipState = (uniqueKey: string) => {
    // Clear timeout
    const refKey = `lang-${uniqueKey}`;
    if (timeoutRefs.current[refKey]) {
      clearTimeout(timeoutRefs.current[refKey]);
      timeoutRefs.current[refKey] = null;
    }
    
    // Extract language code from unique key for tap counts
    const languageCode = uniqueKey.split('-').slice(-1)[0];
    setTeachingLanguageTapCounts(prev => ({
      ...prev,
      [languageCode]: 0
    }));
    setTeachingLanguageTooltipStates(prev => ({
      ...prev,
      [uniqueKey]: false
    }));
  };

  const handleTermBadgeClick = (termCode: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (isMobile) {
      // Mobile/tablet: require 2 taps to apply filter
      const currentTapCount = termTapCounts[termCode] || 0;
      const newTapCount = currentTapCount + 1;
      
      // Clear existing timeout for this key
      const refKey = `term-${termCode}`;
      if (timeoutRefs.current[refKey]) {
        clearTimeout(timeoutRefs.current[refKey]);
      }
      
      setTermTapCounts(prev => ({
        ...prev,
        [termCode]: newTapCount
      }));
      
      if (newTapCount === 1) {
        // First tap: show tooltip
        setTermTooltipStates(prev => ({
          ...prev,
          [termCode]: true
        }));
        
        // Reset after 3 seconds
        timeoutRefs.current[refKey] = setTimeout(() => {
          setTermTapCounts(prev => ({
            ...prev,
            [termCode]: 0
          }));
          setTermTooltipStates(prev => ({
            ...prev,
            [termCode]: false
          }));
        }, 3000);
      } else if (newTapCount === 2) {
        // Second tap: apply filter and close tooltip
        applyTermFilter(termCode);
        resetTermTooltipState(termCode);
      }
    } else {
      // Desktop: 1 tap to apply filter
      applyTermFilter(termCode);
    }
  };
  
  // Apply term filter
  const applyTermFilter = (termCode: string) => {
    const currentValues = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter === 'all' ? [] : [selectedTermFilter]);
    const isSelected = currentValues.includes(termCode);
    
    if (isSelected) {
      // Remove from selection
      const newValues = currentValues.filter(v => v !== termCode);
      setSelectedTermFilter(newValues.length === 0 ? 'all' : newValues);
    } else {
      // Add to selection
      setSelectedTermFilter([...currentValues, termCode]);
    }
  };
  
  // Reset term tooltip state
  const resetTermTooltipState = (termCode: string) => {
    // Clear timeout
    const refKey = `term-${termCode}`;
    if (timeoutRefs.current[refKey]) {
      clearTimeout(timeoutRefs.current[refKey]);
      timeoutRefs.current[refKey] = null;
    }
    
    setTermTapCounts(prev => ({
      ...prev,
      [termCode]: 0
    }));
    setTermTooltipStates(prev => ({
      ...prev,
      [termCode]: false
    }));
  };

  // Service learning filter handler
  const handleServiceLearningToggle = (serviceType: string) => {
    setSelectedServiceLearningFilter(prev => {
      const isSelected = prev.includes(serviceType);
      if (isSelected) {
        // Remove from selection
        return prev.filter(type => type !== serviceType);
      } else {
        // Add to selection (replace existing selection for simplicity)
        return [serviceType];
      }
    });
  };

  // N/A grades toggle handler
  const handleNAToggleChange = (showNA: boolean) => {
    setShowNAGrades(showNA);
  };

  const handleInstructorClick = (instructorName: string, event?: React.MouseEvent) => {
    // This function is now simplified since we're using <a> tags
    // The browser will handle navigation naturally
  };

  // Handle offer badge click to navigate to courses with current term filter
  const handleOfferedBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Navigate to courses catalog with current term filter applied
    const searchParams = new URLSearchParams();
    searchParams.set('offeredTerm', currentTermCode);
    
    navigate(`/courses?${searchParams.toString()}`);
  };

  // Handle scroll to specific review when review_id is in URL
  useEffect(() => {
    const reviewId = searchParams.get('review_id');
    if (reviewId && !reviewsLoading) {
      let hasScrolled = false;
      let attemptCount = 0;
      const maxAttempts = 3;
      
      const scrollToReview = () => {
        if (hasScrolled || attemptCount >= maxAttempts) return false;
        
        attemptCount++;
        const reviewElement = document.querySelector(`[data-review-id="${reviewId}"]`);
        if (reviewElement) {
          reviewElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          hasScrolled = true;
          return true;
        }
        return false;
      };
      
      // Try multiple times with increasing delays, but stop if successful
      const timeout1 = setTimeout(() => {
        if (!scrollToReview() && attemptCount < maxAttempts) {
          const timeout2 = setTimeout(() => {
            if (!scrollToReview() && attemptCount < maxAttempts) {
              setTimeout(() => scrollToReview(), 700);
            }
          }, 500);
        }
      }, 300);
      
      // Cleanup function to prevent memory leaks
      return () => {
        hasScrolled = true; // Prevent any pending scrolls
      };
    }
  }, [searchParams, reviewsLoading]);

  // Auto-switch to available tab when current tab has no records
  useEffect(() => {
    if (teachingInfo && teachingInfo.length > 0) {
      const lectureCount = teachingInfo.filter(info => info.sessionType === 'Lecture').length;
      const tutorialCount = teachingInfo.filter(info => info.sessionType === 'Tutorial').length;
      const projectCount = teachingInfo.filter(info => info.sessionType === 'Project').length;
      const seminarCount = teachingInfo.filter(info => info.sessionType === 'Seminar').length;
      
      const availableTabs = [];
      if (lectureCount > 0) availableTabs.push('lecture');
      if (tutorialCount > 0) availableTabs.push('tutorial');
      if (projectCount > 0) availableTabs.push('project');
      if (seminarCount > 0) availableTabs.push('seminar');
      
      // If current active tab has no records, switch to first available tab
      const currentTabCounts = {
        'lecture': lectureCount,
        'tutorial': tutorialCount,
        'project': projectCount,
        'seminar': seminarCount
      };
      
      if (currentTabCounts[activeTeachingTab as keyof typeof currentTabCounts] === 0 && availableTabs.length > 0) {
        setActiveTeachingTab(availableTabs[0]);
      }
    }
  }, [teachingInfo, activeTeachingTab]);

  // Resolve the latest course syllabus PDF for the header button.
  // Bucket: course_syllabus; filenames look like CDS2004-202601.pdf — among all
  // files for this course we pick the one with the largest numeric suffix.
  // The bucket read permission is restricted to authenticated users, so we only
  // attempt to list it when logged in. Guests always see the button (it opens a
  // login prompt) and never trigger a guaranteed 401.
  useEffect(() => {
    const courseCode = course?.course_code;
    setSyllabusFile(null);
    if (!courseCode || !user) {
      setSyllabusLoading(false);
      return;
    }

    let cancelled = false;
    setSyllabusLoading(true);

    (async () => {
      try {
        const prefix = courseCode.toLowerCase();
        const res = await storage.listFiles({
          bucketId: 'course_syllabus',
          search: courseCode,
          queries: [Query.limit(100)],
        });
        if (cancelled) return;

        let best: { id: string; name: string; suffix: number } | null = null;
        for (const f of res.files || []) {
          const name = f.name.toLowerCase();
          if (!name.startsWith(prefix)) continue;
          // Extract the trailing numeric suffix (e.g. 202601 from cds2004-202601.pdf)
          const match = name.replace(/\.[^.]+$/, '').match(/(\d+)\s*$/);
          const suffix = match ? parseInt(match[1], 10) : -1;
          if (!best || suffix > best.suffix) {
            best = { id: f.$id, name: f.name, suffix };
          }
        }
        if (!cancelled) setSyllabusFile(best ? { id: best.id, name: best.name } : null);
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load course syllabus', err);
          setSyllabusFile(null);
        }
      } finally {
        if (!cancelled) setSyllabusLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [course?.course_code, user]);

  // Open the syllabus PDF — but only for logged-in (verified) users. Guests get
  // a prompt explaining it's restricted material that requires an account.
  const handleViewSyllabus = () => {
    if (!user) {
      promptLogin();
      return;
    }
    if (!syllabusFile) return;
    setPdfViewer({
      src: storage.getFileView({ bucketId: 'course_syllabus', fileId: syllabusFile.id }).toString(),
      title: syllabusFile.name,
      persist: false,
    });
  };

  // The syllabus button is always rendered. For guests it's enabled (clicking
  // opens the login prompt). For logged-in users it's disabled while we resolve
  // the file or when the course has no syllabus on record.
  const syllabusButtonDisabled = !!user && (syllabusLoading || !syllabusFile);

  // A review can only be written for a course that has actually been taught at
  // least once. While teaching records are still loading we keep the button
  // enabled to avoid a disabled→enabled flash; once loaded with no records, the
  // write-review action is blocked entirely.
  const writeReviewDisabled = !teachingInfoLoading && (!teachingInfo || teachingInfo.length === 0);

  // Writing a review requires an account — guests get the same login prompt.
  const handleWriteReview = () => {
    if (writeReviewDisabled) {
      return;
    }
    if (!user) {
      promptLogin();
      return;
    }
    navigate(`/write-review/${course.course_code}`);
  };

  // Load past exam papers once the course is known (for logged-in users).
  // We fetch eagerly rather than only when the tab opens so we know whether any
  // papers exist — the exams tab is hidden entirely when there are none.
  // Bucket: past_exam_papers; filenames are prefixed with the course code (e.g. CDS2004_24252.pdf).
  // `storage.listFiles` caps each response at 100 rows, so paginate until empty
  // to capture every paper (CCC8011 has 130+).
  useEffect(() => {
    if (!user || !course?.course_code || examPapersLoaded) return;

    const courseCode = course.course_code;
    let cancelled = false;
    setExamPapersLoading(true);
    setExamPapersError(null);

    const PAGE_SIZE = 100;
    const SAFETY_CAP = 5000;

    (async () => {
      try {
        const prefix = `${courseCode.toLowerCase()}_`;
        const collected: ExamPaper[] = [];
        let offset = 0;
        while (offset < SAFETY_CAP) {
          const res = await storage.listFiles({
            bucketId: 'past_exam_papers',
            search: courseCode,
            queries: [Query.limit(PAGE_SIZE), Query.offset(offset)],
          });
          if (cancelled) return;
          const files = res.files || [];
          for (const f of files) {
            if (!f.name.toLowerCase().startsWith(prefix)) continue;
            collected.push({
              id: f.$id,
              name: f.name,
              sizeOriginal: f.sizeOriginal,
              term: parseExamPaperTermCode(f.name, courseCode.length),
            });
          }
          if (files.length < PAGE_SIZE) break;
          offset += PAGE_SIZE;
        }
        if (cancelled) return;
        setExamPapers(collected);
        setExamPapersLoaded(true);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load past exam papers', err);
        setExamPapersError(t('pages.courseDetail.examPapersLoadFailed'));
      } finally {
        if (!cancelled) setExamPapersLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, course?.course_code, examPapersLoaded, t]);

  // Resolve filename-encoded instructor names that aren't already in
  // teachingInfo, with a single batched query to the instructors collection.
  useEffect(() => {
    if (examPapers.length === 0) return;
    const needed = new Set<string>();
    examPapers.forEach(p => {
      const name = p.term?.instructorNameFromFile;
      if (!name) return;
      if (teachingInstructorByName.has(name)) return;
      if (filenameInstructorsByName.has(name)) return;
      needed.add(name);
    });
    if (needed.size === 0) return;
    let cancelled = false;
    CourseService.getInstructorsByNames(Array.from(needed))
      .then(rows => {
        if (cancelled || rows.length === 0) return;
        setFilenameInstructorsByName(prev => {
          const next = new Map(prev);
          rows.forEach(r => next.set(r.name, r));
          return next;
        });
      })
      .catch(err => console.error('Failed to resolve filename instructors', err));
    return () => { cancelled = true; };
  }, [examPapers, teachingInstructorByName, filenameInstructorsByName]);

  // Reset to the first page (and clear the bulk-download selection) whenever the
  // filter / sort changes the list, so a hidden paper can't stay selected.
  useEffect(() => {
    setExamPapersCurrentPage(1);
    setSelectedExamPaperIds(new Set());
  }, [examPapersSort, examPapersYearFilter, examPapersInstructorFilter, examPapers]);

  // Load study materials once the course is known (for logged-in users).
  // Bucket: study_materials; same filename convention as past exam papers
  // (course-code prefix). We fetch eagerly so the tab can hide when empty.
  useEffect(() => {
    if (!user || !course?.course_code || studyMaterialsLoaded) return;

    const courseCode = course.course_code;
    let cancelled = false;
    setStudyMaterialsLoading(true);
    setStudyMaterialsError(null);

    const PAGE_SIZE = 100;
    const SAFETY_CAP = 5000;

    const prefix = `${courseCode.toLowerCase()}_`;
    // Strip the "<courseCode>_" prefix and file extension for display, e.g.
    // "LCC1010_book.pdf" → "book". Falls back to the raw name if it doesn't fit.
    const toDisplayName = (fileName: string): string => {
      const dot = fileName.lastIndexOf('.');
      let stem = dot > 0 ? fileName.slice(0, dot) : fileName;
      if (stem.toLowerCase().startsWith(prefix)) {
        stem = stem.slice(prefix.length);
      }
      return stem || fileName;
    };

    (async () => {
      try {
        const collected: StudyMaterial[] = [];
        let offset = 0;
        while (offset < SAFETY_CAP) {
          const res = await storage.listFiles({
            bucketId: 'study_materials',
            search: courseCode,
            queries: [Query.limit(PAGE_SIZE), Query.offset(offset)],
          });
          if (cancelled) return;
          const files = res.files || [];
          for (const f of files) {
            if (!f.name.toLowerCase().startsWith(prefix)) continue;
            collected.push({
              id: f.$id,
              name: f.name,
              displayName: toDisplayName(f.name),
              sizeOriginal: f.sizeOriginal,
            });
          }
          if (files.length < PAGE_SIZE) break;
          offset += PAGE_SIZE;
        }
        if (cancelled) return;
        setStudyMaterials(collected);
        setStudyMaterialsLoaded(true);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load study materials', err);
        setStudyMaterialsError(t('pages.courseDetail.studyMaterialsLoadFailed'));
      } finally {
        if (!cancelled) setStudyMaterialsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, course?.course_code, studyMaterialsLoaded, t]);

  useEffect(() => {
    setStudyMaterialsCurrentPage(1);
    setSelectedStudyMaterialIds(new Set());
  }, [studyMaterials]);

  if (loading) {
    return (
      <div className="mx-auto px-4 lg:px-8 xl:px-16 py-6">
        <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">{t('pages.courseDetail.loadingCourseData')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="mx-auto px-4 lg:px-8 xl:px-16 py-6">
        <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-16 w-16 text-destructive" />
              </div>
              <CardTitle className="text-xl">{t('pages.courseDetail.loadFailed')}</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                {error || t('pages.courseDetail.courseNotFound')}
              </p>
              <Button onClick={() => navigate('/courses')} className="h-auto py-3 text-sm font-medium w-full sm:w-auto sm:text-base">
                <span className="text-center leading-tight">{t('pages.courseDetail.backToCoursesCatalog')}</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 lg:px-8 xl:px-16 py-6 pb-20 overflow-hidden min-w-0">
      {/* Course Header - Always visible above tabs */}
      <div className="mb-6">
        <Card className="transparent-info-card">
          <CardContent className="p-6">
            {/* Course info section with buttons */}
            <div className="mb-4">
              {/* Desktop/Tablet: Course code and buttons in same row */}
              <div className="hidden md:flex md:flex-wrap md:items-center md:justify-between md:gap-x-4 md:gap-y-2 mb-2">
                <CardTitle className="text-2xl font-mono flex items-center gap-2 min-w-0">
                  <BookText className="h-7 w-7 text-primary" />
                  {course.course_code}
                  {course.credits && (
                    <span className="text-sm bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded font-normal whitespace-nowrap">
                      {course.credits === '0' ? t('course.nonCreditBearing') : `${course.credits} ${t('course.credits')}`}
                    </span>
                  )}
                </CardTitle>
                {/* Action buttons - desktop/tablet only inline */}
                <div className="shrink-0 flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="h-10 px-3"
                    onClick={handleViewSyllabus}
                    disabled={syllabusButtonDisabled}
                  >
                    {user && syllabusLoading ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 mr-1.5" />
                    )}
                    {t('pages.courseDetail.viewSyllabus')}
                  </Button>
                  <FavoriteButton
                    type="course"
                    itemId={course.course_code}
                    size="lg"
                    showText={true}
                    variant="outline"
                  />
                  <Button
                    className={cn(
                      'h-10 text-white',
                      writeReviewDisabled
                        ? 'bg-red-300 dark:bg-red-900/50 opacity-60 cursor-not-allowed hover:opacity-60'
                        : 'gradient-primary hover:opacity-90'
                    )}
                    onClick={handleWriteReview}
                    disabled={writeReviewDisabled}
                    title={writeReviewDisabled ? t('pages.courseDetail.noTeachingRecords') : undefined}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {t('review.writeReview')}
                  </Button>
                  <button
                    onClick={() => navigate('/courses')}
                    className="h-10 px-3 text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-sm">{t('common.back')}</span>
                  </button>
                </div>
              </div>

              {/* Desktop/Tablet: Course titles */}
              <div className="hidden md:block mb-3">
                {/* 英文課程名稱 - 作為副標題 */}
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-1 font-medium min-h-[1.5rem]">
                  {course.course_title}
                </p>
                {/* 中文課程名稱 - 作為次副標題（只在中文模式下顯示） */}
                {(language === 'zh-TW' || language === 'zh-CN') && (() => {
                  const chineseName = language === 'zh-TW' ? course.course_title_tc : course.course_title_sc;
                  return chineseName && (
                    <p className="text-base text-gray-500 dark:text-gray-500 mt-1 min-h-[1.25rem]">
                      {chineseName}
                    </p>
                  );
                })()}
              </div>

              {/* Mobile: Course code with back button on same row */}
              <div className="md:hidden mb-3">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <CardTitle className="text-2xl font-mono flex items-center gap-2 min-w-0">
                    <BookText className="h-7 w-7 text-primary" />
                    {course.course_code}
                    {course.credits && (
                      <span className="text-sm bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded font-normal whitespace-nowrap">
                        {course.credits === '0' ? t('course.nonCreditBearing') : `${course.credits} ${t('course.credits')}`}
                      </span>
                    )}
                  </CardTitle>
                  <button 
                    onClick={() => navigate('/courses')}
                    className="h-10 px-3 text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 shrink-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-sm">{t('common.back')}</span>
                  </button>
                </div>

                {/* Course titles */}
                <div>
                  {/* 英文課程名稱 - 作為副標題 */}
                  <p className="text-lg text-gray-600 dark:text-gray-400 mt-1 font-medium min-h-[1.5rem]">
                    {course.course_title}
                  </p>
                  {/* 中文課程名稱 - 作為次副標題（只在中文模式下顯示） */}
                  {(language === 'zh-TW' || language === 'zh-CN') && (() => {
                    const chineseName = language === 'zh-TW' ? course.course_title_tc : course.course_title_sc;
                    return chineseName && (
                      <p className="text-base text-gray-500 dark:text-gray-500 mt-1 min-h-[1.25rem]">
                        {chineseName}
                      </p>
                    );
                  })()}
                </div>
              </div>
            </div>
            
            {/* Action buttons - mobile only, separate row (excluding back button) */}
            <div className="md:hidden flex flex-col gap-2 mb-4">
              <Button
                variant="outline"
                size="lg"
                className="h-10 w-full"
                onClick={handleViewSyllabus}
                disabled={syllabusButtonDisabled}
              >
                {user && syllabusLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                {t('pages.courseDetail.viewSyllabus')}
                {!syllabusButtonDisabled && (
                  <ExternalLink className="h-3.5 w-3.5 ml-1.5 opacity-70" />
                )}
              </Button>
              <div className="flex flex-row gap-2">
                <div className="flex-1">
                  <FavoriteButton
                    type="course"
                    itemId={course.course_code}
                    size="lg"
                    showText={true}
                    variant="outline"
                    className="w-full"
                  />
                </div>
                <div className="flex-1">
                  <Button
                    className={cn(
                      'h-10 text-white w-full',
                      writeReviewDisabled
                        ? 'bg-red-300 dark:bg-red-900/50 opacity-60 cursor-not-allowed hover:opacity-60'
                        : 'gradient-primary hover:opacity-90'
                    )}
                    onClick={handleWriteReview}
                    disabled={writeReviewDisabled}
                    title={writeReviewDisabled ? t('pages.courseDetail.noTeachingRecords') : undefined}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {t('review.writeReview')}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* 系所徽章 - 使用全寬度 */}
            {course.department && (
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mb-4 min-h-[2rem] overflow-hidden">
                {/* Faculty Badges - Support multi-department */}
                {getFacultiesForMultiDepartment(course.department).map((facultyKey, index) => (
                  <Badge 
                    key={facultyKey}
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 shrink-0 w-fit"
                  >
                    {t(facultyKey)}
                  </Badge>
                ))}
                {/* Department Badge */}
                <Badge 
                  variant="outline"
                  className="text-xs bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 shrink-0 w-fit"
                >
                  <span className="break-words hyphens-auto">
                    {translateDepartmentName(course.department, t)}
                  </span>
                </Badge>
                {/* Current Term Offering Badge */}
                {isOfferedInCurrentTerm !== null && (
                  <Badge 
                    variant={isOfferedInCurrentTerm ? "default" : "outline"}
                    className={`text-xs cursor-pointer transition-colors ${
                      isOfferedInCurrentTerm 
                        ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' 
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                    }`}
                    onClick={handleOfferedBadgeClick}
                  >
                    <div className="flex items-center gap-1">
                      {isOfferedInCurrentTerm ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      <span>
                        {isOfferedInCurrentTerm ? t('offered.yes') : t('offered.no')} ({currentTermName})
                      </span>
                    </div>
                  </Badge>
                )}
              </div>
            )}
            
            {/* 課程基本統計信息 - 響應式佈局 */}
            <div className="pt-4">
              {/* Mobile and Tablet Portrait: 統計在兩行 */}
              <div className="grid grid-cols-1 gap-3 lg:hidden">
                <div className="grid grid-cols-3 gap-2">
                  {/* 平均工作量 */}
                  <StatBox
                    value={detailedStats.averageWorkload}
                    label={t('pages.courseDetail.averageWorkload')}
                    labelShort={t('pages.courseDetail.averageWorkloadShort')}
                    hasValidData={detailedStats.averageWorkload > 0}
                  />
                  
                  {/* 平均難度 */}
                  <StatBox
                    value={detailedStats.averageDifficulty}
                    label={t('pages.courseDetail.averageDifficulty')}
                    labelShort={t('pages.courseDetail.averageDifficultyShort')}
                    hasValidData={detailedStats.averageDifficulty > 0}
                  />
                  
                  {/* 平均實用性 */}
                  <StatBox
                    value={detailedStats.averageUsefulness}
                    label={t('pages.courseDetail.averageUsefulness')}
                    labelShort={t('pages.courseDetail.averageUsefulnessShort')}
                    hasValidData={detailedStats.averageUsefulness > 0}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {/* 授課教師數 */}
                  <div className="flex flex-col items-center min-w-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground text-center leading-tight">
                      <GraduationCap className="h-3 w-3" />
                      <span>{t('pages.courseDetail.taughtInstructors')}</span>
                    </div>
                    <span className="text-xl font-bold text-primary">
                      {(() => {
                        if (!teachingInfo || teachingInfo.length === 0) return 0;
                        const uniqueInstructors = new Set(teachingInfo.map(info => info.instructor.name));
                        return uniqueInstructors.size;
                      })()}
                    </span>
                  </div>
                  
                  {/* 評論數量 */}
                  <div className="flex flex-col items-center min-w-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground text-center leading-tight">
                      <MessageSquare className="h-3 w-3" />
                      <span>{t('pages.courseDetail.totalReviews')}</span>
                    </div>
                    <span className="text-xl font-bold text-primary">
                      {allReviews?.length || 0}
                    </span>
                  </div>
                  
                  {/* 學生數量 */}
                  <div className="flex flex-col items-center min-w-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground text-center leading-tight">
                      <UserCheck className="h-3 w-3" />
                      <span>{t('pages.courseDetail.totalStudents')}</span>
                    </div>
                    <span className="text-xl font-bold text-primary">
                      {(() => {
                        if (!allReviews || allReviews.length === 0) return 0;
                        const uniqueStudents = new Set(allReviews.map(review => review.review.user_id));
                        return uniqueStudents.size;
                      })()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Desktop: 統一使用 6 列佈局 */}
              <div className="hidden lg:grid lg:grid-cols-6 gap-4">
                {/* 平均工作量 */}
                <StatBox
                  value={detailedStats.averageWorkload}
                  label={t('pages.courseDetail.averageWorkload')}
                  labelShort={t('pages.courseDetail.averageWorkloadShort')}
                  hasValidData={detailedStats.averageWorkload > 0}
                />
                
                {/* 平均難度 */}
                <StatBox
                  value={detailedStats.averageDifficulty}
                  label={t('pages.courseDetail.averageDifficulty')}
                  labelShort={t('pages.courseDetail.averageDifficultyShort')}
                  hasValidData={detailedStats.averageDifficulty > 0}
                />
                
                {/* 平均實用性 */}
                <StatBox
                  value={detailedStats.averageUsefulness}
                  label={t('pages.courseDetail.averageUsefulness')}
                  labelShort={t('pages.courseDetail.averageUsefulnessShort')}
                  hasValidData={detailedStats.averageUsefulness > 0}
                />
                
                {/* 授課教師數 */}
                <div className="flex flex-col items-center min-w-0">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground text-center">
                    <GraduationCap className="h-4 w-4" />
                    <span>{t('pages.courseDetail.taughtInstructors')}</span>
                  </div>
                  <span className="text-xl font-bold text-primary">
                    {(() => {
                      if (!teachingInfo || teachingInfo.length === 0) return 0;
                      const uniqueInstructors = new Set(teachingInfo.map(info => info.instructor.name));
                      return uniqueInstructors.size;
                    })()}
                  </span>
                </div>
                
                {/* 評論數量 */}
                <div className="flex flex-col items-center min-w-0">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground text-center">
                    <MessageSquare className="h-4 w-4" />
                    <span>{t('pages.courseDetail.totalReviews')}</span>
                  </div>
                  <span className="text-xl font-bold text-primary">
                    {allReviews?.length || 0}
                  </span>
                </div>
                
                {/* 學生數量 */}
                <div className="flex flex-col items-center min-w-0">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground text-center">
                    <UserCheck className="h-4 w-4" />
                    <span>{t('pages.courseDetail.totalStudents')}</span>
                  </div>
                  <span className="text-xl font-bold text-primary">
                    {(() => {
                      if (!allReviews || allReviews.length === 0) return 0;
                      const uniqueStudents = new Set(allReviews.map(review => review.review.user_id));
                      return uniqueStudents.size;
                    })()}
                  </span>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>

      <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className={`w-full ${tabsScrollable ? 'tabs-scrollable' : ''}`}>
        {/* Tab Navigation - Attached Design */}
        <div className="attached-tabs-container">
          <TabsList ref={tabsListRef} className="attached-tabs-list">
            <TabsTrigger
              value="overview"
              className="attached-tab-trigger"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">{t('pages.courseDetail.overview')}</span>
              {activeMainTab === 'overview' && <span className="sm:hidden text-xs">{t('pages.courseDetail.overview')}</span>}
            </TabsTrigger>
            <TabsTrigger
              value="teaching"
              className="attached-tab-trigger"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">{t('pages.courseDetail.offerRecords')}</span>
              {activeMainTab === 'teaching' && <span className="sm:hidden text-xs">{t('common.teaching')}</span>}
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="attached-tab-trigger"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">{t('review.studentReviews')}</span>
              {activeMainTab === 'reviews' && <span className="sm:hidden text-xs">{t('pages.courseDetail.reviewsShort')}</span>}
            </TabsTrigger>
            <TabsTrigger
              value="grades"
              className="attached-tab-trigger"
            >
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">{t('chart.gradeDistribution')}</span>
              {activeMainTab === 'grades' && <span className="sm:hidden text-xs">{t('common.grades')}</span>}
            </TabsTrigger>
            {/* Hide the study-materials tab for logged-in users when none exist.
                Guests still see it (they get a login prompt) since we can't
                check the bucket without auth. */}
            {(!user || studyMaterials.length > 0) && (
              <TabsTrigger
                value="materials"
                className="attached-tab-trigger"
              >
                <BookText className="h-4 w-4" />
                <span className="hidden sm:inline">{t('pages.courseDetail.studyMaterials')}</span>
                {activeMainTab === 'materials' && <span className="sm:hidden text-xs">{t('pages.courseDetail.studyMaterialsShort')}</span>}
              </TabsTrigger>
            )}
            {/* Hide the exams tab for logged-in users when no papers exist.
                Guests still see it (they get a login prompt) since we can't
                check the bucket without auth. */}
            {(!user || examPapers.length > 0) && (
              <TabsTrigger
                value="exams"
                className="attached-tab-trigger"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">{t('pages.courseDetail.pastExamPapers')}</span>
                {activeMainTab === 'exams' && <span className="sm:hidden text-xs">{t('pages.courseDetail.pastExamPapersShort')}</span>}
              </TabsTrigger>
            )}
          </TabsList>
          {/* Redraws the content's rounded top-right corner border above the
              active tab (light theme). Only needed when tabs don't scroll. */}
          {!tabsScrollable && <div className="attached-tab-content-corner" aria-hidden="true" />}
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="attached-tab-content mt-0">
          <div className="p-6">
            {(() => {
              const description = language === 'zh-TW'
                ? (course.course_description_tc || course.course_description)
                : language === 'zh-CN'
                  ? (course.course_description_sc || course.course_description)
                  : course.course_description;

              const hasRequirements = Boolean(
                course.course_prerequisites?.trim() ||
                course.course_corequisites?.trim() ||
                course.course_exclusions?.trim() ||
                course.course_exemption_requirements?.trim() ||
                course.course_recommended?.trim() ||
                course.course_restriction?.trim()
              );

              const hasBasicInfo = Boolean(
                course.course_recommended_study_year?.trim() ||
                course.course_mode_of_tuition?.trim() ||
                course.course_class_contact_hours?.trim() ||
                course.course_category?.trim() ||
                course.course_discipline?.trim() ||
                course.course_language_of_instruction?.trim()
              );

              if (!description && !hasRequirements && !hasBasicInfo) {
                return (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('pages.courseDetail.noDescription')}</p>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      {t('pages.courseDetail.description')}
                    </h3>
                    {description ? (
                      <p className="text-base leading-relaxed text-foreground whitespace-pre-line text-justify hyphens-auto">
                        {renderTextWithCourseLinks(description, course.course_code, referencedCourseTitles, language)}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">{t('pages.courseDetail.noDescription')}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <CourseBasicInfoSection course={course} t={t} language={language} titleMap={referencedCourseTitles} />
                    <CourseRequirementsSection course={course} t={t} language={language} titleMap={referencedCourseTitles} />
                  </div>
                </div>
              );
            })()}
          </div>
        </TabsContent>

        {/* Student Reviews Tab */}
        <TabsContent value="reviews" className="attached-tab-content mt-0">
          <div id="student-reviews" className="p-6 space-y-4">
            <CourseReviewsList
              reviews={allReviews || []}
              allReviews={allReviews || []}
              loading={reviewsLoading}
              externalGradeFilter={externalGradeFilter}
              course={course}
              hideHeader={true}
              onToggleServiceLearning={handleServiceLearningToggle}
              preloadedInstructors={courseTeachingInstructors}
            />
          </div>
        </TabsContent>

        {/* Teaching Records Tab */}
        <TabsContent value="teaching" className="attached-tab-content mt-0">
          <div className="p-6 space-y-4">
          {teachingInfoLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">{t('pages.courseDetail.loadingTeachingRecords')}</p>
            </div>
          ) : teachingInfo.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('pages.courseDetail.noTeachingRecords')}</p>
            </div>
          ) : (
            <Tabs value={activeTeachingTab} onValueChange={setActiveTeachingTab} className="w-full">
              <div className="flex flex-col gap-4 mb-4">
                {/* Mobile: Tab switcher and filters in separate rows */}
                <div className="md:hidden">
                  {(() => {
                    // Count available session types
                    const sessionTypeCounts = {
                      lecture: filteredTeachingInfo.filter(info => info.sessionType === 'Lecture').length,
                      tutorial: filteredTeachingInfo.filter(info => info.sessionType === 'Tutorial').length,
                      project: filteredTeachingInfo.filter(info => info.sessionType === 'Project').length,
                      seminar: filteredTeachingInfo.filter(info => info.sessionType === 'Seminar').length,
                    };
                    
                    const availableSessionTypes = Object.values(sessionTypeCounts).filter(count => count > 0).length;
                    const shouldUseAbbreviations = availableSessionTypes >= 3;
                    
                    // Get session type labels (abbreviated for mobile portrait when 3+ types)
                    const getSessionTypeLabel = (type: string) => {
                      if (!shouldUseAbbreviations) {
                        return t(`sessionType.${type}`);
                      }
                      
                      // Use abbreviations for mobile portrait with 3+ session types
                      const abbreviations = {
                        en: { lecture: 'LEC', tutorial: 'TUT', project: 'PRJ', seminar: 'SEM' },
                        'zh-TW': { lecture: '講課', tutorial: '導修', project: '專題', seminar: '研討' },
                        'zh-CN': { lecture: '講課', tutorial: '导修', project: '专题', seminar: '研讨' }
                      };
                      
                      return abbreviations[language as keyof typeof abbreviations]?.[type as keyof typeof abbreviations['en']] || t(`sessionType.${type}`);
                    };
                    
                    return (
                      <TabsList className="bg-muted/50 backdrop-blur-sm w-full mb-4">
                    {filteredTeachingInfo.filter(info => info.sessionType === 'Lecture').length > 0 && (
                      <TabsTrigger 
                        value="lecture" 
                        className="hover:shadow-md transition-[transform,box-shadow,scale] duration-200 data-[state=active]:shadow-lg hover:scale-105 flex-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{getSessionTypeLabel('lecture')}</span>
                          <div className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                            {filteredTeachingInfo.filter(info => info.sessionType === 'Lecture').length}
                          </div>
                        </div>
                      </TabsTrigger>
                    )}
                    {filteredTeachingInfo.filter(info => info.sessionType === 'Tutorial').length > 0 && (
                      <TabsTrigger 
                        value="tutorial" 
                        className="hover:shadow-md transition-[transform,box-shadow,scale] duration-200 data-[state=active]:shadow-lg hover:scale-105 flex-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{getSessionTypeLabel('tutorial')}</span>
                          <div className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                            {filteredTeachingInfo.filter(info => info.sessionType === 'Tutorial').length}
                          </div>
                        </div>
                      </TabsTrigger>
                    )}
                    {filteredTeachingInfo.filter(info => info.sessionType === 'Project').length > 0 && (
                      <TabsTrigger 
                        value="project" 
                        className="hover:shadow-md transition-[transform,box-shadow,scale] duration-200 data-[state=active]:shadow-lg hover:scale-105 flex-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{getSessionTypeLabel('project')}</span>
                          <div className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                            {filteredTeachingInfo.filter(info => info.sessionType === 'Project').length}
                          </div>
                        </div>
                      </TabsTrigger>
                    )}
                    {filteredTeachingInfo.filter(info => info.sessionType === 'Seminar').length > 0 && (
                      <TabsTrigger 
                        value="seminar" 
                        className="hover:shadow-md transition-[transform,box-shadow,scale] duration-200 data-[state=active]:shadow-lg hover:scale-105 flex-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{getSessionTypeLabel('seminar')}</span>
                          <div className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                            {filteredTeachingInfo.filter(info => info.sessionType === 'Seminar').length}
                          </div>
                        </div>
                      </TabsTrigger>
                    )}
                  </TabsList>
                    );
                  })()}

                  {/* Mobile filters - each filter in its own row */}
                  <div className="grid grid-cols-1 gap-2">
                    {/* 學期篩選 */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 shrink-0 w-24">
                        <CalendarDays className="h-4 w-4" />
                        {t('pages.courseDetail.filterByTerm')}
                      </label>
                      <MultiSelectDropdown
                        options={availableTermsWithCounts.map((termData): SelectOption => ({
                          value: termData.term.term_code,
                          label: termData.term.name,
                          count: termData.count,
                          status: isCurrentTerm(termData.term.term_code) ? 'current' : 
                                 new Date(termData.term.end_date) < new Date() ? 'past' : 'future'
                        }))}
                        selectedValues={(() => {
                          const values = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter ? [selectedTermFilter] : []);
                          // If 'all' is selected or no values, return empty array to show placeholder
                          if (values.length === 0 || values.includes('all')) {
                            return [];
                          }
                          return values;
                        })()}
                        onSelectionChange={(values: string[]) => {
                          if (values.length === 0) {
                            setSelectedTermFilter('all'); // When nothing selected, set to 'all'
                          } else {
                            setSelectedTermFilter(values);
                          }
                        }}
                        placeholder={t('common.all')}
                        className="flex-1 h-10 text-sm"
                        showCounts={true}
                        maxHeight="max-h-48"
                        totalCount={teachingInfo.length}
                      />
                    </div>

                    {/* 教學語言篩選 */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 shrink-0 w-24">
                        <BookText className="h-4 w-4" />
                        {t('pages.courseDetail.filterByTeachingLanguage')}
                      </label>
                      <MultiSelectDropdown
                        options={availableTeachingLanguagesWithCounts.map((languageData): SelectOption => ({
                          value: languageData.language,
                          label: getResponsiveTeachingLanguageLabel(languageData.language),
                          count: languageData.count,
                          isTeachingLanguage: true
                        }))}
                        selectedValues={(() => {
                          const values = Array.isArray(selectedTeachingLanguageFilter) ? selectedTeachingLanguageFilter : (selectedTeachingLanguageFilter === 'all' ? [] : [selectedTeachingLanguageFilter]);
                          // If 'all' is selected or no values, return empty array to show placeholder
                          if (values.length === 0 || values.includes('all')) {
                            return [];
                          }
                          return values;
                        })()}
                        onSelectionChange={(values: string[]) => {
                          if (values.length === 0) {
                            setSelectedTeachingLanguageFilter('all'); // When nothing selected, set to 'all'
                          } else {
                            setSelectedTeachingLanguageFilter(values);
                          }
                        }}
                        placeholder={t('common.all')}
                        className="flex-1 h-10 text-sm"
                        showCounts={true}
                        maxHeight="max-h-48"
                        totalCount={teachingInfo.length}
                      />
                    </div>
                  </div>
                </div>

                {/* Desktop: Tab switcher and filters in the same row */}
                <div className="hidden md:flex md:items-start md:gap-4">
                  <TabsList className="bg-muted/50 backdrop-blur-sm flex-shrink-0 min-w-0">
                    {filteredTeachingInfo.filter(info => info.sessionType === 'Lecture').length > 0 && (
                      <TabsTrigger 
                        value="lecture" 
                        className="hover:shadow-md transition-[transform,box-shadow,scale] duration-200 data-[state=active]:shadow-lg hover:scale-105 text-xs px-2 py-1.5"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold truncate">{t('sessionType.lecture')}</span>
                          <div className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {filteredTeachingInfo.filter(info => info.sessionType === 'Lecture').length}
                          </div>
                        </div>
                      </TabsTrigger>
                    )}
                    {filteredTeachingInfo.filter(info => info.sessionType === 'Tutorial').length > 0 && (
                      <TabsTrigger 
                        value="tutorial" 
                        className="hover:shadow-md transition-[transform,box-shadow,scale] duration-200 data-[state=active]:shadow-lg hover:scale-105 text-xs px-2 py-1.5"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold truncate">{t('sessionType.tutorial')}</span>
                          <div className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {filteredTeachingInfo.filter(info => info.sessionType === 'Tutorial').length}
                          </div>
                        </div>
                      </TabsTrigger>
                    )}
                    {filteredTeachingInfo.filter(info => info.sessionType === 'Project').length > 0 && (
                      <TabsTrigger 
                        value="project" 
                        className="hover:shadow-md transition-[transform,box-shadow,scale] duration-200 data-[state=active]:shadow-lg hover:scale-105 text-xs px-2 py-1.5"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold truncate">{t('sessionType.project')}</span>
                          <div className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {filteredTeachingInfo.filter(info => info.sessionType === 'Project').length}
                          </div>
                        </div>
                      </TabsTrigger>
                    )}
                    {filteredTeachingInfo.filter(info => info.sessionType === 'Seminar').length > 0 && (
                      <TabsTrigger 
                        value="seminar" 
                        className="hover:shadow-md transition-[transform,box-shadow,scale] duration-200 data-[state=active]:shadow-lg hover:scale-105 text-xs px-2 py-1.5"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold truncate">{t('sessionType.seminar')}</span>
                          <div className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {filteredTeachingInfo.filter(info => info.sessionType === 'Seminar').length}
                          </div>
                        </div>
                      </TabsTrigger>
                    )}
                  </TabsList>

                  {/* Desktop filters - inline with tab switcher */}
                  <div className="flex items-start gap-3 flex-shrink-0 min-w-0 ml-auto">
                    {/* 學期篩選器 */}
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="flex items-center gap-1 text-sm font-medium text-muted-foreground whitespace-nowrap">
                        <CalendarDays className="h-4 w-4" />
                        {t('pages.courseDetail.filterByTerm')}
                      </label>
                      <MultiSelectDropdown
                        options={availableTermsWithCounts.map((termData): SelectOption => ({
                          value: termData.term.term_code,
                          label: termData.term.name,
                          count: termData.count,
                          status: isCurrentTerm(termData.term.term_code) ? 'current' : 
                                 new Date(termData.term.end_date) < new Date() ? 'past' : 'future'
                        }))}
                        selectedValues={(() => {
                          const values = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter ? [selectedTermFilter] : []);
                          // If 'all' is selected or no values, return empty array to show placeholder
                          if (values.length === 0 || values.includes('all')) {
                            return [];
                          }
                          return values;
                        })()}
                        onSelectionChange={(values: string[]) => {
                          if (values.length === 0) {
                            setSelectedTermFilter('all'); // When nothing selected, set to 'all'
                          } else {
                            setSelectedTermFilter(values);
                          }
                        }}
                        placeholder={t('common.all')}
                        className="w-[170px] h-10 text-sm"
                        showCounts={true}
                        maxHeight="max-h-48"
                        totalCount={teachingInfo.length}
                      />
                    </div>

                    {/* 教學語言篩選器 */}
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="flex items-center gap-1 text-sm font-medium text-muted-foreground whitespace-nowrap">
                        <BookText className="h-4 w-4" />
                        {t('pages.courseDetail.filterByTeachingLanguage')}
                      </label>
                      <MultiSelectDropdown
                        options={availableTeachingLanguagesWithCounts.map((languageData): SelectOption => ({
                          value: languageData.language,
                          label: getResponsiveTeachingLanguageLabel(languageData.language),
                          count: languageData.count,
                          isTeachingLanguage: true
                        }))}
                        selectedValues={(() => {
                          const values = Array.isArray(selectedTeachingLanguageFilter) ? selectedTeachingLanguageFilter : (selectedTeachingLanguageFilter === 'all' ? [] : [selectedTeachingLanguageFilter]);
                          // If 'all' is selected or no values, return empty array to show placeholder
                          if (values.length === 0 || values.includes('all')) {
                            return [];
                          }
                          return values;
                        })()}
                        onSelectionChange={(values: string[]) => {
                          if (values.length === 0) {
                            setSelectedTeachingLanguageFilter('all'); // When nothing selected, set to 'all'
                          } else {
                            setSelectedTeachingLanguageFilter(values);
                          }
                        }}
                        placeholder={t('common.all')}
                        className="w-[170px] h-10 text-sm"
                        showCounts={true}
                        maxHeight="max-h-48"
                        totalCount={teachingInfo.length}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <TabsContent value="lecture" className="mt-0">
                {filteredTeachingInfo.filter(info => info.sessionType === 'Lecture').length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('pages.courseDetail.noLectureRecords')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Group by instructor and sort alphabetically */}
                    {Object.entries(
                      filteredTeachingInfo
                        .filter(info => info.sessionType === 'Lecture')
                        .reduce((acc, info) => {
                          const instructorName = info.instructor.name;
                          if (!acc[instructorName]) {
                            acc[instructorName] = {
                              instructor: info.instructor,
                              terms: []
                            };
                          }
                          acc[instructorName].terms.push(info.term);
                          return acc;
                        }, {} as Record<string, { instructor: any; terms: any[] }>)
                    )
                    .sort(([a], [b]) => {
                      const aNameForSort = extractInstructorNameForSorting(a);
                      const bNameForSort = extractInstructorNameForSorting(b);
                      return aNameForSort.localeCompare(bNameForSort);
                    }) // Sort by instructor name alphabetically, ignoring titles
                    .map(([instructorName, data]) => (
                      <div key={instructorName} className="p-3 rounded-lg space-y-3">
                        {/* First row: Instructor name */}
                        <div className="flex-shrink-0">
                          {instructorName === 'UNKNOWN' ? (
                            // For UNKNOWN instructors, display as non-clickable text
                            <div className="font-medium text-sm text-muted-foreground">
                              <div className="flex flex-col">
                                <span>{language === 'zh-TW' ? '未知教師' : language === 'zh-CN' ? '未知教师' : 'Unknown Instructor'}</span>
                              </div>
                            </div>
                          ) : (
                            // For known instructors, display as clickable link
                            <a
                              href={`/instructors/${encodeURIComponent(instructorName)}`}
                              onClick={(e) => {
                                if (e.ctrlKey || e.metaKey || e.button === 1) {
                                  return;
                                }
                                e.preventDefault();
                                navigate(`/instructors/${encodeURIComponent(instructorName)}`);
                              }}
                              className="font-medium text-sm hover:text-primary transition-colors inline-block w-fit"
                            >
                              <div className="flex flex-col">
                                {(() => {
                                  const formattedName = getFormattedInstructorName(data.instructor, language);
                                  return (
                                    <>
                                      <span>{formattedName.primary}</span>
                                      {formattedName.secondary && (
                                        <span className="text-xs text-muted-foreground font-normal">
                                          {formattedName.secondary}
                                        </span>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            </a>
                          )}
                        </div>
                        
                        {/* Second row: Terms and Teaching Languages Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          {data.terms
                            .sort((a, b) => b.term_code.localeCompare(a.term_code)) // Sort terms by code descending
                            .map((term, termIndex) => {
                              // Find the teaching language for this term and instructor
                              const teachingLanguage = filteredTeachingInfo.find(info => 
                                info.term.term_code === term.term_code && 
                                info.instructor.name === instructorName &&
                                info.sessionType === 'Lecture'
                              )?.teachingLanguage;
                              
                              return (
                                <div key={termIndex} className="flex items-center">
                                  {/* Combined term and teaching language badge */}
                                  {teachingLanguage ? (
                                    <div className="inline-flex rounded-md border border-border overflow-hidden transition-colors hover:border-primary/50">
                                      {/* Term part (left side) */}
                                      <ResponsiveTooltip
                                        ref={(el) => {
                                          if (el) tooltipRefs.current[`term-${term.term_code}`] = el;
                                        }}
                                        content={t('filter.clickToFilterByTerm', { term: term.name })}
                                        hasClickAction={true}
                                        clickActionText={t('tooltip.clickAgainToFilter')}
                                        open={isMobile ? termTooltipStates[term.term_code] || false : undefined}
                                        onOpenChange={isMobile ? (open) => setTermTooltipStates(prev => ({ ...prev, [term.term_code]: open })) : undefined}
                                        onReset={() => resetTermTooltipState(term.term_code)}
                                      >
                                        <button
                                          onClick={(e) => {
                                            handleTermBadgeClick(term.term_code, e);
                                          }}
                                          className={`px-2 py-1 text-xs transition-colors border-0 ${
                                            (() => {
                                              const currentValues = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter === 'all' ? [] : [selectedTermFilter]);
                                              return currentValues.includes(term.term_code)
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-background hover:bg-muted';
                                            })()
                                          }`}
                                        >
                                          {term.name}
                                        </button>
                                      </ResponsiveTooltip>
                                      
                                      {/* Separator */}
                                      <div className="w-px bg-border"></div>
                                      
                                      {/* Teaching language part (right side) */}
                                      <ResponsiveTooltip
                                        ref={(el) => {
                                          const uniqueLanguageKey = `${term.term_code}-${instructorName.replace(/\s+/g, '-')}-${teachingLanguage}`;
                                          if (el) tooltipRefs.current[`lang-${uniqueLanguageKey}`] = el;
                                        }}
                                        content={t('filter.clickToFilterByTeachingLanguage', { language: getTeachingLanguageName(teachingLanguage, t) })}
                                        hasClickAction={true}
                                        clickActionText={t('tooltip.clickAgainToFilter')}
                                        open={isMobile ? (() => {
                                          const uniqueLanguageKey = `${term.term_code}-${instructorName.replace(/\s+/g, '-')}-${teachingLanguage}`;
                                          return teachingLanguageTooltipStates[uniqueLanguageKey] || false;
                                        })() : undefined}
                                        onOpenChange={isMobile ? (open) => {
                                          const uniqueLanguageKey = `${term.term_code}-${instructorName.replace(/\s+/g, '-')}-${teachingLanguage}`;
                                          setTeachingLanguageTooltipStates(prev => ({ ...prev, [uniqueLanguageKey]: open }));
                                        } : undefined}
                                        onReset={() => {
                                          const uniqueLanguageKey = `${term.term_code}-${instructorName.replace(/\s+/g, '-')}-${teachingLanguage}`;
                                          resetTeachingLanguageTooltipState(uniqueLanguageKey);
                                        }}
                                      >
                                        <button
                                          onClick={(e) => {
                                            const uniqueLanguageKey = `${term.term_code}-${instructorName.replace(/\s+/g, '-')}-${teachingLanguage}`;
                                            if (e) {
                                              e.stopPropagation();
                                              e.preventDefault();
                                            }
                                            
                                            if (isMobile) {
                                              // Mobile/tablet: require 2 taps to apply filter
                                              const currentTapCount = teachingLanguageTapCounts[teachingLanguage] || 0;
                                              const newTapCount = currentTapCount + 1;
                                              
                                              // Clear existing timeout for this unique key
                                              const refKey = `lang-${uniqueLanguageKey}`;
                                              if (timeoutRefs.current[refKey]) {
                                                clearTimeout(timeoutRefs.current[refKey]);
                                              }
                                              
                                              setTeachingLanguageTapCounts(prev => ({
                                                ...prev,
                                                [teachingLanguage]: newTapCount
                                              }));
                                              
                                              if (newTapCount === 1) {
                                                // First tap: show tooltip
                                                setTeachingLanguageTooltipStates(prev => ({
                                                  ...prev,
                                                  [uniqueLanguageKey]: true
                                                }));
                                                
                                                // Reset after 3 seconds
                                                timeoutRefs.current[refKey] = setTimeout(() => {
                                                  setTeachingLanguageTapCounts(prev => ({
                                                    ...prev,
                                                    [teachingLanguage]: 0
                                                  }));
                                                  setTeachingLanguageTooltipStates(prev => ({
                                                    ...prev,
                                                    [uniqueLanguageKey]: false
                                                  }));
                                                }, 3000);
                                              } else if (newTapCount === 2) {
                                                // Second tap: apply filter and close tooltip
                                                applyTeachingLanguageFilter(teachingLanguage);
                                                resetTeachingLanguageTooltipState(uniqueLanguageKey);
                                              }
                                            } else {
                                              // Desktop: 1 tap to apply filter
                                              applyTeachingLanguageFilter(teachingLanguage);
                                            }
                                          }}
                                          className={`px-2 py-1 text-xs transition-colors border-0 font-mono ${
                                            (() => {
                                              const currentValues = Array.isArray(selectedTeachingLanguageFilter) ? selectedTeachingLanguageFilter : (selectedTeachingLanguageFilter === 'all' ? [] : [selectedTeachingLanguageFilter]);
                                              const isSelected = currentValues.includes(teachingLanguage);
                                              return isSelected
                                                ? 'bg-orange-500 text-orange-50 font-bold'
                                                : 'bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/10 dark:text-orange-400 dark:hover:bg-orange-900/20';
                                            })()
                                          }`}
                                        >
                                          {teachingLanguage}
                                        </button>
                                      </ResponsiveTooltip>
                                    </div>
                                  ) : (
                                    // Fallback to term-only badge if no teaching language
                                    <ResponsiveTooltip
                                      content={t('filter.clickToFilterByTerm', { term: term.name })}
                                      hasClickAction={true}
                                      clickActionText={t('tooltip.clickAgainToFilter')}
                                    >
                                      <button
                                        onClick={() => handleTermBadgeClick(term.term_code)}
                                        className={`px-2 py-1 text-xs rounded-md transition-colors border ${
                                          (() => {
                                            const currentValues = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter === 'all' ? [] : [selectedTermFilter]);
                                            return currentValues.includes(term.term_code)
                                              ? 'bg-primary text-primary-foreground border-primary'
                                              : 'bg-background hover:bg-muted border-border hover:border-primary/50';
                                          })()
                                        }`}
                                      >
                                        {term.name}
                                      </button>
                                    </ResponsiveTooltip>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tutorial" className="mt-0">
                {filteredTeachingInfo.filter(info => info.sessionType === 'Tutorial').length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('pages.courseDetail.noTutorialRecords')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Group by instructor and sort alphabetically */}
                    {Object.entries(
                      filteredTeachingInfo
                        .filter(info => info.sessionType === 'Tutorial')
                        .reduce((acc, info) => {
                          const instructorName = info.instructor.name;
                          if (!acc[instructorName]) {
                            acc[instructorName] = {
                              instructor: info.instructor,
                              terms: []
                            };
                          }
                          acc[instructorName].terms.push(info.term);
                          return acc;
                        }, {} as Record<string, { instructor: any; terms: any[] }>)
                    )
                    .sort(([a], [b]) => {
                      const aNameForSort = extractInstructorNameForSorting(a);
                      const bNameForSort = extractInstructorNameForSorting(b);
                      return aNameForSort.localeCompare(bNameForSort);
                    }) // Sort by instructor name alphabetically, ignoring titles
                    .map(([instructorName, data]) => (
                      <div key={instructorName} className="p-3 rounded-lg space-y-3">
                        {/* First row: Instructor name */}
                        <div className="flex-shrink-0">
                          {instructorName === 'UNKNOWN' ? (
                            // For UNKNOWN instructors, display as non-clickable text
                            <div className="font-medium text-sm text-muted-foreground">
                              <div className="flex flex-col">
                                <span>{language === 'zh-TW' ? '未知教師' : language === 'zh-CN' ? '未知教师' : 'Unknown Instructor'}</span>
                              </div>
                            </div>
                          ) : (
                            // For known instructors, display as clickable link
                            <a
                              href={`/instructors/${encodeURIComponent(instructorName)}`}
                              onClick={(e) => {
                                if (e.ctrlKey || e.metaKey || e.button === 1) {
                                  return;
                                }
                                e.preventDefault();
                                navigate(`/instructors/${encodeURIComponent(instructorName)}`);
                              }}
                              className="font-medium text-sm hover:text-primary transition-colors inline-block w-fit"
                            >
                              <div className="flex flex-col">
                                {(() => {
                                  const formattedName = getFormattedInstructorName(data.instructor, language);
                                  return (
                                    <>
                                      <span>{formattedName.primary}</span>
                                      {formattedName.secondary && (
                                        <span className="text-xs text-muted-foreground font-normal">
                                          {formattedName.secondary}
                                        </span>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            </a>
                          )}
                        </div>
                        
                        {/* Second row: Terms and Teaching Languages Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          {data.terms
                            .sort((a, b) => b.term_code.localeCompare(a.term_code)) // Sort terms by code descending
                            .map((term, termIndex) => {
                              // Find the teaching language for this term and instructor
                              const teachingLanguage = filteredTeachingInfo.find(info => 
                                info.term.term_code === term.term_code && 
                                info.instructor.name === instructorName &&
                                info.sessionType === 'Tutorial'
                              )?.teachingLanguage;
                              
                              return (
                                <div key={termIndex} className="flex items-center">
                                  {/* Combined term and teaching language badge */}
                                  {teachingLanguage ? (
                                    <div className="inline-flex rounded-md border border-border overflow-hidden transition-colors hover:border-primary/50">
                                      {/* Term part (left side) */}
                                      <ResponsiveTooltip
                                        ref={(el) => {
                                          if (el) tooltipRefs.current[`term-${term.term_code}`] = el;
                                        }}
                                        content={t('filter.clickToFilterByTerm', { term: term.name })}
                                        hasClickAction={true}
                                        clickActionText={t('tooltip.clickAgainToFilter')}
                                        open={isMobile ? termTooltipStates[term.term_code] || false : undefined}
                                        onOpenChange={isMobile ? (open) => setTermTooltipStates(prev => ({ ...prev, [term.term_code]: open })) : undefined}
                                        onReset={() => resetTermTooltipState(term.term_code)}
                                      >
                                        <button
                                          onClick={(e) => {
                                            handleTermBadgeClick(term.term_code, e);
                                          }}
                                          className={`px-2 py-1 text-xs transition-colors border-0 ${
                                            (() => {
                                              const currentValues = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter === 'all' ? [] : [selectedTermFilter]);
                                              return currentValues.includes(term.term_code)
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-background hover:bg-muted';
                                            })()
                                          }`}
                                        >
                                          {term.name}
                                        </button>
                                      </ResponsiveTooltip>
                                      
                                      {/* Separator */}
                                      <div className="w-px bg-border"></div>
                                      
                                      {/* Teaching language part (right side) */}
                                      <ResponsiveTooltip
                                        ref={(el) => {
                                          const uniqueLanguageKey = `${term.term_code}-${instructorName.replace(/\s+/g, '-')}-${teachingLanguage}`;
                                          if (el) tooltipRefs.current[`lang-${uniqueLanguageKey}`] = el;
                                        }}
                                        content={t('filter.clickToFilterByTeachingLanguage', { language: getTeachingLanguageName(teachingLanguage, t) })}
                                        hasClickAction={true}
                                        clickActionText={t('tooltip.clickAgainToFilter')}
                                        open={isMobile ? (() => {
                                          const uniqueLanguageKey = `${term.term_code}-${instructorName.replace(/\s+/g, '-')}-${teachingLanguage}`;
                                          return teachingLanguageTooltipStates[uniqueLanguageKey] || false;
                                        })() : undefined}
                                        onOpenChange={isMobile ? (open) => {
                                          const uniqueLanguageKey = `${term.term_code}-${instructorName.replace(/\s+/g, '-')}-${teachingLanguage}`;
                                          setTeachingLanguageTooltipStates(prev => ({ ...prev, [uniqueLanguageKey]: open }));
                                        } : undefined}
                                        onReset={() => {
                                          const uniqueLanguageKey = `${term.term_code}-${instructorName.replace(/\s+/g, '-')}-${teachingLanguage}`;
                                          resetTeachingLanguageTooltipState(uniqueLanguageKey);
                                        }}
                                      >
                                        <button
                                          onClick={(e) => {
                                            const uniqueLanguageKey = `${term.term_code}-${instructorName.replace(/\s+/g, '-')}-${teachingLanguage}`;
                                            if (e) {
                                              e.stopPropagation();
                                              e.preventDefault();
                                            }
                                            
                                            if (isMobile) {
                                              // Mobile/tablet: require 2 taps to apply filter
                                              const currentTapCount = teachingLanguageTapCounts[teachingLanguage] || 0;
                                              const newTapCount = currentTapCount + 1;
                                              
                                              // Clear existing timeout for this unique key
                                              const refKey = `lang-${uniqueLanguageKey}`;
                                              if (timeoutRefs.current[refKey]) {
                                                clearTimeout(timeoutRefs.current[refKey]);
                                              }
                                              
                                              setTeachingLanguageTapCounts(prev => ({
                                                ...prev,
                                                [teachingLanguage]: newTapCount
                                              }));
                                              
                                              if (newTapCount === 1) {
                                                // First tap: show tooltip
                                                setTeachingLanguageTooltipStates(prev => ({
                                                  ...prev,
                                                  [uniqueLanguageKey]: true
                                                }));
                                                
                                                // Reset after 3 seconds
                                                timeoutRefs.current[refKey] = setTimeout(() => {
                                                  setTeachingLanguageTapCounts(prev => ({
                                                    ...prev,
                                                    [teachingLanguage]: 0
                                                  }));
                                                  setTeachingLanguageTooltipStates(prev => ({
                                                    ...prev,
                                                    [uniqueLanguageKey]: false
                                                  }));
                                                }, 3000);
                                              } else if (newTapCount === 2) {
                                                // Second tap: apply filter and close tooltip
                                                applyTeachingLanguageFilter(teachingLanguage);
                                                resetTeachingLanguageTooltipState(uniqueLanguageKey);
                                              }
                                            } else {
                                              // Desktop: 1 tap to apply filter
                                              applyTeachingLanguageFilter(teachingLanguage);
                                            }
                                          }}
                                          className={`px-2 py-1 text-xs transition-colors border-0 font-mono ${
                                            (() => {
                                              const currentValues = Array.isArray(selectedTeachingLanguageFilter) ? selectedTeachingLanguageFilter : (selectedTeachingLanguageFilter === 'all' ? [] : [selectedTeachingLanguageFilter]);
                                              const isSelected = currentValues.includes(teachingLanguage);
                                              return isSelected
                                                ? 'bg-orange-500 text-orange-50 font-bold'
                                                : 'bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/10 dark:text-orange-400 dark:hover:bg-orange-900/20';
                                            })()
                                          }`}
                                        >
                                          {teachingLanguage}
                                        </button>
                                      </ResponsiveTooltip>
                                    </div>
                                  ) : (
                                    // Fallback to term-only badge if no teaching language
                                    <ResponsiveTooltip
                                      ref={(el) => {
                                        if (el) tooltipRefs.current[`term-${term.term_code}`] = el;
                                      }}
                                      content={t('filter.clickToFilterByTerm', { term: term.name })}
                                      hasClickAction={true}
                                      clickActionText={t('tooltip.clickAgainToFilter')}
                                      open={isMobile ? termTooltipStates[term.term_code] || false : undefined}
                                      onOpenChange={isMobile ? (open) => setTermTooltipStates(prev => ({ ...prev, [term.term_code]: open })) : undefined}
                                      onReset={() => resetTermTooltipState(term.term_code)}
                                    >
                                      <button
                                        onClick={(e) => {
                                          handleTermBadgeClick(term.term_code, e);
                                        }}
                                        className={`px-2 py-1 text-xs rounded-md transition-colors border ${
                                          (() => {
                                            const currentValues = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter === 'all' ? [] : [selectedTermFilter]);
                                            return currentValues.includes(term.term_code)
                                              ? 'bg-primary text-primary-foreground border-primary'
                                              : 'bg-background hover:bg-muted border-border hover:border-primary/50';
                                          })()
                                        }`}
                                      >
                                        {term.name}
                                      </button>
                                    </ResponsiveTooltip>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="project" className="mt-0">
                {filteredTeachingInfo.filter(info => info.sessionType === 'Project').length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('pages.courseDetail.noProjectRecords')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Group by instructor and sort alphabetically */}
                    {Object.entries(
                      filteredTeachingInfo
                        .filter(info => info.sessionType === 'Project')
                        .reduce((acc, info) => {
                          const instructorName = info.instructor.name;
                          if (!acc[instructorName]) {
                            acc[instructorName] = {
                              instructor: info.instructor,
                              terms: []
                            };
                          }
                          acc[instructorName].terms.push(info.term);
                          return acc;
                        }, {} as Record<string, { instructor: any; terms: any[] }>)
                    )
                    .sort(([a], [b]) => {
                      const aNameForSort = extractInstructorNameForSorting(a);
                      const bNameForSort = extractInstructorNameForSorting(b);
                      return aNameForSort.localeCompare(bNameForSort);
                    }) // Sort by instructor name alphabetically, ignoring titles
                    .map(([instructorName, data]) => (
                      <div key={instructorName} className="p-3 rounded-lg space-y-3">
                        {/* First row: Instructor name */}
                        <div className="flex-shrink-0">
                          {instructorName === 'UNKNOWN' ? (
                            // For UNKNOWN instructors, display as non-clickable text
                            <div className="font-medium text-sm text-muted-foreground">
                              <div className="flex flex-col">
                                <span>{language === 'zh-TW' ? '未知教師' : language === 'zh-CN' ? '未知教师' : 'Unknown Instructor'}</span>
                              </div>
                            </div>
                          ) : (
                            // For known instructors, display as clickable link
                            <a
                              href={`/instructors/${encodeURIComponent(instructorName)}`}
                              onClick={(e) => {
                                if (e.ctrlKey || e.metaKey || e.button === 1) {
                                  return;
                                }
                                e.preventDefault();
                                navigate(`/instructors/${encodeURIComponent(instructorName)}`);
                              }}
                              className="font-medium text-sm hover:text-primary transition-colors inline-block w-fit"
                            >
                              <div className="flex flex-col">
                                {(() => {
                                  const formattedName = getFormattedInstructorName(data.instructor, language);
                                  return (
                                    <>
                                      <span>{formattedName.primary}</span>
                                      {formattedName.secondary && (
                                        <span className="text-xs text-muted-foreground font-normal">
                                          {formattedName.secondary}
                                        </span>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            </a>
                          )}
                        </div>

                        {/* Second row: Terms and Teaching Languages Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          {data.terms
                            .sort((a, b) => b.term_code.localeCompare(a.term_code)) // Sort terms by code descending
                            .map((term, termIndex) => {
                              // Find the teaching language for this term and instructor
                              const teachingLanguage = filteredTeachingInfo.find(info => 
                                info.term.term_code === term.term_code && 
                                info.instructor.name === instructorName &&
                                info.sessionType === 'Project'
                              )?.teachingLanguage;
                              
                              return (
                                <div key={termIndex} className="flex items-center">
                                  {/* Combined term and teaching language badge */}
                                  {teachingLanguage ? (
                                    <div className="inline-flex rounded-md border border-border overflow-hidden transition-colors hover:border-primary/50">
                                      {/* Term part (left side) */}
                                      <ResponsiveTooltip
                                        ref={(el) => {
                                          if (el) tooltipRefs.current[`term-${term.term_code}`] = el;
                                        }}
                                        content={t('filter.clickToFilterByTerm', { term: term.name })}
                                        hasClickAction={true}
                                        clickActionText={t('tooltip.clickAgainToFilter')}
                                        open={isMobile ? termTooltipStates[term.term_code] || false : undefined}
                                        onOpenChange={isMobile ? (open) => setTermTooltipStates(prev => ({ ...prev, [term.term_code]: open })) : undefined}
                                        onReset={() => resetTermTooltipState(term.term_code)}
                                      >
                                        <button
                                          onClick={(e) => {
                                            handleTermBadgeClick(term.term_code, e);
                                          }}
                                          className={`px-2 py-1 text-xs transition-colors border-0 ${
                                            (() => {
                                              const currentValues = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter === 'all' ? [] : [selectedTermFilter]);
                                              return currentValues.includes(term.term_code)
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-background hover:bg-muted';
                                            })()
                                          }`}
                                        >
                                          {term.name}
                                        </button>
                                      </ResponsiveTooltip>
                                      
                                      {/* Separator */}
                                      <div className="w-px bg-border"></div>
                                      
                                      {/* Teaching language part (right side) */}
                                      <ResponsiveTooltip
                                        ref={(el) => {
                                          const uniqueLanguageKey = `${term.term_code}-${instructorName.replace(/\s+/g, '-')}-${teachingLanguage}`;
                                          if (el) tooltipRefs.current[`lang-${uniqueLanguageKey}`] = el;
                                        }}
                                        content={t('filter.clickToFilterByTeachingLanguage', { language: getTeachingLanguageName(teachingLanguage, t) })}
                                        hasClickAction={true}
                                        clickActionText={t('tooltip.clickAgainToFilter')}
                                        open={isMobile ? (() => {
                                          const uniqueLanguageKey = `${term.term_code}-${instructorName.replace(/\s+/g, '-')}-${teachingLanguage}`;
                                          return teachingLanguageTooltipStates[uniqueLanguageKey] || false;
                                        })() : undefined}
                                        onOpenChange={isMobile ? (open) => {
                                          const uniqueLanguageKey = `${term.term_code}-${instructorName.replace(/\s+/g, '-')}-${teachingLanguage}`;
                                          setTeachingLanguageTooltipStates(prev => ({ ...prev, [uniqueLanguageKey]: open }));
                                        } : undefined}
                                        onReset={() => {
                                          const uniqueLanguageKey = `${term.term_code}-${instructorName.replace(/\s+/g, '-')}-${teachingLanguage}`;
                                          resetTeachingLanguageTooltipState(uniqueLanguageKey);
                                        }}
                                      >
                                        <button
                                          onClick={(e) => {
                                            const uniqueLanguageKey = `${term.term_code}-${instructorName.replace(/\s+/g, '-')}-${teachingLanguage}`;
                                            if (e) {
                                              e.stopPropagation();
                                              e.preventDefault();
                                            }
                                            
                                            if (isMobile) {
                                              // Mobile/tablet: require 2 taps to apply filter
                                              const currentTapCount = teachingLanguageTapCounts[teachingLanguage] || 0;
                                              const newTapCount = currentTapCount + 1;
                                              
                                              // Clear existing timeout for this unique key
                                              const refKey = `lang-${uniqueLanguageKey}`;
                                              if (timeoutRefs.current[refKey]) {
                                                clearTimeout(timeoutRefs.current[refKey]);
                                              }
                                              
                                              setTeachingLanguageTapCounts(prev => ({
                                                ...prev,
                                                [teachingLanguage]: newTapCount
                                              }));
                                              
                                              if (newTapCount === 1) {
                                                // First tap: show tooltip
                                                setTeachingLanguageTooltipStates(prev => ({
                                                  ...prev,
                                                  [uniqueLanguageKey]: true
                                                }));
                                                
                                                // Reset after 3 seconds
                                                timeoutRefs.current[refKey] = setTimeout(() => {
                                                  setTeachingLanguageTapCounts(prev => ({
                                                    ...prev,
                                                    [teachingLanguage]: 0
                                                  }));
                                                  setTeachingLanguageTooltipStates(prev => ({
                                                    ...prev,
                                                    [uniqueLanguageKey]: false
                                                  }));
                                                }, 3000);
                                              } else if (newTapCount === 2) {
                                                // Second tap: apply filter and close tooltip
                                                applyTeachingLanguageFilter(teachingLanguage);
                                                resetTeachingLanguageTooltipState(uniqueLanguageKey);
                                              }
                                            } else {
                                              // Desktop: 1 tap to apply filter
                                              applyTeachingLanguageFilter(teachingLanguage);
                                            }
                                          }}
                                          className={`px-2 py-1 text-xs transition-colors border-0 font-mono ${
                                            (() => {
                                              const currentLanguageValues = Array.isArray(selectedTeachingLanguageFilter) ? selectedTeachingLanguageFilter : (selectedTeachingLanguageFilter === 'all' ? [] : [selectedTeachingLanguageFilter]);
                                              const isLanguageSelected = currentLanguageValues.includes(teachingLanguage);
                                              return isLanguageSelected
                                                ? 'bg-orange-500 text-orange-50 font-bold'
                                                : 'bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/10 dark:text-orange-400 dark:hover:bg-orange-900/20';
                                            })()
                                          }`}
                                        >
                                          {teachingLanguage}
                                        </button>
                                      </ResponsiveTooltip>
                                    </div>
                                  ) : (
                                    // Fallback to term-only badge if no teaching language
                                    <ResponsiveTooltip
                                      ref={(el) => {
                                        if (el) tooltipRefs.current[`term-${term.term_code}`] = el;
                                      }}
                                      content={t('filter.clickToFilterByTerm', { term: term.name })}
                                      hasClickAction={true}
                                      clickActionText={t('tooltip.clickAgainToFilter')}
                                      open={isMobile ? termTooltipStates[term.term_code] || false : undefined}
                                      onOpenChange={isMobile ? (open) => setTermTooltipStates(prev => ({ ...prev, [term.term_code]: open })) : undefined}
                                      onReset={() => resetTermTooltipState(term.term_code)}
                                    >
                                      <button
                                        onClick={(e) => {
                                          handleTermBadgeClick(term.term_code, e);
                                        }}
                                        className={`px-2 py-1 text-xs rounded-md transition-colors border ${
                                          (() => {
                                            const currentValues = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter === 'all' ? [] : [selectedTermFilter]);
                                            return currentValues.includes(term.term_code)
                                              ? 'bg-primary text-primary-foreground border-primary'
                                              : 'bg-background hover:bg-muted border-border hover:border-primary/50';
                                          })()
                                        }`}
                                      >
                                        {term.name}
                                      </button>
                                    </ResponsiveTooltip>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="seminar" className="mt-0">
                {filteredTeachingInfo.filter(info => info.sessionType === 'Seminar').length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('pages.courseDetail.noSeminarRecords')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Group by instructor and sort alphabetically */}
                    {Object.entries(
                      filteredTeachingInfo
                        .filter(info => info.sessionType === 'Seminar')
                        .reduce((acc, info) => {
                          const instructorName = info.instructor.name;
                          if (!acc[instructorName]) {
                            acc[instructorName] = {
                              instructor: info.instructor,
                              terms: []
                            };
                          }
                          acc[instructorName].terms.push(info.term);
                          return acc;
                        }, {} as Record<string, { instructor: any; terms: any[] }>)
                    )
                    .sort(([a], [b]) => {
                      const aNameForSort = extractInstructorNameForSorting(a);
                      const bNameForSort = extractInstructorNameForSorting(b);
                      return aNameForSort.localeCompare(bNameForSort);
                    }) // Sort by instructor name alphabetically, ignoring titles
                    .map(([instructorName, data]) => (
                      <div key={instructorName} className="p-3 rounded-lg space-y-3">
                        {/* First row: Instructor name */}
                        <div className="flex-shrink-0">
                          {instructorName === 'UNKNOWN' ? (
                            // For UNKNOWN instructors, display as non-clickable text
                            <div className="font-medium text-sm text-muted-foreground">
                              <div className="flex flex-col">
                                <span>{language === 'zh-TW' ? '未知教師' : language === 'zh-CN' ? '未知教师' : 'Unknown Instructor'}</span>
                              </div>
                            </div>
                          ) : (
                            // For known instructors, display as clickable link
                            <a
                              href={`/instructors/${encodeURIComponent(instructorName)}`}
                              onClick={(e) => {
                                if (e.ctrlKey || e.metaKey || e.button === 1) {
                                  return;
                                }
                                e.preventDefault();
                                navigate(`/instructors/${encodeURIComponent(instructorName)}`);
                              }}
                              className="font-medium text-sm hover:text-primary transition-colors inline-block w-fit"
                            >
                              <div className="flex flex-col">
                                {(() => {
                                  const formattedName = getFormattedInstructorName(data.instructor, language);
                                  return (
                                    <>
                                      <span>{formattedName.primary}</span>
                                      {formattedName.secondary && (
                                        <span className="text-xs text-muted-foreground font-normal">
                                          {formattedName.secondary}
                                        </span>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            </a>
                          )}
                        </div>

                        {/* Second row: Terms and Teaching Languages Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          {data.terms
                            .sort((a, b) => b.term_code.localeCompare(a.term_code)) // Sort terms by code descending
                            .map((term, termIndex) => {
                              // Find the teaching language for this term and instructor
                              const teachingLanguage = filteredTeachingInfo.find(info => 
                                info.term.term_code === term.term_code && 
                                info.instructor.name === instructorName &&
                                info.sessionType === 'Seminar'
                              )?.teachingLanguage;
                              
                              return (
                                <div key={termIndex} className="flex items-center">
                                  {/* Combined term and teaching language badge */}
                                  {teachingLanguage ? (
                                    <div className="inline-flex rounded-md border border-border overflow-hidden transition-colors hover:border-primary/50">
                                      {/* Term part (left side) */}
                                      <ResponsiveTooltip
                                        ref={(el) => {
                                          if (el) tooltipRefs.current[`term-${term.term_code}`] = el;
                                        }}
                                        content={t('filter.clickToFilterByTerm', { term: term.name })}
                                        hasClickAction={true}
                                        clickActionText={t('tooltip.clickAgainToFilter')}
                                        open={isMobile ? termTooltipStates[term.term_code] || false : undefined}
                                        onOpenChange={isMobile ? (open) => setTermTooltipStates(prev => ({ ...prev, [term.term_code]: open })) : undefined}
                                        onReset={() => resetTermTooltipState(term.term_code)}
                                      >
                                        <button
                                          onClick={(e) => {
                                            handleTermBadgeClick(term.term_code, e);
                                          }}
                                          className={`px-2 py-1 text-xs transition-colors border-0 ${
                                            (() => {
                                              const currentValues = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter === 'all' ? [] : [selectedTermFilter]);
                                              return currentValues.includes(term.term_code)
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-background hover:bg-muted';
                                            })()
                                          }`}
                                        >
                                          {term.name}
                                        </button>
                                      </ResponsiveTooltip>
                                      
                                      {/* Separator */}
                                      <div className="w-px bg-border"></div>
                                      
                                      {/* Teaching language part (right side) */}
                                      <ResponsiveTooltip
                                        ref={(el) => {
                                          const uniqueLanguageKey = `${term.term_code}-${instructorName.replace(/\s+/g, '-')}-${teachingLanguage}`;
                                          if (el) tooltipRefs.current[`lang-${uniqueLanguageKey}`] = el;
                                        }}
                                        content={t('filter.clickToFilterByTeachingLanguage', { language: getTeachingLanguageName(teachingLanguage, t) })}
                                        hasClickAction={true}
                                        clickActionText={t('tooltip.clickAgainToFilter')}
                                        open={isMobile ? (() => {
                                          const uniqueLanguageKey = `${term.term_code}-${instructorName.replace(/\s+/g, '-')}-${teachingLanguage}`;
                                          return teachingLanguageTooltipStates[uniqueLanguageKey] || false;
                                        })() : undefined}
                                        onOpenChange={isMobile ? (open) => {
                                          const uniqueLanguageKey = `${term.term_code}-${instructorName.replace(/\s+/g, '-')}-${teachingLanguage}`;
                                          setTeachingLanguageTooltipStates(prev => ({ ...prev, [uniqueLanguageKey]: open }));
                                        } : undefined}
                                        onReset={() => {
                                          const uniqueLanguageKey = `${term.term_code}-${instructorName.replace(/\s+/g, '-')}-${teachingLanguage}`;
                                          resetTeachingLanguageTooltipState(uniqueLanguageKey);
                                        }}
                                      >
                                        <button
                                          onClick={(e) => {
                                            const uniqueLanguageKey = `${term.term_code}-${instructorName.replace(/\s+/g, '-')}-${teachingLanguage}`;
                                            if (e) {
                                              e.stopPropagation();
                                              e.preventDefault();
                                            }
                                            
                                            if (isMobile) {
                                              // Mobile/tablet: require 2 taps to apply filter
                                              const currentTapCount = teachingLanguageTapCounts[teachingLanguage] || 0;
                                              const newTapCount = currentTapCount + 1;
                                              
                                              // Clear existing timeout for this unique key
                                              const refKey = `lang-${uniqueLanguageKey}`;
                                              if (timeoutRefs.current[refKey]) {
                                                clearTimeout(timeoutRefs.current[refKey]);
                                              }
                                              
                                              setTeachingLanguageTapCounts(prev => ({
                                                ...prev,
                                                [teachingLanguage]: newTapCount
                                              }));
                                              
                                              if (newTapCount === 1) {
                                                // First tap: show tooltip
                                                setTeachingLanguageTooltipStates(prev => ({
                                                  ...prev,
                                                  [uniqueLanguageKey]: true
                                                }));
                                                
                                                // Reset after 3 seconds
                                                timeoutRefs.current[refKey] = setTimeout(() => {
                                                  setTeachingLanguageTapCounts(prev => ({
                                                    ...prev,
                                                    [teachingLanguage]: 0
                                                  }));
                                                  setTeachingLanguageTooltipStates(prev => ({
                                                    ...prev,
                                                    [uniqueLanguageKey]: false
                                                  }));
                                                }, 3000);
                                              } else if (newTapCount === 2) {
                                                // Second tap: apply filter and close tooltip
                                                applyTeachingLanguageFilter(teachingLanguage);
                                                resetTeachingLanguageTooltipState(uniqueLanguageKey);
                                              }
                                            } else {
                                              // Desktop: 1 tap to apply filter
                                              applyTeachingLanguageFilter(teachingLanguage);
                                            }
                                          }}
                                          className={`px-2 py-1 text-xs transition-colors border-0 font-mono ${
                                            (() => {
                                              const currentLanguageValues = Array.isArray(selectedTeachingLanguageFilter) ? selectedTeachingLanguageFilter : (selectedTeachingLanguageFilter === 'all' ? [] : [selectedTeachingLanguageFilter]);
                                              const isLanguageSelected = currentLanguageValues.includes(teachingLanguage);
                                              return isLanguageSelected
                                                ? 'bg-orange-500 text-orange-50 font-bold'
                                                : 'bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/10 dark:text-orange-400 dark:hover:bg-orange-900/20';
                                            })()
                                          }`}
                                        >
                                          {teachingLanguage}
                                        </button>
                                      </ResponsiveTooltip>
                                    </div>
                                  ) : (
                                    // Fallback to term-only badge if no teaching language
                                    <ResponsiveTooltip
                                      ref={(el) => {
                                        if (el) tooltipRefs.current[`term-${term.term_code}`] = el;
                                      }}
                                      content={t('filter.clickToFilterByTerm', { term: term.name })}
                                      hasClickAction={true}
                                      clickActionText={t('tooltip.clickAgainToFilter')}
                                      open={isMobile ? termTooltipStates[term.term_code] || false : undefined}
                                      onOpenChange={isMobile ? (open) => setTermTooltipStates(prev => ({ ...prev, [term.term_code]: open })) : undefined}
                                      onReset={() => resetTermTooltipState(term.term_code)}
                                    >
                                      <button
                                        onClick={(e) => {
                                          handleTermBadgeClick(term.term_code, e);
                                        }}
                                        className={`px-2 py-1 text-xs rounded-md transition-colors border ${
                                          (() => {
                                            const currentValues = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter === 'all' ? [] : [selectedTermFilter]);
                                            return currentValues.includes(term.term_code)
                                              ? 'bg-primary text-primary-foreground border-primary'
                                              : 'bg-background hover:bg-muted border-border hover:border-primary/50';
                                          })()
                                        }`}
                                      >
                                        {term.name}
                                      </button>
                                    </ResponsiveTooltip>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
          </div>
        </TabsContent>

        {/* Grade Distribution Tab */}
        <TabsContent value="grades" className="attached-tab-content mt-0">
          <div className="p-0 space-y-4">
            {/* 成績分佈圖表 */}
            {!reviewsLoading && allReviewsForChart.length > 0 ? (
              <div>
                <GradeDistributionChart
                  gradeDistribution={calculateGradeDistributionFromReviews(filteredReviewsForChart.map(review => ({ course_final_grade: review.review.course_final_grade })))}
                  loading={reviewsLoading}
                  title={t('chart.gradeDistribution')}
                  height={120}
                  showPercentage={true}
                  className="bg-transparent border-transparent"
                  context="course"
                  filterOptions={gradeChartFilterOptions}
                  selectedFilter={selectedGradeChartFilter}
                  onFilterChange={setSelectedGradeChartFilter}
                  filterLabel={t('chart.filterByInstructor')}
                  rawReviewData={allReviewsForChart}
                  defaultExpanded={true}
                  hideHeader={true}
                  showNAGrades={showNAGrades}
                  onNAToggleChange={handleNAToggleChange}
                  onBarClick={(grade) => {
                    // 設置成績篩選並滾動到學生評論區域
                    setExternalGradeFilter(grade);
                    
                    // 短暫延遲後滾動，讓篩選生效
                    setTimeout(() => {
                      const studentReviewsElement = document.getElementById('student-reviews');
                      if (studentReviewsElement) {
                        studentReviewsElement.scrollIntoView({ 
                          behavior: 'smooth', 
                          block: 'start' 
                        });
                      }
                    }, 100);
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-muted/50 rounded-full">
                    <Info className="h-12 w-12 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-muted-foreground">{t('chart.noGradeData')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('chart.noGradeDataDescription')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Past Exam Papers Tab */}
        <TabsContent value="materials" className="attached-tab-content mt-0">
          <div className="p-6">
            {user ? (
              studyMaterialsLoading && !studyMaterialsLoaded ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : studyMaterialsError ? (
                <div className="text-center py-12 space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-muted/50 rounded-full">
                      <AlertCircle className="h-12 w-12 text-destructive" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{studyMaterialsError}</p>
                </div>
              ) : studyMaterials.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-muted/50 rounded-full">
                      <BookText className="h-12 w-12 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('pages.courseDetail.noStudyMaterials')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Personal-use notice for specific courses (LCC1010 / LCC2010) */}
                  {['LCC1010', 'LCC2010'].includes((course.course_code || '').toUpperCase()) && (
                    <div className="flex items-center gap-2 rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{t('pages.courseDetail.studyMaterialsPersonalUseNotice')}</span>
                    </div>
                  )}
                  {/* Toolbar: select-all + count + bulk download (no filters) */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
                        <Checkbox
                          checked={allStudyMaterialsSelected ? true : someStudyMaterialsSelected ? 'indeterminate' : false}
                          onCheckedChange={toggleSelectAllStudyMaterials}
                          aria-label={t('pages.courseDetail.examPapersSelectAll')}
                        />
                        <span className="text-sm">{t('pages.courseDetail.examPapersSelectAll')}</span>
                      </label>
                      <span className="text-xs text-muted-foreground truncate">
                        {selectedStudyMaterialCount > 0
                          ? `${t('pages.courseDetail.examPapersSelectedCount', { count: selectedStudyMaterialCount })}${
                              selectedStudyMaterialsSize > 0 ? ` · ${formatExamPaperSize(selectedStudyMaterialsSize)}` : ''
                            }`
                          : t('pages.courseDetail.examPapersResultCount', {
                              filtered: sortedStudyMaterials.length,
                              total: studyMaterials.length,
                            })}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="h-8 shrink-0"
                      disabled={selectedStudyMaterialCount === 0 || studyMaterialsDownloading}
                      onClick={handleDownloadSelectedStudyMaterials}
                    >
                      {studyMaterialsDownloading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {studyMaterialsDownloading
                        ? t('pages.courseDetail.examPapersDownloading')
                        : t('pages.courseDetail.examPapersDownloadSelected', { count: selectedStudyMaterialCount })}
                    </Button>
                  </div>

                  {(() => {
                    const totalPages = Math.max(1, Math.ceil(sortedStudyMaterials.length / STUDY_MATERIALS_PAGE_SIZE));
                    const currentPage = Math.min(studyMaterialsCurrentPage, totalPages);
                    const startIdx = (currentPage - 1) * STUDY_MATERIALS_PAGE_SIZE;
                    const pagePapers = sortedStudyMaterials.slice(startIdx, startIdx + STUDY_MATERIALS_PAGE_SIZE);
                    return (
                    <>
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                      {pagePapers.map(paper => {
                        const sizeLabel = formatExamPaperSize(paper.sizeOriginal);
                        const viewUrl = storage.getFileView({ bucketId: 'study_materials', fileId: paper.id });
                        const isSelected = selectedStudyMaterialIds.has(paper.id);
                        return (
                          <div
                            key={paper.id}
                            className={`flex items-center gap-2.5 p-3 rounded-lg border shadow-sm hover:shadow-md transition-all min-w-0 cursor-pointer select-none ${
                              isSelected
                                ? 'bg-primary/5 border-primary ring-1 ring-primary'
                                : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-muted/40'
                            }`}
                            onClick={() => toggleStudyMaterialSelection(paper.id)}
                          >
                            <div onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleStudyMaterialSelection(paper.id)}
                                aria-label={paper.displayName}
                                className="shrink-0"
                              />
                            </div>
                            <div className="p-1.5 bg-muted/50 rounded-md shrink-0">
                              <BookText className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{paper.displayName}</div>
                              {sizeLabel && (
                                <div className="text-xs text-muted-foreground truncate">{sizeLabel}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                title={t('pages.courseDetail.examPaperViewFile')}
                                aria-label={t('pages.courseDetail.examPaperViewFile')}
                                onClick={(e) => { e.stopPropagation(); setPdfViewer({ src: viewUrl.toString(), title: paper.name, persist: true }); }}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {totalPages > 1 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setStudyMaterialsCurrentPage}
                        itemsPerPage={STUDY_MATERIALS_PAGE_SIZE}
                        totalItems={sortedStudyMaterials.length}
                      />
                    )}
                    </>
                    );
                  })()}
                </div>
              )
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-muted/50 rounded-full">
                    <Lock className="h-12 w-12 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-lg font-medium">{t('pages.courseDetail.studyMaterialsSignUpTitle')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('pages.courseDetail.studyMaterialsSignUpDescription')}
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <Button onClick={() => navigate('/register')}>
                    {t('auth.signUp')}
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/login')}>
                    {t('auth.login')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="exams" className="attached-tab-content mt-0">
          <div className="p-6">
            {user ? (
              examPapersLoading && !examPapersLoaded ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : examPapersError ? (
                <div className="text-center py-12 space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-muted/50 rounded-full">
                      <AlertCircle className="h-12 w-12 text-destructive" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{examPapersError}</p>
                </div>
              ) : examPapers.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-muted/50 rounded-full">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('pages.courseDetail.noExamPapers')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Toolbar: sort + year filter + instructor filter + result count */}
                  <div className="flex flex-col gap-3">
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      <Select value={examPapersSort} onValueChange={v => setExamPapersSort(v as 'newest' | 'oldest')}>
                        <SelectTrigger className="h-8" aria-label={t('pages.courseDetail.examPapersSortLabel')}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">{t('pages.courseDetail.examPapersSortNewest')}</SelectItem>
                          <SelectItem value="oldest">{t('pages.courseDetail.examPapersSortOldest')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <MultiSelectDropdown
                        options={examPapersYearOptions}
                        selectedValues={examPapersYearFilter}
                        onSelectionChange={setExamPapersYearFilter}
                        placeholder={t('pages.courseDetail.examPapersFilterYearPlaceholder')}
                        totalCount={examPapers.length}
                      />
                      {examPapersInstructorOptions.length > 0 && (
                        <MultiSelectDropdown
                          options={examPapersInstructorOptions}
                          selectedValues={examPapersInstructorFilter}
                          onSelectionChange={setExamPapersInstructorFilter}
                          placeholder={t('pages.courseDetail.examPapersFilterInstructorPlaceholder')}
                          totalCount={examPapers.length}
                        />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {filteredExamPapers.length > 0 && (
                          <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
                            <Checkbox
                              checked={allExamPapersSelected ? true : someExamPapersSelected ? 'indeterminate' : false}
                              onCheckedChange={toggleSelectAllExamPapers}
                              aria-label={t('pages.courseDetail.examPapersSelectAll')}
                            />
                            <span className="text-sm">{t('pages.courseDetail.examPapersSelectAll')}</span>
                          </label>
                        )}
                        <span className="text-xs text-muted-foreground truncate">
                          {selectedExamPaperCount > 0
                            ? `${t('pages.courseDetail.examPapersSelectedCount', { count: selectedExamPaperCount })}${
                                selectedExamPapersSize > 0 ? ` · ${formatExamPaperSize(selectedExamPapersSize)}` : ''
                              }`
                            : t('pages.courseDetail.examPapersResultCount', {
                                filtered: filteredExamPapers.length,
                                total: examPapers.length,
                              })}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="h-8 shrink-0"
                        disabled={selectedExamPaperCount === 0 || examPapersDownloading}
                        onClick={handleDownloadSelectedExamPapers}
                      >
                        {examPapersDownloading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        {examPapersDownloading
                          ? t('pages.courseDetail.examPapersDownloading')
                          : t('pages.courseDetail.examPapersDownloadSelected', { count: selectedExamPaperCount })}
                      </Button>
                    </div>
                  </div>

                  {filteredExamPapers.length === 0 ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="flex justify-center">
                        <div className="p-4 bg-muted/50 rounded-full">
                          <FileText className="h-12 w-12 text-muted-foreground" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t('pages.courseDetail.examPapersNoMatch')}
                      </p>
                    </div>
                  ) : (() => {
                    const totalPages = Math.max(1, Math.ceil(filteredExamPapers.length / EXAM_PAPERS_PAGE_SIZE));
                    const currentPage = Math.min(examPapersCurrentPage, totalPages);
                    const startIdx = (currentPage - 1) * EXAM_PAPERS_PAGE_SIZE;
                    const pagePapers = filteredExamPapers.slice(startIdx, startIdx + EXAM_PAPERS_PAGE_SIZE);
                    return (
                    <>
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                      {pagePapers.map(paper => {
                        const termLabel = paper.term?.label || t('pages.courseDetail.examPaperTermFallback');
                        const sizeLabel = formatExamPaperSize(paper.sizeOriginal);
                        const viewUrl = storage.getFileView({ bucketId: 'past_exam_papers', fileId: paper.id });
                        const isSelected = selectedExamPaperIds.has(paper.id);
                        return (
                          <div
                            key={paper.id}
                            className={`flex flex-col gap-2 p-3 rounded-lg border shadow-sm hover:shadow-md transition-all min-w-0 cursor-pointer select-none ${
                              isSelected
                                ? 'bg-primary/5 border-primary ring-1 ring-primary'
                                : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-muted/40'
                            }`}
                            onClick={() => toggleExamPaperSelection(paper.id)}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleExamPaperSelection(paper.id)}
                                  aria-label={termLabel}
                                  className="shrink-0"
                                />
                              </div>
                              <div className="p-1.5 bg-muted/50 rounded-md shrink-0">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{termLabel}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {sizeLabel || paper.name}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  title={t('pages.courseDetail.examPaperViewFile')}
                                  aria-label={t('pages.courseDetail.examPaperViewFile')}
                                  onClick={(e) => { e.stopPropagation(); setPdfViewer({ src: viewUrl.toString(), title: paper.name, persist: false }); }}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {paper.lectureInstructors.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 pl-1">
                                <UserCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                {paper.lectureInstructors.map(ins => {
                                  const formatted = getFormattedInstructorName(ins, language);
                                  const label = formatted.secondary
                                    ? `${formatted.primary} · ${formatted.secondary}`
                                    : formatted.primary;
                                  const isShell = ins.$id.startsWith('shell:');
                                  return (
                                    <Badge
                                      key={ins.name}
                                      variant="outline"
                                      className={`text-xs font-normal bg-background border-gray-300 dark:border-gray-600 text-foreground transition-colors ${isShell ? '' : 'cursor-pointer hover:bg-muted hover:border-gray-400 dark:hover:border-gray-500'}`}
                                      onClick={isShell ? undefined : (e) => { e.stopPropagation(); navigate(`/instructors/${encodeURIComponent(ins.name)}`); }}
                                      title={label}
                                    >
                                      {formatted.primary}
                                    </Badge>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {totalPages > 1 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setExamPapersCurrentPage}
                        itemsPerPage={EXAM_PAPERS_PAGE_SIZE}
                        totalItems={filteredExamPapers.length}
                      />
                    )}
                    </>
                    );
                  })()}
                </div>
              )
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-muted/50 rounded-full">
                    <Lock className="h-12 w-12 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-lg font-medium">{t('pages.courseDetail.examPapersSignUpTitle')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('pages.courseDetail.examPapersSignUpDescription')}
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <Button onClick={() => navigate('/register')}>
                    {t('auth.signUp')}
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/login')}>
                    {t('auth.login')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>


      </Tabs>

      <PdfViewerDialog
        src={pdfViewer?.src ?? null}
        title={pdfViewer?.title}
        open={!!pdfViewer}
        persistState={pdfViewer?.persist ?? false}
        onOpenChange={(o) => { if (!o) setPdfViewer(null); }}
      />
    </div>
  );
};

export default CourseDetail;