import { useEffect, useRef, useCallback, useState } from 'react';

interface SwipeGestureOptions {
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  threshold?: number;
  restraint?: number;
  allowedTime?: number;
  enabled?: boolean;
  swipeZone?: 'full' | 'right-half' | 'left-edge' | 'left-half-to-right';
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
  const [reinitTrigger, setReinitTrigger] = useState<number>(0);
  const isScrolling = useRef<boolean>(false);
  const scrollTimeout = useRef<number | null>(null);
  const isValidSwipeStart = useRef<boolean>(false);
  const isSwipeGesture = useRef<boolean>(false);

  // 使用 ref 來存儲最新的選項，避免頻繁重新創建事件處理器
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const currentOptions = optionsRef.current;
    if (!currentOptions.enabled) return;

    // 重置狀態
    isScrolling.current = false;
    isValidSwipeStart.current = false;
    isSwipeGesture.current = false;

    if (!e.touches || e.touches.length === 0) {
      return;
    }
    
    const touch = e.touches[0];
    if (!touch) {
      return;
    }

    const startX = touch.clientX;
    const startY = touch.clientY;
    const screenWidth = window.innerWidth;

    // 檢查滑動區域
    if (currentOptions.swipeZone === 'right-half' && startX < screenWidth / 2) {
      return;
    }
    
    if (currentOptions.swipeZone === 'left-edge' && startX > (currentOptions.edgeThreshold || 50)) {
      return;
    }

    // 新增：左半部分到右半部分的滑動檢測
    if (currentOptions.swipeZone === 'left-half-to-right' && startX > screenWidth / 2) {
      return;
    }

    touchStartX.current = startX;
    touchStartY.current = startY;
    touchStartTime.current = Date.now();
    isValidSwipeStart.current = true;
    
    // 不在這裡阻止默認行為，讓其他交互正常進行
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const currentOptions = optionsRef.current;
    if (!currentOptions.enabled || !isValidSwipeStart.current) return;

    if (!e.touches || e.touches.length === 0) {
      return;
    }
    
    const touch = e.touches[0];
    if (!touch) {
      return;
    }
    
    const currentX = touch.clientX;
    const currentY = touch.clientY;
    
    const deltaX = Math.abs(currentX - touchStartX.current);
    const deltaY = Math.abs(currentY - touchStartY.current);
    
    // 檢測是否是水平滑動手勢（而不是垂直滾動）
    if (deltaX > 15 && deltaX > deltaY * 1.5) {
      // 這看起來像一個水平滑動手勢
      isSwipeGesture.current = true;
    } else if (deltaY > deltaX * 1.5 && deltaY > 20) {
      // 這是垂直滾動
      isScrolling.current = true;
      isValidSwipeStart.current = false;
      isSwipeGesture.current = false;
      
      // 清除之前的超時
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      
      // 設置超時來重置滾動狀態
      scrollTimeout.current = window.setTimeout(() => {
        isScrolling.current = false;
      }, 200);
    }

    // 只有當確定是滑動手勢時才阻止默認行為
    if (isSwipeGesture.current) {
      try {
        e.preventDefault();
      } catch (err) {
        // 忽略錯誤，可能是被動監聽器
      }
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const currentOptions = optionsRef.current;
    if (!currentOptions.enabled || !isValidSwipeStart.current || isScrolling.current) {
      // 重置狀態
      isValidSwipeStart.current = false;
      isSwipeGesture.current = false;
      return;
    }

    if (!e.changedTouches || e.changedTouches.length === 0) {
      return;
    }
    
    const touch = e.changedTouches[0];
    if (!touch) {
      return;
    }
    
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();

    const distanceX = endX - touchStartX.current;
    const distanceY = endY - touchStartY.current;
    const elapsedTime = endTime - touchStartTime.current;

    const threshold = currentOptions.threshold || 100;
    const restraint = currentOptions.restraint || 100;
    const allowedTime = currentOptions.allowedTime || 300;

    // 檢查時間限制
    if (elapsedTime > allowedTime) {
      isValidSwipeStart.current = false;
      isSwipeGesture.current = false;
      return;
    }

    // 特殊處理：左半部分到右半部分的滑動
    if (currentOptions.swipeZone === 'left-half-to-right') {
      const screenWidth = window.innerWidth;
      const startX = touchStartX.current;
      
      // 確保滑動從左半部分開始，在右半部分結束，且是向右滑動
      if (startX <= screenWidth / 2 && endX > screenWidth / 2 && distanceX > 0) {
        // 對於這種模式，使用較小的閾值，因為用戶已經滑動了較長距離
        const adjustedThreshold = Math.min(threshold, screenWidth / 4); // 最多螢幕寬度的1/4
        
        if (Math.abs(distanceX) >= adjustedThreshold && Math.abs(distanceY) <= restraint) {
          // 只在確認是有效滑動時才阻止默認行為並執行回調
          try {
            e.preventDefault();
          } catch (err) {
            // 忽略錯誤，可能是被動監聽器
          }
          
          if (currentOptions.onSwipeRight) {
            currentOptions.onSwipeRight();
          }
        }
      }
      
      // 重置狀態
      isValidSwipeStart.current = false;
      isSwipeGesture.current = false;
      return;
    }

    // 原有的滑動邏輯
    if (Math.abs(distanceX) >= threshold && Math.abs(distanceY) <= restraint) {
      // 只在確認是有效滑動時才阻止默認行為並執行回調
      try {
        e.preventDefault();
      } catch (err) {
        // 忽略錯誤，可能是被動監聽器
      }
      
      if (distanceX > 0 && currentOptions.onSwipeRight) {
        // 向右滑動
        currentOptions.onSwipeRight();
      } else if (distanceX < 0 && currentOptions.onSwipeLeft) {
        // 向左滑動
        currentOptions.onSwipeLeft();
      }
    }
    
    // 重置狀態
    isValidSwipeStart.current = false;
    isSwipeGesture.current = false;
  }, []);

  const forceReinit = useCallback(() => {
    setReinitTrigger(prev => prev + 1);
  }, []);

  // 使用 document 而不是覆蓋層，並使用被動監聽器來提高性能
  useEffect(() => {
    if (!enabled) return;

    // 使用被動監聽器以避免阻止默認滾動行為
    const options = { passive: true };
    const activeOptions = { passive: false }; // 只在需要時使用

    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('touchmove', handleTouchMove, activeOptions);
    document.addEventListener('touchend', handleTouchEnd, activeOptions);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
        scrollTimeout.current = null;
      }
    };
  }, [enabled, reinitTrigger, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // 頁面可見性變化時重新初始化
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        setTimeout(() => {
          forceReinit();
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, forceReinit]);

  // 窗口大小變化時重新初始化
  useEffect(() => {
    const handleResize = () => {
      if (enabled) {
        setTimeout(() => {
          forceReinit();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [enabled, forceReinit]);

  return {
    ref: elementRef,
    forceReinit
  };
} 