import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  platforms?: string[];
}

interface PWAContextType {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  canInstall: boolean;
  promptInstall: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // 檢查是否已經安裝
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          (window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return;
      }
    };

    checkIfInstalled();

    // 監聽 beforeinstallprompt 事件
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA Context: beforeinstallprompt 事件觸發');
      console.log('PWA Context: 當前 deferredPromptRef 狀態:', !!deferredPromptRef.current);
      
      // 阻止瀏覽器的自動提示，我們將手動控制
      e.preventDefault();
      
      // 總是保存新的事件，因為語言變更後舊的事件可能失效
      const promptEvent = e as BeforeInstallPromptEvent;
      deferredPromptRef.current = promptEvent;
      setDeferredPrompt(promptEvent);
      console.log('PWA Context: 已保存安裝提示事件（覆蓋舊事件）');
      
      console.log('PWA Context: 已阻止原生提示');
    };

    // 監聽應用安裝事件
    const handleAppInstalled = () => {
      console.log('PWA Context: 應用已安裝');
      setIsInstalled(true);
      deferredPromptRef.current = null;
      setDeferredPrompt(null);
    };

    // 不再需要監聽 manifest 更新事件，使用統一的英文 manifest

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    console.log('PWA Context: promptInstall 被調用');
    console.log('PWA Context: deferredPrompt 狀態:', deferredPrompt);
    console.log('PWA Context: deferredPrompt 類型:', typeof deferredPrompt);
    
    if (!deferredPrompt) {
      console.error('PWA Context: 沒有 deferredPrompt，無法觸發安裝');
      return;
    }

    try {
      console.log('PWA Context: 準備調用 deferredPrompt.prompt()');
      console.log('PWA Context: prompt 方法類型:', typeof deferredPrompt.prompt);
      console.log('PWA Context: deferredPrompt 詳細信息:', {
        isTrusted: deferredPrompt.isTrusted,
        platforms: deferredPrompt.platforms,
        type: deferredPrompt.type
      });
      
      const promptResult = deferredPrompt.prompt();
      console.log('PWA Context: prompt() 返回值:', promptResult);
      
      // 添加超時機制來診斷問題
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('prompt() 超時 - 可能安裝提示沒有顯示'));
        }, 5000);
      });
      
      try {
        await Promise.race([promptResult, timeoutPromise]);
        console.log('PWA Context: deferredPrompt.prompt() 調用完成');
      } catch (timeoutError) {
        if (timeoutError.message.includes('超時')) {
          console.error('PWA Context: prompt() 超時，可能安裝提示沒有顯示');
          console.log('PWA Context: 嘗試直接等待 userChoice...');
          
          // 如果 prompt() 超時，嘗試直接等待 userChoice
          const userChoiceTimeout = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('userChoice 也超時了'));
            }, 2000);
          });
          
          try {
            const result = await Promise.race([deferredPrompt.userChoice, userChoiceTimeout]);
            const { outcome } = result as { outcome: 'accepted' | 'dismissed' };
            console.log('PWA Context: 用戶選擇結果:', outcome);
            
            if (outcome === 'accepted') {
              console.log('PWA Context: 用戶接受安裝');
              setIsInstalled(true);
            } else {
              console.log('PWA Context: 用戶拒絕安裝');
            }
            
            deferredPromptRef.current = null;
            setDeferredPrompt(null);
            return;
          } catch (userChoiceError) {
            console.error('PWA Context: userChoice 也超時，安裝提示可能完全失效');
            throw timeoutError;
          }
        } else {
          throw timeoutError;
        }
      }
      
      console.log('PWA Context: 等待用戶選擇...');
      const { outcome } = await deferredPrompt.userChoice;
      console.log('PWA Context: 用戶選擇結果:', outcome);
      
      if (outcome === 'accepted') {
        console.log('PWA Context: 用戶接受安裝');
        setIsInstalled(true);
      } else {
        console.log('PWA Context: 用戶拒絕安裝');
      }
      
      deferredPromptRef.current = null;
      setDeferredPrompt(null);
    } catch (error) {
      console.error('PWA Context: 安裝提示失敗:', error);
      console.error('PWA Context: 錯誤詳情:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        toString: error?.toString()
      });
      
      // 檢查是否是因為 deferredPrompt 失效
      if (error?.message?.includes('prompt') || error?.name === 'InvalidStateError') {
        console.error('PWA Context: deferredPrompt 可能已失效，嘗試重新獲取');
        deferredPromptRef.current = null;
        setDeferredPrompt(null);
      }
    }
  };

  const canInstall = !isInstalled && !!deferredPrompt;

  return (
    <PWAContext.Provider value={{
      deferredPrompt,
      isInstalled,
      canInstall,
      promptInstall
    }}>
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
} 