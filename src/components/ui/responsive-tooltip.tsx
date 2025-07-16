import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

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
}) => {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [hasBeenTapped, setHasBeenTapped] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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

  // Handle click outside for mobile
  useEffect(() => {
    if (!isMobile || !isOpen) return;
    
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      
      // Check if click is outside both trigger and content
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
    
    // Add listener with slight delay to avoid immediate trigger
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
      document.addEventListener('touchstart', handleClickOutside, true);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
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

  // Prepare content with click instruction for mobile
  const mobileContent = useCallback(() => {
    if (!hasClickAction || !isOpen || !hasBeenTapped) {
      return content;
    }
    
    const actionText = clickActionText || t('tooltip.clickAgainToActivate');
    
    return (
      <div>
        {content}
        <div className="mt-2 text-xs opacity-75 italic border-t border-border/50 pt-1">
          {actionText}
        </div>
      </div>
    );
  }, [content, hasClickAction, isOpen, hasBeenTapped, clickActionText, t]);

  if (disabled || !content) {
    return <>{children}</>;
  }

  // For mobile devices, use controlled tooltip with tap behavior
  if (isMobile) {
    return (
      <TooltipProvider>
        <Tooltip open={isOpen} onOpenChange={setIsOpen}>
          <TooltipTrigger asChild={asChild} className={className}>
            <div 
              ref={triggerRef}
              onClick={(e) => {
                if (hasClickAction && (!isOpen || !hasBeenTapped)) {
                  // First click - prevent action, show tooltip
                  e.preventDefault();
                  e.stopPropagation();
                }
                handleMobileTap(e);
              }}
              className="cursor-pointer"
            >
              {children}
            </div>
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
            {mobileContent()}
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