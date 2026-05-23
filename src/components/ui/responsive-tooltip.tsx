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
  onReset?: () => void; // Add reset callback for when tooltip is closed externally
  // Controlled mode props for mobile
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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
  onReset,
  open,
  onOpenChange,
}) => {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [hasBeenTapped, setHasBeenTapped] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Use controlled mode if open and onOpenChange are provided, otherwise use internal state
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalIsOpen;
  const setIsOpen = useCallback((newOpen: boolean) => {
    if (isControlled) {
      onOpenChange!(newOpen);
    } else {
      setInternalIsOpen(newOpen);
    }
  }, [isControlled, onOpenChange]);
  
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
        // Notify parent component to reset its state
        if (onReset) {
          onReset();
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
      // Notify parent component to reset its state
      if (onReset) {
        onReset();
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
  }, [isMobile, isOpen, onReset]);

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
    // Notify parent component to reset its state
    if (onReset) {
      onReset();
    }
  }, [onReset]);

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
                
                // For mobile with click action, let the parent component handle all the logic
                if (hasClickAction && originalOnClick) {
                  // Simply call the original onClick - parent will manage state
                  originalOnClick(e);
                } else if (!hasClickAction) {
                  // For informational tooltips (no click action), handle locally
                  if (isOpen) {
                    setIsOpen(false);
                    setHasBeenTapped(false);
                    if (onReset) {
                      onReset();
                    }
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
              'z-50 max-w-xs text-sm bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
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
            'z-50 max-w-xs text-sm bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
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
  // Always use the responsive tooltip for consistent styling across all devices
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
};

export default ResponsiveTooltip; 