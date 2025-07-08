import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MarqueeTextProps {
  children: React.ReactNode;
  speed?: number; // pixels per second
  className?: string;
  style?: React.CSSProperties;
  enabled?: boolean;
  asDiv?: boolean; // If true, renders as div instead of span
}

export function MarqueeText({ 
  children, 
  speed = 120, 
  className = '', 
  style = {},
  enabled = true,
  asDiv = false
}: MarqueeTextProps) {
  const isMobile = useIsMobile();
  const divContainerRef = useRef<HTMLDivElement>(null);
  const divTextRef = useRef<HTMLDivElement>(null);
  const spanContainerRef = useRef<HTMLSpanElement>(null);
  const spanTextRef = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<number>();
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [offset, setOffset] = useState(0);

  // Get current refs based on element type
  const containerRef = asDiv ? divContainerRef : spanContainerRef;
  const textRef = asDiv ? divTextRef : spanTextRef;

  // Check if text needs marquee
  const checkTruncation = useCallback(() => {
    if (!containerRef.current || !textRef.current || !isMobile || !enabled) {
      setShouldAnimate(false);
      return;
    }

    const container = containerRef.current;
    const textElement = textRef.current;

    // Get the available width and text width
    const containerWidth = container.offsetWidth;
    const textWidth = textElement.scrollWidth;

    // If text is wider than container, enable marquee
    if (textWidth > containerWidth) {
      setShouldAnimate(true);
    } else {
      setShouldAnimate(false);
      setOffset(0);
    }
  }, [isMobile, enabled, asDiv]);

  // Animation loop
  const animate = useCallback(() => {
    if (!shouldAnimate || !containerRef.current || !textRef.current) return;

    const container = containerRef.current;
    const textElement = textRef.current;
    const containerWidth = container.offsetWidth;
    const textWidth = textElement.scrollWidth;
    
    // Calculate the distance the text needs to travel
    const maxOffset = textWidth - containerWidth;
    
    setOffset(prevOffset => {
      // Move text to the left
      let newOffset = prevOffset + speed / 60; // 60fps approximation
      
      // If text has scrolled completely off screen, reset to start from right
      if (newOffset > maxOffset + containerWidth) {
        newOffset = -containerWidth;
      }
      
      return newOffset;
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [shouldAnimate, speed, asDiv]);

  // Start/stop animation
  useEffect(() => {
    if (shouldAnimate) {
      setOffset(0); // Start from beginning
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setOffset(0);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [shouldAnimate, animate]);

  // Check truncation on mount and resize
  useEffect(() => {
    const checkWithDelay = () => {
      setTimeout(checkTruncation, 100);
    };

    checkWithDelay();
    window.addEventListener('resize', checkWithDelay);
    
    return () => {
      window.removeEventListener('resize', checkWithDelay);
    };
  }, [checkTruncation]);

  const containerStyle = {
    ...style,
    position: 'relative' as const,
    whiteSpace: shouldAnimate ? 'nowrap' as const : undefined
  };

  const textStyle = {
    transform: shouldAnimate ? `translateX(-${offset}px)` : 'none',
    display: 'inline-block' as const,
    whiteSpace: 'nowrap' as const
  };

  const containerClassName = `${className} ${shouldAnimate ? 'overflow-hidden' : ''}`;

  if (asDiv) {
    return (
      <div 
        ref={divContainerRef}
        className={containerClassName}
        style={containerStyle}
      >
        <div 
          ref={divTextRef}
          style={textStyle}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <span 
      ref={spanContainerRef}
      className={containerClassName}
      style={containerStyle}
    >
      <span 
        ref={spanTextRef}
        style={textStyle}
      >
        {children}
      </span>
    </span>
  );
} 