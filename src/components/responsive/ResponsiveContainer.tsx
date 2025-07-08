import React from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/use-responsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  // Preset container sizes
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  // Responsive padding
  noPadding?: boolean;
  // Center content
  center?: boolean;
}

const containerSizes = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
};

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  size = 'lg',
  noPadding = false,
  center = true,
}) => {
  const { isMobile } = useResponsive();
  
  return (
    <div
      className={cn(
        'w-full',
        containerSizes[size],
        center && 'mx-auto',
        !noPadding && (isMobile ? 'px-4' : 'px-6'),
        className
      )}
    >
      {children}
    </div>
  );
};

// Page wrapper with consistent spacing
interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  // Include gradient background
  gradient?: boolean;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  className,
  gradient = true,
}) => {
  return (
    <div
      className={cn(
        'min-h-screen',
        gradient && 'bg-gradient-to-br from-background via-background to-muted/20',
        className
      )}
    >
      {children}
    </div>
  );
};

// Section wrapper with consistent spacing
interface SectionWrapperProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg';
}

const spacingSizes = {
  sm: 'py-4 md:py-6',
  md: 'py-6 md:py-8',
  lg: 'py-8 md:py-12',
};

export const SectionWrapper: React.FC<SectionWrapperProps> = ({
  children,
  className,
  spacing = 'md',
}) => {
  return (
    <section className={cn(spacingSizes[spacing], className)}>
      {children}
    </section>
  );
};