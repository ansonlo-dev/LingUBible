import { useState, useEffect } from 'react';
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

// Enhanced mobile detection function
function getEnhancedMobileDetection() {
  if (typeof window === 'undefined') return false;
  
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  
  // Simple mobile detection based on screen width
  // All devices under 1024px are treated as mobile for consistent sidebar behavior
  if (width < 1024) {
    return true; // Mobile behavior with sliding sidebar
  }
  
  // Desktop behavior for screens 1024px and above
  return false;
}

// Enhanced responsive hook
export const useEnhancedResponsive = () => {
  // Basic responsive breakpoints using react-responsive
  const isXs = useMediaQuery({ maxWidth: breakpoints.xs - 1 });
  const isSm = useMediaQuery({ minWidth: breakpoints.xs, maxWidth: breakpoints.sm - 1 });
  const isMd = useMediaQuery({ minWidth: breakpoints.sm, maxWidth: breakpoints.md - 1 });
  const isLg = useMediaQuery({ minWidth: breakpoints.md, maxWidth: breakpoints.lg - 1 });
  const isXl = useMediaQuery({ minWidth: breakpoints.lg, maxWidth: breakpoints.xl - 1 });
  const is2xl = useMediaQuery({ minWidth: breakpoints.xl });

  // Min width queries
  const isSmAndUp = useMediaQuery({ minWidth: breakpoints.xs });
  const isMdAndUp = useMediaQuery({ minWidth: breakpoints.sm });
  const isLgAndUp = useMediaQuery({ minWidth: breakpoints.md });
  const isXlAndUp = useMediaQuery({ minWidth: breakpoints.lg });
  const is2xlAndUp = useMediaQuery({ minWidth: breakpoints.xl });

  // Enhanced mobile/desktop detection
  const [isMobile, setIsMobile] = useState(() => getEnhancedMobileDetection());
  const [isDesktop, setIsDesktop] = useState(() => !getEnhancedMobileDetection());
  
  // Traditional tablet detection (for non-mobile touch devices)
  const isTablet = useMediaQuery({ minWidth: breakpoints.sm, maxWidth: breakpoints.lg - 1 });

  // Touch device detection
  const isTouchDevice = useMediaQuery({ query: '(hover: none) and (pointer: coarse)' });
  
  // Orientation
  const isPortrait = useMediaQuery({ orientation: 'portrait' });
  const isLandscape = useMediaQuery({ orientation: 'landscape' });

  // High resolution displays
  const isRetina = useMediaQuery({ minResolution: '2dppx' });

  // Update mobile detection on resize and orientation change
  useEffect(() => {
    const updateMobileDetection = () => {
      const newIsMobile = getEnhancedMobileDetection();
      setIsMobile(newIsMobile);
      setIsDesktop(!newIsMobile);
    };

    // Listen for resize and orientation changes
    window.addEventListener('resize', updateMobileDetection);
    window.addEventListener('orientationchange', () => {
      // Delay to ensure viewport has updated after orientation change
      setTimeout(updateMobileDetection, 100);
    });

    // Initial check
    updateMobileDetection();

    return () => {
      window.removeEventListener('resize', updateMobileDetection);
      window.removeEventListener('orientationchange', updateMobileDetection);
    };
  }, []);

  // Combined queries using enhanced detection
  const isMobilePortrait = isMobile && isPortrait;
  const isMobileLandscape = isMobile && isLandscape;
  const isTabletPortrait = isTablet && isPortrait && !isMobile; // Exclude mobile devices
  const isTabletLandscape = isTablet && isLandscape && !isMobile; // Exclude mobile devices

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
    
    // Enhanced device categories
    isMobile, // Uses enhanced detection
    isTablet, // Traditional tablet detection, excluding mobile devices
    isDesktop, // Uses enhanced detection
    
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

// Backward compatibility exports
export const useResponsive = useEnhancedResponsive;
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => getEnhancedMobileDetection());
  
  useEffect(() => {
    const updateMobileDetection = () => {
      setIsMobile(getEnhancedMobileDetection());
    };

    window.addEventListener('resize', updateMobileDetection);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateMobileDetection, 100);
    });

    updateMobileDetection();

    return () => {
      window.removeEventListener('resize', updateMobileDetection);
      window.removeEventListener('orientationchange', updateMobileDetection);
    };
  }, []);
  
  return isMobile;
};

export const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(() => !getEnhancedMobileDetection());
  
  useEffect(() => {
    const updateDesktopDetection = () => {
      setIsDesktop(!getEnhancedMobileDetection());
    };

    window.addEventListener('resize', updateDesktopDetection);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateDesktopDetection, 100);
    });

    updateDesktopDetection();

    return () => {
      window.removeEventListener('resize', updateDesktopDetection);
      window.removeEventListener('orientationchange', updateDesktopDetection);
    };
  }, []);
  
  return isDesktop;
}; 