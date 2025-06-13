import { useState, useEffect, useRef } from 'react';
import { ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export function BackToTop() {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
        
        const shouldBeVisible = scrollTop > 50;
        
        // 強制狀態更新，確保 React 重新渲染
        setIsVisible(prev => {
          if (prev !== shouldBeVisible) {
            // 使用 setTimeout 確保狀態更新被處理
            setTimeout(() => setIsVisible(shouldBeVisible), 0);
            return shouldBeVisible;
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
      
      // 強制檢查多次
      const forceCheck = () => {
        const bodyScrollTop = document.body.scrollTop || 0;
        const documentScrollTop = document.documentElement.scrollTop || 0;
        const windowScrollY = window.pageYOffset || 0;
        const scrollTop = Math.max(bodyScrollTop, documentScrollTop, windowScrollY);
        setIsVisible(scrollTop > 50);
      };

      // 多個時間點檢查
      setTimeout(forceCheck, 0);
      setTimeout(forceCheck, 100);
      setTimeout(forceCheck, 300);
      setTimeout(forceCheck, 500);
      setTimeout(forceCheck, 800);
      setTimeout(forceCheck, 1200);
      
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

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      style={{
        position: 'fixed',
        bottom: window.innerWidth >= 768 ? '64px' : '8px',
        right: window.innerWidth >= 768 ? '32px' : '8px',
        zIndex: 40,
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgb(220, 38, 38) 0%, rgb(136, 19, 23) 100%)',
        color: 'white',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.3s ease-in-out',
        transform: isVisible 
          ? 'translateY(0px) scale(1)' 
          : 'translateY(32px) scale(0.75)',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
      onMouseEnter={(e) => {
        if (isVisible) {
          e.currentTarget.style.opacity = '0.9';
          e.currentTarget.style.transform = isVisible 
            ? 'translateY(0px) scale(1.1)' 
            : 'translateY(32px) scale(0.75)';
        }
      }}
      onMouseLeave={(e) => {
        if (isVisible) {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.transform = isVisible 
            ? 'translateY(0px) scale(1)' 
            : 'translateY(32px) scale(0.75)';
        }
      }}
      onMouseDown={(e) => {
        if (isVisible) {
          e.currentTarget.style.transform = isVisible 
            ? 'translateY(0px) scale(0.95)' 
            : 'translateY(32px) scale(0.75)';
        }
      }}
      onMouseUp={(e) => {
        if (isVisible) {
          e.currentTarget.style.transform = isVisible 
            ? 'translateY(0px) scale(1.1)' 
            : 'translateY(32px) scale(0.75)';
        }
      }}
      aria-label={t('backToTop.label')}
    >
      <ChevronUp style={{ width: '24px', height: '24px', strokeWidth: 3 }} />
    </Button>
  );
} 