import { useLanguage } from '@/hooks/useLanguage';
import { isCurrentTerm } from '@/utils/dateUtils';
import { sortGradesDescending } from '@/utils/gradeUtils';
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
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export interface MyReviewFilters {
  searchTerm: string;
  selectedSubjectAreas: string[];
  selectedTerms: string[];
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
  gradeCounts,
  sessionTypeCounts,
  totalReviews,
  filteredReviews,
  onClearAll
}: MyReviewsFiltersProps) {
  const { t, language } = useLanguage();

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

  // Helper function to determine if labels should be bold based on language
  const getLabelClassName = () => {
    return language === 'zh-TW' || language === 'zh-CN' 
      ? 'text-base font-bold text-muted-foreground flex items-center gap-2 shrink-0'
      : 'text-base font-medium text-muted-foreground flex items-center gap-2 shrink-0';
  };

  const handleSubjectAreaChange = (value: string) => {
    if (value === 'all') {
      updateFilters({ selectedSubjectAreas: [], currentPage: 1 });
    } else {
      updateFilters({ selectedSubjectAreas: [value], currentPage: 1 });
    }
  };

  const handleTermChange = (value: string) => {
    if (value === 'all') {
      updateFilters({ selectedTerms: [], currentPage: 1 });
    } else {
      updateFilters({ selectedTerms: [value], currentPage: 1 });
    }
  };

  const handleGradeChange = (value: string) => {
    if (value === 'all') {
      updateFilters({ selectedGrades: [], currentPage: 1 });
    } else {
      updateFilters({ selectedGrades: [value], currentPage: 1 });
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
    return (
      filters.searchTerm.trim() !== '' ||
      (filters.selectedSubjectAreas || []).length > 0 ||
      (filters.selectedTerms || []).length > 0 ||
      (filters.selectedGrades || []).length > 0 ||
      (filters.selectedSessionTypes || []).length > 0
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm.trim()) count++;
    if ((filters.selectedSubjectAreas || []).length > 0) count++;
    if ((filters.selectedTerms || []).length > 0) count++;
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
            placeholder={t('myReviews.searchPlaceholder')}
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* 學科領域 */}
        <div className="flex items-center gap-3">
          <label className={getLabelClassName()}>
            <Library className="h-4 w-4" />
            {t('sort.subjectArea')}
          </label>
          <Select 
            value={filters.selectedSubjectAreas?.[0] || 'all'} 
            onValueChange={handleSubjectAreaChange}
          >
            <SelectTrigger className="bg-background hover:border-primary/30 focus:border-primary h-10 rounded-lg flex-1">
              <SelectValue placeholder={t('filter.allSubjects')}>
                {!filters.selectedSubjectAreas?.length || filters.selectedSubjectAreas[0] === 'all' ? (
                  <span className="font-bold">{t('common.all')}</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded text-xs">
                      {filters.selectedSubjectAreas[0]}
                    </span>
                    <span className="text-sm">
                      {t(`subjectArea.${filters.selectedSubjectAreas[0]}` as any) || filters.selectedSubjectAreas[0]}
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
                    {totalReviews}
                  </Badge>
                </span>
              </SelectItem>
              {availableSubjectAreas.map(subject => (
                <SelectItem key={subject} value={subject}>
                  <span className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded text-xs mr-2">
                      {subject}
                    </span>
                    <span className="text-sm text-foreground">
                      {t(`subjectArea.${subject}` as any) || subject}
                    </span>
                    <Badge variant="secondary" className="ml-auto text-xs bg-primary/10 text-primary hover:bg-primary/10 dark:bg-primary/20 dark:text-primary-foreground dark:hover:bg-primary/20">
                      {subjectAreaCounts()[subject]}
                    </Badge>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 學期 */}
        <div className="flex items-center gap-3">
          <label className={getLabelClassName()}>
            <Calendar className="h-4 w-4" />
            {t('filter.offeredTerms')}
          </label>
          <Select 
            value={filters.selectedTerms?.[0] || 'all'} 
            onValueChange={handleTermChange}
          >
            <SelectTrigger className="bg-background hover:border-primary/30 focus:border-primary h-10 rounded-lg flex-1">
              <SelectValue placeholder={t('filter.allTerms')}>
                {!filters.selectedTerms?.length || filters.selectedTerms[0] === 'all' ? (
                  <span className="font-bold">{t('common.all')}</span>
                ) : (
                  <span className="flex items-center gap-2">
                    {termCounts[filters.selectedTerms[0]]?.name || filters.selectedTerms[0]}
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
                    {totalReviews}
                  </Badge>
                </span>
              </SelectItem>
              {Object.entries(termCounts).map(([termCode, termInfo]) => (
                <SelectItem key={termCode} value={termCode}>
                  <span className="flex items-center gap-2">
                    <div className={`w-2 h-2 ${isCurrentTerm(termCode) ? 'bg-green-500' : 'bg-gray-500'} rounded-full`}></div>
                    <span>{termInfo.name}</span>
                    <Badge variant="secondary" className="ml-auto text-xs bg-primary/10 text-primary hover:bg-primary/10 dark:bg-primary/20 dark:text-primary-foreground dark:hover:bg-primary/20">
                      {termInfo.count}
                    </Badge>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 成績 */}
        <div className="flex items-center gap-3">
          <label className={getLabelClassName()}>
            <GraduationCap className="h-4 w-4" />
            {t('sort.grade')}
          </label>
          <Select 
            value={filters.selectedGrades?.[0] || 'all'} 
            onValueChange={handleGradeChange}
          >
            <SelectTrigger className="bg-background hover:border-primary/30 focus:border-primary h-10 rounded-lg flex-1">
              <SelectValue placeholder={t('filter.allGrades')}>
                {!filters.selectedGrades?.length || filters.selectedGrades[0] === 'all' ? (
                  <span className="font-bold">{t('common.all')}</span>
                ) : (
                  <span className="flex items-center gap-2">
                    {filters.selectedGrades[0] === 'N/A' ? t('review.notApplicable') : filters.selectedGrades[0]}
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
                    {totalReviews}
                  </Badge>
                </span>
              </SelectItem>
              {sortGradesDescending(Object.keys(gradeCounts || {})).map((grade) => {
                const count = gradeCounts[grade] || 0;
                return (
                  <SelectItem key={grade} value={grade}>
                    <span className="flex items-center gap-2">
                      <span>{grade === 'N/A' ? t('review.notApplicable') : grade}</span>
                      <Badge variant="secondary" className="ml-auto text-xs bg-primary/10 text-primary hover:bg-primary/10 dark:bg-primary/20 dark:text-primary-foreground dark:hover:bg-primary/20">
                        {count}
                      </Badge>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* 課堂類型 */}
        <div className="flex items-center gap-3">
          <label className={getLabelClassName()}>
            <Clock className="h-4 w-4" />
            {t('filter.reviewSessionType')}
          </label>
          <Select 
            value={filters.selectedSessionTypes?.[0] || 'all'} 
            onValueChange={handleSessionTypeChange}
          >
            <SelectTrigger className="bg-background hover:border-primary/30 focus:border-primary h-10 rounded-lg flex-1">
              <SelectValue placeholder={t('filter.allSessionTypes')}>
                {!filters.selectedSessionTypes?.length || filters.selectedSessionTypes[0] === 'all' ? (
                  <span className="font-bold">{t('common.all')}</span>
                ) : (
                  <span className="flex items-center gap-2">
                    {t(`sessionType.${filters.selectedSessionTypes[0]?.toLowerCase()}`)}
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
                    {totalReviews}
                  </Badge>
                </span>
              </SelectItem>
              {Object.entries(sessionTypeCounts).map(([sessionType, count]) => (
                <SelectItem key={sessionType} value={sessionType}>
                  <span className="flex items-center gap-2">
                    <span>{t(`sessionType.${sessionType.toLowerCase()}`)}</span>
                    <Badge variant="secondary" className="ml-auto text-xs bg-primary/10 text-primary hover:bg-primary/10 dark:bg-primary/20 dark:text-primary-foreground dark:hover:bg-primary/20">
                      {count}
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
            variant={getSortButtonVariant('postDate')}
            size="sm"
            onClick={() => handleSort('postDate')}
            className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200"
          >
            <Calendar className="h-4 w-4" />
            {t('sort.postDate')}
            {getSortIcon('postDate')}
          </Button>

          <Button
            variant={getSortButtonVariant('courseCode')}
            size="sm"
            onClick={() => handleSort('courseCode')}
            className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200"
          >
            <Hash className="h-4 w-4" />
            {t('sort.courseCode')}
            {getSortIcon('courseCode')}
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
            variant={getSortButtonVariant('grade')}
            size="sm"
            onClick={() => handleSort('grade')}
            className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200"
          >
            <GraduationCap className="h-4 w-4" />
            {t('sort.grade')}
            {getSortIcon('grade')}
          </Button>

          <Button
            variant={getSortButtonVariant('upvotes')}
            size="sm"
            onClick={() => handleSort('upvotes')}
            className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200"
          >
            <ThumbsUp className="h-4 w-4" />
            {t('sort.upvotes')}
            {getSortIcon('upvotes')}
          </Button>

          <Button
            variant={getSortButtonVariant('downvotes')}
            size="sm"
            onClick={() => handleSort('downvotes')}
            className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200"
          >
            <ThumbsDown className="h-4 w-4" />
            {t('sort.downvotes')}
            {getSortIcon('downvotes')}
          </Button>
        </div>
      </div>

      {/* 底部行：每頁項目數和清除篩選器 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* 左側：每頁評論數 */}
        <div className="flex items-center gap-4">
          <label className={getLabelClassName()}>
            <Grid3X3 className="h-4 w-4" />
            {t('pagination.reviewsPerPage')}
          </label>
          <div className="flex gap-2">
            {[2, 4, 8].map((count) => (
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

        {/* 右側：評論統計和清除篩選器 */}
        <div className="flex items-center gap-4">
          {/* 統計信息 */}
          <div className="text-sm text-muted-foreground">
            {hasActiveFilters() ? (
              <span>{t('pages.courses.foundCount', { count: filteredReviews })}</span>
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