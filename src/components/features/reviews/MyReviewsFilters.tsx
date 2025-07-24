import { useLanguage } from '@/hooks/useLanguage';
import { processPluralTranslation, getTeachingLanguageName } from '@/utils/textUtils';
import { isCurrentTerm } from '@/utils/dateUtils';
import { sortGradesDescending } from '@/utils/gradeUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';
import {
  X,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Search,
  Sparkles,
  Hash,
  Calendar,
  GraduationCap,
  Library,
  Grid3X3,
  Clock,
  Brain,
  Target,
  ThumbsUp,
  ThumbsDown,
  Users,
  ChevronDown,
  Filter,
  MessageSquare,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Removed unused Select imports - now using MultiSelectDropdown for all filters
import { Badge } from '@/components/ui/badge';
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface MyReviewFilters {
  searchTerm: string;
  selectedSubjectAreas: string[];
  selectedReviewLanguages: string[];
  selectedTerms: string[];
  selectedTeachingLanguages: string[];
  selectedGrades: string[];
  selectedSessionTypes: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  itemsPerPage: number;
  currentPage: number;
}

interface MyReviewsFiltersProps {
  filters: MyReviewFilters;
  onFiltersChange: (filters: MyReviewFilters) => void;
  courseCounts: { [key: string]: { title: string; count: number } };
  termCounts: { [key: string]: { name: string; count: number } };
  reviewLanguageCounts: { [key: string]: number };
  teachingLanguageCounts: { [key: string]: number };
  gradeCounts: { [key: string]: number };
  sessionTypeCounts: { [key: string]: number };
  totalReviews: number;
  filteredReviews: number;
  onClearAll: () => void;
}

export function MyReviewsFilters({
  filters,
  onFiltersChange,
  courseCounts,
  termCounts,
  reviewLanguageCounts,
  teachingLanguageCounts,
  gradeCounts,
  sessionTypeCounts,
  totalReviews,
  filteredReviews,
  onClearAll
}: MyReviewsFiltersProps) {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const [isSortCollapsed, setIsSortCollapsed] = useState(isMobile);

  const updateFilters = (updates: Partial<MyReviewFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  // Extract subject areas from course codes
  const subjectAreaCounts = () => {
    const counts: { [key: string]: number } = {};
    Object.keys(courseCounts).forEach(courseCode => {
      const subjectArea = courseCode.split(/\d/)[0]; // Extract letters before numbers
      counts[subjectArea] = (counts[subjectArea] || 0) + courseCounts[courseCode].count;
    });
    return counts;
  };



  const handleSubjectAreaChange = (values: string[]) => {
    updateFilters({ selectedSubjectAreas: values, currentPage: 1 });
  };

  const handleReviewLanguageChange = (values: string[]) => {
    updateFilters({ selectedReviewLanguages: values, currentPage: 1 });
  };

  const handleTermChange = (values: string[]) => {
    updateFilters({ selectedTerms: values, currentPage: 1 });
  };

  const handleTeachingLanguageChange = (values: string[]) => {
    updateFilters({ selectedTeachingLanguages: values, currentPage: 1 });
  };

  const handleGradeChange = (values: string[]) => {
    updateFilters({ selectedGrades: values, currentPage: 1 });
  };

  const handleSessionTypeChange = (values: string[]) => {
    updateFilters({ selectedSessionTypes: values, currentPage: 1 });
  };

  const handleSearchTermChange = (value: string) => {
    updateFilters({ searchTerm: value, currentPage: 1 });
  };

  const hasActiveFilters = () => {
    return (
      filters.searchTerm.trim() !== '' ||
      (filters.selectedSubjectAreas || []).length > 0 ||
      (filters.selectedReviewLanguages || []).length > 0 ||
      (filters.selectedTerms || []).length > 0 ||
      (filters.selectedTeachingLanguages || []).length > 0 ||
      (filters.selectedGrades || []).length > 0 ||
      (filters.selectedSessionTypes || []).length > 0
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm.trim()) count++;
    if ((filters.selectedSubjectAreas || []).length > 0) count++;
    if ((filters.selectedReviewLanguages || []).length > 0) count++;
    if ((filters.selectedTerms || []).length > 0) count++;
    if ((filters.selectedTeachingLanguages || []).length > 0) count++;
    if ((filters.selectedGrades || []).length > 0) count++;
    if ((filters.selectedSessionTypes || []).length > 0) count++;
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

  const availableSubjectAreas = Object.keys(subjectAreaCounts());

  // Helper function to determine if labels should be bold based on language
  const getLabelClassName = () => {
    return language === 'zh-TW' || language === 'zh-CN' 
      ? 'text-sm font-bold text-muted-foreground flex items-center gap-2 shrink-0 w-24 md:w-32'
      : 'text-sm font-medium text-muted-foreground flex items-center gap-2 shrink-0 w-24 md:w-32';
  };

  const sortOptions = [
    { value: 'postDate', label: t('sort.postDate') },
    { value: 'courseCode', label: t('sort.courseCode') },
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

  // Helper function to create subject options sorted alphabetically by subject code
  const getSubjectOptions = () => {
    const subjectCounts = subjectAreaCounts();
    
    // availableSubjectAreas contains subject codes (e.g., "BUS", "ENG", etc.)
    // which are already extracted from course codes
    const subjectsWithCodes = availableSubjectAreas.map(subjectCode => {
      return {
        subjectCode,
        count: subjectCounts[subjectCode] || 0
      };
    });

    // Sort alphabetically by subject code (A to Z)
    subjectsWithCodes.sort((a, b) => a.subjectCode.localeCompare(b.subjectCode));

    // Return options in the format expected by MultiSelectDropdown
    return subjectsWithCodes.map(({ subjectCode, count }) => ({
      value: subjectCode,
      label: `${subjectCode} - ${t(`subjectArea.${subjectCode}` as any) || subjectCode}`,
      count
    }));
  };

  // Helper function to create term options
  const getTermOptions = () => {
    return Object.entries(termCounts).map(([termCode, termInfo]) => ({
      value: termCode,
      label: termInfo.name,
      count: termInfo.count,
      status: isCurrentTerm(termCode) ? 'current' as const : 'past' as const
    }));
  };

  // Helper function to create grade options
  const getGradeOptions = () => {
    return sortGradesDescending(Object.keys(gradeCounts || {})).map((grade) => ({
      value: grade,
      label: grade === 'N/A' ? t('review.notApplicable') : 
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
      count: gradeCounts[grade] || 0
    }));
  };

  // Helper function to create session type options
  const getSessionTypeOptions = () => {
    return Object.entries(sessionTypeCounts).map(([sessionType, count]) => ({
      value: sessionType,
      label: t(`sessionType.${sessionType.toLowerCase()}`),
      count
    }));
  };

  // Helper function to create review language options
  const getReviewLanguageOptions = () => {
    return Object.entries(reviewLanguageCounts).map(([language, count]) => ({
      value: language,
      label: getLanguageDisplayName(language),
      count
    }));
  };

  // Helper function to create teaching language options
  const getTeachingLanguageOptions = () => {
    return Object.entries(teachingLanguageCounts).map(([language, count]) => ({
      value: language,
      label: getTeachingLanguageName(language, t),
      count
    }));
  };

  // Helper function to get language display name
  const getLanguageDisplayName = (language: string) => {
    switch (language) {
      case 'zh-TW':
        return t('language.traditionalChinese');
      case 'zh-CN':
        return t('language.simplifiedChinese');
      case 'en':
        return t('language.english');
      default:
        return language;
    }
  };

  // Helper function to get term label - "Term" for English, keep original for other languages
  const getTermLabel = () => {
    return language === 'en' ? t('filter.reviewTerm') : t('filter.offeredTerms');
  };

  return (
    <div className="bg-gradient-to-r from-card to-card/50 rounded-xl p-4 flex flex-col gap-2">
      {/* 智能搜索行 */}
      <div className="flex items-center gap-2">
        <label className={getLabelClassName()}>
          <Sparkles className="h-4 w-4" />
          {t('search.smartSearch')}
        </label>
        <div className="relative group flex-1">
          <Input
            type="text"
            placeholder={t('search.placeholder')}
            value={filters.searchTerm || ''}
            onChange={(e) => handleSearchTermChange(e.target.value)}
            className="pr-10 h-8 text-sm placeholder:text-muted-foreground bg-background/80 hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-muted rounded-md transition-all duration-300"
          />
          {filters.searchTerm && (
            <button
              onClick={() => handleSearchTermChange('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* 篩選器行 */}
      <div className="grid grid-cols-1 gap-2 md:gap-0 md:w-full">
        {/* Mobile: Traditional layout */}
        <div className="grid grid-cols-1 gap-2 md:hidden">
          {/* Subject Area */}
          <div className="flex items-center gap-2">
            <label className={getLabelClassName()}>
              <Library className="h-4 w-4" />
              {t('sort.subjectArea')}
            </label>
            <MultiSelectDropdown
              options={getSubjectOptions()}
              selectedValues={filters.selectedSubjectAreas || []}
              onSelectionChange={handleSubjectAreaChange}
              placeholder={t('common.all')}
              totalCount={totalReviews}
              className="flex-1 text-sm"
              showCounts={true}
              maxHeight="max-h-48"
            />
          </div>

          {/* Grade */}
          <div className="flex items-center gap-2">
            <label className={getLabelClassName()}>
              <GraduationCap className="h-4 w-4" />
              {t('sort.grade')}
            </label>
            <MultiSelectDropdown
              options={getGradeOptions()}
              selectedValues={filters.selectedGrades || []}
              onSelectionChange={handleGradeChange}
              placeholder={t('common.all')}
              totalCount={totalReviews}
              className="flex-1 text-sm"
              showCounts={true}
              maxHeight="max-h-48"
            />
          </div>

          {/* Term */}
          <div className="flex items-center gap-2">
            <label className={getLabelClassName()}>
              <Calendar className="h-4 w-4" />
              {getTermLabel()}
            </label>
            <MultiSelectDropdown
              options={getTermOptions()}
              selectedValues={filters.selectedTerms || []}
              onSelectionChange={handleTermChange}
              placeholder={t('common.all')}
              totalCount={totalReviews}
              className="flex-1 text-sm"
              showCounts={true}
              maxHeight="max-h-48"
            />
          </div>

          {/* Review Language */}
          <div className="flex items-center gap-2">
            <label className={getLabelClassName()}>
              <MessageSquare className="h-4 w-4" />
              {t('filter.reviewLanguage')}
            </label>
            <MultiSelectDropdown
              options={getReviewLanguageOptions()}
              selectedValues={filters.selectedReviewLanguages || []}
              onSelectionChange={handleReviewLanguageChange}
              placeholder={t('common.all')}
              totalCount={totalReviews}
              className="flex-1 text-sm"
              showCounts={true}
              maxHeight="max-h-48"
            />
          </div>

          {/* Session Type */}
          <div className="flex items-center gap-2">
            <label className={getLabelClassName()}>
              <Clock className="h-4 w-4" />
              {t('filter.reviewSessionType')}
            </label>
            <MultiSelectDropdown
              options={getSessionTypeOptions()}
              selectedValues={filters.selectedSessionTypes || []}
              onSelectionChange={handleSessionTypeChange}
              placeholder={t('common.all')}
              totalCount={totalReviews}
              className="flex-1 text-sm"
              showCounts={true}
              maxHeight="max-h-48"
            />
          </div>

          {/* Teaching Language */}
          <div className="flex items-center gap-2">
            <label className={getLabelClassName()}>
              <Globe className="h-4 w-4" />
              {t('filter.reviewTeachingLanguage')}
            </label>
            <MultiSelectDropdown
              options={getTeachingLanguageOptions()}
              selectedValues={filters.selectedTeachingLanguages || []}
              onSelectionChange={handleTeachingLanguageChange}
              placeholder={t('common.all')}
              totalCount={totalReviews}
              className="flex-1 text-sm"
              showCounts={true}
              maxHeight="max-h-48"
            />
          </div>
        </div>

        {/* Desktop: Flex layout matching catalog page style */}
        <div className="hidden md:flex flex-col xl:flex-row xl:items-center gap-2 overflow-hidden">
          {/* Subject Area */}
          <div className="flex items-center gap-2 xl:flex-1 min-w-0">
            <label className={getLabelClassName()}>
              <Library className="h-4 w-4" />
              {t('sort.subjectArea')}
            </label>
            <div className="flex-1 min-w-0 max-w-xs xl:max-w-none">
              <MultiSelectDropdown
                options={getSubjectOptions()}
                selectedValues={filters.selectedSubjectAreas || []}
                onSelectionChange={handleSubjectAreaChange}
                placeholder={t('common.all')}
                totalCount={totalReviews}
                className="w-full text-sm"
                showCounts={true}
                maxHeight="max-h-48"
              />
            </div>
          </div>

          {/* Grade */}
          <div className="flex items-center gap-2 xl:flex-1 min-w-0">
            <label className={getLabelClassName()}>
              <GraduationCap className="h-4 w-4" />
              {t('sort.grade')}
            </label>
            <div className="flex-1 min-w-0 max-w-xs xl:max-w-none">
              <MultiSelectDropdown
                options={getGradeOptions()}
                selectedValues={filters.selectedGrades || []}
                onSelectionChange={handleGradeChange}
                placeholder={t('common.all')}
                totalCount={totalReviews}
                className="w-full text-sm"
                showCounts={true}
                maxHeight="max-h-48"
              />
            </div>
          </div>

          {/* Term */}
          <div className="flex items-center gap-2 xl:flex-1 min-w-0">
            <label className={getLabelClassName()}>
              <Calendar className="h-4 w-4" />
              {getTermLabel()}
            </label>
            <div className="flex-1 min-w-0 max-w-xs xl:max-w-none">
              <MultiSelectDropdown
                options={getTermOptions()}
                selectedValues={filters.selectedTerms || []}
                onSelectionChange={handleTermChange}
                placeholder={t('common.all')}
                totalCount={totalReviews}
                className="w-full text-sm"
                showCounts={true}
                maxHeight="max-h-48"
              />
            </div>
          </div>

          {/* Review Language */}
          <div className="flex items-center gap-2 xl:flex-1 min-w-0">
            <label className={getLabelClassName()}>
              <MessageSquare className="h-4 w-4" />
              {t('filter.reviewLanguage')}
            </label>
            <div className="flex-1 min-w-0 max-w-xs xl:max-w-none">
              <MultiSelectDropdown
                options={getReviewLanguageOptions()}
                selectedValues={filters.selectedReviewLanguages || []}
                onSelectionChange={handleReviewLanguageChange}
                placeholder={t('common.all')}
                totalCount={totalReviews}
                className="w-full text-sm"
                showCounts={true}
                maxHeight="max-h-48"
              />
            </div>
          </div>

          {/* Session Type */}
          <div className="flex items-center gap-2 xl:flex-1 min-w-0">
            <label className={getLabelClassName()}>
              <Clock className="h-4 w-4" />
              {t('filter.reviewSessionType')}
            </label>
            <div className="flex-1 min-w-0 max-w-xs xl:max-w-none">
              <MultiSelectDropdown
                options={getSessionTypeOptions()}
                selectedValues={filters.selectedSessionTypes || []}
                onSelectionChange={handleSessionTypeChange}
                placeholder={t('common.all')}
                totalCount={totalReviews}
                className="w-full text-sm"
                showCounts={true}
                maxHeight="max-h-48"
              />
            </div>
          </div>

          {/* Teaching Language */}
          <div className="flex items-center gap-2 xl:flex-1 min-w-0">
            <label className={getLabelClassName()}>
              <Globe className="h-4 w-4" />
              {t('filter.reviewTeachingLanguage')}
            </label>
            <div className="flex-1 min-w-0 max-w-xs xl:max-w-none">
              <MultiSelectDropdown
                options={getTeachingLanguageOptions()}
                selectedValues={filters.selectedTeachingLanguages || []}
                onSelectionChange={handleTeachingLanguageChange}
                placeholder={t('common.all')}
                totalCount={totalReviews}
                className="w-full text-sm"
                showCounts={true}
                maxHeight="max-h-48"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 排序行 */}
      {isMobile ? (
        <Collapsible open={!isSortCollapsed} onOpenChange={(open) => setIsSortCollapsed(!open)}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center justify-between w-full h-10 rounded-lg transition-all duration-200 border-0 px-0"
            >
              <div className="flex items-center gap-2 w-full">
                <Filter className="h-4 w-4" />
                <span className={`${language === 'zh-TW' || language === 'zh-CN' ? 'text-sm font-bold' : 'text-sm font-medium'} text-muted-foreground`}>
                  {t('sort.by')}
                </span>
                <div className="flex-1 flex items-center" style={{ marginLeft: 'calc(96px - 24px - 0.5rem - 4ch)' }}>
                  <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                    {getSortFieldDisplayName(filters.sortBy)} {filters.sortOrder === 'desc' ? '↓' : '↑'}
                  </Badge>
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${!isSortCollapsed ? 'rotate-180' : ''}`} />
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
                    className="h-6 px-3 text-xs w-full"
                  >
                    {label}
                    {getSortIcon(value)}
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
            {t('sort.by')}
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

      {/* 底部行：每頁項目數和清除篩選器 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
        {/* 左側：每頁評論數 */}
        <div className="flex items-center gap-2">
          <label className={`${language === 'zh-TW' || language === 'zh-CN' ? 'text-sm font-bold' : 'text-sm font-medium'} text-muted-foreground flex items-center gap-2 shrink-0 whitespace-nowrap`}>
            <Grid3X3 className="h-4 w-4" />
            {t('pagination.reviewsPerPage')}
          </label>
          <div className="flex gap-2">
            {[2, 4, 8].map((count) => (
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

        {/* 右側：評論統計和清除篩選器 */}
        <div className="flex items-center gap-2">
          {/* 統計信息 */}
          <div className="text-sm text-muted-foreground">
            {hasActiveFilters() ? (
              <span>{processPluralTranslation(t('pages.courses.foundCount', { count: filteredReviews }), filteredReviews)}</span>
            ) : (
              <span>{t('myReviews.totalReviews', { count: totalReviews })}</span>
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