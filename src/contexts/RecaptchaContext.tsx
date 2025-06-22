import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useLanguage } from '@/hooks/useLanguage';
import { theme } from '@/lib/utils';

// reCAPTCHA 配置
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

// 表單風險等級配置
export const FORM_RISK_LEVELS = {
  // 高風險表單 - 總是需要 reCAPTCHA
  HIGH: {
    register: true,
    forgotPassword: true,
    contact: true,
    review: true,
    report: true,
  },
  // 中風險表單 - 條件性需要 reCAPTCHA
  MEDIUM: {
    login: false, // 只在多次失敗後啟用
    updateProfile: true,
    subscribe: true,
  },
  // 低風險表單 - 通常不需要 reCAPTCHA
  LOW: {
    search: false,
    filter: false,
    sort: false,
    theme: false,
    language: false,
  }
};

// 智能 reCAPTCHA 配置
export const SMART_RECAPTCHA_CONFIG = {
  // 登入失敗次數閾值
  LOGIN_FAILURE_THRESHOLD: 3,
  // 短時間內多次提交閾值
  RAPID_SUBMISSION_THRESHOLD: 5,
  // 時間窗口（毫秒）
  TIME_WINDOW: 5 * 60 * 1000, // 5分鐘
  // 最低分數要求
  MIN_SCORE: 0.5,
};

interface RecaptchaContextType {
  executeRecaptcha: ((action: string) => Promise<string>) | undefined;
  isRecaptchaLoaded: boolean;
  shouldUseRecaptcha: (formType: string, options?: RecaptchaOptions) => boolean;
}

interface RecaptchaOptions {
  forceEnable?: boolean;
  userBehavior?: {
    loginFailures?: number;
    recentSubmissions?: number;
    suspiciousActivity?: boolean;
  };
}

const RecaptchaContext = createContext<RecaptchaContextType | undefined>(undefined);

// reCAPTCHA Hook
export const useRecaptcha = () => {
  const context = useContext(RecaptchaContext);
  if (context === undefined) {
    throw new Error('useRecaptcha must be used within a RecaptchaProvider');
  }
  return context;
};

// 智能判斷是否需要 reCAPTCHA
const shouldUseRecaptcha = (formType: string, options: RecaptchaOptions = {}): boolean => {
  // 如果強制啟用
  if (options.forceEnable) {
    return true;
  }

  // 檢查高風險表單
  if (FORM_RISK_LEVELS.HIGH[formType as keyof typeof FORM_RISK_LEVELS.HIGH]) {
    return true;
  }

  // 檢查中風險表單的條件
  if (FORM_RISK_LEVELS.MEDIUM[formType as keyof typeof FORM_RISK_LEVELS.MEDIUM]) {
    // 登入表單的特殊邏輯
    if (formType === 'login') {
      const failures = options.userBehavior?.loginFailures || 0;
      return failures >= SMART_RECAPTCHA_CONFIG.LOGIN_FAILURE_THRESHOLD;
    }
    return true;
  }

  // 檢查用戶行為是否可疑
  if (options.userBehavior?.suspiciousActivity) {
    return true;
  }

  // 檢查是否有快速提交行為
  if (options.userBehavior?.recentSubmissions && 
      options.userBehavior.recentSubmissions >= SMART_RECAPTCHA_CONFIG.RAPID_SUBMISSION_THRESHOLD) {
    return true;
  }

  // 低風險表單默認不需要
  return false;
};

// 內部 Provider 組件
const RecaptchaInnerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const value: RecaptchaContextType = {
    executeRecaptcha,
    isRecaptchaLoaded: !!executeRecaptcha,
    shouldUseRecaptcha,
  };

  return (
    <RecaptchaContext.Provider value={value}>
      {children}
    </RecaptchaContext.Provider>
  );
};

// 獲取 reCAPTCHA 語言代碼
const getRecaptchaLanguage = (currentLanguage: string): string => {
  switch (currentLanguage) {
    case 'zh-TW':
      return 'zh-TW';
    case 'zh-CN':
      return 'zh-CN';
    case 'en':
    default:
      return 'en';
  }
};

// 獲取 reCAPTCHA 主題
const getRecaptchaTheme = (isDark: boolean): 'light' | 'dark' => {
  return isDark ? 'dark' : 'light';
};

// 動態語言和主題 Provider 組件
const DynamicRecaptchaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => {
    return theme.getEffectiveTheme();
  });
  
  const recaptchaLanguage = getRecaptchaLanguage(language);
  const recaptchaTheme = getRecaptchaTheme(currentTheme === 'dark');

  // 監聽主題變化
  useEffect(() => {
    const updateTheme = () => {
      const newTheme = theme.getEffectiveTheme();
      setCurrentTheme(newTheme);
    };

    // 初始設定
    updateTheme();

    // 監聽主題變化事件
    const handleThemeChange = () => {
      updateTheme();
    };

    // 監聽 localStorage 變化
    window.addEventListener('storage', handleThemeChange);
    
    // 監聽自定義主題變化事件
    window.addEventListener('themechange', handleThemeChange);

    // 定期檢查主題變化（備用方案）
    const themeCheckInterval = setInterval(updateTheme, 1000);

    return () => {
      window.removeEventListener('storage', handleThemeChange);
      window.removeEventListener('themechange', handleThemeChange);
      clearInterval(themeCheckInterval);
    };
  }, []);

  // 當主題或語言變化時重新載入 reCAPTCHA
  useEffect(() => {
    console.log(`🎨 reCAPTCHA 主題已更新為: ${recaptchaTheme} (語言: ${recaptchaLanguage})`);
  }, [recaptchaTheme, recaptchaLanguage]);

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={RECAPTCHA_SITE_KEY}
      language={recaptchaLanguage}
      useRecaptchaNet={false}
      useEnterprise={false}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: 'head',
        nonce: undefined,
      }}
    >
      <RecaptchaInnerProvider>
        {children}
      </RecaptchaInnerProvider>
    </GoogleReCaptchaProvider>
  );
};

// 主要的 Provider 組件
export const RecaptchaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 如果沒有配置 reCAPTCHA 金鑰，提供一個空的 context
  if (!RECAPTCHA_SITE_KEY) {
    console.warn('⚠️ reCAPTCHA 網站金鑰未配置，CAPTCHA 功能將被禁用');
    const fallbackValue: RecaptchaContextType = {
      executeRecaptcha: undefined,
      isRecaptchaLoaded: false,
      shouldUseRecaptcha: () => false, // 開發模式下總是返回 false
    };
    
    return (
      <RecaptchaContext.Provider value={fallbackValue}>
        {children}
      </RecaptchaContext.Provider>
    );
  }

  return <DynamicRecaptchaProvider>{children}</DynamicRecaptchaProvider>;
};

// 執行 reCAPTCHA 驗證的 Hook
export const useRecaptchaVerification = () => {
  const { executeRecaptcha, isRecaptchaLoaded, shouldUseRecaptcha } = useRecaptcha();

  const verifyRecaptcha = async (
    action: string, 
    options: RecaptchaOptions = {}
  ): Promise<{ success: boolean; token?: string; error?: string; skipped?: boolean }> => {
    try {
      // 智能判斷是否需要 reCAPTCHA
      const needsRecaptcha = shouldUseRecaptcha(action, options);
      
      if (!needsRecaptcha) {
        console.log(`🔧 智能跳過 reCAPTCHA 驗證: ${action}`);
        return { success: true, skipped: true };
      }

      // 如果 reCAPTCHA 未載入，返回成功（開發模式或配置問題）
      if (!isRecaptchaLoaded || !executeRecaptcha) {
        console.warn('⚠️ reCAPTCHA 未載入，跳過驗證');
        return { success: true, skipped: true };
      }

      console.log(`🔐 執行 reCAPTCHA 驗證: ${action}`);

      // 執行 reCAPTCHA 驗證
      const token = await executeRecaptcha(action);
      
      if (!token) {
        return { 
          success: false, 
          error: 'reCAPTCHA 驗證失敗，請重試' 
        };
      }

      return { 
        success: true, 
        token 
      };

    } catch (error) {
      console.error('reCAPTCHA 驗證錯誤:', error);
      return { 
        success: false, 
        error: 'reCAPTCHA 驗證過程中發生錯誤' 
      };
    }
  };

  return {
    verifyRecaptcha,
    isRecaptchaLoaded,
    shouldUseRecaptcha,
  };
}; 