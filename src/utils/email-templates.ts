// Email template generators for preview purposes
// These are simplified versions of the backend templates for frontend preview

export interface EmailTemplate {
  html: string;
  subject: string;
}

// Translations for email templates
const translations = {
  'zh-TW': {
    verification: {
      subject: '驗證碼',
      title: '驗證您的帳戶',
      greeting: '親愛的嶺南人！',
      message: '請使用以下驗證碼來驗證您的帳戶：',
      code: '驗證碼',
      expiry: '此驗證碼將在 10 分鐘後過期。',
      security: '如果您沒有請求此驗證碼，請忽略此郵件。',
      footer: '此郵件由系統自動發送，請勿回覆。',
      footerLinks: {
        faq: '常見問題',
        contact: '聯絡我們',
        terms: '使用條款',
        privacy: '隱私政策'
      }
    },
    passwordReset: {
      subject: '密碼重設',
      title: '重設您的密碼',
      greeting: '您好，{username}！',
      message1: '我們收到了您的密碼重設請求。',
      message2: '請點擊下方按鈕來重設您的密碼：',
      button: '重設密碼',
      expiry: '此重設連結僅可使用一次，請妥善保管。',
      security1: '如果您沒有請求重設密碼，請忽略此郵件。',
      security2: '您的密碼將保持不變。',
      footer: '此郵件由系統自動發送，請勿回覆。',
      linkInstruction: '如果按鈕無法點擊，請複製以下連結到瀏覽器：',
      footerLinks: {
        faq: '常見問題',
        contact: '聯絡我們',
        terms: '使用條款',
        privacy: '隱私政策'
      }
    },
    contactForm: {
      subject: '新的聯絡表單訊息',
      title: '收到新的聯絡表單訊息',
      from: '來自',
      email: '郵件',
      message: '訊息內容',
      footer: '此郵件由聯絡表單自動發送。',
      footerLinks: {
        faq: '常見問題',
        contact: '聯絡我們',
        terms: '使用條款',
        privacy: '隱私政策'
      }
    }
  },
  'zh-CN': {
    verification: {
      subject: '验证码',
      title: '验证您的账户',
      greeting: '亲爱的岭南人！',
      message: '请使用以下验证码来验证您的账户：',
      code: '验证码',
      expiry: '此验证码将在 10 分钟后过期。',
      security: '如果您没有请求此验证码，请忽略此邮件。',
      footer: '此邮件由系统自动发送，请勿回复。',
      footerLinks: {
        faq: '常见问题',
        contact: '联系我们',
        terms: '使用条款',
        privacy: '隐私政策'
      }
    },
    passwordReset: {
      subject: '密码重设',
      title: '重设您的密码',
      greeting: '您好，{username}！',
      message1: '我们收到了您的密码重设请求。',
      message2: '请点击下方按钮来重设您的密码：',
      button: '重设密码',
      expiry: '此重设链接仅可使用一次，请妥善保管。',
      security1: '如果您没有请求重设密码，请忽略此邮件。',
      security2: '您的密码将保持不变。',
      footer: '此邮件由系统自动发送，请勿回复。',
      linkInstruction: '如果按钮无法点击，请复制以下链接到浏览器：',
      footerLinks: {
        faq: '常见问题',
        contact: '联系我们',
        terms: '使用条款',
        privacy: '隐私政策'
      }
    },
    contactForm: {
      subject: '新的联系表单消息',
      title: '收到新的联系表单消息',
      from: '来自',
      email: '邮件',
      message: '消息内容',
      footer: '此邮件由联系表单自动发送。',
      footerLinks: {
        faq: '常见问题',
        contact: '联系我们',
        terms: '使用条款',
        privacy: '隐私政策'
      }
    }
  },
  'en': {
    verification: {
      subject: 'Verification Code',
      title: 'Verify Your Account',
      greeting: 'Dear Lingnanians!',
      message: 'Please use the following verification code to verify your account:',
      code: 'Verification Code',
      expiry: 'This verification code will expire in 10 minutes.',
      security: 'If you did not request this verification code, please ignore this email.',
      footer: 'This email was sent automatically by the system. Please do not reply.',
      footerLinks: {
        faq: 'FAQ',
        contact: 'Contact Us',
        terms: 'Terms of Service',
        privacy: 'Privacy Policy'
      }
    },
    passwordReset: {
      subject: 'Password Reset',
      title: 'Reset Your Password',
      greeting: 'Hello, {username}!',
      message1: 'We received a request to reset your password.',
      message2: 'Please click the button below to reset your password:',
      button: 'Reset Password',
      expiry: 'This reset link can only be used once. Please keep it secure.',
      security1: 'If you did not request a password reset, please ignore this email.',
      security2: 'Your password will remain unchanged.',
      footer: 'This email was sent automatically by the system. Please do not reply.',
      linkInstruction: 'If the button cannot be clicked, please copy the following link to your browser:',
      footerLinks: {
        faq: 'FAQ',
        contact: 'Contact Us',
        terms: 'Terms of Service',
        privacy: 'Privacy Policy'
      }
    },
    contactForm: {
      subject: 'New Contact Form Message',
      title: 'New Contact Form Message Received',
      from: 'From',
      email: 'Email',
      message: 'Message',
      footer: 'This email was sent automatically from the contact form.',
      footerLinks: {
        faq: 'FAQ',
        contact: 'Contact Us',
        terms: 'Terms of Service',
        privacy: 'Privacy Policy'
      }
    }
  }
};

export function generateEmailTemplate(code: string, language: string = 'zh-TW', theme: string = 'light'): EmailTemplate {
  const isDark = theme === 'dark';
  const t = translations[language as keyof typeof translations]?.verification || translations['zh-TW'].verification;
  
  const colors = {
    background: isDark ? '#000000' : '#ffffff',
    containerBg: isDark ? '#0f0f0f' : '#f5f5f5',
    text: isDark ? '#ffffff' : '#1f2937',
    textSecondary: isDark ? '#e5e7eb' : '#6b7280',
    primary: '#dc2626',
    primaryLight: isDark ? '#7f1d1d' : '#fee2e2',
    border: isDark ? '#374151' : '#e5e7eb',
    codeBg: isDark ? '#18171b' : '#f8fafc',
    codeText: isDark ? '#ffffff' : '#dc2626',
    linkColor: isDark ? '#60a5fa' : '#2563eb'
  };

  const html = `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t.subject}</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background-color: ${colors.background};
                color: ${colors.text};
                line-height: 1.6;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: ${colors.containerBg};
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                padding: 40px 30px 20px;
            }
            .logo {
                max-width: 200px;
                height: auto;
                margin-bottom: 20px;
            }
            .title {
                font-size: 28px;
                font-weight: bold;
                color: ${colors.text};
                margin: 0;
            }
            .content {
                padding: 0 30px 40px;
                text-align: center;
            }
            .greeting {
                font-size: 18px;
                color: ${colors.text};
                margin-bottom: 20px;
            }
            .message {
                font-size: 16px;
                color: ${colors.textSecondary};
                margin-bottom: 30px;
            }
            .code-container {
                background-color: ${colors.codeBg};
                ${isDark ? '' : 'border: 2px solid ' + colors.primary + ';'}
                border-radius: 12px;
                padding: 30px;
                margin: 30px 0;
                text-align: center;
            }
            .code-label {
                font-size: 14px;
                color: ${colors.textSecondary};
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .code {
                font-size: 36px;
                font-weight: bold;
                color: ${colors.codeText};
                font-family: 'Courier New', monospace;
                letter-spacing: 4px;
                margin: 0;
            }
            .expiry {
                background-color: transparent;
                border-radius: 8px;
                padding: 5px;
                margin: 10px 0;
                color: ${colors.primary};
                font-size: 14px;
                text-align: center;
            }
            .security-note {
                background-color: transparent;
                border-radius: 8px;
                padding: 5px;
                margin: 10px 0;
                color: ${isDark ? colors.text : colors.textSecondary};
                font-size: 14px;
            }
            .footer {
                text-align: center;
                padding: 20px 30px;
                background-color: ${colors.background};
                color: ${colors.textSecondary};
                font-size: 12px;
                border-top: 1px solid ${colors.border};
            }
            @media (max-width: 600px) {
                .container {
                    margin: 10px;
                    border-radius: 8px;
                }
                .header {
                    padding: 30px 20px 15px;
                }
                .content {
                    padding: 0 20px 30px;
                }
                .title {
                    font-size: 24px;
                }
                .code {
                    font-size: 28px;
                    letter-spacing: 2px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <a href="https://lingubible.com" style="text-decoration: none; color: inherit;">
                    <img src="/email-banner.png" alt="LingUBible" class="logo">
                    <h1 class="title">${t.title}</h1>
                </a>
            </div>
            
            <div class="content">
                <p class="greeting">${t.greeting}</p>
                <p class="message">${t.message}</p>
                
                <div class="code-container">
                    <div class="code-label">${t.code}</div>
                    <div class="code">${code}</div>
                </div>
                
                <div class="expiry">${t.expiry}</div>
                
                <div class="security-note">${t.security}</div>
            </div>
            
            <div class="footer">
                ${t.footer}
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid ${colors.border};">
                    <a href="https://lingubible.com/faq" style="color: ${colors.linkColor}; text-decoration: none; margin: 0 10px;">${t.footerLinks.faq}</a> |
                    <a href="https://lingubible.com/contact" style="color: ${colors.linkColor}; text-decoration: none; margin: 0 10px;">${t.footerLinks.contact}</a> |
                    <a href="https://lingubible.com/terms" style="color: ${colors.linkColor}; text-decoration: none; margin: 0 10px;">${t.footerLinks.terms}</a> |
                    <a href="https://lingubible.com/privacy" style="color: ${colors.linkColor}; text-decoration: none; margin: 0 10px;">${t.footerLinks.privacy}</a>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;

  return {
    html,
    subject: t.subject
  };
}

export function generatePasswordResetEmailTemplate(userId: string, resetToken: string, username: string, language: string = 'zh-TW', theme: string = 'light'): EmailTemplate {
  const isDark = theme === 'dark';
  const t = translations[language as keyof typeof translations]?.passwordReset || translations['zh-TW'].passwordReset;
  
  const colors = {
    background: isDark ? '#000000' : '#ffffff',
    containerBg: isDark ? '#0f0f0f' : '#f5f5f5',
    text: isDark ? '#ffffff' : '#1f2937',
    textSecondary: isDark ? '#e5e7eb' : '#6b7280',
    primary: '#dc2626',
    primaryLight: isDark ? '#7f1d1d' : '#fee2e2',
    border: isDark ? '#374151' : '#e5e7eb',
    buttonBg: '#dc2626',
    buttonText: '#ffffff',
    linkColor: isDark ? '#60a5fa' : '#2563eb',
    infoBg: isDark ? '#18171b' : '#fee2e2'
  };

  const resetUrl = `https://lingubible.com/reset-password?token=${resetToken}&userId=${userId}`;

  const html = `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t.subject}</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background-color: ${colors.background};
                color: ${colors.text};
                line-height: 1.6;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: ${colors.containerBg};
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                padding: 40px 30px 20px;
            }
            .logo {
                max-width: 200px;
                height: auto;
                margin-bottom: 20px;
            }
            .title {
                font-size: 28px;
                font-weight: bold;
                color: ${colors.text};
                margin: 0;
            }
            .content {
                padding: 0 30px 40px;
                text-align: center;
            }
            .greeting {
                font-size: 18px;
                color: ${colors.text};
                margin-bottom: 20px;
            }
            .message {
                font-size: 16px;
                color: ${colors.textSecondary};
                margin-bottom: 30px;
            }
            .button {
                display: inline-block;
                background-color: ${colors.buttonBg};
                color: ${colors.buttonText};
                text-decoration: none;
                padding: 15px 30px;
                border-radius: 8px;
                font-weight: bold;
                font-size: 16px;
                margin: 20px 0;
            }
            .expiry {
                background-color: transparent;
                border-radius: 8px;
                padding: 5px;
                margin: 10px 0;
                color: ${colors.primary};
                font-size: 14px;
                text-align: center;
            }
            .security-note {
                background-color: transparent;
                border-radius: 8px;
                padding: 5px;
                margin: 10px 0;
                color: ${isDark ? colors.text : colors.textSecondary};
                font-size: 14px;
            }
            .message-group {
                margin-bottom: 30px;
            }
            .message-group .message {
                margin-bottom: 5px;
            }
            .message-group .message:last-child {
                margin-bottom: 0;
            }
            .security-group {
                margin-bottom: 20px;
            }
            .security-group .security-note {
                margin: 2px 0;
            }
            .security-group .security-note:last-child {
                margin-bottom: 0;
            }
            .reset-link {
                word-break: break-all;
                color: ${colors.linkColor};
                text-decoration: none;
                font-size: 14px;
                background-color: ${colors.infoBg};
                padding: 10px;
                border-radius: 6px;
                display: block;
                margin: 10px 0;
            }
            .footer {
                text-align: center;
                padding: 20px 30px;
                background-color: ${colors.background};
                color: ${colors.textSecondary};
                font-size: 12px;
                border-top: 1px solid ${colors.border};
            }
            @media (max-width: 600px) {
                .container {
                    margin: 10px;
                    border-radius: 8px;
                }
                .header {
                    padding: 30px 20px 15px;
                }
                .content {
                    padding: 0 20px 30px;
                }
                .title {
                    font-size: 24px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <a href="https://lingubible.com" style="text-decoration: none; color: inherit;">
                    <img src="/email-banner.png" alt="LingUBible" class="logo">
                    <h1 class="title">${t.title}</h1>
                </a>
            </div>
            
            <div class="content">
                <p class="greeting">${t.greeting.replace('{username}', username)}</p>
                <div class="message-group">
                    <p class="message">${t.message1}</p>
                    <p class="message">${t.message2}</p>
                </div>
                
                <a href="${resetUrl}" class="button">${t.button}</a>
                
                <div class="expiry">${t.expiry}</div>
                
                <div class="security-group">
                    <div class="security-note">${t.security1}</div>
                    <div class="security-note">${t.security2}</div>
                </div>
                
                <p style="margin-top: 30px; font-size: 14px; color: ${colors.textSecondary};">
                    ${t.linkInstruction}
                </p>
                <a href="${resetUrl}" class="reset-link">${resetUrl}</a>
            </div>
            
            <div class="footer">
                ${t.footer}
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid ${colors.border};">
                    <a href="https://lingubible.com/faq" style="color: ${colors.linkColor}; text-decoration: none; margin: 0 10px;">${t.footerLinks.faq}</a> |
                    <a href="https://lingubible.com/contact" style="color: ${colors.linkColor}; text-decoration: none; margin: 0 10px;">${t.footerLinks.contact}</a> |
                    <a href="https://lingubible.com/terms" style="color: ${colors.linkColor}; text-decoration: none; margin: 0 10px;">${t.footerLinks.terms}</a> |
                    <a href="https://lingubible.com/privacy" style="color: ${colors.linkColor}; text-decoration: none; margin: 0 10px;">${t.footerLinks.privacy}</a>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;

  return {
    html,
    subject: t.subject
  };
}

export function generateContactFormEmailTemplate(name: string, email: string, message: string, language: string = 'zh-TW', theme: string = 'light'): EmailTemplate {
  const isDark = theme === 'dark';
  const t = translations[language as keyof typeof translations]?.contactForm || translations['zh-TW'].contactForm;
  
  const colors = {
    background: isDark ? '#000000' : '#ffffff',
    containerBg: isDark ? '#0f0f0f' : '#f5f5f5',
    text: isDark ? '#ffffff' : '#1f2937',
    textSecondary: isDark ? '#e5e7eb' : '#6b7280',
    primary: '#dc2626',
    primaryLight: isDark ? '#7f1d1d' : '#fee2e2',
    border: isDark ? '#374151' : '#e5e7eb',
    infoBg: isDark ? '#18171b' : '#f8fafc',
    messageBg: isDark ? '#18171b' : '#ffffff',
    linkColor: isDark ? '#60a5fa' : '#2563eb'
  };

  const html = `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t.subject}</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background-color: ${colors.background};
                color: ${colors.text};
                line-height: 1.6;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: ${colors.containerBg};
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                padding: 40px 30px 20px;
            }
            .logo {
                max-width: 200px;
                height: auto;
                margin-bottom: 20px;
            }
            .title {
                font-size: 28px;
                font-weight: bold;
                color: ${colors.text};
                margin: 0;
            }
            .content {
                padding: 0 30px 40px;
            }
            .info-section {
                background-color: ${colors.infoBg};
                ${isDark ? '' : 'border: 2px solid ' + colors.primary + ';'}
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
            }
            .info-label {
                font-size: 14px;
                color: ${colors.textSecondary};
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: bold;
            }
            .info-value {
                font-size: 16px;
                color: ${colors.text};
                margin: 0 0 15px 0;
                word-break: break-word;
            }
            .info-value:last-child {
                margin-bottom: 0;
            }
            .message-section {
                background-color: ${colors.messageBg};
                border: 1px solid ${colors.border};
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
            }
            .message-label {
                font-size: 14px;
                color: ${colors.textSecondary};
                margin-bottom: 15px;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: bold;
            }
            .message-content {
                font-size: 16px;
                color: ${colors.text};
                line-height: 1.6;
                white-space: pre-wrap;
                word-wrap: break-word;
                margin: 0;
            }
            .footer {
                text-align: center;
                padding: 20px 30px;
                background-color: ${colors.background};
                color: ${colors.textSecondary};
                font-size: 12px;
                border-top: 1px solid ${colors.border};
            }
            @media (max-width: 600px) {
                .container {
                    margin: 10px;
                    border-radius: 8px;
                }
                .header {
                    padding: 30px 20px 15px;
                }
                .content {
                    padding: 0 20px 30px;
                }
                .title {
                    font-size: 24px;
                }
                .info-section, .message-section {
                    padding: 15px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <a href="https://lingubible.com" style="text-decoration: none; color: inherit;">
                    <img src="/email-banner.png" alt="LingUBible" class="logo">
                    <h1 class="title">${t.title}</h1>
                </a>
            </div>
            
            <div class="content">
                <div class="info-section">
                    <div class="info-label">${t.from}</div>
                    <div class="info-value">${name}</div>
                    
                    <div class="info-label">${t.email}</div>
                    <div class="info-value">${email}</div>
                </div>
                
                <div class="message-section">
                    <div class="message-label">${t.message}</div>
                    <div class="message-content">${message}</div>
                </div>
            </div>
            
            <div class="footer">
                ${t.footer}
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid ${colors.border};">
                    <a href="https://lingubible.com/faq" style="color: ${colors.linkColor}; text-decoration: none; margin: 0 10px;">${t.footerLinks.faq}</a> |
                    <a href="https://lingubible.com/contact" style="color: ${colors.linkColor}; text-decoration: none; margin: 0 10px;">${t.footerLinks.contact}</a> |
                    <a href="https://lingubible.com/terms" style="color: ${colors.linkColor}; text-decoration: none; margin: 0 10px;">${t.footerLinks.terms}</a> |
                    <a href="https://lingubible.com/privacy" style="color: ${colors.linkColor}; text-decoration: none; margin: 0 10px;">${t.footerLinks.privacy}</a>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;

  return {
    html,
    subject: t.subject
  };
} 