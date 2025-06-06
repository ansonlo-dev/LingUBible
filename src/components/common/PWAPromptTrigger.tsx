import { useEffect } from 'react';
import { usePWA } from '@/contexts/PWAContext';

export const PWAPromptTrigger = () => {
  const { canInstall, deferredPrompt } = usePWA();

  useEffect(() => {
    // 如果可以安裝且有延遲的提示事件，觸發用戶參與度檢查
    if (canInstall && deferredPrompt) {
      let userEngagementScore = 0;
      let hasTriggeredPrompt = false;
      
      // 用戶參與度指標
      const trackEngagement = () => {
        userEngagementScore += 1;
        
        // 當用戶參與度達到一定程度時，觸發原生提示
        if (userEngagementScore >= 3 && !hasTriggeredPrompt) {
          hasTriggeredPrompt = true;
          
          // 延遲一點時間再觸發，讓用戶完成當前操作
          setTimeout(() => {
            if (deferredPrompt && !hasTriggeredPrompt) {
              // 不調用 preventDefault，讓瀏覽器自然顯示提示
              // 這裡我們只是記錄，實際的提示由瀏覽器控制
            }
          }, 1000);
        }
      };

      // 監聽用戶互動事件
      const events = ['click', 'scroll', 'keydown', 'touchstart'];
      
      events.forEach(eventType => {
        document.addEventListener(eventType, trackEngagement, { 
          passive: true, 
          once: false 
        });
      });

      // 清理函數
      return () => {
        events.forEach(eventType => {
          document.removeEventListener(eventType, trackEngagement);
        });
      };
    }
  }, [canInstall, deferredPrompt]);

  // 這個組件不渲染任何內容
  return null;
}; 