import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

export interface CourseRequirementsFilters {
  midterm: 'all' | 'has' | 'no';
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
    { key: 'midterm' as keyof CourseRequirementsFilters, label: t('review.requirements.midterm') },
    { key: 'quiz' as keyof CourseRequirementsFilters, label: t('review.requirements.quiz') },
    { key: 'groupProject' as keyof CourseRequirementsFilters, label: t('review.requirements.groupProject') },
    { key: 'individualAssignment' as keyof CourseRequirementsFilters, label: t('review.requirements.individualAssignment') },
    { key: 'presentation' as keyof CourseRequirementsFilters, label: t('review.requirements.presentation') },
    { key: 'reading' as keyof CourseRequirementsFilters, label: t('review.requirements.reading') },
    { key: 'attendance' as keyof CourseRequirementsFilters, label: t('review.requirements.attendance') }
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
      midterm: 'all',
      quiz: 'all',
      groupProject: 'all',
      individualAssignment: 'all',
      presentation: 'all',
      reading: 'all',
      attendance: 'all'
    };
    onFiltersChange(resetFilters);
  };

  const getFilterButtonStyle = (currentValue: string, targetValue: string) => {
    const isActive = currentValue === targetValue;
    
    if (targetValue === 'has') {
      return cn(
        "h-8 px-3 text-sm font-semibold transition-all duration-200 border-0",
        isActive 
          ? "bg-green-500 text-white hover:bg-green-600 shadow-sm" 
          : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
      );
    } else if (targetValue === 'no') {
      return cn(
        "h-8 px-3 text-sm font-semibold transition-all duration-200 border-0",
        isActive 
          ? "bg-red-500 text-white hover:bg-red-600 shadow-sm" 
          : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"  
      );
    } else {
      return cn(
        "h-8 px-3 text-sm font-medium transition-all duration-200 border-0",
        isActive 
          ? "bg-primary text-white hover:bg-primary/90 shadow-sm" 
          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      );
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header Toggle */}
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between h-12 px-4 hover:bg-muted/70 transition-all duration-200 border border-transparent hover:border-border/50 rounded-lg group"
      >
        <div className="flex items-center gap-3">
          <Filter className="h-5 w-5 text-primary group-hover:text-primary/80 transition-colors" />
          <span className="font-semibold text-base">{t('filter.courseRequirements')}</span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="h-6 px-2 text-sm ml-1 bg-primary text-white font-medium shadow-sm">
              {Object.values(filters).filter(f => f !== 'all').length}
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        )}
      </Button>

      {/* Filter Content */}
      {isExpanded && (
        <div className="relative p-3 rounded-xl bg-muted/20">
          {/* Requirements Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {requirements.map(({ key, label }) => (
              <div key={key} className="space-y-1.5 p-2 rounded-lg bg-background/60 hover:bg-background/80 transition-all duration-200">
                <div className="text-sm font-semibold text-foreground truncate" title={label}>
                  {label}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFilterChange(key, 'all')}
                    className={getFilterButtonStyle(filters[key], 'all')}
                  >
                    {t('filter.all')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFilterChange(key, 'has')}
                    className={getFilterButtonStyle(filters[key], 'has')}
                  >
                    <span className="text-base font-bold">✓</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFilterChange(key, 'no')}
                    className={getFilterButtonStyle(filters[key], 'no')}
                  >
                    <span className="text-base font-bold">✗</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Reset Button - Bottom Right */}
          {hasActiveFilters && (
            <div className="absolute bottom-3 right-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200 px-3 py-1.5 rounded-md"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                {t('filter.reset')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 