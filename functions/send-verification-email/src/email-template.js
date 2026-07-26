// 純 JavaScript 版本的郵件模板生成器
export function generateEmailTemplate(code, language = 'zh-TW', theme = 'light') {
  const translations = {
    'zh-TW': {
      subject: '【LingUBible】您的驗證碼',
      title: 'LingUBible 郵件驗證',
      subtitle: '感謝您註冊 LingUBible！',
      greeting: '親愛的嶺南人！',
      message: '請使用以下驗證碼完成您的帳戶註冊：',
      codeLabel: '您的驗證碼',
      expiry: '此驗證碼將在 15 分鐘後過期',
      footer: '如果您沒有註冊 LingUBible 帳戶，請忽略此郵件。',
      security: '為了您的帳戶安全，請勿將此驗證碼分享給他人。',
      footerLinks: {
        faq: '常見問題',
        contact: '聯絡我們',
        terms: '使用條款',
        privacy: '隱私政策'
      }
    },
    'zh-CN': {
      subject: '【LingUBible】您的验证码',
      title: 'LingUBible 邮件验证',
      subtitle: '感谢您注册 LingUBible！',
      greeting: '亲爱的岭南人！',
      message: '请使用以下验证码完成您的账户注册：',
      codeLabel: '您的验证码',
      expiry: '此验证码将在 15 分钟后过期',
      footer: '如果您没有注册 LingUBible 账户，请忽略此邮件。',
      security: '为了您的账户安全，请勿将此验证码分享给他人。',
      footerLinks: {
        faq: '常见问题',
        contact: '联系我们',
        terms: '使用条款',
        privacy: '隐私政策'
      }
    },
    'en': {
      subject: '【LingUBible】Your Verification Code',
      title: 'LingUBible Email Verification',
      subtitle: 'Thank you for registering with LingUBible!',
      greeting: 'Dear Lingnanians!',
      message: 'Please use the following verification code to complete your account registration:',
      codeLabel: 'Your Verification Code',
      expiry: 'This verification code will expire in 15 minutes',
      footer: 'If you did not register for a LingUBible account, please ignore this email.',
      security: 'For your account security, please do not share this verification code with others.',
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
            text-align: center;
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
        .verification-code {
            font-size: 36px;
            font-weight: bold;
            color: ${colors.codeText};
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            margin: 10px 0;
        }
        .expiry {
            font-size: 14px;
            color: ${colors.textSecondary};
            margin-top: 20px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid ${colors.border};
            text-align: center;
            color: ${colors.textSecondary};
            font-size: 14px;
        }
        .security-note {
            background-color: ${isDark ? colors.codeBg : colors.primaryLight};
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
            color: ${isDark ? colors.text : colors.primary};
            font-size: 14px;
        }
        @media (max-width: 600px) {
            body { padding: 10px; }
            .container { padding: 20px; }
            .verification-code { font-size: 28px; letter-spacing: 4px; }
            .logo-image { max-width: 300px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="https://www.lingubible.com" style="text-decoration: none; color: inherit;">
                <img src="https://www.lingubible.com/email-banner.png" alt="LingUBible" class="logo-image" />
                <div class="logo">${t.title}</div>
                <div class="subtitle">${t.subtitle}</div>
            </a>
        </div>
        
        <div class="content">
            <div class="greeting">${t.greeting}</div>
            <div class="message">${t.message}</div>
            
            <div class="code-container">
                <div class="code-label">${t.codeLabel}</div>
                <div class="verification-code">${code}</div>
                <div class="expiry">⏰ ${t.expiry}</div>
            </div>
        </div>
        
        <div class="security-note">
            🔒 ${t.security}
        </div>
        
        <div class="footer">
            ${t.footer}
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid ${colors.border};">
                <a href="https://www.lingubible.com/faq" style="color: ${colors.linkColor}; text-decoration: none; margin: 0 10px;">${t.footerLinks.faq}</a> |
                <a href="https://www.lingubible.com/contact" style="color: ${colors.linkColor}; text-decoration: none; margin: 0 10px;">${t.footerLinks.contact}</a> |
                <a href="https://www.lingubible.com/terms" style="color: ${colors.linkColor}; text-decoration: none; margin: 0 10px;">${t.footerLinks.terms}</a> |
                <a href="https://www.lingubible.com/privacy" style="color: ${colors.linkColor}; text-decoration: none; margin: 0 10px;">${t.footerLinks.privacy}</a>
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

${t.codeLabel}: ${code}

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