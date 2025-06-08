import { useState, useEffect } from 'react';

interface PWASplashScreenState {
  isVisible: boolean;
  shouldShow: boolean;
  isStandalone: boolean;
  isFirstLaunch: boolean;
}

export function usePWASplashScreen() {
  const [state, setState] = useState<PWASplashScreenState>({
    isVisible: false,
    shouldShow: false,
    isStandalone: false,
    isFirstLaunch: false
  });

  useEffect(() => {
    // 緊急修復：檢查是否有強制禁用標記
    const forceDisabled = sessionStorage.getItem('pwa-splash-disabled') === 'true';
    if (forceDisabled) {
      setState({
        isVisible: false,
        shouldShow: false,
        isStandalone: false,
        isFirstLaunch: false
      });
      return;
    }

    // 檢測是否為 PWA 模式（獨立模式）
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    // 檢測是否為首次啟動或冷啟動
    const isFirstLaunch = !sessionStorage.getItem('pwa-launched');
    
    // 檢測是否從主屏幕啟動（Android）
    const isFromHomeScreen = 
      window.location.search.includes('utm_source=homescreen') ||
      document.referrer === '' ||
      document.referrer.includes('android-app://');

    // 檢測 iOS PWA
    const isIOSPWA = 
      (window.navigator as any).standalone === true ||
      (window.matchMedia('(display-mode: standalone)').matches && 
       /iPad|iPhone|iPod/.test(navigator.userAgent));

    // 決定是否顯示啟動畫面 - 更保守的檢測
    const shouldShow = 
      (isStandalone || isIOSPWA) && 
      isFirstLaunch && // 只在真正的首次啟動時顯示
      !sessionStorage.getItem('app-loaded'); // 確保應用未加載過

    setState({
      isVisible: shouldShow,
      shouldShow,
      isStandalone: isStandalone || isIOSPWA,
      isFirstLaunch
    });

    // 標記已啟動
    if (shouldShow) {
      sessionStorage.setItem('pwa-launched', 'true');
    }

    // 添加緊急退出機制 - 5秒後強制隱藏
    if (shouldShow) {
      const emergencyTimer = setTimeout(() => {
        console.warn('PWA 啟動畫面緊急退出機制觸發');
        setState(prev => ({ ...prev, isVisible: false }));
        sessionStorage.setItem('app-loaded', 'true');
      }, 5000);

      return () => clearTimeout(emergencyTimer);
    }

    // 監聽顯示模式變化
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setState(prev => ({
        ...prev,
        isStandalone: e.matches
      }));
    };

    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const hideSplashScreen = () => {
    setState(prev => ({
      ...prev,
      isVisible: false
    }));
    // 標記應用已加載，防止啟動畫面再次顯示
    sessionStorage.setItem('app-loaded', 'true');
  };

  const showSplashScreen = () => {
    setState(prev => ({
      ...prev,
      isVisible: true
    }));
  };

  // 手動觸發啟動畫面（用於測試或特殊情況）
  const triggerSplashScreen = () => {
    setState(prev => ({
      ...prev,
      isVisible: true,
      shouldShow: true
    }));
  };

  // 緊急禁用啟動畫面
  const emergencyDisable = () => {
    setState({
      isVisible: false,
      shouldShow: false,
      isStandalone: false,
      isFirstLaunch: false
    });
    sessionStorage.setItem('pwa-splash-disabled', 'true');
    sessionStorage.setItem('app-loaded', 'true');
    console.log('PWA 啟動畫面已緊急禁用');
  };

  return {
    ...state,
    hideSplashScreen,
    showSplashScreen,
    triggerSplashScreen,
    emergencyDisable
  };
} 