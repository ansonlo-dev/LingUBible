import { useEffect, useRef, useState } from 'react';
import { useIsMobile } from './use-mobile';

interface MarqueePlaceholderOptions {
  text: string;
  enabled?: boolean;
  speed?: number; // characters per second
  pauseDuration?: number; // pause at end in milliseconds
}

export function useMarqueePlaceholder({
  text,
  enabled = true,
  speed = 3, // characters per second
  pauseDuration = 1000 // 1 second pause
}: MarqueePlaceholderOptions) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayText, setDisplayText] = useState(text);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const animationRef = useRef<number>();
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Check if text would be truncated
  const checkTruncation = () => {
    if (!containerRef.current || !isMobile || !enabled) {
      setShouldAnimate(false);
      setDisplayText(text);
      return;
    }

    const element = containerRef.current;
    const input = element.querySelector('input') || element;
    
    if (!input) {
      setShouldAnimate(false);
      setDisplayText(text);
      return;
    }

    // Create a temporary element to measure text width
    const measurer = document.createElement('span');
    measurer.style.visibility = 'hidden';
    measurer.style.position = 'absolute';
    measurer.style.whiteSpace = 'nowrap';
    measurer.style.fontSize = window.getComputedStyle(input).fontSize;
    measurer.style.fontFamily = window.getComputedStyle(input).fontFamily;
    measurer.style.fontWeight = window.getComputedStyle(input).fontWeight;
    measurer.textContent = text;
    
    document.body.appendChild(measurer);
    const textWidth = measurer.offsetWidth;
    document.body.removeChild(measurer);

    // Get available width (input width minus padding)
    const inputStyles = window.getComputedStyle(input);
    const paddingLeft = parseInt(inputStyles.paddingLeft, 10) || 0;
    const paddingRight = parseInt(inputStyles.paddingRight, 10) || 0;
    const availableWidth = input.offsetWidth - paddingLeft - paddingRight;

    // Add some buffer to account for slight measurement differences
    const needsMarquee = textWidth > (availableWidth - 20);
    
    setShouldAnimate(needsMarquee);
    if (!needsMarquee) {
      setDisplayText(text);
    }
  };

  // Marquee animation function
  const startMarqueeAnimation = () => {
    if (!shouldAnimate || !text) return;

    let currentIndex = 0;
    const textLength = text.length;
    const intervalDuration = 1000 / speed; // milliseconds per character

    const animate = () => {
      if (currentIndex <= textLength) {
        // Show characters from start up to currentIndex
        setDisplayText(text.substring(0, currentIndex));
        currentIndex++;
        
        timeoutRef.current = setTimeout(() => {
          animationRef.current = requestAnimationFrame(animate);
        }, intervalDuration);
      } else {
        // Animation complete, pause then restart
        setDisplayText(text);
        timeoutRef.current = setTimeout(() => {
          currentIndex = 0;
          animationRef.current = requestAnimationFrame(animate);
        }, pauseDuration);
      }
    };

    // Start the animation
    animate();
  };

  // Stop animation and cleanup
  const stopAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  };

  // Check truncation when dependencies change
  useEffect(() => {
    const checkWithDelay = () => {
      // Small delay to ensure DOM is ready
      setTimeout(checkTruncation, 100);
    };

    checkWithDelay();

    // Listen for resize events
    window.addEventListener('resize', checkWithDelay);
    return () => {
      window.removeEventListener('resize', checkWithDelay);
    };
  }, [text, isMobile, enabled]);

  // Start/stop animation based on shouldAnimate
  useEffect(() => {
    stopAnimation(); // Clean up any existing animation

    if (shouldAnimate && isMobile && enabled) {
      // Small delay before starting animation
      timeoutRef.current = setTimeout(() => {
        startMarqueeAnimation();
      }, 500);
    } else {
      setDisplayText(text);
    }

    return stopAnimation;
  }, [shouldAnimate, text, speed, pauseDuration, isMobile, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return stopAnimation;
  }, []);

  return {
    ref: containerRef,
    displayText: shouldAnimate ? displayText : text,
    isAnimating: shouldAnimate
  };
} 