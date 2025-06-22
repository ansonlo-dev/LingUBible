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
  Tag,
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
  ChevronsRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

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
}

export function AdvancedCourseFilters({
  filters,
  onFiltersChange,
  availableSubjects,
  onClearAll,
  totalCourses = 0,
  filteredCourses = 0
}: AdvancedCourseFiltersProps) {
  const { t } = useLanguage();
  const [availableTerms, setAvailableTerms] = useState<Term[]>([]);
  const [termsLoading, setTermsLoading] = useState(true);

  // Load available terms
  useEffect(() => {
    const loadAvailableTerms = async () => {
      try {
        setTermsLoading(true);
        const terms = await CourseService.getAllTerms();
        setAvailableTerms(terms);
      } catch (error) {
        console.error('Error loading available terms:', error);
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

  return (
    <div className="bg-gradient-to-r from-card to-card/50 rounded-xl p-6 flex flex-col gap-6">
      {/* 智能搜索行 */}
      <div className="flex items-center gap-4">
        <label className="text-base font-medium text-muted-foreground flex items-center gap-2 shrink-0">
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
          <label className="text-base font-medium text-muted-foreground flex items-center gap-2 shrink-0">
            <Library className="h-4 w-4" />
            {t('sort.subjectArea')}
          </label>
          <Select value={filters.subjectArea} onValueChange={(value) => updateFilters({ subjectArea: value })}>
            <SelectTrigger className="bg-background hover:border-primary/30 focus:border-primary h-10 rounded-lg flex-1">
              <SelectValue placeholder={t('filter.allSubjects')}>
                {filters.subjectArea === 'all' ? t('filter.allSubjects') : (
                  <span className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded text-xs">
                      {filters.subjectArea}
                    </span>
                    <span className="text-sm">
                      {t(`subjectArea.${filters.subjectArea}` as any) || filters.subjectArea}
                    </span>
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 border shadow-xl">
              <SelectItem value="all">
                <span className="flex items-center gap-2">
                  <Library className="h-4 w-4 text-primary" />
                  {t('filter.allSubjects')}
                </span>
              </SelectItem>
              {availableSubjects.map(subject => (
                <SelectItem key={subject} value={subject}>
                  <span className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary/70" />
                    <span className="font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded text-xs mr-2">
                      {subject}
                    </span>
                    <span className="text-sm text-foreground">
                      {t(`subjectArea.${subject}` as any) || subject}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 教學語言 */}
        <div className="flex items-center gap-3">
          <label className="text-base font-medium text-muted-foreground flex items-center gap-2 shrink-0">
            <BookText className="h-4 w-4" />
            {t('filter.teachingLanguage')}
          </label>
          <Select value={filters.teachingLanguage} onValueChange={(value) => updateFilters({ teachingLanguage: value })}>
            <SelectTrigger className="bg-background hover:border-primary/30 focus:border-primary h-10 rounded-lg flex-1">
              <SelectValue placeholder={t('filter.allLanguages')} />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 border shadow-xl">
              <SelectItem value="all">
                <span className="flex items-center gap-2">
                  <BookText className="h-4 w-4 text-primary" />
                  {t('filter.allLanguages')}
                </span>
              </SelectItem>
              <SelectItem value="English">
                <span className="flex items-center gap-2">
                  <BookText className="h-4 w-4 text-primary/70" />
                  {t('language.english')}
                </span>
              </SelectItem>
              <SelectItem value="Mandarin Chinese">
                <span className="flex items-center gap-2">
                  <BookText className="h-4 w-4 text-primary/70" />
                  {t('language.mandarinChinese')}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 開設學期 */}
        <div className="flex items-center gap-3">
          <label className="text-base font-medium text-muted-foreground flex items-center gap-2 shrink-0">
            <Calendar className="h-4 w-4" />
            {t('filter.offeredTerms')}
          </label>
          <Select value={filters.offeredTerm} onValueChange={(value) => updateFilters({ offeredTerm: value })}>
            <SelectTrigger className="bg-background hover:border-primary/30 focus:border-primary h-10 rounded-lg flex-1">
              <SelectValue placeholder={t('filter.allTerms')} />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 border shadow-xl">
              <SelectItem value="all">{t('filter.allTerms')}</SelectItem>
                             {availableTerms.map(term => (
                 <SelectItem key={term.term_code} value={term.term_code}>
                   <span className="flex items-center gap-2">
                     <div className={`w-2 h-2 ${isCurrentTerm(term.term_code) ? 'bg-green-500' : 'bg-gray-500'} rounded-full`}></div>
                     {getTermDisplayName(term.term_code)}
                   </span>
                 </SelectItem>
               ))}
            </SelectContent>
          </Select>
        </div>

      </div>

      {/* 排序行 */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <label className="text-base font-medium text-muted-foreground flex items-center gap-2 shrink-0">
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
            <Tag className="h-4 w-4" />
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
        </div>
      </div>

      {/* 每頁課程數和統計 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* 左側：每頁課程數 */}
        <div className="flex items-center gap-4">
          <label className="text-base font-medium text-muted-foreground flex items-center gap-2 shrink-0">
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