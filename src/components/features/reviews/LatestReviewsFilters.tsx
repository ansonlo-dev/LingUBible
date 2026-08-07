import { useLanguage } from '@/hooks/useLanguage';
import { processPluralTranslation, getSessionTypeTranslation, getTermName } from '@/utils/textUtils';
import { isCurrentTerm, getCurrentTermCode } from '@/utils/dateUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Filter,
  X,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Languages,
  CalendarDays,
  BookText,
  School,
  User,
  GraduationCap,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

// 與課程資訊頁 reviews tab（CourseReviewsFilters）同風格的篩選器，
// 用於 /reviews 全站最新評論頁。所有選項與計數皆由已載入的評論推導，
// 純客戶端運算，不產生任何額外資料庫讀取。
export interface LatestReviewFilters {
  searchTerm: string;
  selectedCourses: string[];
  selectedInstructors: string[];
  selectedGrades: string[];
  selectedTerms: string[];
  selectedLanguages: string[];
  selectedSessionTypes: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface LatestReviewsFiltersProps {
  filters: LatestReviewFilters;
  onFiltersChange: (filters: LatestReviewFilters) => void;
  courseCounts: { [key: string]: { label: string; count: number } };
  // 與 courseCounts 同形狀：key 是原始英文名（篩選值），label 已依介面語言組好
  instructorCounts: { [key: string]: { label: string; count: number } };
  gradeCounts: { [key: string]: number };
  termCounts: { [key: string]: { name: string; count: number } };
  languageCounts: { [key: string]: number };
  sessionTypeCounts: { [key: string]: number };
  totalReviews: number;
  filteredReviews: number;
  onClearAll: () => void;
}

export function LatestReviewsFilters({
  filters,
  onFiltersChange,
  courseCounts,
  instructorCounts,
  gradeCounts,
  termCounts,
  languageCounts,
  sessionTypeCounts,
  totalReviews,
  filteredReviews,
  onClearAll
}: LatestReviewsFiltersProps) {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const [isSortOpen, setIsSortOpen] = useState(false);

  const updateFilters = (updates: Partial<LatestReviewFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const hasActiveFilters = () => {
    return (filters.searchTerm || '').trim() !== '' ||
           (filters.selectedCourses || []).length > 0 ||
           (filters.selectedInstructors || []).length > 0 ||
           (filters.selectedGrades || []).length > 0 ||
           (filters.selectedTerms || []).length > 0 ||
           (filters.selectedLanguages || []).length > 0 ||
           (filters.selectedSessionTypes || []).length > 0;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if ((filters.searchTerm || '').trim() !== '') count++;
    if ((filters.selectedCourses || []).length > 0) count++;
    if ((filters.selectedInstructors || []).length > 0) count++;
    if ((filters.selectedGrades || []).length > 0) count++;
    if ((filters.selectedTerms || []).length > 0) count++;
    if ((filters.selectedLanguages || []).length > 0) count++;
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
      updateFilters({ sortBy: field, sortOrder: 'desc' }); // 預設為降序，因為通常想看最新/最高評分的
    }
  };

  const getLanguageDisplayName = (reviewLanguage: string) => {
    const languageMap: { [key: string]: string } = {
      'en': t('language.english'),
      'zh-TW': t('language.traditionalChinese'),
      'zh-CN': t('language.simplifiedChinese')
    };
    return languageMap[reviewLanguage] || reviewLanguage;
  };

  const sortOptions = [
    { value: 'postDate', label: t('sort.postDate') },
    { value: 'workload', label: t('sort.workload') },
    { value: 'difficulty', label: t('sort.difficulty') },
    { value: 'usefulness', label: t('sort.usefulness') },
    { value: 'grade', label: t('sort.grade') },
    { value: 'upvotes', label: t('sort.upvotes') },
    { value: 'downvotes', label: t('sort.downvotes') }
  ];

  const getSortFieldDisplayName = (sortBy: string): string => {
    const sortOption = sortOptions.find(option => option.value === sortBy);
    return sortOption ? sortOption.label : sortBy;
  };

  const getLabelClassName = () => {
    return language === 'zh-TW' || language === 'zh-CN'
      ? 'text-sm font-bold text-muted-foreground flex items-center gap-2 shrink-0 w-24'
      : 'text-sm font-medium text-muted-foreground flex items-center gap-2 shrink-0 w-24';
  };

  const gradeOptionLabel = (grade: string) =>
    grade === 'N/A' ? t('review.notApplicable') :
      `${grade}${(() => {
        switch (grade) {
          case 'A': return ' (4.00)';
          case 'A-': return ' (3.67)';
          case 'B+': return ' (3.33)';
          case 'B': return ' (3.00)';
          case 'B-': return ' (2.67)';
          case 'C+': return ' (2.33)';
          case 'C': return ' (2.00)';
          case 'C-': return ' (1.67)';
          case 'D+': return ' (1.33)';
          case 'D': return ' (1.00)';
          case 'F': return ' (0.00)';
          default: return '';
        }
      })()}`;

  const courseOptions = Object.entries(courseCounts || {}).map(([code, data]) => ({
    value: code,
    label: data.label,
    count: data.count
  }));

  const instructorOptions = Object.entries(instructorCounts || {}).map(([instructor, data]) => ({
    value: instructor,
    label: data.label,
    count: data.count
  }));

  const gradeOptions = Object.entries(gradeCounts || {}).map(([grade, count]) => ({
    value: grade,
    label: gradeOptionLabel(grade),
    count: count
  }));

  const termFilterOptions = Object.entries(termCounts || {}).map(([termCode, termData]) => ({
    value: termCode,
    // fallback 學期（UNKNOWN / *_on_or_before 等）的 name 是原始代碼，交由 getTermName 翻譯
    label: getTermName(termData.name, t),
    count: termData.count,
    status: isCurrentTerm(termCode) ? 'current' :
           (termCode < getCurrentTermCode() ? 'past' : 'future')
  }));

  const languageOptions = Object.entries(languageCounts || {}).map(([lang, count]) => ({
    value: lang,
    label: getLanguageDisplayName(lang),
    count: count
  }));

  const sessionTypeOptions = Object.entries(sessionTypeCounts || {}).map(([sessionType, count]) => ({
    value: sessionType,
    label: getSessionTypeTranslation(sessionType, t),
    count: count
  }));

  const filterConfigs = [
    { key: 'selectedCourses' as const, label: t('nav.courses'), icon: BookText, options: courseOptions },
    { key: 'selectedInstructors' as const, label: t('filter.reviewInstructor'), icon: User, options: instructorOptions },
    { key: 'selectedGrades' as const, label: t('filter.grade'), icon: GraduationCap, options: gradeOptions },
    { key: 'selectedTerms' as const, label: t('filter.reviewTerm'), icon: CalendarDays, options: termFilterOptions },
    { key: 'selectedLanguages' as const, label: t('filter.reviewLanguage'), icon: Languages, options: languageOptions },
    { key: 'selectedSessionTypes' as const, label: t('filter.reviewSessionType'), icon: School, options: sessionTypeOptions },
  ];

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
            placeholder={t('latestReviews.searchPlaceholder')}
            value={filters.searchTerm || ''}
            onChange={(e) => updateFilters({ searchTerm: e.target.value })}
            className="pr-10 h-8 text-sm placeholder:text-muted-foreground bg-background/80 hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-muted rounded-md transition-all duration-300"
          />
          {filters.searchTerm && (
            <button
              onClick={() => updateFilters({ searchTerm: '' })}
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
          {filterConfigs.map(({ key, label, icon: Icon, options }) => (
            <div key={key} className="flex items-center gap-2">
              <label className={getLabelClassName()}>
                <Icon className="h-4 w-4" />
                {label}
              </label>
              <MultiSelectDropdown
                options={options}
                selectedValues={filters[key]}
                onSelectionChange={(values) => updateFilters({ [key]: values } as Partial<LatestReviewFilters>)}
                placeholder={t('common.all')}
                totalCount={totalReviews}
                className="flex-1 h-10 text-sm"
                showCounts={true}
                maxHeight="max-h-48"
              />
            </div>
          ))}
        </div>

        {/* Desktop: Two-row layout with labels above dropdowns */}
        <div className="hidden md:block">
          {/* Labels row */}
          <div className="flex gap-2 mb-2">
            {filterConfigs.map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex-1 flex items-center gap-1 text-sm font-medium text-muted-foreground px-1">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Dropdowns row */}
          <div className="flex gap-2">
            {filterConfigs.map(({ key, options }) => (
              <div key={key} className="flex-1">
                <MultiSelectDropdown
                  options={options}
                  selectedValues={filters[key]}
                  onSelectionChange={(values) => updateFilters({ [key]: values } as Partial<LatestReviewFilters>)}
                  placeholder={t('common.all')}
                  totalCount={totalReviews}
                  className="w-full h-10 text-sm"
                  showCounts={true}
                />
              </div>
            ))}
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
              <div className="flex items-center gap-2 min-w-0">
                <Filter className="h-4 w-4 shrink-0" />
                <span className={`${language === 'zh-TW' || language === 'zh-CN' ? 'text-sm font-bold' : 'text-sm font-medium'} text-muted-foreground shrink-0`}>
                  {t('sort.sortBy')}
                </span>
                <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 ml-2">
                  {getSortFieldDisplayName(filters.sortBy)} {filters.sortOrder === 'desc' ? '↓' : '↑'}
                </Badge>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 shrink-0 ${isSortOpen ? 'rotate-180' : ''}`} />
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

      {/* 統計信息和清除篩選器 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          {hasActiveFilters() ? (
            <span>{processPluralTranslation(t('pages.courseDetail.filteredReviewsCount', { count: filteredReviews }), filteredReviews)}</span>
          ) : (
            <span>{processPluralTranslation(t('pages.courseDetail.totalReviewsCount', { count: totalReviews }), totalReviews)}</span>
          )}
        </div>

        {hasActiveFilters() && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="flex items-center gap-2 h-8 px-3 text-xs rounded-lg transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground w-fit"
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
  );
}
