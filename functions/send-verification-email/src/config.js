// 開發模式配置
export const DEV_MODE = {
  // 臨時硬編碼開發模式為 true，因為環境變數設置有問題
  enabled: false, // process.env.DEV_MODE === 'true',
  
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
  ]
};

// 檢查郵件是否為有效的學生郵件或開發模式下的測試郵件
export const isValidEmailForRegistration = (email) => {
  const emailLower = email.toLowerCase();
  
  // 學生郵件格式檢查
  const validStudentEmailPattern = /^[a-zA-Z0-9._%+-]+@(ln\.edu\.hk|ln\.hk)$/;
  const isStudentEmailResult = validStudentEmailPattern.test(emailLower);
  
  // 如果是學生郵件，直接返回 true
  if (isStudentEmailResult) {
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
export const isStudentEmail = (email) => {
  const emailLower = email.toLowerCase();
  const validStudentEmailPattern = /^[a-zA-Z0-9._%+-]+@(ln\.edu\.hk|ln\.hk)$/;
  return validStudentEmailPattern.test(emailLower);
};

// 檢查是否為一次性郵件
export const isDisposableEmail = (email) => {
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

// 管理員相關的禁用詞彙
const adminRelatedWords = [
  // 基本管理員詞彙
  'admin', 'administrator', 'administrators', 'admins',
  'root', 'system', 'sysadmin', 'systemadmin',
  'moderator', 'moderators', 'mod', 'mods',
  'staff', 'staffs', 'official', 'officials',
  'manager', 'managers', 'supervisor', 'supervisors',
  'owner', 'owners', 'master', 'masters',
  // 服務相關
  'service', 'services', 'support', 'supports',
  'help', 'helper', 'helpers', 'bot', 'bots',
  'api', 'apis', 'server', 'servers',
  // 測試相關
  'test', 'tests', 'testing', 'tester', 'testers',
  'demo', 'demos', 'sample', 'samples',
  'guest', 'guests', 'user', 'users',
  'null', 'undefined', 'none', 'empty',
  // 品牌相關
  'lingubible', 'ln', 'hk', 'lingnan',
  // 常見變體
  'webmaster', 'postmaster', 'hostmaster'
];

// 檢查用戶名是否包含管理員相關詞彙
export const containsAdminWords = (username) => {
  const lowerUsername = username.toLowerCase();
  
  // 檢查是否完全匹配管理員詞彙
  if (adminRelatedWords.some(word => lowerUsername === word.toLowerCase())) {
    return true;
  }
  
  // 檢查是否包含管理員詞彙（作為子字符串）
  const strictAdminWords = [
    'admin', 'administrator', 'root', 'system', 'moderator', 'mod',
    'staff', 'official', 'manager', 'supervisor', 'owner', 'master',
    'support', 'service', 'bot', 'api', 'lingubible'
  ];
  
  return strictAdminWords.some(word => lowerUsername.includes(word.toLowerCase()));
};

// 生成安全的重設 token
export const generateSecureToken = () => {
  // 使用密碼學安全的隨機數生成器
  const crypto = require('crypto');
  return crypto.randomBytes(48).toString('base64url'); // 64個字符的URL安全字符串
}; 