// 生成密碼重設郵件模板
export function generatePasswordResetEmailTemplate(userId, resetToken, username, language = 'zh-TW', theme = 'light') {
  const resetUrl = `https://lingubible.com/reset-password?userId=${userId}&token=${resetToken}`;
  
  const translations = {
    'zh-TW': {
      subject: '【LingUBible】密碼重設請求',
      title: 'LingUBible 密碼重設',
      subtitle: '我們收到了您的密碼重設請求',
      greeting: '您好，{username}！',
      message1: '我們收到了您的密碼重設請求。',
      message2: '請點擊下方按鈕來重設您的密碼：',
      buttonText: '重設密碼',
      alternativeText: '如果按鈕無法點擊，請複製以下連結到瀏覽器中打開：',
      expiry: '此重設連結僅可使用一次，請妥善保管。',
      security1: '如果您沒有請求重設密碼，請忽略此郵件。',
      security2: '您的密碼將保持不變。',
      footer: '為了您的帳戶安全，請勿將此重設連結分享給他人。',
      footerLinks: {
        faq: '常見問題',
        contact: '聯絡我們',
        terms: '使用條款',
        privacy: '隱私政策'
      }
    },
    'zh-CN': {
      subject: '【LingUBible】密码重设请求',
      title: 'LingUBible 密码重设',
      subtitle: '我们收到了您的密码重设请求',
      greeting: '您好，{username}！',
      message1: '我们收到了您的密码重设请求。',
      message2: '请点击下方按钮来重设您的密码：',
      buttonText: '重设密码',
      alternativeText: '如果按钮无法点击，请复制以下链接到浏览器中打开：',
      expiry: '此重设链接仅可使用一次，请妥善保管。',
      security1: '如果您没有请求重设密码，请忽略此邮件。',
      security2: '您的密码将保持不变。',
      footer: '为了您的账户安全，请勿将此重设链接分享给他人。',
      footerLinks: {
        faq: '常见问题',
        contact: '联系我们',
        terms: '使用条款',
        privacy: '隐私政策'
      }
    },
    'en': {
      subject: '【LingUBible】Password Reset Request',
      title: 'LingUBible Password Reset',
      subtitle: 'We received your password reset request',
      greeting: 'Hello, {username}!',
      message1: 'We received a request to reset your password.',
      message2: 'Please click the button below to reset your password:',
      buttonText: 'Reset Password',
      alternativeText: 'If the button doesn\'t work, please copy and paste the following link into your browser:',
      expiry: 'This reset link can only be used once. Please keep it secure.',
      security1: 'If you did not request a password reset, please ignore this email.',
      security2: 'Your password will remain unchanged.',
      footer: 'For your account security, please do not share this reset link with others.',
      footerLinks: {
        faq: 'FAQ',
        contact: 'Contact Us',
        terms: 'Terms of Service',
        privacy: 'Privacy Policy'
      }
    }
  };

  const t = translations[language] || translations['zh-TW'];
  const isDark = theme === 'dark';

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

  const html = `
<!DOCTYPE html>
<html lang="${language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: ${colors.text};
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: ${colors.background};
        }
        .container {
            background-color: ${colors.containerBg};
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border: 1px solid ${colors.border};
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid ${colors.primary};
        }
        .logo-image {
            max-width: 400px;
            width: 100%;
            height: auto;
            margin-bottom: 16px;
            display: block;
            margin-left: auto;
            margin-right: auto;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: ${colors.primary};
            margin-bottom: 10px;
        }
        .subtitle {
            color: ${colors.textSecondary};
            font-size: 16px;
        }
        .content {
            margin: 30px 0;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: ${colors.text};
        }
        .message {
            font-size: 16px;
            margin-bottom: 30px;
            color: ${colors.textSecondary};
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .reset-button {
            display: inline-block;
            background-color: ${colors.buttonBg};
            color: ${colors.buttonText};
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            transition: background-color 0.3s ease;
        }
        .reset-button:hover {
            background-color: #b91c1c;
        }
        .alternative-text {
            font-size: 14px;
            color: ${colors.textSecondary};
            margin: 20px 0 10px;
            text-align: center;
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
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid ${colors.border};
            text-align: center;
            color: ${colors.textSecondary};
            font-size: 14px;
        }
        @media (max-width: 600px) {
            body { padding: 10px; }
            .container { padding: 20px; }
            .reset-button { padding: 12px 24px; font-size: 14px; }
            .logo-image { max-width: 300px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="https://lingubible.com" style="text-decoration: none; color: inherit;">
                <img src="https://lingubible.com/email-banner.png" alt="LingUBible" class="logo-image" />
                <div class="logo">${t.title}</div>
                <div class="subtitle">${t.subtitle}</div>
            </a>
        </div>
        
        <div class="content">
            <div class="greeting">${t.greeting.replace('{username}', username)}</div>
            <div class="message-group">
                <div class="message">${t.message1}</div>
                <div class="message">${t.message2}</div>
            </div>
            
            <div class="button-container">
                <a href="${resetUrl}" class="reset-button">${t.buttonText}</a>
            </div>
            
            <div class="alternative-text">${t.alternativeText}</div>
            <a href="${resetUrl}" class="reset-link">${resetUrl}</a>
            
            <div class="expiry">
                ⏰ ${t.expiry}
            </div>
            
            <div class="security-group">
                <div class="security-note">
                    🔒 ${t.security1}
                </div>
                <div class="security-note">
                    ${t.security2}
                </div>
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
</html>`;

  const text = `
${t.title}
${t.subtitle}

${t.greeting}

${t.message}

${t.buttonText}: ${resetUrl}

${t.expiry}

${t.security}

${t.footer}
  `;

  return {
    html,
    text,
    subject: t.subject
  };
} 