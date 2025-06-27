import { useLanguage } from '@/hooks/useLanguage';
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
  User,
  School
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export interface ReviewFilters {
  selectedLanguages: string[];
  selectedTerms: string[];
  selectedInstructors: string[];
  selectedSessionTypes: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  itemsPerPage: number;
  currentPage: number;
}

interface CourseReviewsFiltersProps {
  filters: ReviewFilters;
  onFiltersChange: (filters: ReviewFilters) => void;
  languageCounts: { [key: string]: number };
  termCounts: { [key: string]: { name: string; count: number } };
  instructorCounts: { [key: string]: number };
  sessionTypeCounts: { [key: string]: number };
  totalReviews: number;
  filteredReviews: number;
  onClearAll: () => void;
}

export function CourseReviewsFilters({
  filters,
  onFiltersChange,
  languageCounts,
  termCounts,
  instructorCounts,
  sessionTypeCounts,
  totalReviews,
  filteredReviews,
  onClearAll
}: CourseReviewsFiltersProps) {
  const { t } = useLanguage();

  const updateFilters = (updates: Partial<ReviewFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const handleLanguageChange = (value: string) => {
    if (value === 'all') {
      updateFilters({ selectedLanguages: [], currentPage: 1 });
    } else {
      updateFilters({ selectedLanguages: [value], currentPage: 1 });
    }
  };

  const handleTermChange = (value: string) => {
    if (value === 'all') {
      updateFilters({ selectedTerms: [], currentPage: 1 });
    } else {
      updateFilters({ selectedTerms: [value], currentPage: 1 });
    }
  };

  const handleInstructorChange = (value: string) => {
    if (value === 'all') {
      updateFilters({ selectedInstructors: [], currentPage: 1 });
    } else {
      updateFilters({ selectedInstructors: [value], currentPage: 1 });
    }
  };

  const handleSessionTypeChange = (value: string) => {
    if (value === 'all') {
      updateFilters({ selectedSessionTypes: [], currentPage: 1 });
    } else {
      updateFilters({ selectedSessionTypes: [value], currentPage: 1 });
    }
  };

  const hasActiveFilters = () => {
    return (filters.selectedLanguages || []).length > 0 ||
           (filters.selectedTerms || []).length > 0 ||
           (filters.selectedInstructors || []).length > 0 ||
           (filters.selectedSessionTypes || []).length > 0;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if ((filters.selectedLanguages || []).length > 0) count++;
    if ((filters.selectedTerms || []).length > 0) count++;
    if ((filters.selectedInstructors || []).length > 0) count++;
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
    { value: 'workload', label: t('sort.workload'), icon: Clock },
    { value: 'difficulty', label: t('sort.difficulty'), icon: Brain },
    { value: 'usefulness', label: t('sort.usefulness'), icon: Target },
    { value: 'grade', label: t('sort.grade'), icon: GraduationCap },
    { value: 'upvotes', label: t('sort.upvotes'), icon: ThumbsUp },
    { value: 'downvotes', label: t('sort.downvotes'), icon: ThumbsDown }
  ];

  // Get current selected values for dropdowns
  const currentLanguage = (filters.selectedLanguages || []).length === 0 ? 'all' : (filters.selectedLanguages || [])[0];
  const currentTerm = (filters.selectedTerms || []).length === 0 ? 'all' : (filters.selectedTerms || [])[0];
  const currentInstructor = (filters.selectedInstructors || []).length === 0 ? 'all' : (filters.selectedInstructors || [])[0];
  const currentSessionType = (filters.selectedSessionTypes || []).length === 0 ? 'all' : (filters.selectedSessionTypes || [])[0];

  return (
    <div className="bg-gradient-to-r from-card to-card/50 rounded-xl p-6 flex flex-col gap-6">
      {/* 篩選器行 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 語言篩選 */}
        <div className="flex items-center gap-3">
          <label className="text-base font-bold text-muted-foreground flex items-center gap-2 shrink-0">
            <Languages className="h-4 w-4" />
            {t('filter.reviewLanguage')}
          </label>
          <Select value={currentLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="bg-background hover:border-primary/30 focus:border-primary h-10 rounded-lg flex-1">
              <SelectValue placeholder={t('common.all')} />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 border shadow-xl">
              <SelectItem value="all">
                <span className="font-bold">
                  {t('common.all')}
                </span>
              </SelectItem>
              {Object.entries(languageCounts || {}).map(([language, count]) => (
                <SelectItem key={language} value={language}>
                  <span className="flex items-center gap-2">
                    <span>{getLanguageDisplayName(language)}</span>
                    <span className="text-xs text-muted-foreground">({count})</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 學期篩選 */}
        <div className="flex items-center gap-3">
          <label className="text-base font-bold text-muted-foreground flex items-center gap-2 shrink-0">
            <CalendarDays className="h-4 w-4" />
            {t('filter.reviewTerm')}
          </label>
          <Select value={currentTerm} onValueChange={handleTermChange}>
            <SelectTrigger className="bg-background hover:border-primary/30 focus:border-primary h-10 rounded-lg flex-1">
              <SelectValue placeholder={t('common.all')} />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 border shadow-xl">
              <SelectItem value="all">
                <span className="font-bold">
                  {t('common.all')}
                </span>
              </SelectItem>
              {Object.entries(termCounts || {}).map(([termCode, termInfo]) => {
                if (!termInfo || typeof termInfo !== 'object') {
                  return null;
                }
                return (
                  <SelectItem key={termCode} value={termCode}>
                    <span className="flex items-center gap-2">
                      <span>{(termInfo && termInfo.name) ? termInfo.name : termCode}</span>
                      <span className="text-xs text-muted-foreground">({(termInfo && termInfo.count) ? termInfo.count : 0})</span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* 講師篩選 */}
        <div className="flex items-center gap-3">
          <label className="text-base font-bold text-muted-foreground flex items-center gap-2 shrink-0">
            <User className="h-4 w-4" />
            {t('filter.reviewInstructor')}
          </label>
          <Select value={currentInstructor} onValueChange={handleInstructorChange}>
            <SelectTrigger className="bg-background hover:border-primary/30 focus:border-primary h-10 rounded-lg flex-1">
              <SelectValue placeholder={t('common.all')} />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 border shadow-xl">
              <SelectItem value="all">
                <span className="font-bold">
                  {t('common.all')}
                </span>
              </SelectItem>
              {Object.entries(instructorCounts || {}).map(([instructorName, count]) => (
                <SelectItem key={instructorName} value={instructorName}>
                  <span className="flex items-center gap-2">
                    <span>{instructorName}</span>
                    <span className="text-xs text-muted-foreground">({count})</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 課堂類型篩選 */}
        <div className="flex items-center gap-3">
          <label className="text-base font-bold text-muted-foreground flex items-center gap-2 shrink-0">
            <School className="h-4 w-4" />
            {t('filter.reviewSessionType')}
          </label>
          <Select value={currentSessionType} onValueChange={handleSessionTypeChange}>
            <SelectTrigger className="bg-background hover:border-primary/30 focus:border-primary h-10 rounded-lg flex-1">
              <SelectValue placeholder={t('common.all')} />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 border shadow-xl">
              <SelectItem value="all">
                <span className="font-bold">
                  {t('common.all')}
                </span>
              </SelectItem>
              {Object.entries(sessionTypeCounts || {}).map(([sessionType, count]) => (
                <SelectItem key={sessionType} value={sessionType}>
                  <span className="flex items-center gap-2">
                    <span>{sessionType}</span>
                    <span className="text-xs text-muted-foreground">({count})</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 排序選項 */}
      <div className="flex items-center gap-4">
        <label className="text-base font-bold text-muted-foreground flex items-center gap-2 shrink-0">
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
          <label className="text-base font-bold text-muted-foreground flex items-center gap-2 shrink-0">
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