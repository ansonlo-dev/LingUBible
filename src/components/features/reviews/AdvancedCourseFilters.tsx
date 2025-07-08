import { useLanguage } from '@/hooks/useLanguage';
import { getCurrentTermCode, getTermDisplayName, isCurrentTerm } from '@/utils/dateUtils';
import { CourseService, Term } from '@/services/api/courseService';
import { useEffect, useState } from 'react';
import {
  Filter,
  Search,
  X,
  Sparkles,
  Calendar,
  Hash,
  BookText,
  Building2,
  Library,
  Brain,
  Target,
  Clock,
  Users,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  MessageSquare,
  Grid3X3,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MultiSelectDropdown, SelectOption } from '@/components/ui/multi-select-dropdown';

// Helper function to get faculty by department name
const getFacultyByDepartment = (department: string): string => {
  const facultyMapping: { [key: string]: string } = {
    // Faculty of Arts
    'Chinese': 'faculty.arts',
    'Cultural Studies': 'faculty.arts',
    'Digital Arts and Creative Industries': 'faculty.arts',
    'English': 'faculty.arts',
    'History': 'faculty.arts',
    'Philosophy': 'faculty.arts',
    'Translation': 'faculty.arts',
    'Centre for English and Additional Languages': 'faculty.arts',
    'Centre for Chinese Language and Assessment': 'faculty.arts',
    // Faculty of Business
    'Accountancy': 'faculty.business',
    'Finance': 'faculty.business',
    'Management': 'faculty.business',
    'Marketing and International Business': 'faculty.business',
    'Operations and Risk Management': 'faculty.business',
    // Faculty of Social Sciences
    'Psychology': 'faculty.socialSciences',
    'Economics': 'faculty.socialSciences',
    'Government and International Affairs': 'faculty.socialSciences',
    'Sociology and Social Policy': 'faculty.socialSciences',
    // Core and Other
    'Core Office': 'faculty.core',
    'Science Unit': 'faculty.core',
    'Lui Che Woo Music and Arts': 'faculty.core',
    'Chan Shu-Ming Data Science Institute': 'faculty.core',
  };
  return facultyMapping[department] || 'faculty.other';
};

// Helper function to get subject code from department name
const getSubjectCodeFromDepartment = (department: string): string => {
  const mapping: { [key: string]: string } = {
    'English': 'ENG',
    'Chinese': 'CHI', 
    'Management': 'MGT',
    'Business': 'BUS',
    'Psychology': 'PSY',
    'Economics': 'ECO',
    'Philosophy': 'PHI',
    'History': 'HST',
    'Digital Arts and Creative Industries': 'CLA',
    'Computer Science': 'CS',
    'Mathematics': 'MATH',
    'Physics': 'PHYS',
    'Chemistry': 'CHEM',
    'Biology': 'BIO',
    'Sociology': 'SOC',
    'Political Science': 'POLS',
    'Anthropology': 'ANTH',
    'Geography': 'GEOG',
    'Environmental Studies': 'ENVS',
    'Art': 'ART',
    'Music': 'MUS',
    'Theatre': 'THEA',
    'Film Studies': 'FILM',
    'Journalism': 'JOUR',
    'Communication': 'COMM',
    'Education': 'EDU',
    'Social Work': 'SW',
    'Law': 'LAW',
    'Medicine': 'MED',
    'Nursing': 'NURS',
    'Engineering': 'ENG',
    'Architecture': 'ARCH'
  };
  
  return mapping[department] || department.substring(0, 3).toUpperCase();
};

/**
 * Maps database language codes to user-friendly language names
 */
const mapLanguageCode = (courseLanguage: string): string => {
  if (courseLanguage === 'E') {
    return 'English';
  } else if (courseLanguage === 'C') {
    return 'Mandarin Chinese';
  } else if (courseLanguage === 'English') {
    return 'English';
  } else if (courseLanguage === 'Mandarin Chinese') {
    return 'Mandarin Chinese';
  }
  // Default to English for any unrecognized codes
  return 'English';
};

export interface CourseFilters {
  searchTerm: string;
  subjectArea: string[];
  teachingLanguage: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  offeredTerm: string[];
  itemsPerPage: number;
  currentPage: number;
}

interface AdvancedCourseFiltersProps {
  filters: CourseFilters;
  onFiltersChange: (filters: CourseFilters) => void;
  availableSubjects: string[];
  onClearAll: () => void;
  totalCourses?: number;
  filteredCourses?: number;
  courses?: any[]; // Add courses data for count calculation
}

export function AdvancedCourseFilters({
  filters,
  onFiltersChange,
  availableSubjects,
  onClearAll,
  totalCourses = 0,
  filteredCourses = 0,
  courses = []
}: AdvancedCourseFiltersProps) {
  const { t, language } = useLanguage();
  const [availableTerms, setAvailableTerms] = useState<Term[]>([]);
  const [termsLoading, setTermsLoading] = useState(true);
  const [termCoursesMap, setTermCoursesMap] = useState<Map<string, Set<string>>>(new Map());

  // Load available terms
  useEffect(() => {
    const loadAvailableTerms = async () => {
      try {
        setTermsLoading(true);
        
        // 🚀 優化：使用預加載的教學記錄數據
        console.log('🚀 Loading terms with preloaded teaching records...');
        
        // 並行加載學期和教學記錄數據
        const [terms, termCoursesMap] = await Promise.all([
          CourseService.getAllTerms(),
          CourseService.getAllTermsCoursesOfferedBatch()
        ]);
        
        // Sort terms by start_date (most recent first)
        const sortedTerms = terms.sort((a, b) => {
          const dateA = new Date(a.start_date);
          const dateB = new Date(b.start_date);
          return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
        });
        
        setAvailableTerms(sortedTerms);
        setTermCoursesMap(termCoursesMap);
        
        console.log('✅ Terms and teaching data loaded successfully');
      } catch (error) {
        console.error('Error loading terms:', error);
      } finally {
        setTermsLoading(false);
      }
    };

    loadAvailableTerms();
  }, []);

  const updateFilters = (updates: Partial<CourseFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const hasActiveFilters = () => {
    return (
      filters.searchTerm.trim() !== '' ||
      filters.subjectArea.length > 0 ||
      filters.teachingLanguage.length > 0 ||
      filters.offeredTerm.length > 0
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm.trim()) count++;
    if (filters.subjectArea.length > 0) count++;
    if (filters.teachingLanguage.length > 0) count++;
    if (filters.offeredTerm.length > 0) count++;
    return count;
  };

  const getSortIcon = (field: string) => {
    if (filters.sortBy !== field) return <ArrowUpDown className="h-4 w-4" />;
    return filters.sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const getSortButtonVariant = (field: string) => {
    return filters.sortBy === field ? 'default' : 'ghost';
  };

  const handleSort = (field: string) => {
    if (filters.sortBy === field) {
      updateFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      updateFilters({ sortBy: field, sortOrder: 'asc' });
    }
  };

  // Helper function to determine if labels should be bold based on language
  const getLabelClassName = () => {
    return language === 'zh-TW' || language === 'zh-CN' 
      ? 'text-base font-bold text-muted-foreground flex items-center gap-2 shrink-0'
      : 'text-base font-medium text-muted-foreground flex items-center gap-2 shrink-0';
  };

  // Calculate counts for each filter option
  const getSubjectCounts = () => {
    const counts: { [key: string]: number } = {};
    courses.forEach(course => {
      if (course.department) {
        counts[course.department] = (counts[course.department] || 0) + 1;
      }
    });
    return counts;
  };

  const getLanguageCounts = () => {
    const counts: { [key: string]: number } = {};
    courses.forEach(course => {
      const language = mapLanguageCode(course.course_language);
      counts[language] = (counts[language] || 0) + 1;
    });
    return counts;
  };

  const getTermCounts = () => {
    const counts: { [key: string]: number } = {};
    
    availableTerms.forEach(term => {
      // Get the actual courses offered in this term
      const coursesOfferedInTerm = termCoursesMap.get(term.term_code) || new Set();
      
      // Count how many of the current filtered courses are offered in this term
      let count = 0;
      courses.forEach(course => {
        if (coursesOfferedInTerm.has(course.course_code)) {
          count++;
        }
      });
      
      counts[term.term_code] = count;
    });
    
    return counts;
  };

  // Helper function to create grouped subject options
  const getGroupedSubjectOptions = (): SelectOption[] => {
    const groupedOptions: SelectOption[] = [];
    const subjectsByFaculty: { [key: string]: typeof availableSubjects } = {};
    
    // Group subjects by faculty
    availableSubjects.forEach(subject => {
      const faculty = getFacultyByDepartment(subject);
      if (!subjectsByFaculty[faculty]) {
        subjectsByFaculty[faculty] = [];
      }
      subjectsByFaculty[faculty].push(subject);
    });
    
    // Sort faculties for consistent order
    const sortedFaculties = Object.keys(subjectsByFaculty).sort((a, b) => {
      const order = ['faculty.arts', 'faculty.business', 'faculty.socialSciences', 'faculty.core', 'faculty.other'];
      return order.indexOf(a) - order.indexOf(b);
    });
    
    // Add grouped options
    sortedFaculties.forEach(faculty => {
      // Add faculty header (disabled option for grouping)
      groupedOptions.push({
        value: `__faculty_${faculty}`,
        label: `📚 ${t(faculty)}`,
        count: subjectsByFaculty[faculty].reduce((total, subject) => 
          total + (getSubjectCounts()[subject] || 0), 0
        )
      });
      
      // Add subjects under this faculty
      subjectsByFaculty[faculty]
        .sort((a, b) => a.localeCompare(b))
        .forEach(subject => {
          const subjectCode = getSubjectCodeFromDepartment(subject);
          groupedOptions.push({
            value: subject,
            label: `  ${subjectCode} - ${t(`subjectArea.${subjectCode}` as any) || subject}`,
            count: getSubjectCounts()[subject] || 0
          });
        });
    });
    
    return groupedOptions;
  };

  return (
    <div className="bg-gradient-to-r from-card to-card/50 rounded-xl p-6 flex flex-col gap-3">
      {/* 智能搜索行 */}
      <div className="flex items-center gap-4">
        <label className={getLabelClassName()}>
          <Sparkles className="h-4 w-4" />
          {t('search.smartSearch')}
        </label>
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary/70" />
          <Input
            type="text"
            placeholder={t('search.placeholder')}
            value={filters.searchTerm || ''}
            onChange={(e) => updateFilters({ searchTerm: e.target.value })}
            className="pl-12 pr-12 h-10 text-base bg-background/80 hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-muted rounded-lg transition-all duration-300"
          />
          {filters.searchTerm && (
            <button
              onClick={() => updateFilters({ searchTerm: '' })}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 篩選器行 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* 學科領域 */}
        <div className="flex items-center gap-3">
          <label className="text-base font-medium text-muted-foreground flex items-center gap-2 shrink-0 min-w-[120px] whitespace-nowrap">
            <Library className="h-4 w-4" />
            {t('sort.subjectArea')}
          </label>
          <div className="flex-1 min-w-0">
            <MultiSelectDropdown
              options={availableSubjects
                .sort((a, b) => {
                  const codeA = getSubjectCodeFromDepartment(a);
                  const codeB = getSubjectCodeFromDepartment(b);
                  return codeA.localeCompare(codeB);
                })
                .map(subject => {
                  const subjectCode = getSubjectCodeFromDepartment(subject);
                  return {
                    value: subject,
                    label: `${subjectCode} - ${t(`subjectArea.${subjectCode}` as any) || subject}`,
                    count: getSubjectCounts()[subject] || 0
                  };
                })}
              selectedValues={filters.subjectArea}
              onSelectionChange={(values) => updateFilters({ subjectArea: values })}
              placeholder={t('filter.allSubjects')}
              totalCount={totalCourses}
            />
          </div>
        </div>

        {/* 教學語言 */}
        <div className="flex items-center gap-3">
          <label className="text-base font-medium text-muted-foreground flex items-center gap-2 shrink-0 min-w-[120px] whitespace-nowrap">
            <BookText className="h-4 w-4" />
            {t('filter.teachingLanguage')}
          </label>
          <div className="flex-1 min-w-0">
            <MultiSelectDropdown
              options={[
                {
                  value: 'English',
                  label: t('language.english'),
                  count: getLanguageCounts()['English'] || 0
                },
                {
                  value: 'Mandarin Chinese',
                  label: t('language.mandarinChinese'),
                  count: getLanguageCounts()['Mandarin Chinese'] || 0
                }
              ]}
              selectedValues={filters.teachingLanguage}
              onSelectionChange={(values) => updateFilters({ teachingLanguage: values })}
              placeholder={t('filter.allLanguages')}
              totalCount={totalCourses}
            />
          </div>
        </div>

        {/* 開設學期 */}
        <div className="flex items-center gap-3 md:col-span-2 xl:col-span-1">
          <label className="text-base font-medium text-muted-foreground flex items-center gap-2 shrink-0 min-w-[120px] whitespace-nowrap">
            <Calendar className="h-4 w-4" />
            {t('filter.offeredTerms')}
          </label>
          <div className="flex-1 min-w-0">
            <MultiSelectDropdown
              options={availableTerms.map(term => ({
                value: term.term_code,
                label: getTermDisplayName(term.term_code),
                count: getTermCounts()[term.term_code] || 0
              }))}
              selectedValues={filters.offeredTerm}
              onSelectionChange={(values) => updateFilters({ offeredTerm: values })}
              placeholder={t('filter.allTerms')}
              totalCount={totalCourses}
            />
          </div>
        </div>

      </div>

      {/* 排序行 */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <label className={getLabelClassName()}>
          <Hash className="h-4 w-4" />
          {t('sort.by')}
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={getSortButtonVariant('code')}
            size="sm"
            onClick={() => handleSort('code')}
            className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200"
          >
            <Hash className="h-4 w-4" />
            {t('sort.courseCode')}
            {getSortIcon('code')}
          </Button>

          <Button
            variant={getSortButtonVariant('title')}
            size="sm"
            onClick={() => handleSort('title')}
            className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200"
          >
            <BookText className="h-4 w-4" />
            {t('sort.courseName')}
            {getSortIcon('title')}
          </Button>

          <Button
            variant={getSortButtonVariant('subject')}
            size="sm"
            onClick={() => handleSort('subject')}
            className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200"
          >
            <Library className="h-4 w-4" />
            {t('sort.subjectArea')}
            {getSortIcon('subject')}
          </Button>

          <Button
            variant={getSortButtonVariant('language')}
            size="sm"
            onClick={() => handleSort('language')}
            className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200"
          >
            <BookText className="h-4 w-4" />
            {t('sort.language')}
            {getSortIcon('language')}
          </Button>

          <Button
            variant={getSortButtonVariant('workload')}
            size="sm"
            onClick={() => handleSort('workload')}
            className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200"
          >
            <Clock className="h-4 w-4" />
            {t('sort.workload')}
            {getSortIcon('workload')}
          </Button>

          <Button
            variant={getSortButtonVariant('difficulty')}
            size="sm"
            onClick={() => handleSort('difficulty')}
            className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200"
          >
            <Brain className="h-4 w-4" />
            {t('sort.difficulty')}
            {getSortIcon('difficulty')}
          </Button>

          <Button
            variant={getSortButtonVariant('usefulness')}
            size="sm"
            onClick={() => handleSort('usefulness')}
            className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200"
          >
            <Target className="h-4 w-4" />
            {t('sort.usefulness')}
            {getSortIcon('usefulness')}
          </Button>

          <Button
            variant={getSortButtonVariant('reviews')}
            size="sm"
            onClick={() => handleSort('reviews')}
            className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200"
          >
            <MessageSquare className="h-4 w-4" />
            {t('sort.reviews')}
            {getSortIcon('reviews')}
          </Button>

          <Button
            variant={getSortButtonVariant('averageGPA')}
            size="sm"
            onClick={() => handleSort('averageGPA')}
            className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200"
          >
            <Award className="h-4 w-4" />
            {t('sort.averageGPA')}
            {getSortIcon('averageGPA')}
          </Button>
        </div>
      </div>

      {/* 每頁課程數和統計 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* 左側：每頁課程數 */}
        <div className="flex items-center gap-4">
          <label className={getLabelClassName()}>
            <Grid3X3 className="h-4 w-4" />
            {t('pagination.coursesPerPage')}
          </label>
          <div className="flex gap-2">
            {[6, 12, 24].map((count) => (
              <Button
                key={count}
                variant={filters.itemsPerPage === count ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilters({ itemsPerPage: count, currentPage: 1 })}
                className={`h-9 px-3 ${
                  filters.itemsPerPage === count
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted'
                }`}
              >
                {count}
              </Button>
            ))}
          </div>
        </div>

        {/* 右側：課程統計和清除篩選器 */}
        <div className="flex items-center gap-4">
          {/* 統計信息 */}
          <div className="text-sm text-muted-foreground">
            {filters.searchTerm.trim() || filters.subjectArea.length > 0 || filters.teachingLanguage.length > 0 || filters.offeredTerm.length > 0 ? (
              <span>{t('pages.courses.foundCount', { count: filteredCourses })}</span>
            ) : (
              <span>{t('pages.courses.totalCount', { count: totalCourses })}</span>
            )}
          </div>

          {/* 清除篩選器按鈕 */}
          {hasActiveFilters() && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-4 w-4" />
              {t('filter.clearAll')}
              <Badge variant="destructive" className="ml-1 text-xs">
                {getActiveFiltersCount()}
              </Badge>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 