import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  platform: string | null;
  canInstall: boolean;
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [installState, setInstallState] = useState<PWAInstallState>({
    isInstallable: false,
    isInstalled: false,
    isStandalone: false,
    platform: null,
    canInstall: false
  });

  // 保存安裝狀態到 sessionStorage
  const saveInstallState = (state: PWAInstallState) => {
    try {
      sessionStorage.setItem('pwa-install-state', JSON.stringify(state));
    } catch (error) {
      console.warn('PWA: 無法保存安裝狀態到 sessionStorage:', error);
    }
  };

  // 從 sessionStorage 恢復安裝狀態
  const loadInstallState = (): Partial<PWAInstallState> | null => {
    try {
      const saved = sessionStorage.getItem('pwa-install-state');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('PWA: 無法從 sessionStorage 載入安裝狀態:', error);
      return null;
    }
  };

  useEffect(() => {
    // 檢查是否已經在 PWA 模式下運行
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');

    // 檢查是否已安裝（通過檢查是否在獨立模式下）
    const isInstalled = isStandalone;

    // 檢測平台
    const userAgent = navigator.userAgent.toLowerCase();
    let platform = null;
    if (userAgent.includes('android')) {
      platform = 'Android';
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      platform = 'iOS';
    } else if (userAgent.includes('windows')) {
      platform = 'Windows';
    } else if (userAgent.includes('mac')) {
      platform = 'macOS';
    } else {
      platform = 'Desktop';
    }

    // 嘗試從 sessionStorage 恢復之前的安裝狀態
    const savedState = loadInstallState();
    
    const newState = {
      isStandalone,
      isInstalled,
      platform,
      // 如果有保存的狀態且當前未安裝，則恢復 isInstallable 和 canInstall
      isInstallable: savedState?.isInstallable && !isInstalled ? true : false,
      canInstall: savedState?.canInstall && !isInstalled ? true : false
    };

    setInstallState(newState);
    saveInstallState(newState);

    console.log('PWA: 初始化狀態', {
      current: newState,
      saved: savedState,
      restored: !!savedState
    });

    // 暫時禁用 beforeinstallprompt 事件監聽，避免與 PWAContext 衝突
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA: beforeinstallprompt 事件觸發 (已禁用處理)');
      // 不處理事件，讓 PWAContext 處理
    };

    // 監聽應用安裝事件
    const handleAppInstalled = () => {
      console.log('PWA: 應用已安裝');
      setInstallPrompt(null);
      setInstallState(prev => {
        const newState = {
          ...prev,
          isInstalled: true,
          isInstallable: false,
          canInstall: false
        };
        saveInstallState(newState);
        return newState;
      });
    };

    // 添加事件監聽器 (暫時禁用 beforeinstallprompt 以避免與 PWAContext 衝突)
    // window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 清理函數
    return () => {
      // window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 觸發安裝提示
  const promptInstall = async () => {
    console.log('PWA: 準備顯示自定義安裝對話框');
    console.log('PWA: installPrompt 狀態:', !!installPrompt);
    
    // 記錄當前語言
    const currentLang = document.documentElement.lang || 'en';
    console.log('PWA: 當前頁面語言:', currentLang);
    
    // 即使沒有 installPrompt，也顯示自定義對話框
    // 對話框內部會處理沒有 installPrompt 的情況
    setShowCustomDialog(true);
    
    return new Promise((resolve) => {
      // 這個 Promise 會在對話框關閉時解決
      const handleDialogClose = (success: boolean) => {
        setShowCustomDialog(false);
        if (success) {
          setInstallState(prev => {
            const newState = { ...prev, isInstalled: true, canInstall: false };
            saveInstallState(newState);
            return newState;
          });
          setInstallPrompt(null);
        }
        resolve(success);
      };
      
      // 將處理函數存儲以供對話框使用
      (window as any).__pwaInstallDialogHandler = handleDialogClose;
    });
  };

  // 關閉自定義對話框
  const closeCustomDialog = () => {
    setShowCustomDialog(false);
  };

  // 處理安裝完成
  const handleInstallComplete = (success: boolean) => {
    if (success) {
      setInstallState(prev => ({ ...prev, isInstalled: true }));
      setInstallPrompt(null);
      setInstallState(prev => ({ ...prev, canInstall: false }));
    }
    
    // 調用存儲的處理函數
    if ((window as any).__pwaInstallDialogHandler) {
      (window as any).__pwaInstallDialogHandler(success);
      delete (window as any).__pwaInstallDialogHandler;
    }
  };

  // 獲取安裝指引文字
  const getInstallInstructions = () => {
    const { platform } = installState;
    
    switch (platform) {
      case 'iOS':
        return {
          title: '安裝到主畫面',
          steps: [
            '點擊分享按鈕 📤',
            '選擇「加入主畫面」',
            '點擊「新增」確認'
          ]
        };
      case 'Android':
        return {
          title: '安裝應用',
          steps: [
            '點擊瀏覽器選單 ⋮',
            '選擇「安裝應用」或「加到主畫面」',
            '點擊「安裝」確認'
          ]
        };
      default:
        return {
          title: '安裝應用',
          steps: [
            '點擊地址欄右側的安裝圖標',
            '或使用瀏覽器選單中的「安裝」選項',
            '按照提示完成安裝'
          ]
        };
    }
  };

  // 監聽 manifest 更新事件
  useEffect(() => {
    const handleManifestUpdate = (event: CustomEvent) => {
      console.log('PWA: Manifest 已更新', event.detail);
      
      // 當 manifest 更新時，不要重置 installPrompt
      // 保持現有的安裝提示可用，因為瀏覽器不會重新觸發 beforeinstallprompt
      console.log('PWA: Manifest 更新完成，保持現有安裝提示可用');
    };

    window.addEventListener('manifestUpdated', handleManifestUpdate as EventListener);
    
    return () => {
      window.removeEventListener('manifestUpdated', handleManifestUpdate as EventListener);
    };
  }, []);

  return {
    ...installState,
    promptInstall,
    getInstallInstructions,
    hasInstallPrompt: !!installPrompt,
    showCustomDialog,
    closeCustomDialog,
    handleInstallComplete,
    installPrompt
  };
} 