import { useState, useEffect, useRef, useCallback } from 'react';

interface UseCounterAnimationOptions {
  end: number;
  duration?: number;
  delay?: number;
  easing?: (t: number) => number;
  startPercentage?: number; // 從目標值的百分比開始
}

export function useCounterAnimation({
  end,
  duration = 1500, // 默認1.5秒
  delay = 0,
  easing = (t: number) => t * t * (3 - 2 * t), // smooth step easing
  startPercentage = 0.3 // 從目標值的30%開始
}: UseCounterAnimationOptions) {
  const start = Math.floor(end * startPercentage);
  const [count, setCount] = useState(end); // 初始顯示最終值
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const frameRef = useRef<number>();
  const startTimeRef = useRef<number>();

  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);
    
    const currentValue = start + (end - start) * easedProgress;
    setCount(Math.floor(currentValue));

    if (progress < 1) {
      frameRef.current = requestAnimationFrame(animate);
    } else {
      setCount(end);
      setHasAnimated(true);
      setIsAnimating(false);
    }
  }, [start, end, duration, easing]);

  const startAnimation = useCallback(() => {
    if (hasAnimated || isAnimating) return; // 只播放一次且避免重複觸發
    
    setIsAnimating(true);
    setCount(start);
    startTimeRef.current = undefined;
    
    const startAnimationFrame = () => {
      frameRef.current = requestAnimationFrame(animate);
    };

    if (delay > 0) {
      setTimeout(startAnimationFrame, delay);
    } else {
      startAnimationFrame();
    }
  }, [hasAnimated, isAnimating, start, end, delay, animate]);

  const resetAnimation = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    setCount(end);
    setHasAnimated(false);
    setIsAnimating(false);
    startTimeRef.current = undefined;
  }, [end]);

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return {
    count,
    hasAnimated,
    isAnimating,
    startAnimation,
    resetAnimation
  };
} 