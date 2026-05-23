// Export all responsive components
export * from './ResponsiveComponents';
export * from './ResponsiveGrid';
export * from './ResponsiveContainer';
export * from './ResponsiveText';

// Re-export hooks for convenience
export { 
  useResponsive, 
  useIsMobile, 
  useIsDesktop, 
  useBreakpoint,
  useCustomMediaQuery 
} from '@/hooks/use-responsive';