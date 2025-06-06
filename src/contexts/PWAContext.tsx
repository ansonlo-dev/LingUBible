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

// 開發模式下的日誌控制
const isDev = import.meta.env.DEV;
const log = (...args: any[]) => {
  if (!isDev) console.log(...args);
};

export function PWAProvider({ children }: PWAProviderProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  const savePWAState = (hasPrompt: boolean, installed: boolean) => {
    try {
      const state = {
        hasPrompt,
        installed,
        timestamp: Date.now()
      };
      sessionStorage.setItem('pwa-state', JSON.stringify(state));
    } catch (error) {
      console.error('PWA Context: 保存狀態失敗:', error);
    }
  };

  const loadPWAState = () => {
    try {
      const saved = sessionStorage.getItem('pwa-state');
      if (saved) {
        const state = JSON.parse(saved);
        // 檢查狀態是否過期（1小時）
        if (Date.now() - state.timestamp < 60 * 60 * 1000) {
          return state;
        }
      }
    } catch (error) {
      console.error('PWA Context: 載入狀態失敗:', error);
    }
    return null;
  };

  useEffect(() => {
    // 檢查是否已安裝
    const checkIfInstalled = () => {
      // 檢查是否在 standalone 模式下運行
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
      }
      
      // 檢查是否在 PWA 環境中
      if ((window.navigator as any).standalone === true) {
        return true;
      }
      
      return false;
    };

    const installed = checkIfInstalled();
    
    // 如果未安裝，嘗試恢復之前的狀態
    if (!installed) {
      const savedState = loadPWAState();
      if (savedState && savedState.hasPrompt && !savedState.installed) {
        log('PWA Context: 恢復之前的安裝提示狀態');
        // 創建一個虛擬的 prompt 狀態，表示之前有過安裝提示
        const virtualPrompt = {
          prompt: async () => {
            log('PWA Context: 使用虛擬提示 - 顯示手動安裝指引');
          },
          userChoice: Promise.resolve({ outcome: 'dismissed' as const }),
          platforms: ['web'],
          preventDefault: () => {},
          isTrusted: false,
          type: 'beforeinstallprompt'
        } as any;
        
        deferredPromptRef.current = virtualPrompt;
        setDeferredPrompt(virtualPrompt);
      }
    }

    // 監聽 beforeinstallprompt 事件
    const handleBeforeInstallPrompt = (e: Event) => {
      log('PWA Context: beforeinstallprompt 事件觸發');
      
      // 阻止瀏覽器的自動提示，我們將手動控制
      e.preventDefault();
      
      // 總是保存新的事件，因為語言變更後舊的事件可能失效
      const promptEvent = e as BeforeInstallPromptEvent;
      deferredPromptRef.current = promptEvent;
      setDeferredPrompt(promptEvent);
      
      // 保存狀態到 sessionStorage
      savePWAState(true, false);
      
      log('PWA Context: 已保存安裝提示事件');
    };

    // 監聽應用安裝事件
    const handleAppInstalled = () => {
      log('PWA Context: 應用已安裝');
      setIsInstalled(true);
      deferredPromptRef.current = null;
      setDeferredPrompt(null);
      
      // 更新保存的狀態
      savePWAState(false, true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    log('PWA Context: promptInstall 被調用');
    
    if (!deferredPrompt) {
      console.error('PWA Context: 沒有 deferredPrompt，無法觸發安裝');
      return;
    }

    // 檢查是否是虛擬提示
    if (!deferredPrompt.isTrusted) {
      log('PWA Context: 使用虛擬提示，顯示手動安裝指引');
      alert('請使用瀏覽器選單中的「安裝應用」或「加到主畫面」選項來安裝此應用。');
      return;
    }

    try {
      log('PWA Context: 準備調用 deferredPrompt.prompt()');
      
      const promptResult = deferredPrompt.prompt();
      
      // 添加超時機制
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('prompt() 超時'));
        }, 5000);
      });
      
      try {
        await Promise.race([promptResult, timeoutPromise]);
      } catch (timeoutError) {
        if (timeoutError.message.includes('超時')) {
          console.error('PWA Context: prompt() 超時');
          
          const userChoiceTimeout = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('userChoice 也超時了'));
            }, 2000);
          });
          
          try {
            const result = await Promise.race([deferredPrompt.userChoice, userChoiceTimeout]);
            const { outcome } = result as { outcome: 'accepted' | 'dismissed' };
            log('PWA Context: 用戶選擇結果:', outcome);
            
            if (outcome === 'accepted') {
              setIsInstalled(true);
            }
            
            deferredPromptRef.current = null;
            setDeferredPrompt(null);
            return;
          } catch (userChoiceError) {
            console.error('PWA Context: 安裝提示完全失效');
            throw timeoutError;
          }
        } else {
          throw timeoutError;
        }
      }
      
      const { outcome } = await deferredPrompt.userChoice;
      log('PWA Context: 用戶選擇結果:', outcome);
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      
      deferredPromptRef.current = null;
      setDeferredPrompt(null);
    } catch (error) {
      console.error('PWA Context: 安裝提示失敗:', error);
      
      // 檢查是否是因為 deferredPrompt 失效
      if (error?.message?.includes('prompt') || error?.name === 'InvalidStateError') {
        console.error('PWA Context: deferredPrompt 可能已失效');
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