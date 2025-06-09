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

// 調試日誌函數
const log = (...args: any[]) => {
  console.log('[PWA Context]', ...args);
};

export function PWAProvider({ children }: PWAProviderProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  // 保存 PWA 狀態到 sessionStorage
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
    setIsInstalled(installed);
    
    // 如果已安裝，不需要監聽安裝事件
    if (installed) {
      log('應用已在 PWA 模式下運行');
      return;
    }

    // 監聽來自 Service Worker 的 PWA 事件
    const handlePWAInstallAvailable = (event: CustomEvent) => {
      log('收到 PWA 安裝可用事件:', event.detail);
      
      // 檢查用戶是否拒絕過安裝
      if (event.detail.userDismissed) {
        log('用戶已拒絕安裝，不創建安裝提示');
        setCanInstall(false);
        setDeferredPrompt(null);
        deferredPromptRef.current = null;
        savePWAState(false, false);
        return;
      }
      
      // 檢查是否有真實的安裝提示或強制顯示
      const hasRealPrompt = (window as any).PWAInstaller?.hasPrompt();
      const shouldForceShow = event.detail.forceShow || (window as any).PWAInstaller?.forceShow();
      
      if (hasRealPrompt || shouldForceShow) {
        // 創建一個代理事件對象
        const proxyPrompt = {
          prompt: async () => {
            // 檢查用戶拒絕狀態
            const dismissalStatus = (window as any).PWAInstaller?.getDismissalStatus?.();
            if (dismissalStatus?.dismissed) {
              log('用戶已拒絕安裝，顯示手動安裝指引');
              if ((window as any).PWAInstaller?.showManualInstructions) {
                (window as any).PWAInstaller.showManualInstructions();
              }
              return;
            }
            
            // 優先使用 Service Worker 的安裝方法
            if ((window as any).PWAInstaller?.triggerInstallPrompt) {
              return (window as any).PWAInstaller.triggerInstallPrompt();
            }
            // 備用：顯示手動安裝指引
            if ((window as any).PWAInstaller?.showManualInstructions) {
              (window as any).PWAInstaller.showManualInstructions();
            }
          },
          userChoice: Promise.resolve({ outcome: 'dismissed' as const }),
          platforms: event.detail.platforms || ['web'],
          preventDefault: () => {},
          isTrusted: hasRealPrompt,
          type: 'beforeinstallprompt',
          forceShow: shouldForceShow
        } as any;
        
        deferredPromptRef.current = proxyPrompt;
        setDeferredPrompt(proxyPrompt);
        savePWAState(true, false);
        
        log('已創建代理安裝提示:', { hasRealPrompt, shouldForceShow });
      }
    };

    const handlePWAInstallAccepted = () => {
      log('PWA 安裝被接受');
      setCanInstall(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
      deferredPromptRef.current = null;
      savePWAState(false, true);
    };

    const handlePWAInstallDismissed = () => {
      log('PWA 安裝被拒絕');
      setCanInstall(false);
      setDeferredPrompt(null);
      deferredPromptRef.current = null;
      savePWAState(false, false);
    };

    const handlePWAInstalled = () => {
      log('PWA 安裝完成');
      setCanInstall(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
      deferredPromptRef.current = null;
      savePWAState(false, true);
    };

    // 監聽 beforeinstallprompt 事件（備用）
    const handleBeforeInstallPrompt = (e: Event) => {
      log('原生 beforeinstallprompt 事件觸發');
      
      // 不阻止事件，讓 Service Worker 處理
      // e.preventDefault();
      
      const promptEvent = e as BeforeInstallPromptEvent;
      deferredPromptRef.current = promptEvent;
      setDeferredPrompt(promptEvent);
      
      // 保存狀態到 sessionStorage
      savePWAState(true, false);
      
      log('已保存原生安裝提示事件');
    };

    // 監聽應用安裝事件
    const handleAppInstalled = () => {
      log('應用已安裝');
      setIsInstalled(true);
      deferredPromptRef.current = null;
      setDeferredPrompt(null);
      
      // 更新保存的狀態
      savePWAState(false, true);
    };

    // 添加事件監聽器
    window.addEventListener('pwaInstallAvailable', handlePWAInstallAvailable as EventListener);
    window.addEventListener('pwaInstallAccepted', handlePWAInstallAccepted);
    window.addEventListener('pwaInstallDismissed', handlePWAInstallDismissed);
    window.addEventListener('pwaInstalled', handlePWAInstalled);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 檢查是否有來自 Service Worker 的現有狀態
    setTimeout(() => {
      if ((window as any).PWAInstaller?.hasPrompt() && !deferredPrompt) {
        log('檢測到 Service Worker 中有可用的安裝提示');
        handlePWAInstallAvailable(new CustomEvent('pwaInstallAvailable', {
          detail: { platforms: ['web'], canInstall: true }
        }));
      }
    }, 1000);

    return () => {
      window.removeEventListener('pwaInstallAvailable', handlePWAInstallAvailable as EventListener);
      window.removeEventListener('pwaInstallAccepted', handlePWAInstallAccepted);
      window.removeEventListener('pwaInstallDismissed', handlePWAInstallDismissed);
      window.removeEventListener('pwaInstalled', handlePWAInstalled);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt]);

  const promptInstall = async () => {
    log('promptInstall 被調用');
    
    // 優先使用 Service Worker 的安裝方法
    if ((window as any).PWAInstaller?.hasPrompt()) {
      log('使用 Service Worker 的安裝方法');
      try {
        await (window as any).PWAInstaller.triggerInstallPrompt();
        return;
      } catch (error) {
        log('Service Worker 安裝方法失敗:', error);
      }
    }
    
    // 備用：使用原生方法
    if (!deferredPrompt) {
      log('沒有 deferredPrompt，顯示手動安裝指引');
      if ((window as any).PWAInstaller?.showManualInstructions) {
        (window as any).PWAInstaller.showManualInstructions();
      }
      return;
    }

    try {
      log('準備調用 deferredPrompt.prompt()');
      
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
          log('prompt() 超時，嘗試等待 userChoice');
          
          const userChoiceTimeout = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('userChoice 也超時了'));
            }, 2000);
          });
          
          try {
            const result = await Promise.race([deferredPrompt.userChoice, userChoiceTimeout]);
            const { outcome } = result as { outcome: 'accepted' | 'dismissed' };
            log('用戶選擇結果:', outcome);
            
            if (outcome === 'accepted') {
              setIsInstalled(true);
            }
            
            deferredPromptRef.current = null;
            setDeferredPrompt(null);
            return;
          } catch (userChoiceError) {
            log('安裝提示完全失效');
            throw timeoutError;
          }
        } else {
          throw timeoutError;
        }
      }
      
      const { outcome } = await deferredPrompt.userChoice;
      log('用戶選擇結果:', outcome);
      
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
        
        // 嘗試使用手動安裝指引
        if ((window as any).PWAInstaller?.showManualInstructions) {
          (window as any).PWAInstaller.showManualInstructions();
        }
      }
    }
  };

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