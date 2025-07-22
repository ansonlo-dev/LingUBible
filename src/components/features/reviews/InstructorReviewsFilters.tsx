import { useLanguage } from '@/hooks/useLanguage';
import { processPluralTranslation, getTeachingLanguageName } from '@/utils/textUtils';
import { isCurrentTerm } from '@/utils/dateUtils';
import { sortGradesDescending } from '@/utils/gradeUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Filter,
  X,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Languages,
  Grid3X3,
  CalendarDays,
  BookOpen,
  School,
  CheckCircle,
  User,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  BookText,
  Award,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MultiSelectDropdown, SelectOption } from '@/components/ui/multi-select-dropdown';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

export interface InstructorReviewFilters {
  selectedLanguages: string[];
  selectedTerms: string[];
  selectedCourses: string[];
  selectedSessionTypes: string[];
  selectedTeachingLanguages: string[];
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
  teachingLanguageCounts: { [key: string]: number };
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
  teachingLanguageCounts,
  gradeCounts,
  totalReviews,
  filteredReviews,
  onClearAll
  }: InstructorReviewsFiltersProps) {
    const { t, language } = useLanguage();
    const isMobile = useIsMobile();
    const [isSortOpen, setIsSortOpen] = useState(false);

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

  const handleTeachingLanguageChange = (values: string[]) => {
    updateFilters({ selectedTeachingLanguages: values, currentPage: 1 });
  };

  const handleGradeChange = (values: string[]) => {
    updateFilters({ selectedGrades: values, currentPage: 1 });
  };

  const hasActiveFilters = () => {
    return (filters.selectedLanguages || []).length > 0 ||
           (filters.selectedTerms || []).length > 0 ||
           (filters.selectedCourses || []).length > 0 ||
           (filters.selectedSessionTypes || []).length > 0 ||
           (filters.selectedTeachingLanguages || []).length > 0 ||
           (filters.selectedGrades || []).length > 0;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if ((filters.selectedLanguages || []).length > 0) count++;
    if ((filters.selectedTerms || []).length > 0) count++;
    if ((filters.selectedCourses || []).length > 0) count++;
    if ((filters.selectedSessionTypes || []).length > 0) count++;
    if ((filters.selectedTeachingLanguages || []).length > 0) count++;
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
    { value: 'postDate', label: t('sort.postDate') },
    { value: 'teaching', label: t('sort.teaching') },
    { value: 'grading', label: t('sort.grading') },
    { value: 'workload', label: t('sort.workload') },
    { value: 'difficulty', label: t('sort.difficulty') },
    { value: 'usefulness', label: t('sort.usefulness') },
    { value: 'grade', label: t('sort.grade') },
    { value: 'upvotes', label: t('sort.upvotes') },
    { value: 'downvotes', label: t('sort.downvotes') }
  ];

  // Helper function to get sort field display name
  const getSortFieldDisplayName = (sortBy: string): string => {
    const sortOption = sortOptions.find(option => option.value === sortBy);
    return sortOption ? sortOption.label : sortBy;
  };



  // Helper function to determine if labels should be bold based on language
  const getLabelClassName = () => {
    return language === 'zh-TW' || language === 'zh-CN' 
      ? 'text-sm font-bold text-muted-foreground flex items-center gap-2 shrink-0 w-24'
      : 'text-sm font-medium text-muted-foreground flex items-center gap-2 shrink-0 w-24';
  };

  return (
    <div className="bg-gradient-to-r from-card to-card/50 rounded-xl p-4 flex flex-col gap-2">
      {/* 篩選器行 */}
      <div className="grid grid-cols-1 gap-2 md:gap-0 md:w-full">
        {/* Mobile: Traditional layout */}
        <div className="grid grid-cols-1 gap-2 md:hidden">
          {/* 課程篩選 */}
          <div className="flex items-center gap-2">
            <label className={getLabelClassName()}>
              <BookOpen className="h-4 w-4" />
              {t('filter.reviewCourse')}
            </label>
            <MultiSelectDropdown
              options={Object.entries(courseCounts || {}).map(([courseCode, courseData]) => ({
                value: courseCode,
                label: `${courseCode} - ${courseData.title}`,
                count: courseData.count
              }))}
              selectedValues={filters.selectedCourses}
              onSelectionChange={handleCourseChange}
              placeholder={t('common.all')}
              totalCount={totalReviews}
              className="flex-1 h-10 text-sm"
              showCounts={true}
              maxHeight="max-h-48"
            />
          </div>

          {/* 成績篩選 */}
          <div className="flex items-center gap-2">
            <label className={getLabelClassName()}>
              <Award className="h-4 w-4" />
              {t('filter.grade')}
            </label>
            <MultiSelectDropdown
              options={Object.entries(gradeCounts || {}).map(([grade, count]) => ({
                value: grade,
                label: grade === 'N/A' ? t('grade.notApplicable') : 
                  `${grade}${(() => {
                    switch (grade) {
                      case 'A': return '\u00A0(4.00)';
                      case 'A-': return '\u00A0(3.67)';
                      case 'B+': return '\u00A0(3.33)';
                      case 'B': return '\u00A0(3.00)';
                      case 'B-': return '\u00A0(2.67)';
                      case 'C+': return '\u00A0(2.33)';
                      case 'C': return '\u00A0(2.00)';
                      case 'C-': return '\u00A0(1.67)';
                      case 'D+': return '\u00A0(1.33)';
                      case 'D': return '\u00A0(1.00)';
                      case 'F': return '\u00A0(0.00)';
                      default: return '';
                    }
                  })()}`,
                count: count
              }))}
              selectedValues={filters.selectedGrades}
              onSelectionChange={handleGradeChange}
              placeholder={t('common.all')}
              totalCount={totalReviews}
              className="flex-1 h-10 text-sm"
              showCounts={true}
              maxHeight="max-h-48"
            />
          </div>

          {/* 學期篩選 */}
          <div className="flex items-center gap-2">
            <label className={getLabelClassName()}>
              <Calendar className="h-4 w-4" />
              {t('filter.reviewTerm')}
            </label>
            <MultiSelectDropdown
              options={Object.entries(termCounts || {}).map(([termCode, termData]) => ({
                value: termCode,
                label: termData.name,
                count: termData.count
              }))}
              selectedValues={filters.selectedTerms}
              onSelectionChange={handleTermChange}
              placeholder={t('common.all')}
              totalCount={totalReviews}
              className="flex-1 h-10 text-sm"
              showCounts={true}
              maxHeight="max-h-48"
            />
          </div>

          {/* 評論語言篩選 */}
          <div className="flex items-center gap-2">
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
              className="flex-1 h-10 text-sm"
              showCounts={true}
              maxHeight="max-h-48"
            />
          </div>

          {/* 課程類型篩選 */}
          <div className="flex items-center gap-2">
            <label className={getLabelClassName()}>
              <GraduationCap className="h-4 w-4" />
              {t('filter.reviewSessionType')}
            </label>
            <MultiSelectDropdown
              options={Object.entries(sessionTypeCounts || {}).map(([sessionType, count]) => ({
                value: sessionType,
                label: sessionType,
                count: count
              }))}
              selectedValues={filters.selectedSessionTypes}
              onSelectionChange={handleSessionTypeChange}
              placeholder={t('common.all')}
              totalCount={totalReviews}
              className="flex-1 h-10 text-sm"
              showCounts={true}
              maxHeight="max-h-48"
            />
          </div>

          {/* 教學語言篩選 */}
          <div className="flex items-center gap-2">
            <label className={getLabelClassName()}>
              <MessageSquare className="h-4 w-4" />
              {t('filter.reviewTeachingLanguage')}
            </label>
            <MultiSelectDropdown
              options={Object.entries(teachingLanguageCounts || {}).map(([language, count]) => ({
                value: language,
                label: getTeachingLanguageName(language, t),
                count: count
              }))}
              selectedValues={filters.selectedTeachingLanguages}
              onSelectionChange={handleTeachingLanguageChange}
              placeholder={t('common.all')}
              totalCount={totalReviews}
              className="flex-1 h-10 text-sm"
              showCounts={true}
              maxHeight="max-h-48"
            />
          </div>
        </div>

        {/* Desktop: Two-row layout with labels above dropdowns */}
        <div className="hidden md:block">
          {/* Labels row */}
          <div className="flex gap-2 mb-2">
            <div className="flex-1 flex items-center gap-1 text-sm font-medium text-muted-foreground px-1">
              <BookOpen className="h-4 w-4" />
              <span>{t('filter.reviewCourse')}</span>
            </div>
            <div className="flex-1 flex items-center gap-1 text-sm font-medium text-muted-foreground px-1">
              <Award className="h-4 w-4" />
              <span>{t('filter.grade')}</span>
            </div>
            <div className="flex-1 flex items-center gap-1 text-sm font-medium text-muted-foreground px-1">
              <CalendarDays className="h-4 w-4" />
              <span>{t('filter.reviewTerm')}</span>
            </div>
            <div className="flex-1 flex items-center gap-1 text-sm font-medium text-muted-foreground px-1">
              <Languages className="h-4 w-4" />
              <span>{t('filter.reviewLanguage')}</span>
            </div>
            <div className="flex-1 flex items-center gap-1 text-sm font-medium text-muted-foreground px-1">
              <GraduationCap className="h-4 w-4" />
              <span>{t('filter.reviewSessionType')}</span>
            </div>
            <div className="flex-1 flex items-center gap-1 text-sm font-medium text-muted-foreground px-1">
              <MessageSquare className="h-4 w-4" />
              <span>{t('filter.reviewTeachingLanguage')}</span>
            </div>
          </div>

          {/* Dropdowns row */}
          <div className="flex gap-2">
            <div className="flex-1">
              <MultiSelectDropdown
                options={Object.entries(courseCounts || {}).map(([courseCode, courseData]) => ({
                  value: courseCode,
                  label: `${courseCode} - ${courseData.title}`,
                  count: courseData.count
                }))}
                selectedValues={filters.selectedCourses}
                onSelectionChange={handleCourseChange}
                placeholder={t('common.all')}
                totalCount={totalReviews}
                className="w-full h-10 text-sm"
                showCounts={true}
              />
            </div>
            <div className="flex-1">
              <MultiSelectDropdown
                options={Object.entries(gradeCounts || {}).map(([grade, count]) => ({
                  value: grade,
                  label: grade === 'N/A' ? t('grade.notApplicable') : 
                    `${grade}${(() => {
                      switch (grade) {
                        case 'A': return '\u00A0(4.00)';
                        case 'A-': return '\u00A0(3.67)';
                        case 'B+': return '\u00A0(3.33)';
                        case 'B': return '\u00A0(3.00)';
                        case 'B-': return '\u00A0(2.67)';
                        case 'C+': return '\u00A0(2.33)';
                        case 'C': return '\u00A0(2.00)';
                        case 'C-': return '\u00A0(1.67)';
                        case 'D+': return '\u00A0(1.33)';
                        case 'D': return '\u00A0(1.00)';
                        case 'F': return '\u00A0(0.00)';
                        default: return '';
                      }
                    })()}`,
                  count: count
                }))}
                selectedValues={filters.selectedGrades}
                onSelectionChange={handleGradeChange}
                placeholder={t('common.all')}
                totalCount={totalReviews}
                className="w-full h-10 text-sm"
                showCounts={true}
              />
            </div>
            <div className="flex-1">
              <MultiSelectDropdown
                options={Object.entries(termCounts || {}).map(([termCode, termData]) => ({
                  value: termCode,
                  label: termData.name,
                  count: termData.count
                }))}
                selectedValues={filters.selectedTerms}
                onSelectionChange={handleTermChange}
                placeholder={t('common.all')}
                totalCount={totalReviews}
                className="w-full h-10 text-sm"
                showCounts={true}
              />
            </div>
            <div className="flex-1">
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
                className="w-full h-10 text-sm"
                showCounts={true}
              />
            </div>
            <div className="flex-1">
              <MultiSelectDropdown
                options={Object.entries(sessionTypeCounts || {}).map(([sessionType, count]) => ({
                  value: sessionType,
                  label: sessionType,
                  count: count
                }))}
                selectedValues={filters.selectedSessionTypes}
                onSelectionChange={handleSessionTypeChange}
                placeholder={t('common.all')}
                totalCount={totalReviews}
                className="w-full h-10 text-sm"
                showCounts={true}
              />
            </div>
            <div className="flex-1">
              <MultiSelectDropdown
                options={Object.entries(teachingLanguageCounts || {}).map(([language, count]) => ({
                  value: language,
                  label: getTeachingLanguageName(language, t),
                  count: count
                }))}
                selectedValues={filters.selectedTeachingLanguages}
                onSelectionChange={handleTeachingLanguageChange}
                placeholder={t('common.all')}
                totalCount={totalReviews}
                className="w-full h-10 text-sm"
                showCounts={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 排序選項 */}
      {isMobile ? (
        <Collapsible open={isSortOpen} onOpenChange={setIsSortOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center justify-between w-full h-10 rounded-lg transition-all duration-200 border-0 px-0"
            >
              <div className="flex items-center gap-2 w-full">
                <Filter className="h-4 w-4" />
                <span className={`${language === 'zh-TW' || language === 'zh-CN' ? 'text-sm font-bold' : 'text-sm font-medium'} text-muted-foreground`}>
                  {t('sort.sortBy')}
                </span>
                <div className="flex-1 flex items-center" style={{ marginLeft: 'calc(96px - 24px - 0.5rem - 4ch)' }}>
                  <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                    {getSortFieldDisplayName(filters.sortBy)} {filters.sortOrder === 'desc' ? '↓' : '↑'}
                  </Badge>
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-0.5" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {sortOptions.map(({ value, label }) => (
                  <Button
                    key={value}
                    variant={getSortButtonVariant(value)}
                    size="sm"
                    onClick={() => handleSort(value)}
                    className="flex items-center justify-center gap-1 py-2 px-1 text-xs sm:text-sm sm:gap-1.5 sm:px-2 rounded-lg transition-all duration-200 min-h-0"
                  >
                    <span className="text-center flex-1 min-w-0 leading-tight">{label}</span>
                    <span className="shrink-0">{getSortIcon(value)}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <div className="flex items-center gap-2">
          <label className={getLabelClassName()}>
            <Filter className="h-4 w-4" />
            {t('sort.sortBy')}
          </label>
          <div className="flex flex-wrap gap-2 flex-1">
            {sortOptions.map(({ value, label }) => (
              <Button
                key={value}
                variant={getSortButtonVariant(value)}
                size="sm"
                onClick={() => handleSort(value)}
                className="h-8 px-3 text-xs transition-all duration-200 hover:bg-red-500/10"
              >
                <span>{label}</span>
                {getSortIcon(value)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 每頁評論數和統計 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
        {/* 左側：每頁評論數 */}
        <div className="flex items-center gap-2">
          <label className={`${language === 'zh-TW' || language === 'zh-CN' ? 'text-sm font-bold' : 'text-sm font-medium'} text-muted-foreground flex items-center gap-2 shrink-0 whitespace-nowrap`}>
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
                className={`h-8 px-3 text-xs ${
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
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            {hasActiveFilters() ? (
              <span>{processPluralTranslation(t('pages.courseDetail.filteredReviewsCount', { count: filteredReviews }), filteredReviews)}</span>
            ) : (
              <span>{processPluralTranslation(t('pages.courseDetail.totalReviewsCount', { count: totalReviews }), totalReviews)}</span>
            )}
          </div>
          
          {/* 清除篩選器按鈕 */}
          {hasActiveFilters() && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="flex items-center gap-2 h-8 px-3 text-xs rounded-lg transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground"
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