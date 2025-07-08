import { useLanguage } from '@/hooks/useLanguage';
import { isCurrentTerm } from '@/utils/dateUtils';
import { sortGradesDescending } from '@/utils/gradeUtils';
import {
  Filter,
  X,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  MessageSquare,
  Calendar,
  Brain,
  Target,
  Clock,
  GraduationCap,
  ThumbsUp,
  ThumbsDown,
  Languages,
  Grid3X3,
  CalendarDays,
  BookOpen,
  School,
  CheckCircle,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MultiSelectDropdown, SelectOption } from '@/components/ui/multi-select-dropdown';

export interface InstructorReviewFilters {
  selectedLanguages: string[];
  selectedTerms: string[];
  selectedCourses: string[];
  selectedSessionTypes: string[];
  selectedGrades: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  itemsPerPage: number;
  currentPage: number;
}

interface InstructorReviewsFiltersProps {
  filters: InstructorReviewFilters;
  onFiltersChange: (filters: InstructorReviewFilters) => void;
  languageCounts: { [key: string]: number };
  termCounts: { [key: string]: { name: string; count: number } };
  courseCounts: { [key: string]: { title: string; count: number } };
  sessionTypeCounts: { [key: string]: number };
  gradeCounts: { [key: string]: number };
  totalReviews: number;
  filteredReviews: number;
  onClearAll: () => void;
}

export function InstructorReviewsFilters({
  filters,
  onFiltersChange,
  languageCounts,
  termCounts,
  courseCounts,
  sessionTypeCounts,
  gradeCounts,
  totalReviews,
  filteredReviews,
  onClearAll
}: InstructorReviewsFiltersProps) {
  const { t, language } = useLanguage();

  const updateFilters = (updates: Partial<InstructorReviewFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const handleLanguageChange = (values: string[]) => {
    updateFilters({ selectedLanguages: values, currentPage: 1 });
  };

  const handleTermChange = (values: string[]) => {
    updateFilters({ selectedTerms: values, currentPage: 1 });
  };

  const handleCourseChange = (values: string[]) => {
    updateFilters({ selectedCourses: values, currentPage: 1 });
  };

  const handleSessionTypeChange = (values: string[]) => {
    updateFilters({ selectedSessionTypes: values, currentPage: 1 });
  };

  const handleGradeChange = (values: string[]) => {
    updateFilters({ selectedGrades: values, currentPage: 1 });
  };

  const hasActiveFilters = () => {
    return (filters.selectedLanguages || []).length > 0 ||
           (filters.selectedTerms || []).length > 0 ||
           (filters.selectedCourses || []).length > 0 ||
           (filters.selectedSessionTypes || []).length > 0 ||
           (filters.selectedGrades || []).length > 0;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if ((filters.selectedLanguages || []).length > 0) count++;
    if ((filters.selectedTerms || []).length > 0) count++;
    if ((filters.selectedCourses || []).length > 0) count++;
    if ((filters.selectedSessionTypes || []).length > 0) count++;
    if ((filters.selectedGrades || []).length > 0) count++;
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
      updateFilters({ sortBy: field, sortOrder: 'desc' }); // 預設為降序，因為通常想看最新/最高評分的
    }
  };

  const getLanguageDisplayName = (language: string) => {
    const languageMap: { [key: string]: string } = {
      'en': t('language.english'),
      'zh-TW': t('language.traditionalChinese'),
      'zh-CN': t('language.simplifiedChinese')
    };
    return languageMap[language] || language;
  };

  const sortOptions = [
    { value: 'postDate', label: t('sort.postDate'), icon: Calendar },
    { value: 'teaching', label: t('sort.teaching'), icon: School },
    { value: 'grading', label: t('sort.grading'), icon: CheckCircle },
    { value: 'workload', label: t('sort.workload'), icon: Clock },
    { value: 'difficulty', label: t('sort.difficulty'), icon: Brain },
    { value: 'usefulness', label: t('sort.usefulness'), icon: Target },
    { value: 'grade', label: t('sort.grade'), icon: GraduationCap },
    { value: 'upvotes', label: t('sort.upvotes'), icon: ThumbsUp },
    { value: 'downvotes', label: t('sort.downvotes'), icon: ThumbsDown }
  ];



  // Helper function to determine if labels should be bold based on language
  const getLabelClassName = () => {
    return language === 'zh-TW' || language === 'zh-CN' 
      ? 'text-base font-bold text-muted-foreground flex items-center gap-2 shrink-0'
      : 'text-base font-medium text-muted-foreground flex items-center gap-2 shrink-0';
  };

  return (
    <div className="bg-gradient-to-r from-card to-card/50 rounded-xl p-6 flex flex-col gap-3">
      {/* 篩選器行 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 語言篩選 */}
        <div className="flex items-center gap-3">
          <label className={getLabelClassName()}>
            <Languages className="h-4 w-4" />
            {t('filter.reviewLanguage')}
          </label>
          <MultiSelectDropdown
            options={Object.entries(languageCounts || {}).map(([language, count]) => ({
              value: language,
              label: getLanguageDisplayName(language),
              count: count
            }))}
            selectedValues={filters.selectedLanguages}
            onSelectionChange={handleLanguageChange}
            placeholder={t('common.all')}
            totalCount={totalReviews}
            className="flex-1 h-10"
            showCounts={true}
          />
        </div>

        {/* 學期篩選 */}
        <div className="flex items-center gap-3">
          <label className={getLabelClassName()}>
            <CalendarDays className="h-4 w-4" />
            {t('filter.reviewTerm')}
          </label>
          <MultiSelectDropdown
            options={Object.entries(termCounts || {}).map(([termCode, termInfo]) => {
              if (!termInfo || typeof termInfo !== 'object') {
                return null;
              }
              return {
                value: termCode,
                label: (termInfo && termInfo.name) ? termInfo.name : termCode,
                count: (termInfo && termInfo.count) ? termInfo.count : 0,
                status: isCurrentTerm(termCode) ? 'current' : 'past'
              };
            }).filter(Boolean) as SelectOption[]}
            selectedValues={filters.selectedTerms}
            onSelectionChange={handleTermChange}
            placeholder={t('common.all')}
            totalCount={totalReviews}
            className="flex-1 h-10"
            showCounts={true}
          />
        </div>

        {/* 課程篩選 */}
        <div className="flex items-center gap-3">
          <label className={getLabelClassName()}>
            <BookOpen className="h-4 w-4" />
            {t('filter.reviewCourse')}
          </label>
          <MultiSelectDropdown
            options={Object.entries(courseCounts || {}).map(([courseCode, courseInfo]) => {
              if (!courseInfo || typeof courseInfo !== 'object') {
                return null;
              }
              return {
                value: courseCode,
                label: `${courseCode} - ${(courseInfo && courseInfo.title) ? courseInfo.title : courseCode}`,
                count: (courseInfo && courseInfo.count) ? courseInfo.count : 0
              };
            }).filter(Boolean) as SelectOption[]}
            selectedValues={filters.selectedCourses}
            onSelectionChange={handleCourseChange}
            placeholder={t('common.all')}
            totalCount={totalReviews}
            className="flex-1 h-10"
            showCounts={true}
          />
        </div>

        {/* 課堂類型篩選 */}
        <div className="flex items-center gap-3">
          <label className={getLabelClassName()}>
            <School className="h-4 w-4" />
            {t('filter.reviewSessionType')}
          </label>
          <MultiSelectDropdown
            options={Object.entries(sessionTypeCounts || {}).map(([sessionType, count]) => ({
              value: sessionType,
              label: t(`sessionType.${sessionType.toLowerCase()}`),
              count: count
            }))}
            selectedValues={filters.selectedSessionTypes}
            onSelectionChange={handleSessionTypeChange}
            placeholder={t('common.all')}
            totalCount={totalReviews}
            className="flex-1 h-10"
            showCounts={true}
          />
        </div>

        {/* 成績篩選 */}
        <div className="flex items-center gap-3">
          <label className={getLabelClassName()}>
            <GraduationCap className="h-4 w-4" />
            {t('sort.grade')}
          </label>
          <MultiSelectDropdown
            options={sortGradesDescending(Object.keys(gradeCounts || {})).map((grade) => ({
              value: grade,
              label: grade === 'N/A' ? t('review.notApplicable') : grade,
              count: gradeCounts[grade] || 0
            }))}
            selectedValues={filters.selectedGrades}
            onSelectionChange={handleGradeChange}
            placeholder={t('common.all')}
            totalCount={totalReviews}
            className="flex-1 h-10"
            showCounts={true}
          />
        </div>
      </div>

      {/* 排序選項 */}
      <div className="flex items-center gap-4">
        <label className={getLabelClassName()}>
          <Filter className="h-4 w-4" />
          {t('sort.sortBy')}
        </label>
        <div className="flex flex-wrap gap-2">
          {sortOptions.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={getSortButtonVariant(value)}
              size="sm"
              onClick={() => handleSort(value)}
              className="flex items-center gap-2 transition-all duration-200 hover:bg-red-500/10"
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
              {getSortIcon(value)}
            </Button>
          ))}
        </div>
      </div>

      {/* 每頁評論數和統計 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* 左側：每頁評論數 */}
        <div className="flex items-center gap-4">
          <label className={getLabelClassName()}>
            <Grid3X3 className="h-4 w-4" />
            {t('pagination.reviewsPerPage')}
          </label>
          <div className="flex gap-2">
            {[6, 12, 24].map((count) => (
              <Button
                key={count}
                variant={filters.itemsPerPage === count ? "default" : "ghost"}
                size="sm"
                onClick={() => updateFilters({ itemsPerPage: count, currentPage: 1 })}
                className={`h-9 px-3 ${
                  filters.itemsPerPage === count
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-red-500/10 border-0'
                }`}
              >
                {count}
              </Button>
            ))}
          </div>
        </div>

        {/* 右側：統計信息和清除篩選器 */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {hasActiveFilters() ? (
              <span>{t('pages.courseDetail.filteredReviewsCount', { count: filteredReviews })}</span>
            ) : (
              <span>{t('pages.courseDetail.totalReviewsCount', { count: totalReviews })}</span>
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
              {getActiveFiltersCount() > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 