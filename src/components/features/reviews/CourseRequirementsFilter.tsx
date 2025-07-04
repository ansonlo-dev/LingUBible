import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

export interface CourseRequirementsFilters {
  midterm: 'all' | 'has' | 'no';
  final: 'all' | 'has' | 'no';
  quiz: 'all' | 'has' | 'no';
  groupProject: 'all' | 'has' | 'no';
  individualAssignment: 'all' | 'has' | 'no';
  presentation: 'all' | 'has' | 'no';
  reading: 'all' | 'has' | 'no';
  attendance: 'all' | 'has' | 'no';
}

interface CourseRequirementsFilterProps {
  filters: CourseRequirementsFilters;
  onFiltersChange: (filters: CourseRequirementsFilters) => void;
  className?: string;
}

export const CourseRequirementsFilter: React.FC<CourseRequirementsFilterProps> = ({
  filters,
  onFiltersChange,
  className
}) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  const requirements = [
    { key: 'attendance' as keyof CourseRequirementsFilters, label: t('review.requirements.attendance') },
    { key: 'quiz' as keyof CourseRequirementsFilters, label: t('review.requirements.quiz') },
    { key: 'midterm' as keyof CourseRequirementsFilters, label: t('review.requirements.midterm') },
    { key: 'final' as keyof CourseRequirementsFilters, label: t('review.requirements.final') },
    { key: 'individualAssignment' as keyof CourseRequirementsFilters, label: t('review.requirements.individualAssignment') },
    { key: 'groupProject' as keyof CourseRequirementsFilters, label: t('review.requirements.groupProject') },
    { key: 'presentation' as keyof CourseRequirementsFilters, label: t('review.requirements.presentation') },
    { key: 'reading' as keyof CourseRequirementsFilters, label: t('review.requirements.reading') }
  ];

  const handleFilterChange = (key: keyof CourseRequirementsFilters, value: 'all' | 'has' | 'no') => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter !== 'all');

  const resetFilters = () => {
    const resetFilters: CourseRequirementsFilters = {
      attendance: 'all',
      quiz: 'all',
      midterm: 'all',
      final: 'all',
      individualAssignment: 'all',
      groupProject: 'all',
      presentation: 'all',
      reading: 'all'
    };
    onFiltersChange(resetFilters);
  };

  return (
    <div className={cn("space-y-0 bg-[rgb(243,244,246)] dark:bg-[rgb(36,36,40)] rounded-lg", className)}>
      {/* Header Toggle */}
      <div className="w-full bg-[rgb(243,244,246)] hover:bg-[rgb(243,244,246)] dark:bg-[rgb(36,36,40)] dark:hover:bg-[rgb(36,36,40)] transition-all duration-200 rounded-lg">
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between h-12 px-4 bg-transparent hover:bg-transparent transition-all duration-200 rounded-lg group"
        >
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-primary group-hover:text-primary/80 transition-colors" />
            <span className="font-semibold text-base">{t('filter.courseRequirements')}</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="h-6 px-2 text-sm ml-1 bg-primary text-white font-medium shadow-sm hidden sm:inline-flex">
                {Object.values(filters).filter(f => f !== 'all').length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  resetFilters();
                }}
                className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200 px-1 sm:px-2 py-1 rounded-md h-6 sm:h-7 hidden sm:flex"
              >
                <RotateCcw className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">{t('filter.reset')}</span>
              </Button>
            )}
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            )}
          </div>
        </Button>
        {hasActiveFilters && (
          <div className="sm:hidden px-4 pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="h-6 px-2 text-sm bg-primary text-white font-medium shadow-sm">
                {Object.values(filters).filter(f => f !== 'all').length} {t('filter.active')}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200 px-2 py-1 rounded-md h-6"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                {t('filter.reset')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="relative p-4 rounded-xl bg-muted/20">
          {/* Requirements Grid - 2 rows x 4 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {requirements.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-background/60 hover:bg-background/80 transition-all duration-200 min-h-[2.5rem]">
                <div className="text-sm font-semibold text-foreground truncate flex-1 pr-3" title={label}>
                  {label}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFilterChange(key, 'all')}
                    className={cn(
                      "h-7 px-2 text-xs font-medium transition-all duration-200 border-0",
                      filters[key] === 'all'
                        ? "bg-transparent text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold" 
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    )}
                  >
                    {t('filter.all')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFilterChange(key, 'has')}
                    className={cn(
                      "h-7 px-2 text-xs font-semibold transition-all duration-200 border-0",
                      filters[key] === 'has'
                        ? "bg-green-500 text-white hover:bg-green-600 shadow-sm" 
                        : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
                    )}
                  >
                    <span className="text-sm font-bold">✓</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFilterChange(key, 'no')}
                    className={cn(
                      "h-7 px-2 text-xs font-semibold transition-all duration-200 border-0",
                      filters[key] === 'no'
                        ? "bg-red-500 text-white hover:bg-red-600 shadow-sm" 
                        : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                    )}
                  >
                    <span className="text-sm font-bold">✗</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 