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

  // 使用 ref 來存儲最新的選項，避免頻繁重新創建事件處理器
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const currentOptions = optionsRef.current;
    if (!currentOptions.enabled) return;

    // 如果正在滾動，忽略觸摸開始
    if (isScrolling.current) return;

    // 檢查觸摸是否發生在互動元素上
    const target = e.target as Element;
    if (target && (
      target.closest('[role="dialog"]') ||
      target.closest('.search-container') ||
      target.closest('[data-radix-dialog-content]') ||
      target.closest('input[type="text"]') ||
      target.closest('textarea') ||
      target.closest('select') ||
      target.closest('button') ||
      target.closest('a[href]') ||
      target.closest('[cmdk-root]') ||
      target.closest('.fixed.left-4.right-4') // 搜索結果下拉框
    )) {

      return;
    }

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
    if (!currentOptions.enabled) return;

    // 如果正在滾動或不是有效的滑動開始，忽略觸摸結束
    if (isScrolling.current || !isValidSwipeStart.current) {
      // 重置狀態
      isScrolling.current = false;
      isValidSwipeStart.current = false;
      return;
    }

    // 檢查觸摸結束是否發生在互動元素上
    const target = e.target as Element;
    if (target && (
      target.closest('[role="dialog"]') ||
      target.closest('.search-container') ||
      target.closest('[data-radix-dialog-content]') ||
      target.closest('input[type="text"]') ||
      target.closest('textarea') ||
      target.closest('select') ||
      target.closest('button') ||
      target.closest('a[href]') ||
      target.closest('[cmdk-root]') ||
      target.closest('.fixed.left-4.right-4') // 搜索結果下拉框
    )) {

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

    // 檢查是否為有效的水平滑動
    if (Math.abs(distanceX) >= threshold && Math.abs(distanceY) <= restraint) {
      // 阻止默認行為以避免頁面滾動等干擾
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
  }, []); // 移除所有依賴，使用 ref 來獲取最新值

  // 強制重新初始化的函數
  const forceReinit = useCallback(() => {
    setReinitTrigger(prev => prev + 1);
  }, [reinitTrigger]);

  useEffect(() => {
    const element = elementRef.current || document;
    const currentCount = reinitTrigger;

    // 添加延遲以確保在頁面導航後正確綁定
    const bindEvents = () => {
      // 總是添加事件監聽器，在處理器內部檢查 enabled 狀態
      // touchstart 和 touchmove 使用 passive 來提高性能
      element.addEventListener('touchstart', handleTouchStart, { passive: true });
      element.addEventListener('touchmove', handleTouchMove, { passive: true });
      element.addEventListener('touchend', handleTouchEnd, { passive: false });


    };

    // 立即綁定
    bindEvents();

    // 也在下一個事件循環中再次綁定，以防頁面導航時的時機問題
    const timeoutId = setTimeout(() => {
      // 先移除可能存在的監聽器，避免重複綁定
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      // 重新綁定
      bindEvents();

    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);

    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, reinitTrigger]); // 添加 reinitTrigger 作為依賴

  return { ref: elementRef, forceReinit };
} 