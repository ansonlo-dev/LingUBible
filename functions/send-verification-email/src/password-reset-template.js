// 生成密碼重設郵件模板
export function generatePasswordResetEmailTemplate(userId, resetToken, language = 'zh-TW', theme = 'light') {
  const resetUrl = `https://lingubible.com/reset-password?userId=${userId}&token=${resetToken}`;
  
  const translations = {
    'zh-TW': {
      subject: '【LingUBible】密碼重設請求',
      title: 'LingUBible 密碼重設',
      subtitle: '我們收到了您的密碼重設請求',
      greeting: '您好！',
      message: '我們收到了您的密碼重設請求。如果這是您本人的操作，請點擊下方按鈕重設您的密碼：',
      buttonText: '重設密碼',
      alternativeText: '如果按鈕無法點擊，請複製以下連結到瀏覽器中打開：',
      expiry: '此重設連結將在 24 小時後過期',
      security: '如果您沒有請求密碼重設，請忽略此郵件。您的帳戶仍然安全。',
      footer: '為了您的帳戶安全，請勿將此重設連結分享給他人。'
    },
    'zh-CN': {
      subject: '【LingUBible】密码重设请求',
      title: 'LingUBible 密码重设',
      subtitle: '我们收到了您的密码重设请求',
      greeting: '您好！',
      message: '我们收到了您的密码重设请求。如果这是您本人的操作，请点击下方按钮重设您的密码：',
      buttonText: '重设密码',
      alternativeText: '如果按钮无法点击，请复制以下链接到浏览器中打开：',
      expiry: '此重设链接将在 24 小时后过期',
      security: '如果您没有请求密码重设，请忽略此邮件。您的账户仍然安全。',
      footer: '为了您的账户安全，请勿将此重设链接分享给他人。'
    },
    'en': {
      subject: '【LingUBible】Password Reset Request',
      title: 'LingUBible Password Reset',
      subtitle: 'We received your password reset request',
      greeting: 'Hello!',
      message: 'We received your password reset request. If this was you, please click the button below to reset your password:',
      buttonText: 'Reset Password',
      alternativeText: 'If the button doesn\'t work, please copy and paste the following link into your browser:',
      expiry: 'This reset link will expire in 24 hours',
      security: 'If you didn\'t request a password reset, please ignore this email. Your account is still secure.',
      footer: 'For your account security, please do not share this reset link with others.'
    }
  };

  const t = translations[language] || translations['zh-TW'];
  const isDark = theme === 'dark';

  const colors = {
    background: isDark ? '#1f2937' : '#ffffff',
    containerBg: isDark ? '#374151' : '#ffffff',
    text: isDark ? '#f9fafb' : '#1f2937',
    textSecondary: isDark ? '#d1d5db' : '#6b7280',
    primary: '#dc2626',
    primaryLight: isDark ? '#fca5a5' : '#fee2e2',
    border: isDark ? '#4b5563' : '#e5e7eb',
    buttonBg: '#dc2626',
    buttonText: '#ffffff',
    linkColor: isDark ? '#60a5fa' : '#2563eb'
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
            background-color: ${colors.primaryLight};
            padding: 10px;
            border-radius: 6px;
            display: block;
            margin: 10px 0;
        }
        .expiry {
            background-color: ${colors.primaryLight};
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: ${colors.primary};
            font-size: 14px;
            text-align: center;
        }
        .security-note {
            background-color: ${colors.primaryLight};
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: ${colors.primary};
            font-size: 14px;
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
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">${t.title}</div>
            <div class="subtitle">${t.subtitle}</div>
        </div>
        
        <div class="content">
            <div class="greeting">${t.greeting}</div>
            <div class="message">${t.message}</div>
            
            <div class="button-container">
                <a href="${resetUrl}" class="reset-button">${t.buttonText}</a>
            </div>
            
            <div class="alternative-text">${t.alternativeText}</div>
            <a href="${resetUrl}" class="reset-link">${resetUrl}</a>
            
            <div class="expiry">
                ⏰ ${t.expiry}
            </div>
        </div>
        
        <div class="security-note">
            🔒 ${t.security}
        </div>
        
        <div class="footer">
            ${t.footer}
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

---
${t.footer}
`;

  return {
    subject: t.subject,
    html: html.trim(),
    text: text.trim()
  };
} 