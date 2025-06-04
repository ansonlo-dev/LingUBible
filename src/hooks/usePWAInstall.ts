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
  const [installState, setInstallState] = useState<PWAInstallState>({
    isInstallable: false,
    isInstalled: false,
    isStandalone: false,
    platform: null,
    canInstall: false
  });

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

    setInstallState(prev => ({
      ...prev,
      isStandalone,
      isInstalled,
      platform
    }));

    // 監聽 beforeinstallprompt 事件
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA: beforeinstallprompt 事件觸發');
      // 阻止瀏覽器默認的安裝提示
      e.preventDefault();
      
      const promptEvent = e as BeforeInstallPromptEvent;
      setInstallPrompt(promptEvent);
      
      setInstallState(prev => ({
        ...prev,
        isInstallable: true,
        canInstall: true
      }));
    };

    // 監聽應用安裝事件
    const handleAppInstalled = () => {
      console.log('PWA: 應用已安裝');
      setInstallPrompt(null);
      setInstallState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        canInstall: false
      }));
    };

    // 添加事件監聽器
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 清理函數
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 觸發安裝提示
  const promptInstall = async () => {
    if (!installPrompt) {
      console.log('PWA: 沒有可用的安裝提示');
      return false;
    }

    try {
      // 顯示安裝提示
      await installPrompt.prompt();
      
      // 等待用戶選擇
      const choiceResult = await installPrompt.userChoice;
      
      console.log('PWA: 用戶選擇結果:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA: 用戶接受安裝');
        setInstallState(prev => ({ ...prev, isInstalled: true }));
      } else {
        console.log('PWA: 用戶拒絕安裝');
      }
      
      // 清除提示
      setInstallPrompt(null);
      setInstallState(prev => ({ ...prev, canInstall: false }));
      
      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('PWA: 安裝提示失敗:', error);
      return false;
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

  return {
    ...installState,
    promptInstall,
    getInstallInstructions,
    hasInstallPrompt: !!installPrompt
  };
} 