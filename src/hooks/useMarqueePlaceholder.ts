import { useEffect, useRef, useState } from 'react';
import { useIsMobile } from './use-mobile';

interface MarqueePlaceholderOptions {
  text: string;
  enabled?: boolean;
  speed?: number; // pixels per second
}

export function useMarqueePlaceholder({
  text,
  enabled = true,
  speed = 120 // pixels per second - increased for faster movement
}: MarqueePlaceholderOptions) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [animationDistance, setAnimationDistance] = useState(0);

  // Check if text would be truncated and calculate animation distance
  const checkTruncation = () => {
    if (!containerRef.current || !isMobile || !enabled) {
      setShouldAnimate(false);
      return;
    }

    const element = containerRef.current;
    const input = element.querySelector('input') || element.querySelector('span') || element;
    
    if (!input) {
      setShouldAnimate(false);
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
    
    if (needsMarquee) {
      // Calculate how far we need to scroll to show all text
      const scrollDistance = textWidth - availableWidth + 40; // extra buffer
      setAnimationDistance(scrollDistance);
      setShouldAnimate(true);
    } else {
      setShouldAnimate(false);
      setAnimationDistance(0);
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

  // Generate CSS animation styles for the text element
  const getTextStyles = () => {
    if (!shouldAnimate || !animationDistance) return {};

    const scrollDuration = (animationDistance + 100) / speed; // time to scroll one full cycle
    
    return {
      animation: `marquee-continuous-${animationDistance} ${scrollDuration}s linear infinite`,
      whiteSpace: 'nowrap' as const,
      display: 'inline-block'
    };
  };

  // Generate CSS styles for the container
  const getContainerStyles = () => {
    if (!shouldAnimate) return {};
    
    return {
      overflow: 'hidden' as const,
      position: 'relative' as const,
      whiteSpace: 'nowrap' as const
    };
  };

  // Inject CSS keyframes if needed
  useEffect(() => {
    if (!shouldAnimate || !animationDistance) return;

    const styleId = `marquee-continuous-${animationDistance}`;
    let existingStyle = document.getElementById(styleId);
    
    if (!existingStyle) {
      existingStyle = document.createElement('style');
      existingStyle.id = styleId;
      document.head.appendChild(existingStyle);
    }

    // For continuous scrolling, we need to scroll from 0 to negative distance, then loop back seamlessly
    existingStyle.textContent = `
      @keyframes marquee-continuous-${animationDistance} {
        0% {
          transform: translateX(100%);
        }
        100% {
          transform: translateX(-${animationDistance + 100}px);
        }
      }
    `;

    return () => {
      // Cleanup: remove styles when component unmounts or animation stops
      const style = document.getElementById(styleId);
      if (style && !shouldAnimate) {
        style.remove();
      }
    };
  }, [shouldAnimate, animationDistance, speed]);

  return {
    ref: containerRef,
    text: text,
    shouldAnimate,
    textStyles: getTextStyles(),
    containerStyles: getContainerStyles(),
    // For continuous scrolling, we duplicate the text to create seamless loop
    displayText: shouldAnimate ? `${text} • ${text}` : text
  };
} 