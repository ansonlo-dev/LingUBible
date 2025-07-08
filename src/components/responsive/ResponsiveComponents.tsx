import React from 'react';
import { useMediaQuery } from 'react-responsive';

// Breakpoint values matching Tailwind CSS
const breakpoints = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

interface ResponsiveProps {
  children: React.ReactNode;
}

// Mobile-only component (xs and sm screens)
export const Mobile: React.FC<ResponsiveProps> = ({ children }) => {
  const isMobile = useMediaQuery({ maxWidth: breakpoints.sm - 1 });
  return isMobile ? <>{children}</> : null;
};

// Tablet-only component (sm to lg screens)
export const Tablet: React.FC<ResponsiveProps> = ({ children }) => {
  const isTablet = useMediaQuery({ 
    minWidth: breakpoints.sm, 
    maxWidth: breakpoints.lg - 1 
  });
  return isTablet ? <>{children}</> : null;
};

// Desktop-only component (lg and up)
export const Desktop: React.FC<ResponsiveProps> = ({ children }) => {
  const isDesktop = useMediaQuery({ minWidth: breakpoints.lg });
  return isDesktop ? <>{children}</> : null;
};

// Not mobile component (tablet and desktop)
export const NotMobile: React.FC<ResponsiveProps> = ({ children }) => {
  const isNotMobile = useMediaQuery({ minWidth: breakpoints.sm });
  return isNotMobile ? <>{children}</> : null;
};

// Mobile and tablet component
export const MobileAndTablet: React.FC<ResponsiveProps> = ({ children }) => {
  const isMobileOrTablet = useMediaQuery({ maxWidth: breakpoints.lg - 1 });
  return isMobileOrTablet ? <>{children}</> : null;
};

// Custom breakpoint component
interface BreakpointProps extends ResponsiveProps {
  minWidth?: keyof typeof breakpoints;
  maxWidth?: keyof typeof breakpoints;
}

export const Breakpoint: React.FC<BreakpointProps> = ({ 
  children, 
  minWidth, 
  maxWidth 
}) => {
  const query: any = {};
  if (minWidth) query.minWidth = breakpoints[minWidth];
  if (maxWidth) query.maxWidth = breakpoints[maxWidth] - 1;
  
  const matches = useMediaQuery(query);
  return matches ? <>{children}</> : null;
};

// Portrait orientation component
export const Portrait: React.FC<ResponsiveProps> = ({ children }) => {
  const isPortrait = useMediaQuery({ orientation: 'portrait' });
  return isPortrait ? <>{children}</> : null;
};

// Landscape orientation component
export const Landscape: React.FC<ResponsiveProps> = ({ children }) => {
  const isLandscape = useMediaQuery({ orientation: 'landscape' });
  return isLandscape ? <>{children}</> : null;
};

// Touch device component
export const TouchDevice: React.FC<ResponsiveProps> = ({ children }) => {
  const isTouchDevice = useMediaQuery({ 
    query: '(hover: none) and (pointer: coarse)' 
  });
  return isTouchDevice ? <>{children}</> : null;
};

// Non-touch device component
export const NonTouchDevice: React.FC<ResponsiveProps> = ({ children }) => {
  const isNonTouchDevice = useMediaQuery({ 
    query: '(hover: hover) and (pointer: fine)' 
  });
  return isNonTouchDevice ? <>{children}</> : null;
};

// High DPI display component
export const HighDPI: React.FC<ResponsiveProps> = ({ children }) => {
  const isHighDPI = useMediaQuery({ minResolution: '2dppx' });
  return isHighDPI ? <>{children}</> : null;
};

// Custom media query component
interface CustomQueryProps extends ResponsiveProps {
  query: string;
}

export const CustomQuery: React.FC<CustomQueryProps> = ({ children, query }) => {
  const matches = useMediaQuery({ query });
  return matches ? <>{children}</> : null;
};