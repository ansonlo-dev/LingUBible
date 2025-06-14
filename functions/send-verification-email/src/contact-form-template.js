// 生成聯絡表單郵件模板
export function generateContactFormEmailTemplate(name, email, type, message, language = 'zh-TW', theme = 'light') {
  const isDark = theme === 'dark';
  
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

  const translations = {
    'zh-TW': {
      subject: '新的聯絡表單訊息',
      title: '收到新的聯絡表單訊息',
      from: '來自',
      email: '郵件',
      type: '類型',
      message: '訊息內容',
      footer: '此郵件由聯絡表單自動發送。',
      types: {
        bugReport: '錯誤回報',
        commentReport: '評論檢舉',
        accountIssue: '帳戶問題',
        featureRequest: '功能建議',
        general: '一般諮詢',
        other: '其他'
      },
      footerLinks: {
        faq: '常見問題',
        contact: '聯絡我們',
        terms: '使用條款',
        privacy: '隱私政策'
      }
    },
    'zh-CN': {
      subject: '新的联系表单消息',
      title: '收到新的联系表单消息',
      from: '来自',
      email: '邮件',
      type: '类型',
      message: '消息内容',
      footer: '此邮件由联系表单自动发送。',
      types: {
        bugReport: '错误报告',
        commentReport: '评论举报',
        accountIssue: '账户问题',
        featureRequest: '功能建议',
        general: '一般咨询',
        other: '其他'
      },
      footerLinks: {
        faq: '常见问题',
        contact: '联系我们',
        terms: '使用条款',
        privacy: '隐私政策'
      }
    },
    'en': {
      subject: 'New Contact Form Message',
      title: 'New Contact Form Message Received',
      from: 'From',
      email: 'Email',
      type: 'Type',
      message: 'Message',
      footer: 'This email was sent automatically from the contact form.',
      types: {
        bugReport: 'Bug Report',
        commentReport: 'Comment Report',
        accountIssue: 'Account Issue',
        featureRequest: 'Feature Request',
        general: 'General Inquiry',
        other: 'Other'
      },
      footerLinks: {
        faq: 'FAQ',
        contact: 'Contact Us',
        terms: 'Terms of Service',
        privacy: 'Privacy Policy'
      }
    }
  };

  const t = translations[language] || translations['zh-TW'];

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
                    
                    <div class="info-label">${t.type}</div>
                    <div class="info-value">${t.types[type] || type}</div>
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
    subject: t.subject,
    html: html
  };
} 