// 純 JavaScript 版本的郵件模板生成器
export function generateEmailTemplate(code, language = 'zh-TW') {
  // 多語言翻譯
  const translations = {
    'en': {
      preview: 'Your LingUBible verification code',
      title: 'Lingnanians Account Verification',
      greeting: 'Dear Lingnanians,',
      thankYou: 'Thank you for registering for a LingUBible Lingnanians account. To ensure account security, please use the following verification code to complete the registration process:',
      importantReminder: 'Important Reminder:',
      expiry: 'This verification code will expire in 10 minutes',
      noShare: 'Do not share the verification code with others',
      ignoreEmail: 'If you did not request this verification code, please ignore this email',
      notice: 'Notice: Only Lingnan University Lingnanians with @ln.hk or @ln.edu.hk email addresses can register for LingUBible.',
      support: 'If you have any questions, please contact our technical support team.',
      platform: 'Lingnan University Course & Lecturer Review Platform',
      license: 'Licensed under MIT',
      team: 'LingUBible Team'
    },
    'zh-TW': {
      preview: '您的 LingUBible 驗證碼',
      title: '嶺南人帳戶驗證',
      greeting: '親愛的嶺南人，您好！',
      thankYou: '感謝您註冊 LingUBible 嶺南人帳戶。為了確保帳戶安全，請使用以下驗證碼完成註冊程序：',
      importantReminder: '重要提醒：',
      expiry: '此驗證碼將在 10 分鐘後過期',
      noShare: '請勿將驗證碼分享給他人',
      ignoreEmail: '如果您沒有請求此驗證碼，請忽略此郵件',
      notice: '注意事項：只有使用 @ln.hk 或 @ln.edu.hk 郵件地址的嶺南大學嶺南人才能註冊 LingUBible。',
      support: '如有任何問題，請聯繫我們的技術支援團隊。',
      platform: '嶺南大學課程與講師評價平台',
      license: '採用 MIT 授權',
      team: 'LingUBible 團隊'
    },
    'zh-CN': {
      preview: '您的 LingUBible 验证码',
      title: '岭南人账户验证',
      greeting: '亲爱的岭南人，您好！',
      thankYou: '感谢您注册 LingUBible 岭南人账户。为了确保账户安全，请使用以下验证码完成注册程序：',
      importantReminder: '重要提醒：',
      expiry: '此验证码将在 10 分钟后过期',
      noShare: '请勿将验证码分享给他人',
      ignoreEmail: '如果您没有请求此验证码，请忽略此邮件',
      notice: '注意事项：只有使用 @ln.hk 或 @ln.edu.hk 邮件地址的岭南大学岭南人才能注册 LingUBible。',
      support: '如有任何问题，请联系我们的技术支持团队。',
      platform: '岭南大学课程与讲师评价平台',
      license: '采用 MIT 授权',
      team: 'LingUBible 团队'
    }
  };

  const t = translations[language] || translations['zh-TW'];

  // 生成 HTML 模板
  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="${language === 'en' ? 'en' : language === 'zh-CN' ? 'zh-CN' : 'zh-HK'}">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LingUBible ${t.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Inter', Arial, 'Microsoft JhengHei', sans-serif;
          background-color: #f6f9fc;
          line-height: 1.6;
        }
        
        .container {
          margin: 0 auto;
          padding: 20px 0;
          width: 600px;
          max-width: 100%;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .header {
          padding: 40px 40px 30px;
          text-align: center;
          border-bottom: 1px solid #eee;
        }
        
        .logo-container {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 8px;
          text-decoration: none;
          color: inherit;
        }
        
        .logo {
          width: 48px;
          height: 48px;
          vertical-align: middle;
        }
        
        .brand-name {
          margin: 0;
          color: #dc2626;
          font-size: 28px;
          font-weight: bold;
          vertical-align: middle;
        }
        
        .platform-text {
          margin: 5px 0 0;
          color: #666;
          font-size: 14px;
        }
        
        .content {
          padding: 40px;
        }
        
        .title {
          margin: 0 0 30px;
          color: #333;
          text-align: center;
          font-size: 24px;
          font-weight: 600;
        }
        
        .text {
          margin: 0 0 30px;
          color: #333;
          font-size: 16px;
        }
        
        .code-section {
          text-align: center;
          padding: 30px 0;
        }
        
        .code-container {
          margin: 0 auto;
          background: #f8f9fa;
          border: 2px solid #dc2626;
          border-radius: 8px;
          padding: 20px 40px;
          display: inline-block;
        }
        
        .code-text {
          color: #dc2626;
          font-family: 'Courier New', monospace;
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 6px;
          margin: 0;
        }
        
        .reminder-title {
          margin: 0 0 20px;
          color: #333;
          font-size: 16px;
          font-weight: bold;
        }
        
        .reminder-list {
          margin: 0 0 30px;
          color: #333;
          font-size: 16px;
          padding-left: 20px;
        }
        
        .reminder-item {
          margin-bottom: 8px;
        }
        
        .notice {
          margin: 0 0 30px;
          color: #333;
          font-size: 16px;
          font-weight: bold;
        }
        
        .footer {
          padding: 30px 40px;
          background-color: #f8f9fa;
          text-align: center;
          border-radius: 0 0 8px 8px;
          border-top: 1px solid #eee;
        }
        
        .footer-text {
          margin: 0 0 10px;
          color: #8898aa;
          font-size: 12px;
        }
        
        .footer-link {
          color: #8898aa;
          text-decoration: none;
        }
        
        /* 深色主題支援 */
        @media (prefers-color-scheme: dark) {
          body {
            background-color: #1a1a1a !important;
          }
          
          .container {
            background-color: #2d2d2d !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
          }
          
          .header {
            border-bottom: 1px solid #404040 !important;
          }
          
          .brand-name {
            color: #ef4444 !important;
          }
          
          .platform-text {
            color: #a0a0a0 !important;
          }
          
          .title {
            color: #f0f0f0 !important;
          }
          
          .text {
            color: #e0e0e0 !important;
          }
          
          .code-container {
            background: #1f1f1f !important;
            border: 2px solid #ef4444 !important;
          }
          
          .code-text {
            color: #ef4444 !important;
          }
          
          .reminder-title {
            color: #f0f0f0 !important;
          }
          
          .reminder-list {
            color: #e0e0e0 !important;
          }
          
          .notice {
            color: #f0f0f0 !important;
          }
          
          .footer {
            background-color: #1f1f1f !important;
            border-top: 1px solid #404040 !important;
          }
          
          .footer-text {
            color: #a0a0a0 !important;
          }
          
          .footer-link {
            color: #a0a0a0 !important;
          }
        }
        
        /* Outlook 深色主題支援 */
        [data-ogsc] body {
          background-color: #1a1a1a !important;
        }
        
        [data-ogsc] .container {
          background-color: #2d2d2d !important;
        }
        
        [data-ogsc] .title,
        [data-ogsc] .text,
        [data-ogsc] .reminder-title,
        [data-ogsc] .reminder-list,
        [data-ogsc] .notice {
          color: #e0e0e0 !important;
        }
        
        [data-ogsc] .brand-name,
        [data-ogsc] .code-text {
          color: #ef4444 !important;
        }
        
        [data-ogsc] .platform-text,
        [data-ogsc] .footer-text,
        [data-ogsc] .footer-link {
          color: #a0a0a0 !important;
        }
        
        [data-ogsc] .code-container {
          background: #1f1f1f !important;
          border-color: #ef4444 !important;
        }
        
        [data-ogsc] .footer {
          background-color: #1f1f1f !important;
        }
        
        [data-ogsc] .header {
          border-bottom-color: #404040 !important;
        }
        
        @media (max-width: 600px) {
          .container {
            width: 100%;
            margin: 0;
            border-radius: 0;
          }
          
          .header, .content, .footer {
            padding: 20px;
          }
          
          .code-text {
            font-size: 24px;
            letter-spacing: 4px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <a href="https://lingubible.com" class="logo-container">
            <svg class="logo" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="32" y="32" width="448" height="448" rx="80" fill="#dc2626"/>
              <g transform="translate(128, 160)">
                <path d="M0 24 C0 12 12 0 24 0 L104 0 C116 0 128 12 128 24 L128 176 C128 188 116 200 104 200 L24 200 C12 200 0 188 0 176 Z" fill="white"/>
                <path d="M128 24 C128 12 140 0 152 0 L232 0 C244 0 256 12 256 24 L256 176 C256 188 244 200 232 200 L152 200 C140 200 128 188 128 176 Z" fill="white"/>
                <line x1="128" y1="24" x2="128" y2="200" stroke="#dc2626" stroke-width="6"/>
                <path d="M116 200 L116 256 L128 244 L140 256 L140 200" fill="#dc2626"/>
              </g>
            </svg>
            <h1 class="brand-name">LingUBible</h1>
          </a>
          <p class="platform-text">${t.platform}</p>
        </div>

        <!-- Content -->
        <div class="content">
          <h2 class="title">${t.title}</h2>
          
          <p class="text">${t.greeting}</p>
          
          <p class="text">${t.thankYou}</p>
          
          <!-- Verification Code Box -->
          <div class="code-section">
            <div class="code-container">
              <div class="code-text">${code}</div>
            </div>
          </div>
          
          <p class="reminder-title">${t.importantReminder}</p>
          
          <ul class="reminder-list">
            <li class="reminder-item">${t.expiry}</li>
            <li class="reminder-item">${t.noShare}</li>
            <li class="reminder-item">${t.ignoreEmail}</li>
          </ul>
          
          <p class="notice">${t.notice}</p>
          
          <p class="text">${t.support}</p>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p class="footer-text">
            <a href="https://lingubible.com" class="footer-link">LingUBible</a> - ${t.platform}
          </p>
          <p class="footer-text">${t.license}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // 生成純文字版本
  const textTemplate = `
${t.greeting}

${t.thankYou}

驗證碼: ${code}

${t.importantReminder}
- ${t.expiry}
- ${t.noShare}
- ${t.ignoreEmail}

${t.notice}

${t.support}

${t.team}
  `;

  return {
    html: htmlTemplate,
    text: textTemplate.trim(),
    subject: language === 'en' 
      ? '【LingUBible】Your Lingnanians Verification Code - Do Not Reply'
      : language === 'zh-CN'
      ? '【LingUBible】您的岭南人验证码 - 请勿回复'
      : '【LingUBible】您的嶺南人驗證碼 - 請勿回覆'
  };
} 