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
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // 使用 ref 來存儲最新的選項，避免頻繁重新創建事件處理器
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const currentOptions = optionsRef.current;
    if (!currentOptions.enabled) return;

    // 重置狀態
    isScrolling.current = false;
    isValidSwipeStart.current = false;

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
    
  }, []); // 移除所有依賴，使用 ref 來獲取最新值

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
    
    // 更智能的滾動檢測：只有當垂直移動明顯超過水平移動且達到一定閾值時才認為是滾動
    if (deltaY > deltaX * 1.5 && deltaY > 20) {
      isScrolling.current = true;
      isValidSwipeStart.current = false; // 標記為無效的滑動開始
      
      // 清除之前的超時
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      
      // 設置超時來重置滾動狀態
      scrollTimeout.current = window.setTimeout(() => {
        isScrolling.current = false;
      }, 200);
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const currentOptions = optionsRef.current;
    if (!currentOptions.enabled || !isValidSwipeStart.current || isScrolling.current) {
      // 重置狀態
      isValidSwipeStart.current = false;
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
    if (elapsedTime > allowedTime) return;

    // 特殊處理：左半部分到右半部分的滑動
    if (currentOptions.swipeZone === 'left-half-to-right') {
      const screenWidth = window.innerWidth;
      const startX = touchStartX.current;
      
      // 確保滑動從左半部分開始，在右半部分結束，且是向右滑動
      if (startX <= screenWidth / 2 && endX > screenWidth / 2 && distanceX > 0) {
        // 對於這種模式，使用較小的閾值，因為用戶已經滑動了較長距離
        const adjustedThreshold = Math.min(threshold, screenWidth / 4); // 最多螢幕寬度的1/4
        
        if (Math.abs(distanceX) >= adjustedThreshold && Math.abs(distanceY) <= restraint) {
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
      return;
    }

    // 原有的滑動邏輯
    if (Math.abs(distanceX) >= threshold && Math.abs(distanceY) <= restraint) {
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
  }, []);

  // 創建透明覆蓋層來確保滑動手勢始終有效
  const createOverlay = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    // 移除現有覆蓋層
    if (overlayRef.current) {
      document.body.removeChild(overlayRef.current);
      overlayRef.current = null;
    }

    // 創建新的透明覆蓋層，只在需要時顯示
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 999999;
      pointer-events: none;
      background: transparent;
      touch-action: manipulation;
    `;
    
    // 讓覆蓋層只在滑動時接收觸摸事件
    overlay.style.pointerEvents = 'auto';
    
    overlayRef.current = overlay;
    document.body.appendChild(overlay);

    // 使用 capture 階段來確保事件處理優先級最高
    overlay.addEventListener('touchstart', handleTouchStart, { capture: true, passive: false });
    overlay.addEventListener('touchmove', handleTouchMove, { capture: true, passive: false });
    overlay.addEventListener('touchend', handleTouchEnd, { capture: true, passive: false });

  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const removeOverlay = useCallback(() => {
    if (overlayRef.current) {
      try {
        document.body.removeChild(overlayRef.current);
      } catch (err) {
        // 元素可能已經被移除
      }
      overlayRef.current = null;
    }
  }, []);

  const forceReinit = useCallback(() => {
    setReinitTrigger(prev => prev + 1);
  }, []);

  // 主要的 effect，處理覆蓋層的創建和清理
  useEffect(() => {
    if (enabled) {
      createOverlay();
    } else {
      removeOverlay();
    }

    return () => {
      removeOverlay();
    };
  }, [enabled, reinitTrigger, createOverlay, removeOverlay]);

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