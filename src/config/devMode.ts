// 開發模式配置
export const DEV_MODE = {
  // 是否啟用開發模式
  enabled: import.meta.env.VITE_DEV_MODE === 'true',
  
  // 是否繞過密碼強度要求（僅開發模式）
  bypassPassword: import.meta.env.VITE_DEV_BYPASS_PASSWORD === 'true',
  
  // 開發模式下允許的測試郵件域名（現在允許所有域名）
  allowedTestDomains: [
    // 常見郵件服務
    '@gmail.com',
    '@outlook.com', 
    '@hotmail.com',
    '@yahoo.com',
    '@test.com',
    '@example.com',
    // 一次性郵件服務
    '@10minutemail.com',
    '@guerrillamail.com',
    '@mailinator.com',
    '@tempmail.org',
    '@yopmail.com',
    '@maildrop.cc',
    '@throwaway.email',
    '@temp-mail.org',
    // 開發模式下實際上允許任何域名
    '*' // 通配符表示允許所有域名
  ],
  
  // 開發模式提示訊息
  messages: {
    'zh-TW': {
      devModeEnabled: '🔧 開發模式已啟用 - 允許任何郵件地址註冊（包括一次性郵件）',
      testEmailWarning: '⚠️ 這是測試郵件地址，僅在開發模式下可用',
      productionWarning: '🚨 生產環境請關閉開發模式',
      disposableEmailTip: '💡 提示：您可以使用一次性郵件服務如 10minutemail.com, tempmail.org 等',
      passwordBypassEnabled: '🔓 密碼強度檢查已繞過 - 開發模式',
      passwordBypassWarning: '⚠️ 生產環境請啟用密碼強度檢查'
    },
    'zh-CN': {
      devModeEnabled: '🔧 开发模式已启用 - 允许任何邮件地址注册（包括一次性邮件）',
      testEmailWarning: '⚠️ 这是测试邮件地址，仅在开发模式下可用',
      productionWarning: '🚨 生产环境请关闭开发模式',
      disposableEmailTip: '💡 提示：您可以使用一次性邮件服务如 10minutemail.com, tempmail.org 等',
      passwordBypassEnabled: '🔓 密码强度检查已绕过 - 开发模式',
      passwordBypassWarning: '⚠️ 生产环境请启用密码强度检查'
    },
    'en': {
      devModeEnabled: '🔧 Dev Mode Enabled - Any email address allowed (including disposable emails)',
      testEmailWarning: '⚠️ This is a test email address, only available in dev mode',
      productionWarning: '🚨 Please disable dev mode in production',
      disposableEmailTip: '💡 Tip: You can use disposable email services like 10minutemail.com, tempmail.org etc.',
      passwordBypassEnabled: '🔓 Password strength check bypassed - Dev Mode',
      passwordBypassWarning: '⚠️ Please enable password strength check in production'
    }
  }
};

// 檢查郵件是否為有效的學生郵件或開發模式下的測試郵件
export const isValidEmailForRegistration = (email: string): boolean => {
  const emailLower = email.toLowerCase();
  
  // 學生郵件格式檢查
  const validStudentEmailPattern = /^[a-zA-Z0-9._%+-]+@(ln\.edu\.hk|ln\.hk)$/;
  const isStudentEmail = validStudentEmailPattern.test(emailLower);
  
  // 如果是學生郵件，直接返回 true
  if (isStudentEmail) {
    return true;
  }
  
  // 如果開發模式未啟用，只允許學生郵件
  if (!DEV_MODE.enabled) {
    return false;
  }
  
  // 開發模式下，允許任何有效的郵件格式（包括一次性郵件）
  const generalEmailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return generalEmailPattern.test(emailLower);
};

// 檢查是否為學生郵件
export const isStudentEmail = (email: string): boolean => {
  const emailLower = email.toLowerCase();
  const validStudentEmailPattern = /^[a-zA-Z0-9._%+-]+@(ln\.edu\.hk|ln\.hk)$/;
  return validStudentEmailPattern.test(emailLower);
};

// 檢查是否為一次性郵件
export const isDisposableEmail = (email: string): boolean => {
  const emailLower = email.toLowerCase();
  const disposableDomains = [
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
    'tempmail.org',
    'yopmail.com',
    'maildrop.cc',
    'throwaway.email',
    'temp-mail.org',
    'sharklasers.com',
    'grr.la',
    'guerrillamailblock.com',
    'pokemail.net',
    'spam4.me',
    'bccto.me',
    'chacuo.net',
    'dispostable.com',
    'fakeinbox.com',
    'mailnesia.com',
    'mytrashmail.com',
    'sogetthis.com',
    'spamgourmet.com',
    'suremail.info',
    'trbvm.com',
    'vpn.st',
    'zetmail.com'
  ];
  
  return disposableDomains.some(domain => emailLower.endsWith(`@${domain}`));
};

// 獲取郵件類型
export const getEmailType = (email: string): 'student' | 'disposable' | 'test' | 'invalid' => {
  if (isStudentEmail(email)) {
    return 'student';
  }
  
  if (DEV_MODE.enabled && isValidEmailForRegistration(email)) {
    if (isDisposableEmail(email)) {
      return 'disposable';
    }
    return 'test';
  }
  
  return 'invalid';
};

// 獲取開發模式訊息
export const getDevModeMessage = (type: keyof typeof DEV_MODE.messages['zh-TW'], language: string = 'zh-TW') => {
  const lang = language as keyof typeof DEV_MODE.messages;
  return DEV_MODE.messages[lang]?.[type] || DEV_MODE.messages['zh-TW'][type];
}; 