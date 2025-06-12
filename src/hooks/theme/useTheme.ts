import { useState, useEffect } from 'react';
import { theme } from '@/lib/utils';

// 主題類型
type ThemeMode = 'light' | 'dark' | 'system';

/**
 * 主題管理 Hook
 * 提供主題切換和狀態管理功能
 */
export function useTheme() {
  const [currentMode, setCurrentMode] = useState<ThemeMode>(() => {
    return theme.get() || 'system';
  });

  const [isDark, setIsDark] = useState(() => {
    return theme.getEffectiveTheme() === 'dark';
  });

  /**
   * 觸發主題變化事件
   */
  const dispatchThemeChangeEvent = () => {
    // 觸發自定義主題變化事件
    window.dispatchEvent(new CustomEvent('themechange', {
      detail: { isDark, mode: currentMode }
    }));
    
    // 觸發 storage 事件（用於跨標籤頁同步）
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'theme',
      newValue: currentMode,
      storageArea: localStorage
    }));
  };

  /**
   * 設置主題模式
   */
  const setThemeMode = (mode: ThemeMode) => {
    const root = document.documentElement;
    
    // 保存主題設定
    theme.set(mode);
    setCurrentMode(mode);
    
    // 獲取實際應該應用的主題
    const effectiveTheme = theme.getEffectiveTheme();
    const shouldUseDark = effectiveTheme === 'dark';
    
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
    
    // 觸發主題變化事件
    setTimeout(() => {
      dispatchThemeChangeEvent();
    }, 100);
  };

  /**
   * 設置主題（向後兼容）
   */
  const setTheme = (isDarkMode: boolean) => {
    setThemeMode(isDarkMode ? 'dark' : 'light');
  };

  /**
   * 初始化主題
   */
  const initializeTheme = () => {
    const storedMode = theme.get() || 'system';
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
    
    setCurrentMode(storedMode);
    setIsDark(shouldUseDark);
    
    // 觸發初始主題事件
    setTimeout(() => {
      dispatchThemeChangeEvent();
    }, 100);
    
    return shouldUseDark;
  };

  /**
   * 切換主題（在 light 和 dark 之間切換）
   */
  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  /**
   * 獲取當前主題模式
   */
  const getCurrentTheme = (): 'light' | 'dark' => {
    return theme.getEffectiveTheme();
  };

  /**
   * 獲取當前主題設定模式
   */
  const getCurrentMode = (): ThemeMode => {
    return currentMode;
  };

  // 初始化主題和監聽系統主題變化
  useEffect(() => {
    initializeTheme();
    
    // 監聽系統主題變化（僅當設定為 system 時）
    const unwatch = theme.watchSystemTheme((systemIsDark) => {
      const currentStoredMode = theme.get() || 'system';
      if (currentStoredMode === 'system') {
        // 重新應用主題以反映系統變化
        setThemeMode('system');
      }
    });
    
    return unwatch;
  }, []);

  return {
    isDark,
    currentMode,
    setTheme,
    setThemeMode,
    toggleTheme,
    initializeTheme,
    getCurrentTheme,
    getCurrentMode
  };
} 