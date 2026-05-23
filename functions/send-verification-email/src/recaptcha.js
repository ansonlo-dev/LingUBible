import { DEV_MODE } from './config.js';

// 驗證 reCAPTCHA token
export const verifyRecaptcha = async (token, ipAddress, log, error) => {
  try {
    // 如果沒有提供 token，在開發模式下跳過驗證
    if (!token) {
      if (DEV_MODE.enabled) {
        log('🔧 開發模式：跳過 reCAPTCHA 驗證（無 token）');
        return { success: true, score: 1.0 };
      } else {
        return { success: false, error: '缺少 reCAPTCHA token' };
      }
    }

    // 如果沒有配置密鑰，在開發模式下跳過驗證
    if (!process.env.RECAPTCHA_SECRET_KEY) {
      if (DEV_MODE.enabled) {
        log('🔧 開發模式：跳過 reCAPTCHA 驗證（無密鑰配置）');
        return { success: true, score: 1.0 };
      } else {
        error('❌ reCAPTCHA 密鑰未配置');
        return { success: false, error: 'reCAPTCHA 服務配置錯誤' };
      }
    }

    log('🔐 開始驗證 reCAPTCHA token');

    // 調用 Google reCAPTCHA API
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token,
        remoteip: ipAddress || ''
      })
    });

    if (!response.ok) {
      error('❌ reCAPTCHA API 請求失敗:', response.status, response.statusText);
      return { success: false, error: 'reCAPTCHA 驗證服務暫時不可用' };
    }

    const result = await response.json();
    log('🔍 reCAPTCHA 驗證結果:', { 
      success: result.success, 
      score: result.score, 
      action: result.action,
      hostname: result.hostname 
    });

    if (!result.success) {
      log('❌ reCAPTCHA 驗證失敗:', result['error-codes']);
      return { 
        success: false, 
        error: 'reCAPTCHA 驗證失敗，請重試',
        errorCodes: result['error-codes']
      };
    }

    // 檢查分數（reCAPTCHA v3）
    if (result.score !== undefined) {
      const minScore = 0.5; // 最低接受分數
      if (result.score < minScore) {
        log(`⚠️ reCAPTCHA 分數過低: ${result.score} < ${minScore}`);
        return { 
          success: false, 
          error: '安全驗證未通過，請稍後重試',
          score: result.score
        };
      }
    }

    log('✅ reCAPTCHA 驗證成功');
    return { 
      success: true, 
      score: result.score,
      action: result.action,
      hostname: result.hostname
    };

  } catch (err) {
    error('💥 reCAPTCHA 驗證異常:', err);
    return { 
      success: false, 
      error: 'reCAPTCHA 驗證過程中發生錯誤' 
    };
  }
}; 