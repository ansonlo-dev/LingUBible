import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 延遲執行滾動，確保頁面內容已經渲染
    const timer = setTimeout(() => {
      try {
        // 方法1: 立即滾動到頂部（無動畫）
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        
        // 方法2: 尋找可能的滾動容器並滾動
        const scrollableElements = [
          document.querySelector('.main-container'),
          document.querySelector('.content-area'),
          document.querySelector('main'),
          document.documentElement,
          document.body
        ];
        
        scrollableElements.forEach(element => {
          if (element && element.scrollTop > 0) {
            element.scrollTop = 0;
          }
        });
        
        // 方法3: 使用平滑滾動作為最後的嘗試
        setTimeout(() => {
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
          });
        }, 50);
        

      } catch (error) {
        console.error('ScrollToTop: Error scrolling to top:', error);
        // 最後的備用方案
        window.scrollTo(0, 0);
      }
    }, 50); // 減少延遲到 50ms

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
} 