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
  subjectArea: string;
  teachingLanguage: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  offeredTerm: string;
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
        
        setAvailableTerms(terms);
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
      filters.subjectArea !== 'all' ||
      filters.teachingLanguage !== 'all' ||
      filters.offeredTerm !== 'all'
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm.trim()) count++;
    if (filters.subjectArea !== 'all') count++;
    if (filters.teachingLanguage !== 'all') count++;
    if (filters.offeredTerm !== 'all') count++;
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 學科領域 */}
        <div className="flex items-center gap-3">
          <label className={getLabelClassName()}>
            <Library className="h-4 w-4" />
            {t('sort.subjectArea')}
          </label>
          <Select value={filters.subjectArea} onValueChange={(value) => updateFilters({ subjectArea: value })}>
            <SelectTrigger className="bg-background hover:border-primary/30 focus:border-primary h-10 rounded-lg flex-1">
              <SelectValue placeholder={t('filter.allSubjects')}>
                {filters.subjectArea === 'all' ? (
                  <span className="font-bold">{t('common.all')}</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded text-xs">
                      {getSubjectCodeFromDepartment(filters.subjectArea)}
                    </span>
                    <span className="text-sm">
                      {t(`subjectArea.${getSubjectCodeFromDepartment(filters.subjectArea)}` as any) || filters.subjectArea}
                    </span>
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 border shadow-xl">
              <SelectItem value="all" textValue={t('common.all')}>
                <span className="flex items-center gap-2">
                  <span className="font-bold">
                    {t('common.all')}
                  </span>
                  <Badge variant="secondary" className="ml-auto text-xs bg-primary/10 text-primary hover:bg-primary/10 dark:bg-primary/20 dark:text-primary-foreground dark:hover:bg-primary/20">
                    {totalCourses}
                  </Badge>
                </span>
              </SelectItem>
              {availableSubjects.map(subject => (
                <SelectItem key={subject} value={subject}>
                  <span className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded text-xs mr-2">
                      {getSubjectCodeFromDepartment(subject)}
                    </span>
                    <span className="text-sm text-foreground">
                      {t(`subjectArea.${getSubjectCodeFromDepartment(subject)}` as any) || subject}
                    </span>
                    <Badge variant="secondary" className="ml-auto text-xs bg-primary/10 text-primary hover:bg-primary/10 dark:bg-primary/20 dark:text-primary-foreground dark:hover:bg-primary/20">
                      {getSubjectCounts()[subject] || 0}
                    </Badge>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 教學語言 */}
        <div className="flex items-center gap-3">
          <label className={getLabelClassName()}>
            <BookText className="h-4 w-4" />
            {t('filter.teachingLanguage')}
          </label>
          <Select value={filters.teachingLanguage} onValueChange={(value) => updateFilters({ teachingLanguage: value })}>
            <SelectTrigger className="bg-background hover:border-primary/30 focus:border-primary h-10 rounded-lg flex-1">
              <SelectValue placeholder={t('filter.allLanguages')}>
                {filters.teachingLanguage === 'all' ? (
                  <span className="font-bold">{t('common.all')}</span>
                ) : filters.teachingLanguage === 'English' ? (
                  t('language.english')
                ) : filters.teachingLanguage === 'Mandarin Chinese' ? (
                  t('language.mandarinChinese')
                ) : (
                  filters.teachingLanguage
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 border shadow-xl">
              <SelectItem value="all" textValue={t('common.all')}>
                <span className="flex items-center gap-2">
                  <span className="font-bold">
                    {t('common.all')}
                  </span>
                  <Badge variant="secondary" className="ml-auto text-xs bg-primary/10 text-primary hover:bg-primary/10 dark:bg-primary/20 dark:text-primary-foreground dark:hover:bg-primary/20">
                    {totalCourses}
                  </Badge>
                </span>
              </SelectItem>
              <SelectItem value="English">
                <span className="flex items-center gap-2">
                  {t('language.english')}
                  <Badge variant="secondary" className="ml-auto text-xs bg-primary/10 text-primary hover:bg-primary/10 dark:bg-primary/20 dark:text-primary-foreground dark:hover:bg-primary/20">
                    {getLanguageCounts()['English'] || 0}
                  </Badge>
                </span>
              </SelectItem>
              <SelectItem value="Mandarin Chinese">
                <span className="flex items-center gap-2">
                  {t('language.mandarinChinese')}
                  <Badge variant="secondary" className="ml-auto text-xs bg-primary/10 text-primary hover:bg-primary/10 dark:bg-primary/20 dark:text-primary-foreground dark:hover:bg-primary/20">
                    {getLanguageCounts()['Mandarin Chinese'] || 0}
                  </Badge>
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 開設學期 */}
        <div className="flex items-center gap-3">
          <label className={getLabelClassName()}>
            <Calendar className="h-4 w-4" />
            {t('filter.offeredTerms')}
          </label>
          <Select value={filters.offeredTerm} onValueChange={(value) => updateFilters({ offeredTerm: value })}>
            <SelectTrigger className="bg-background hover:border-primary/30 focus:border-primary h-10 rounded-lg flex-1">
              <SelectValue placeholder={t('filter.allTerms')}>
                {filters.offeredTerm === 'all' ? (
                  <span className="font-bold">{t('common.all')}</span>
                ) : (
                  getTermDisplayName(filters.offeredTerm)
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 border shadow-xl">
              <SelectItem value="all" textValue={t('common.all')}>
                <span className="flex items-center gap-2">
                  <span className="font-bold">{t('common.all')}</span>
                  <Badge variant="secondary" className="ml-auto text-xs bg-primary/10 text-primary hover:bg-primary/10 dark:bg-primary/20 dark:text-primary-foreground dark:hover:bg-primary/20">
                    {totalCourses}
                  </Badge>
                </span>
              </SelectItem>
                             {availableTerms.map(term => (
                 <SelectItem key={term.term_code} value={term.term_code}>
                   <span className="flex items-center gap-2">
                     <div className={`w-2 h-2 ${isCurrentTerm(term.term_code) ? 'bg-green-500' : 'bg-gray-500'} rounded-full`}></div>
                     {getTermDisplayName(term.term_code)}
                     <Badge variant="secondary" className="ml-auto text-xs bg-primary/10 text-primary hover:bg-primary/10 dark:bg-primary/20 dark:text-primary-foreground dark:hover:bg-primary/20">
                       {getTermCounts()[term.term_code] || 0}
                     </Badge>
                   </span>
                 </SelectItem>
               ))}
            </SelectContent>
          </Select>
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
            {filters.searchTerm.trim() || filters.subjectArea !== 'all' || filters.teachingLanguage !== 'all' || filters.offeredTerm !== 'all' ? (
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