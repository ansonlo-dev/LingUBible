import { useState, useCallback, useRef } from 'react';
import { useRecaptchaVerification } from '@/contexts/RecaptchaContext';

interface UserBehaviorTracker {
  loginFailures: number;
  recentSubmissions: number;
  lastSubmissionTime: number;
  suspiciousActivity: boolean;
}

// 用戶行為追蹤
class BehaviorTracker {
  private static instance: BehaviorTracker;
  private behaviors: Map<string, UserBehaviorTracker> = new Map();
  private readonly TIME_WINDOW = 5 * 60 * 1000; // 5分鐘

  static getInstance(): BehaviorTracker {
    if (!BehaviorTracker.instance) {
      BehaviorTracker.instance = new BehaviorTracker();
    }
    return BehaviorTracker.instance;
  }

  private getUserKey(): string {
    // 使用 IP + User Agent 的簡化版本作為用戶標識
    return `${navigator.userAgent.slice(0, 50)}_${Date.now().toString().slice(0, 10)}`;
  }

  recordLoginFailure(): void {
    const key = this.getUserKey();
    const behavior = this.behaviors.get(key) || this.getDefaultBehavior();
    behavior.loginFailures += 1;
    this.behaviors.set(key, behavior);
  }

  resetLoginFailures(): void {
    const key = this.getUserKey();
    const behavior = this.behaviors.get(key) || this.getDefaultBehavior();
    behavior.loginFailures = 0;
    this.behaviors.set(key, behavior);
  }

  recordSubmission(): void {
    const key = this.getUserKey();
    const now = Date.now();
    const behavior = this.behaviors.get(key) || this.getDefaultBehavior();
    
    // 如果在時間窗口內，增加提交次數
    if (now - behavior.lastSubmissionTime < this.TIME_WINDOW) {
      behavior.recentSubmissions += 1;
    } else {
      behavior.recentSubmissions = 1;
    }
    
    behavior.lastSubmissionTime = now;
    this.behaviors.set(key, behavior);
  }

  markSuspiciousActivity(): void {
    const key = this.getUserKey();
    const behavior = this.behaviors.get(key) || this.getDefaultBehavior();
    behavior.suspiciousActivity = true;
    this.behaviors.set(key, behavior);
  }

  getBehavior(): UserBehaviorTracker {
    const key = this.getUserKey();
    return this.behaviors.get(key) || this.getDefaultBehavior();
  }

  private getDefaultBehavior(): UserBehaviorTracker {
    return {
      loginFailures: 0,
      recentSubmissions: 0,
      lastSubmissionTime: 0,
      suspiciousActivity: false,
    };
  }
}

export const useSmartRecaptcha = () => {
  const { verifyRecaptcha, shouldUseRecaptcha } = useRecaptchaVerification();
  const [isVerifying, setIsVerifying] = useState(false);
  const behaviorTracker = useRef(BehaviorTracker.getInstance());

  // 智能驗證函數
  const smartVerify = useCallback(async (
    formType: string,
    options: {
      forceEnable?: boolean;
      onSuccess?: () => void;
      onError?: (error: string) => void;
    } = {}
  ) => {
    setIsVerifying(true);
    
    try {
      // 獲取當前用戶行為
      const userBehavior = behaviorTracker.current.getBehavior();
      
      // 記錄提交行為
      behaviorTracker.current.recordSubmission();
      
      // 執行智能驗證
      const result = await verifyRecaptcha(formType, {
        forceEnable: options.forceEnable,
        userBehavior,
      });

      if (result.success) {
        if (result.skipped) {
          console.log(`✅ ${formType} 表單智能跳過 reCAPTCHA 驗證`);
        } else {
          console.log(`✅ ${formType} 表單 reCAPTCHA 驗證成功`);
        }
        options.onSuccess?.();
        return { success: true, token: result.token, skipped: result.skipped };
      } else {
        console.error(`❌ ${formType} 表單 reCAPTCHA 驗證失敗:`, result.error);
        options.onError?.(result.error || 'reCAPTCHA 驗證失敗');
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'reCAPTCHA 驗證異常';
      console.error(`💥 ${formType} 表單 reCAPTCHA 驗證異常:`, error);
      options.onError?.(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsVerifying(false);
    }
  }, [verifyRecaptcha]);

  // 記錄登入失敗
  const recordLoginFailure = useCallback(() => {
    behaviorTracker.current.recordLoginFailure();
  }, []);

  // 重置登入失敗計數
  const resetLoginFailures = useCallback(() => {
    behaviorTracker.current.resetLoginFailures();
  }, []);

  // 標記可疑活動
  const markSuspiciousActivity = useCallback(() => {
    behaviorTracker.current.markSuspiciousActivity();
  }, []);

  // 檢查是否需要 reCAPTCHA
  const checkIfNeedsRecaptcha = useCallback((formType: string, forceEnable = false) => {
    const userBehavior = behaviorTracker.current.getBehavior();
    return shouldUseRecaptcha(formType, { forceEnable, userBehavior });
  }, [shouldUseRecaptcha]);

  return {
    smartVerify,
    isVerifying,
    recordLoginFailure,
    resetLoginFailures,
    markSuspiciousActivity,
    checkIfNeedsRecaptcha,
  };
};

// 表單特定的 Hooks
export const useLoginRecaptcha = () => {
  const { smartVerify, recordLoginFailure, resetLoginFailures, checkIfNeedsRecaptcha } = useSmartRecaptcha();
  
  return {
    verifyLogin: (options?: { onSuccess?: () => void; onError?: (error: string) => void }) =>
      smartVerify('login', options),
    recordFailure: recordLoginFailure,
    resetFailures: resetLoginFailures,
    needsRecaptcha: () => checkIfNeedsRecaptcha('login'),
  };
};

export const useContactRecaptcha = () => {
  const { smartVerify } = useSmartRecaptcha();
  
  return {
    verifyContact: (options?: { onSuccess?: () => void; onError?: (error: string) => void }) =>
      smartVerify('contact', options),
  };
};

export const useReviewRecaptcha = () => {
  const { smartVerify } = useSmartRecaptcha();
  
  return {
    verifyReview: (options?: { onSuccess?: () => void; onError?: (error: string) => void }) =>
      smartVerify('review', options),
  };
};

export const useForgotPasswordRecaptcha = () => {
  const { smartVerify } = useSmartRecaptcha();
  
  return {
    verifyForgotPassword: (options?: { onSuccess?: () => void; onError?: (error: string) => void }) =>
      smartVerify('forgotPassword', options),
  };
}; 