import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { X } from 'lucide-react';

interface ResponsiveTooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
  asChild?: boolean;
  hasClickAction?: boolean;
  clickActionText?: string;
  isPending?: boolean;
  onFirstTap?: () => void;
  onSecondTap?: () => void;
  showCloseButton?: boolean; // New prop to control close button visibility
}

export const ResponsiveTooltip: React.FC<ResponsiveTooltipProps> = ({
  content,
  children,
  side = 'top',
  align = 'center',
  delayDuration = 300,
  className,
  contentClassName,
  disabled = false,
  asChild = true,
  hasClickAction = false,
  clickActionText,
  isPending = false,
  onFirstTap,
  onSecondTap,
  showCloseButton = false,
}) => {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [hasBeenTapped, setHasBeenTapped] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Memoize the content to prevent unnecessary re-renders
  const memoizedContent = useMemo(() => content, [content]);
  const memoizedClickActionText = useMemo(() => clickActionText, [clickActionText]);

  // Handle mobile tap behavior
  const handleMobileTap = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isMobile || disabled) return;
    
    // If tooltip is open and user taps the trigger again
    if (isOpen && hasBeenTapped) {
      // If there's a click action, let it bubble through
      if (hasClickAction) {
        setIsOpen(false);
        setHasBeenTapped(false);
        return; // Don't prevent default, let the click action happen
      }
      // Otherwise just close the tooltip
      setIsOpen(false);
      setHasBeenTapped(false);
      // Only prevent default for mouse events, not touch events
      if (e.type === 'click') {
        e.preventDefault();
        e.stopPropagation();
      }
      return;
    }
    
    // First tap - show tooltip
    // Only prevent default for mouse events, not touch events
    if (e.type === 'click') {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsOpen(true);
    setHasBeenTapped(true);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [isMobile, disabled, isOpen, hasBeenTapped, hasClickAction]);

  // Add/remove body class to prevent card hover effects when tooltip is open
  useEffect(() => {
    if (!isMobile) return;
    
    if (isOpen) {
      document.body.classList.add('tooltip-active');
    } else {
      document.body.classList.remove('tooltip-active');
    }
    
    return () => {
      document.body.classList.remove('tooltip-active');
    };
  }, [isMobile, isOpen]);

  // Handle click outside for mobile
  useEffect(() => {
    if (!isMobile || !isOpen) return;
    
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      
      // Check if click is outside both trigger and content
      // This will close the tooltip even if clicking inside another card
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        contentRef.current && !contentRef.current.contains(target)
      ) {
        setIsOpen(false);
        setHasBeenTapped(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }
    };
    
    // Create scroll handler function to properly remove it later
    const handleScroll = () => {
      setIsOpen(false);
      setHasBeenTapped(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    // Add listener with slight delay to avoid immediate trigger
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
      document.addEventListener('touchstart', handleClickOutside, true);
      // Also listen for scroll events to close tooltip
      document.addEventListener('scroll', handleScroll, true);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [isMobile, isOpen]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);



  // Handle close button click
  const handleCloseClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    setHasBeenTapped(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Prepare content with close button for mobile
  const mobileContent = useMemo(() => {
    const baseContent = !hasClickAction || !memoizedClickActionText ? memoizedContent : (
      <div>
        {memoizedContent}
        <div className="mt-3 pt-2 border-t border-border text-xs text-muted-foreground">
          {memoizedClickActionText || t('tooltip.clickAgainToActivate')}
        </div>
      </div>
    );

    // For mobile, wrap content with close button if enabled
    if (isMobile && showCloseButton) {
      return (
        <div className="relative">
          {/* Close button */}
          <button
            onClick={handleCloseClick}
            className="absolute -top-1 -right-1 w-6 h-6 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full flex items-center justify-center text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors z-10 border border-gray-300 dark:border-gray-600 shadow-sm"
            aria-label="Close tooltip"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
          {/* Content */}
          <div className="pr-6">
            {baseContent}
          </div>
        </div>
      );
    }

    return baseContent;
  }, [memoizedContent, hasClickAction, memoizedClickActionText, t, isMobile, showCloseButton, handleCloseClick]);

  if (disabled || !content) {
    return <>{children}</>;
  }

  // For mobile devices, use controlled tooltip with tap behavior
  if (isMobile) {
    return (
      <TooltipProvider>
        <Tooltip 
          open={isOpen} 
          onOpenChange={setIsOpen}
          key={`mobile-tooltip-${String(memoizedContent)}-${hasClickAction}`}
        >
          <TooltipTrigger asChild={asChild} className={className}>
            {React.cloneElement(children as React.ReactElement, {
              ref: triggerRef,
              onClick: (e: React.MouseEvent) => {
                // Get the original onClick handler
                const originalOnClick = (children as React.ReactElement).props?.onClick;
                
                console.log('🎯 ResponsiveTooltip Mobile Click Debug:', {
                  hasClickAction,
                  isOpen,
                  hasBeenTapped,
                  isMobile,
                  hasOriginalOnClick: !!originalOnClick,
                  isPending,
                  tapNumber: !hasBeenTapped ? 'FIRST_TAP' : 'SECOND_TAP'
                });
                
                if (hasClickAction) {
                  if (!hasBeenTapped) {
                    // First tap - show tooltip, call first tap callback
                    console.log('🔄 ResponsiveTooltip: First tap - showing tooltip, calling onFirstTap');
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(true);
                    setHasBeenTapped(true);
                    // Clear any existing timeout
                    if (timeoutRef.current) {
                      clearTimeout(timeoutRef.current);
                    }
                    // Call first tap callback if provided
                    if (onFirstTap) {
                      onFirstTap();
                    }
                    return;
                  } else {
                    // Second tap - hide tooltip, call second tap callback, then original action
                    console.log('✅ ResponsiveTooltip: Second tap - hiding tooltip, calling onSecondTap and originalOnClick');
                    setIsOpen(false);
                    setHasBeenTapped(false);
                    // Call second tap callback if provided
                    if (onSecondTap) {
                      onSecondTap();
                    }
                    // Don't prevent default, let the original action happen
                    if (originalOnClick) {
                      console.log('🚀 ResponsiveTooltip: Calling originalOnClick');
                      originalOnClick(e);
                    } else {
                      console.log('⚠️ ResponsiveTooltip: No originalOnClick found');
                    }
                    return;
                  }
                } else {
                  // No click action, just handle regular tooltip behavior
                  // Toggle tooltip on tap for informational tooltips
                  if (isOpen) {
                    setIsOpen(false);
                    setHasBeenTapped(false);
                  } else {
                    setIsOpen(true);
                    setHasBeenTapped(true);
                  }
                  
                  if (originalOnClick) {
                    originalOnClick(e);
                  }
                }
              }
            })}
          </TooltipTrigger>
          <TooltipContent
            ref={contentRef}
            side={side}
            align={align}
            className={cn(
              'z-50 max-w-xs text-sm bg-[rgb(var(--popover))] text-popover-foreground border border-border rounded-md px-3 py-2 shadow-md',
              contentClassName
            )}
            sideOffset={5}
          >
            {mobileContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // For desktop, use regular hover tooltip
  return (
    <TooltipProvider>
      <Tooltip delayDuration={delayDuration}>
        <TooltipTrigger asChild={asChild} className={className}>
          {children}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className={cn(
            'z-50 max-w-xs text-sm bg-[rgb(var(--popover))] text-popover-foreground border border-border rounded-md px-3 py-2 shadow-md',
            contentClassName
          )}
          sideOffset={5}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Helper component for simple text tooltips with title attribute fallback
interface SimpleTooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  disabled?: boolean;
}

export const SimpleTooltip: React.FC<SimpleTooltipProps> = ({
  content,
  children,
  className,
  side = 'top',
  align = 'center',
  disabled = false,
}) => {
  const isMobile = useIsMobile();
  
  // For mobile, use the responsive tooltip
  if (isMobile) {
    return (
      <ResponsiveTooltip
        content={content}
        side={side}
        align={align}
        className={className}
        disabled={disabled}
      >
        {children}
      </ResponsiveTooltip>
    );
  }
  
  // For desktop, use title attribute as fallback for better performance
  return (
    <div title={content} className={className}>
      {children}
    </div>
  );
};

export default ResponsiveTooltip; 