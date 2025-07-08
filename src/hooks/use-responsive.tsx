import { useMediaQuery } from 'react-responsive';

// Define breakpoints matching Tailwind CSS
const breakpoints = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Device detection hooks
export const useResponsive = () => {
  // Basic responsive breakpoints
  const isXs = useMediaQuery({ maxWidth: breakpoints.xs - 1 });
  const isSm = useMediaQuery({ minWidth: breakpoints.xs, maxWidth: breakpoints.sm - 1 });
  const isMd = useMediaQuery({ minWidth: breakpoints.sm, maxWidth: breakpoints.md - 1 });
  const isLg = useMediaQuery({ minWidth: breakpoints.md, maxWidth: breakpoints.lg - 1 });
  const isXl = useMediaQuery({ minWidth: breakpoints.lg, maxWidth: breakpoints.xl - 1 });
  const is2xl = useMediaQuery({ minWidth: breakpoints.xl });

  // Min width queries (useful for progressive enhancement)
  const isSmAndUp = useMediaQuery({ minWidth: breakpoints.xs });
  const isMdAndUp = useMediaQuery({ minWidth: breakpoints.sm });
  const isLgAndUp = useMediaQuery({ minWidth: breakpoints.md });
  const isXlAndUp = useMediaQuery({ minWidth: breakpoints.lg });
  const is2xlAndUp = useMediaQuery({ minWidth: breakpoints.xl });

  // Common device queries
  const isMobile = useMediaQuery({ maxWidth: breakpoints.sm - 1 });
  const isTablet = useMediaQuery({ minWidth: breakpoints.sm, maxWidth: breakpoints.lg - 1 });
  const isDesktop = useMediaQuery({ minWidth: breakpoints.lg });

  // Touch device detection
  const isTouchDevice = useMediaQuery({ query: '(hover: none) and (pointer: coarse)' });
  
  // Orientation
  const isPortrait = useMediaQuery({ orientation: 'portrait' });
  const isLandscape = useMediaQuery({ orientation: 'landscape' });

  // High resolution displays
  const isRetina = useMediaQuery({ minResolution: '2dppx' });

  // Mobile-specific queries
  const isMobilePortrait = isMobile && isPortrait;
  const isMobileLandscape = isMobile && isLandscape;
  
  // Tablet-specific queries
  const isTabletPortrait = isTablet && isPortrait;
  const isTabletLandscape = isTablet && isLandscape;

  return {
    // Breakpoint status
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
    
    // Min width queries
    isSmAndUp,
    isMdAndUp,
    isLgAndUp,
    isXlAndUp,
    is2xlAndUp,
    
    // Device categories
    isMobile,
    isTablet,
    isDesktop,
    
    // Additional queries
    isTouchDevice,
    isPortrait,
    isLandscape,
    isRetina,
    
    // Combined queries
    isMobilePortrait,
    isMobileLandscape,
    isTabletPortrait,
    isTabletLandscape,
    
    // Utility values
    breakpoints,
    currentBreakpoint: isXs ? 'xs' : isSm ? 'sm' : isMd ? 'md' : isLg ? 'lg' : isXl ? 'xl' : '2xl',
  };
};

// Simplified mobile detection hook for backward compatibility
export const useIsMobile = () => {
  const isMobile = useMediaQuery({ maxWidth: breakpoints.sm - 1 });
  return isMobile;
};

// Simplified desktop detection hook for backward compatibility
export const useIsDesktop = () => {
  const isDesktop = useMediaQuery({ minWidth: breakpoints.lg });
  return isDesktop;
};

// Custom hook for specific breakpoint
export const useBreakpoint = (breakpoint: keyof typeof breakpoints) => {
  const query = useMediaQuery({ minWidth: breakpoints[breakpoint] });
  return query;
};

// Hook for custom media queries
export const useCustomMediaQuery = (query: string) => {
  return useMediaQuery({ query });
};