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
      
      // 更穩定的移動設備檢測：考慮方向變化
      // 使用較小的寬度或高度來判斷，避免橫屏時誤判為桌面
      const minDimension = Math.min(window.innerWidth, window.innerHeight);
      const maxDimension = Math.max(window.innerWidth, window.innerHeight);
      
      // 如果是真正的移動設備，無論方向如何都視為移動設備
      if (isMobileDevice && isTouchDevice) {
        // 真正的移動設備：最大尺寸通常不超過 1024px
        return maxDimension >= 1024;
      }
      
      // 對於非移動設備，使用寬度判斷
      const isMobileDetected = width < 640;
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
      
      // 更穩定的移動設備檢測：考慮方向變化
      // 使用較小的寬度或高度來判斷，避免橫屏時誤判為桌面
      const minDimension = Math.min(window.innerWidth, window.innerHeight);
      const maxDimension = Math.max(window.innerWidth, window.innerHeight);
      
      // 如果是真正的移動設備，無論方向如何都視為移動設備
      if (isMobileDevice && isTouchDevice) {
        // 真正的移動設備：最大尺寸通常不超過 1024px
        return maxDimension < 1024;
      }
      
      // 對於非移動設備，使用寬度判斷
      const isMobileDetected = width < 640;
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
      
      // 更穩定的移動設備檢測：考慮方向變化
      // 使用較小的寬度或高度來判斷，避免橫屏時誤判為桌面
      const minDimension = Math.min(window.innerWidth, window.innerHeight);
      const maxDimension = Math.max(window.innerWidth, window.innerHeight);
      
      let isMobileDetected;
      
      // 如果是真正的移動設備，無論方向如何都視為移動設備
      if (isMobileDevice && isTouchDevice) {
        // 真正的移動設備：最大尺寸通常不超過 1024px
        isMobileDetected = maxDimension < 1024;
      } else {
        // 對於非移動設備，使用寬度判斷
        isMobileDetected = width < 640;
      }
      
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