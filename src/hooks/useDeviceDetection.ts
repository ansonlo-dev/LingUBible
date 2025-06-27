import { useState, useEffect } from 'react';

/**
 * 自定義 hook 用於檢測設備類型
 * 避免在組件初始化時出現閃爍問題
 */
export function useDeviceDetection() {
  const [isDesktop, setIsDesktop] = useState(() => {
    // 在初始化時立即檢測設備類型
    if (typeof window !== 'undefined') {
      // 檢測真正的移動設備：結合螢幕寬度和設備特徵
      const width = window.innerWidth;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      // 只有在寬度小於 640px 或者是真正的移動設備時才視為非桌面端
      // 這樣桌面半屏模式（約 960px）就不會被誤判為手機版
      const isMobileDetected = (width < 640) || (width < 768 && isTouchDevice && isMobileDevice);
      return !isMobileDetected;
    }
    // SSR 時的預設值，假設是桌面端
    return true;
  });

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      // 檢測真正的移動設備：結合螢幕寬度和設備特徵
      const width = window.innerWidth;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      // 只有在寬度小於 640px 或者是真正的移動設備時才視為手機版
      const isMobileDetected = (width < 640) || (width < 768 && isTouchDevice && isMobileDevice);
      return isMobileDetected;
    }
    return false;
  });

  useEffect(() => {
    const checkDeviceType = () => {
      // 檢測真正的移動設備：結合螢幕寬度和設備特徵
      const width = window.innerWidth;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      // 只有在寬度小於 640px 或者是真正的移動設備時才視為手機版
      const isMobileDetected = (width < 640) || (width < 768 && isTouchDevice && isMobileDevice);
      
      setIsDesktop(!isMobileDetected);
      setIsMobile(isMobileDetected);
    };

    // 立即檢查一次
    checkDeviceType();

    // 監聽視窗大小變化
    window.addEventListener('resize', checkDeviceType);

    return () => {
      window.removeEventListener('resize', checkDeviceType);
    };
  }, []);

  return {
    isDesktop,
    isMobile,
    // 提供一些便利的檢測方法
    isTablet: !isDesktop && !isMobile, // 可以根據需要擴展
  };
} 