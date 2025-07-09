import { useLanguage } from '@/hooks/useLanguage';
import { processPluralTranslation } from '@/utils/textUtils';
import {
  Filter,
  X,
  Sparkles,
  Calendar,
  Hash,
  BookText,
  Tag,
  Brain,
  Target,
  Clock,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ThumbsUp,
  ThumbsDown,
  GraduationCap,
  Grid3X3,
  School,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export interface ReviewFilters {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  selectedLanguages: string[];
  itemsPerPage: number;
  currentPage: number;
}

interface ReviewFiltersProps {
  filters: ReviewFilters;
  onFiltersChange: (filters: ReviewFilters) => void;
  onToggleLanguage: (language: string) => void;
  allReviews: any[];
  filteredReviews: any[];
}

export function ReviewFilters({
  filters,
  onFiltersChange,
  onToggleLanguage,
  allReviews,
  filteredReviews
}: ReviewFiltersProps) {
  const { t, language } = useLanguage();

  const updateFilters = (updates: Partial<ReviewFilters>) => {
    onFiltersChange({ ...filters, ...updates });
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
      updateFilters({ sortBy: field, sortOrder: 'desc' }); // Default to desc for most relevant first
    }
  };

  // 計算各語言的評論數量
  const getLanguageCount = (language: string) => {
    return allReviews.filter(reviewInfo => {
      const reviewLanguage = reviewInfo.review?.review_language || 'en';
      return reviewLanguage === language;
    }).length;
  };

  const hasActiveFilters = () => {
    return filters.selectedLanguages.length < 3; // If not all languages are selected
  };

  const clearLanguageFilters = () => {
    updateFilters({ selectedLanguages: ['en', 'zh-TW', 'zh-CN'] });
  };

  // Helper function to determine if labels should be bold based on language
  const getLabelClassName = () => {
    return language === 'zh-TW' || language === 'zh-CN' 
      ? 'text-base font-bold text-muted-foreground flex items-center gap-2 shrink-0'
      : 'text-base font-medium text-muted-foreground flex items-center gap-2 shrink-0';
  };

  return (
    <div className="bg-gradient-to-r from-card to-card/50 rounded-xl p-6 flex flex-col gap-3">
      {/* 語言篩選行 */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <label className={getLabelClassName()}>
          <BookText className="h-4 w-4" />
          {t('filter.reviewLanguage')}
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filters.selectedLanguages.includes('en') ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToggleLanguage('en')}
            className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200"
          >
            <span className="font-medium">English</span>
            <Badge variant="secondary" className="text-xs">
              {getLanguageCount('en')}
            </Badge>
          </Button>

          <Button
            variant={filters.selectedLanguages.includes('zh-TW') ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToggleLanguage('zh-TW')}
            className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200"
          >
            <span className="font-medium">繁體中文</span>
            <Badge variant="secondary" className="text-xs">
              {getLanguageCount('zh-TW')}
            </Badge>
          </Button>

          <Button
            variant={filters.selectedLanguages.includes('zh-CN') ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToggleLanguage('zh-CN')}
            className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200"
          >
            <span className="font-medium">简体中文</span>
            <Badge variant="secondary" className="text-xs">
              {getLanguageCount('zh-CN')}
            </Badge>
          </Button>
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
            variant={getSortButtonVariant('teaching')}
            size="sm"
            onClick={() => handleSort('teaching')}
            className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200"
          >
            <School className="h-4 w-4" />
            {t('sort.teaching')}
            {getSortIcon('teaching')}
          </Button>

          <Button
            variant={getSortButtonVariant('grading')}
            size="sm"
            onClick={() => handleSort('grading')}
            className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200"
          >
            <CheckCircle className="h-4 w-4" />
            {t('sort.grading')}
            {getSortIcon('grading')}
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

        {/* 右側：統計信息和清除篩選器 */}
        <div className="flex items-center gap-4">
          {/* 統計信息 */}
          <div className="text-sm text-muted-foreground">
            {hasActiveFilters() ? (
              <span>{processPluralTranslation(t('pages.courseDetail.filteredReviewsCount', { count: filteredReviews.length }), filteredReviews.length)}</span>
            ) : (
              <span>{processPluralTranslation(t('pages.courseDetail.totalReviewsCount', { count: allReviews.length }), allReviews.length)}</span>
            )}
          </div>

          {/* 清除篩選器按鈕 */}
          {hasActiveFilters() && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearLanguageFilters}
              className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-4 w-4" />
              {t('filter.clearAll')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 