import { useState, useEffect } from 'react';
import { theme } from '@/lib/utils';
import { APP_CONFIG, type ThemeMode } from '@/utils/constants/config';

/**
 * 主題管理 Hook
 * 提供主題切換和狀態管理功能
 */
export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    return theme.getEffectiveTheme() === 'dark';
  });

  /**
   * 設置主題
   */
  const setTheme = (isDarkMode: boolean) => {
    const root = document.documentElement;
    const themeName = isDarkMode ? 'dark' : 'light';
    
    if (isDarkMode) {
      root.classList.add('dark');
      root.style.backgroundColor = 'rgb(0, 0, 0)';
      root.style.color = 'rgb(255, 255, 255)';
      document.body.style.backgroundColor = 'rgb(0, 0, 0)';
      document.body.style.color = 'rgb(255, 255, 255)';
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = 'rgb(255, 255, 255)';
      root.style.color = 'rgb(0, 0, 0)';
      document.body.style.backgroundColor = 'rgb(255, 255, 255)';
      document.body.style.color = 'rgb(0, 0, 0)';
    }
    
    // 保存主題設定
    theme.set(themeName);
    setIsDark(isDarkMode);
  };

  /**
   * 初始化主題
   */
  const initializeTheme = () => {
    const effectiveTheme = theme.getEffectiveTheme();
    const shouldUseDark = effectiveTheme === 'dark';
    
    const root = document.documentElement;
    
    if (shouldUseDark) {
      root.classList.add('dark');
      root.style.backgroundColor = 'rgb(0, 0, 0)';
      root.style.color = 'rgb(255, 255, 255)';
      document.body.style.backgroundColor = 'rgb(0, 0, 0)';
      document.body.style.color = 'rgb(255, 255, 255)';
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = 'rgb(255, 255, 255)';
      root.style.color = 'rgb(0, 0, 0)';
      document.body.style.backgroundColor = 'rgb(255, 255, 255)';
      document.body.style.color = 'rgb(0, 0, 0)';
    }
    
    setIsDark(shouldUseDark);
    return shouldUseDark;
  };

  /**
   * 切換主題
   */
  const toggleTheme = () => {
    setTheme(!isDark);
  };

  /**
   * 獲取當前主題模式
   */
  const getCurrentTheme = (): 'light' | 'dark' => {
    return theme.getEffectiveTheme();
  };

  /**
   * 設置主題模式
   */
  const setThemeMode = (mode: 'light' | 'dark') => {
    theme.set(mode);
    setTheme(mode === 'dark');
  };

  // 初始化主題
  useEffect(() => {
    initializeTheme();
  }, []);

  return {
    isDark,
    setTheme,
    toggleTheme,
    initializeTheme,
    getCurrentTheme,
    setThemeMode
  };
} 