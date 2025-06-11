import { 
  sendVerificationCode,
  verifyCode,
  createVerifiedAccount,
  checkUsernameAvailability,
  sendPasswordReset,
  completePasswordReset,
  sendContactFormEmail
} from './handlers.js';

// 路由映射表
export const routes = {
  'send': sendVerificationCode,
  'verify': verifyCode,
  'createAccount': createVerifiedAccount,
  'checkUsername': checkUsernameAvailability,
  'sendPasswordReset': sendPasswordReset,
  'completePasswordReset': completePasswordReset,
  'sendContactForm': sendContactFormEmail
};

// 路由處理器
export const handleRoute = async (action, requestData, context) => {
  const handler = routes[action] || routes['send']; // 默認為發送驗證碼
  return await handler(requestData, context);
}; 