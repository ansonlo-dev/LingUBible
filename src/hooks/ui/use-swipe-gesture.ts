import { useEffect, useRef, useCallback } from 'react';

interface SwipeGestureOptions {
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  threshold?: number;
  restraint?: number;
  allowedTime?: number;
  enabled?: boolean;
  swipeZone?: 'full' | 'right-half' | 'left-edge';
  edgeThreshold?: number;
}

export function useSwipeGesture(options: SwipeGestureOptions = {}) {
  const {
    onSwipeRight,
    onSwipeLeft,
    threshold = 100,
    restraint = 100,
    allowedTime = 300,
    enabled = true,
    swipeZone = 'full',
    edgeThreshold = 50
  } = options;

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const elementRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    const screenWidth = window.innerWidth;

    // 檢查滑動區域
    if (swipeZone === 'right-half' && startX < screenWidth / 2) {
      return;
    }
    
    if (swipeZone === 'left-edge' && startX > edgeThreshold) {
      return;
    }

    touchStartX.current = startX;
    touchStartY.current = startY;
    touchStartTime.current = Date.now();
  }, [enabled, swipeZone, edgeThreshold]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();

    const distanceX = endX - touchStartX.current;
    const distanceY = endY - touchStartY.current;
    const elapsedTime = endTime - touchStartTime.current;

    // 檢查時間限制
    if (elapsedTime > allowedTime) return;

    // 檢查是否為有效的水平滑動
    if (Math.abs(distanceX) >= threshold && Math.abs(distanceY) <= restraint) {
      if (distanceX > 0 && onSwipeRight) {
        // 向右滑動
        onSwipeRight();
      } else if (distanceX < 0 && onSwipeLeft) {
        // 向左滑動
        onSwipeLeft();
      }
    }
  }, [enabled, threshold, restraint, allowedTime, onSwipeRight, onSwipeLeft]);

  useEffect(() => {
    const element = elementRef.current || document;

    if (enabled) {
      element.addEventListener('touchstart', handleTouchStart, { passive: true });
      element.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchEnd]);

  return elementRef;
} 