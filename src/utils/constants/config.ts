/**
 * 應用配置常量
 */

export const APP_CONFIG = {
  // 應用基本信息
  NAME: 'LingUBible',
  DESCRIPTION: 'Campus Comment Verse - Course & Lecturer Reviews',
  VERSION: '1.0.0',
  
  // 開發模式配置
  DEV_MODE: {
    ENABLED: import.meta.env.VITE_DEV_MODE === 'true',
    BYPASS_PASSWORD: import.meta.env.VITE_DEV_BYPASS_PASSWORD === 'true',
  },
  
  // UI 配置
  UI: {
    SIDEBAR_BREAKPOINT: 768, // px
    SWIPE_HINT_DURATION: 4000, // ms
    TOAST_DURATION: 3000, // ms
  },
  
  // 主題配置
  THEME: {
    DEFAULT: 'system' as const,
    STORAGE_KEY: 'theme',
  },
  
  // 語言配置
  LANGUAGE: {
    DEFAULT: 'zh-TW' as const,
    STORAGE_KEY: 'language',
    SUPPORTED: ['en', 'zh-TW', 'zh-CN'] as const,
  },
  
  // Cookie 配置
  COOKIES: {
    THEME: 'theme',
    LANGUAGE: 'language',
    SIDEBAR_STATE: 'sidebar-state',
    SWIPE_HINT: 'swipe-hint-used',
    COOKIE_CONSENT: 'cookie-consent',
  },
  

} as const;

export type SupportedLanguage = typeof APP_CONFIG.LANGUAGE.SUPPORTED[number];
export type ThemeMode = 'light' | 'dark' | 'system'; 