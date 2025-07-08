import React from 'react';
import { useResponsive } from '@/hooks/use-responsive';
import { cn } from '@/lib/utils';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  // Custom column counts for each breakpoint
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: number | string;
  // Auto-fit with min column width
  minColumnWidth?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  cols = {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
    '2xl': 6,
  },
  gap = 4,
  minColumnWidth,
}) => {
  const { currentBreakpoint } = useResponsive();
  
  // Get the current column count based on breakpoint
  const getColumnCount = () => {
    switch (currentBreakpoint) {
      case 'xs':
        return cols.xs || 1;
      case 'sm':
        return cols.sm || 2;
      case 'md':
        return cols.md || 3;
      case 'lg':
        return cols.lg || 4;
      case 'xl':
        return cols.xl || 5;
      case '2xl':
        return cols['2xl'] || 6;
      default:
        return 3;
    }
  };

  const gapClass = typeof gap === 'number' ? `gap-${gap}` : gap;
  
  // If minColumnWidth is provided, use auto-fit grid
  if (minColumnWidth) {
    return (
      <div
        className={cn('grid', gapClass, className)}
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${minColumnWidth}, 1fr))`,
        }}
      >
        {children}
      </div>
    );
  }

  // Otherwise use fixed column counts
  const columnCount = getColumnCount();
  
  return (
    <div
      className={cn('grid', gapClass, className)}
      style={{
        gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
      }}
    >
      {children}
    </div>
  );
};

// Preset responsive grids for common use cases
export const CourseGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <ResponsiveGrid
    cols={{
      xs: 1,
      sm: 2,
      md: 2,
      lg: 3,
      xl: 4,
      '2xl': 4,
    }}
    gap={6}
    className={className}
  >
    {children}
  </ResponsiveGrid>
);

export const InstructorGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <ResponsiveGrid
    cols={{
      xs: 1,
      sm: 1,
      md: 2,
      lg: 2,
      xl: 3,
      '2xl': 3,
    }}
    gap={4}
    className={className}
  >
    {children}
  </ResponsiveGrid>
);

export const ReviewGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <ResponsiveGrid
    cols={{
      xs: 1,
      sm: 1,
      md: 2,
      lg: 2,
      xl: 2,
      '2xl': 3,
    }}
    gap={4}
    className={className}
  >
    {children}
  </ResponsiveGrid>
);

export const StatsGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <ResponsiveGrid
    cols={{
      xs: 1,
      sm: 2,
      md: 2,
      lg: 4,
      xl: 4,
      '2xl': 4,
    }}
    gap={4}
    className={className}
  >
    {children}
  </ResponsiveGrid>
);