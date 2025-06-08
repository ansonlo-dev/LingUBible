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

    // 決定是否顯示啟動畫面
    const shouldShow = 
      (isStandalone || isIOSPWA) && 
      (isFirstLaunch || isFromHomeScreen);

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

  return {
    ...state,
    hideSplashScreen,
    showSplashScreen,
    triggerSplashScreen
  };
} 