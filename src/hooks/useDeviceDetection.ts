import { useState, useEffect } from 'react';

/**
 * 自定義 hook 用於檢測設備類型
 * 避免在組件初始化時出現閃爍問題
 */
export function useDeviceDetection() {
  const [isDesktop, setIsDesktop] = useState(() => {
    // 在初始化時立即檢測設備類型
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    // SSR 時的預設值，假設是桌面端
    return true;
  });

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const checkDeviceType = () => {
      const isDesktopDevice = window.innerWidth >= 768;
      setIsDesktop(isDesktopDevice);
      setIsMobile(!isDesktopDevice);
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