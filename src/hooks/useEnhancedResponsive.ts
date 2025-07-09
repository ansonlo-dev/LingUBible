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
  
  // Special case: iPad models and iPhone landscape should behave like desktop for sidebar in both orientations
  // This enables desktop-like collapse behavior instead of mobile overlay
  if (isTouchDevice && (/ipad/i.test(userAgent) || /iphone/i.test(userAgent))) {
    // iPad mini portrait: 768x1024
    if (width === 768 && height === 1024) {
      return false; // Treat as desktop for sidebar behavior
    }
    // iPad mini landscape: 1024x768
    if (width === 1024 && height === 768) {
      return false; // Treat as desktop for sidebar behavior
    }
    // iPad Air portrait: 820x1180
    if (width === 820 && height === 1180) {
      return false; // Treat as desktop for sidebar behavior
    }
    // iPad Air landscape: 1180x820
    if (width === 1180 && height === 820) {
      return false; // Treat as desktop for sidebar behavior
    }
  }

  // Common landscape phone dimensions should get desktop-like sidebar behavior regardless of device type
  // This includes iPhone, Samsung, Pixel, and other Android devices
  if (isTouchDevice && width > height) { // Only in landscape mode
    // iPhone XR landscape: 896x414
    if (width === 896 && height === 414) {
      return false; // Treat as desktop for sidebar behavior
    }
    // iPhone 12 Pro landscape: 844x390
    if (width === 844 && height === 390) {
      return false; // Treat as desktop for sidebar behavior
    }
    // iPhone 14 Pro Max landscape: 932x430
    if (width === 932 && height === 430) {
      return false; // Treat as desktop for sidebar behavior
    }
    // Common landscape dimension: 915x412 (iPhone 15 Pro, Samsung Galaxy S20 Ultra, Pixel 7, etc.)
    if (width === 915 && height === 412) {
      return false; // Treat as desktop for sidebar behavior
    }
  }
  
  // Enhanced detection logic for mobile landscape mode
  if (isMobileDevice && isTouchDevice) {
    // Real mobile devices: check screen dimensions considering orientation
    const maxDimension = Math.max(width, height);
    const minDimension = Math.min(width, height);
    
    // Special handling for landscape mode phones
    const isLandscapePhone = width > height && minDimension <= 430; // iPhone 14 Pro Max landscape height = 430
    const isLandscapeTablet = width > height && minDimension > 430 && minDimension < 600; // Small tablet landscape
    
    // Include tablets with max dimension <= 1024 as mobile for sidebar behavior
    // (iPad mini portrait already excluded above)
    if (isLandscapePhone || maxDimension <= 1024) {
      return true; // Mobile behavior
    } else if (isLandscapeTablet) {
      // Small tablet in landscape mode - judge by width
      return maxDimension < 1200;
    } else {
      return false; // Large tablet or desktop device
    }
  } else if (isTouchDevice && !isMobileDevice) {
    // Touch device but not mobile device (like Surface), use width
    return width < 640;
  } else {
    // Desktop device: even in split-screen mode, don't treat as mobile
    return width < 480;
  }
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