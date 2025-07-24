import { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';

export function BackToTop() {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isBottomVisible, setIsBottomVisible] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 檢測設備類型和方向以決定按鈕位置
  const getButtonPosition = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const aspectRatio = width / height;
    
    // 判斷是否為手機設備
    const isMobile = 
      width < 768 || // 明確的手機尺寸
      (isTouchDevice && isLandscape) || // 觸摸設備橫屏
      (isLandscape && aspectRatio > 1.5 && width < 1200); // 明顯的橫屏比例但不是大螢幕
    
    if (isMobile) {
      // 手機版：保持原有的靠近邊緣定位
      return {
        right: '8px',
        bottomButton: '8px',
        topButton: '40px', // 8px + 32px height
        isDesktop: false
      };
    } else {
      // 桌面版：保持相同的水平位置，只在底部時垂直移動
      return {
        right: '16px', // 保持一致的水平位置
        bottomButton: isAtBottom ? '100px' : '16px',
        topButton: isAtBottom ? '132px' : '48px', // 16px + 32px height
        isDesktop: true
      };
    }
  };

  const [buttonPosition, setButtonPosition] = useState(() => getButtonPosition());

  // 更新按鈕位置的函數
  const updateButtonPosition = () => {
    const newPosition = getButtonPosition();
    setButtonPosition(newPosition);
  };

  // 監聽視窗變化和方向變化
  useEffect(() => {
    const handleResize = () => {
      updateButtonPosition();
    };

    const handleOrientationChange = () => {
      // 方向變化時稍微延遲，等待瀏覽器完成佈局調整
      setTimeout(updateButtonPosition, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // 初始更新
    updateButtonPosition();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [isAtBottom]);

  useEffect(() => {
    let mounted = true;

    const updateScrollPosition = () => {
      if (!mounted) return;
      
      try {
        // 嘗試多種滾動檢測方法，確保在不同設備上都能正常工作
        const bodyScrollTop = document.body.scrollTop || 0;
        const documentScrollTop = document.documentElement.scrollTop || 0;
        const windowScrollY = window.pageYOffset || 0;
        
        // 使用最大值確保檢測準確
        const scrollTop = Math.max(bodyScrollTop, documentScrollTop, windowScrollY);
        
        // 計算頁面總高度和視窗高度
        const documentHeight = Math.max(
          document.body.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.clientHeight,
          document.documentElement.scrollHeight,
          document.documentElement.offsetHeight
        );
        const windowHeight = window.innerHeight;
        
        const shouldBeVisible = scrollTop > 50;
        const shouldBottomBeVisible = scrollTop + windowHeight < documentHeight - 50;
        const shouldBeAtBottom = scrollTop + windowHeight >= documentHeight - 100; // 檢測是否接近底部
        
        // 更新狀態
        setIsVisible(shouldBeVisible);
        setIsBottomVisible(shouldBottomBeVisible);
        setIsAtBottom(shouldBeAtBottom);
        
        // 強制狀態更新，確保 React 重新渲染
        setIsVisible(prev => {
          if (prev !== shouldBeVisible) {
            // 使用 setTimeout 確保狀態更新被處理
            setTimeout(() => setIsVisible(shouldBeVisible), 0);
            return shouldBeVisible;
          }
          return prev;
        });
        
        setIsBottomVisible(prev => {
          if (prev !== shouldBottomBeVisible) {
            setTimeout(() => setIsBottomVisible(shouldBottomBeVisible), 0);
            return shouldBottomBeVisible;
          }
          return prev;
        });

        setIsAtBottom(prev => {
          if (prev !== shouldBeAtBottom) {
            setTimeout(() => setIsAtBottom(shouldBeAtBottom), 0);
            return shouldBeAtBottom;
          }
          return prev;
        });
      } catch (error) {
        console.error('BackToTop scroll detection error:', error);
      }
    };

    // 立即執行一次
    updateScrollPosition();

    // 使用高頻檢查確保狀態及時更新
    intervalRef.current = setInterval(updateScrollPosition, 50); // 每50ms檢查一次

    // 事件監聽器
    const handleScroll = () => {
      updateScrollPosition();
    };

    const handleInteraction = () => {
      // 任何交互都觸發狀態檢查
      setTimeout(updateScrollPosition, 0);
      setTimeout(updateScrollPosition, 50);
    };

    // 監聽多個事件源
    document.body.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // 交互事件
    document.addEventListener('touchstart', handleInteraction, { passive: true });
    document.addEventListener('touchend', handleInteraction, { passive: true });
    document.addEventListener('click', handleInteraction, { passive: true });
    document.addEventListener('touchmove', handleInteraction, { passive: true });
    
    // 視窗事件
    window.addEventListener('resize', updateScrollPosition, { passive: true });

    return () => {
      mounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.body.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('touchend', handleInteraction);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchmove', handleInteraction);
      window.removeEventListener('resize', updateScrollPosition);
    };
  }, []);

  const scrollToTop = () => {
    try {
      // 立即隱藏按鈕（預防性）
      setIsVisible(false);
      
      // 嘗試多種滾動方法
      if (document.body.scrollTo) {
        document.body.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      } else if (document.documentElement.scrollTo) {
        document.documentElement.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      } else if (window.scrollTo) {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
      
      // Keep button fully opaque on mobile during scroll, then reset after scroll completes
      const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
      if (isMobile) {
        const backToTopButton = document.querySelector('[aria-label*="backToTop"], [aria-label*="Back to top"]') as HTMLElement;
        if (backToTopButton) {
          // Immediately make button fully opaque when clicked
          backToTopButton.style.opacity = '1';
        }
      }
      
      // 強制檢查多次
      const forceCheck = (isLastCheck = false) => {
        const bodyScrollTop = document.body.scrollTop || 0;
        const documentScrollTop = document.documentElement.scrollTop || 0;
        const windowScrollY = window.pageYOffset || 0;
        const scrollTop = Math.max(bodyScrollTop, documentScrollTop, windowScrollY);
        const documentHeight = Math.max(
          document.body.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.clientHeight,
          document.documentElement.scrollHeight,
          document.documentElement.offsetHeight
        );
        const windowHeight = window.innerHeight;
        setIsVisible(scrollTop > 50);
        setIsBottomVisible(scrollTop + windowHeight < documentHeight - 50);
        
        // Reset mobile opacity on final check for back-to-top button
        if (isLastCheck && isMobile) {
          const backToTopButton = document.querySelector('[aria-label*="backToTop"], [aria-label*="Back to top"]') as HTMLElement;
          if (backToTopButton) {
            backToTopButton.style.opacity = '0.5';
          }
        }
      };

      // 多個時間點檢查
      setTimeout(() => forceCheck(false), 0);
      setTimeout(() => forceCheck(false), 100);
      setTimeout(() => forceCheck(false), 300);
      setTimeout(() => forceCheck(false), 500);
      setTimeout(() => forceCheck(true), 700); // Last check resets mobile opacity - reduced from 1200ms to 700ms
      
    } catch (error) {
      // 備用方案
      try {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        window.scrollTo(0, 0);
        setIsVisible(false);
      } catch (fallbackError) {
        console.error('BackToTop scroll to top error:', fallbackError);
      }
    }
  };

  const scrollToBottom = () => {
    try {
      // 立即隱藏按鈕（預防性）
      setIsBottomVisible(false);
      
      // 尋找頁腳元素並滾動至其開始位置
      const footer = document.querySelector('footer');
      
      if (footer) {
        // 使用 scrollIntoView 滾動到頁腳開始位置，block: 'start' 確保頁腳頂部對齊視窗頂部
        footer.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      } else {
        // 如果找不到頁腳元素，回退到原來的行為（滾動到頁面底部）
        const documentHeight = Math.max(
          document.body.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.clientHeight,
          document.documentElement.scrollHeight,
          document.documentElement.offsetHeight
        );
        
        window.scrollTo({
          top: documentHeight,
          behavior: 'smooth'
        });
      }
      
      // Keep button fully opaque on mobile during scroll, then reset after scroll completes
      const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
      if (isMobile) {
        const scrollToBottomButton = document.querySelector('[aria-label*="scrollToBottom"], [aria-label*="Scroll to bottom"]') as HTMLElement;
        if (scrollToBottomButton) {
          // Immediately make button fully opaque when clicked
          scrollToBottomButton.style.opacity = '1';
        }
      }
      
      // 強制檢查多次
      const forceCheck = (isLastCheck = false) => {
        const bodyScrollTop = document.body.scrollTop || 0;
        const documentScrollTop = document.documentElement.scrollTop || 0;
        const windowScrollY = window.pageYOffset || 0;
        const scrollTop = Math.max(bodyScrollTop, documentScrollTop, windowScrollY);
        const documentHeight = Math.max(
          document.body.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.clientHeight,
          document.documentElement.scrollHeight,
          document.documentElement.offsetHeight
        );
        const windowHeight = window.innerHeight;
        setIsVisible(scrollTop > 50);
        setIsBottomVisible(scrollTop + windowHeight < documentHeight - 50);
        
        // Reset mobile opacity on final check for scroll-to-bottom button
        if (isLastCheck && isMobile) {
          const scrollToBottomButton = document.querySelector('[aria-label*="scrollToBottom"], [aria-label*="Scroll to bottom"]') as HTMLElement;
          if (scrollToBottomButton) {
            scrollToBottomButton.style.opacity = '0.5';
          }
        }
      };

      // 多個時間點檢查
      setTimeout(() => forceCheck(false), 0);
      setTimeout(() => forceCheck(false), 100);
      setTimeout(() => forceCheck(false), 300);
      setTimeout(() => forceCheck(false), 500);
      setTimeout(() => forceCheck(true), 700); // Last check resets mobile opacity - reduced from 1200ms to 700ms
      
    } catch (error) {
      // 備用方案
      try {
        const documentHeight = Math.max(
          document.body.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.clientHeight,
          document.documentElement.scrollHeight,
          document.documentElement.offsetHeight
        );
        document.body.scrollTop = documentHeight;
        document.documentElement.scrollTop = documentHeight;
        window.scrollTo(0, documentHeight);
        setIsBottomVisible(false);
      } catch (fallbackError) {
        console.error('ScrollToBottom scroll to bottom error:', fallbackError);
      }
    }
  };

  const buttonBaseStyle = {
    position: 'fixed' as const,
    right: buttonPosition.right,
    zIndex: 40,
    width: '40px',
    height: '32px',
    background: 'linear-gradient(135deg, rgb(220, 38, 38) 0%, rgb(136, 19, 23) 100%)',
    color: 'white',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s ease-in-out',
    opacity: 0.5, // Half transparent by default
  };

  const topButtonStyle = {
    ...buttonBaseStyle,
    borderRadius: '20px 20px 0 0', // Upper half circle
  };

  const bottomButtonStyle = {
    ...buttonBaseStyle,
    borderRadius: '0 0 20px 20px', // Lower half circle
  };

  const getButtonEventHandlers = (isVisible: boolean) => ({
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isVisible) {
        e.currentTarget.style.opacity = '1';
      }
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isVisible) {
        e.currentTarget.style.opacity = '0.5';
      }
    },
    onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isVisible) {
        e.currentTarget.style.opacity = '0.8';
      }
    },
    onMouseUp: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isVisible) {
        e.currentTarget.style.opacity = '1';
      }
    }
  });

  return (
    <>
      {/* Back to Top Button */}
      <Button
        onClick={scrollToTop}
        size="icon"
        style={{
          ...topButtonStyle,
          bottom: buttonPosition.topButton, // Position directly above scroll-to-bottom button (64+32=96, 8+32=40)
          transform: 'translateY(0px) scale(1)',
          pointerEvents: 'auto'
        }}
        {...getButtonEventHandlers(true)}
        aria-label={t('backToTop.label')}
      >
        <ChevronUp style={{ width: '20px', height: '20px', strokeWidth: 3 }} />
      </Button>

      {/* Scroll to Bottom Button */}
      <Button
        onClick={scrollToBottom}
        size="icon"
        style={{
          ...bottomButtonStyle,
          bottom: buttonPosition.bottomButton,
          transform: 'translateY(0px) scale(1)',
          pointerEvents: 'auto'
        }}
        {...getButtonEventHandlers(true)}
        aria-label={t('scrollToBottom.label') || 'Scroll to bottom'}
      >
        <ChevronDown style={{ width: '20px', height: '20px', strokeWidth: 3 }} />
      </Button>
    </>
  );
} 