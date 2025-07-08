import React from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/use-responsive';

interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  // Responsive text size
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  // Mobile size override
  mobileSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  // Text weight
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  // Alignment
  align?: 'left' | 'center' | 'right';
  // Line clamp
  clamp?: number;
}

const textSizes = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
  '6xl': 'text-6xl',
};

const textWeights = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const textAlignments = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  className,
  size = 'base',
  mobileSize,
  weight = 'normal',
  align = 'left',
  clamp,
}) => {
  const { isMobile } = useResponsive();
  
  const effectiveSize = isMobile && mobileSize ? mobileSize : size;
  
  return (
    <div
      className={cn(
        textSizes[effectiveSize],
        textWeights[weight],
        textAlignments[align],
        clamp && `line-clamp-${clamp}`,
        className
      )}
    >
      {children}
    </div>
  );
};

// Responsive heading component with semantic HTML
interface ResponsiveHeadingProps extends ResponsiveTextProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const ResponsiveHeading: React.FC<ResponsiveHeadingProps> = ({
  as: Component = 'h2',
  children,
  className,
  size = '2xl',
  mobileSize = 'xl',
  weight = 'bold',
  align = 'left',
  ...props
}) => {
  const { isMobile } = useResponsive();
  
  const effectiveSize = isMobile && mobileSize ? mobileSize : size;
  
  return (
    <Component
      className={cn(
        textSizes[effectiveSize],
        textWeights[weight],
        textAlignments[align],
        className
      )}
    >
      {children}
    </Component>
  );
};

// Responsive paragraph with automatic mobile optimization
interface ResponsiveParagraphProps {
  children: React.ReactNode;
  className?: string;
  lead?: boolean; // Lead paragraph style
  muted?: boolean; // Muted text color
}

export const ResponsiveParagraph: React.FC<ResponsiveParagraphProps> = ({
  children,
  className,
  lead = false,
  muted = false,
}) => {
  const { isMobile } = useResponsive();
  
  return (
    <p
      className={cn(
        lead ? (isMobile ? 'text-lg' : 'text-xl') : 'text-base',
        muted && 'text-muted-foreground',
        'leading-relaxed',
        className
      )}
    >
      {children}
    </p>
  );
};