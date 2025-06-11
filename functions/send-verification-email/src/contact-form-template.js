// 生成聯絡表單郵件模板
export function generateContactFormEmailTemplate(name, email, message, language = 'zh-TW') {
  const templates = {
    'zh-TW': {
      subject: `來自 ${name} 的聯絡表單訊息`,
      html: `
        <!DOCTYPE html>
        <html lang="zh-TW">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>聯絡表單訊息</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px; }
            .content { padding: 20px 0; }
            .info-section { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea; }
            .message-section { background-color: #fff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
            h1 { margin: 0; font-size: 24px; }
            h2 { color: #667eea; margin-top: 0; }
            .label { font-weight: bold; color: #495057; }
            .value { margin-left: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 新的聯絡表單訊息</h1>
              <p>來自 LingUBible 網站的聯絡表單</p>
            </div>
            
            <div class="content">
              <div class="info-section">
                <h2>📋 聯絡人資訊</h2>
                <p><span class="label">姓名：</span><span class="value">${name}</span></p>
                <p><span class="label">電子郵件：</span><span class="value">${email}</span></p>
                <p><span class="label">提交時間：</span><span class="value">${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Hong_Kong' })}</span></p>
              </div>
              
              <div class="message-section">
                <h2>💬 訊息內容</h2>
                <div style="white-space: pre-wrap; line-height: 1.6;">${message}</div>
              </div>
            </div>
            
            <div class="footer">
              <p>此郵件由 LingUBible 聯絡表單自動發送</p>
              <p>請直接回覆此郵件與聯絡人溝通</p>
            </div>
          </div>
        </body>
        </html>
      `
    },
    'zh-CN': {
      subject: `来自 ${name} 的联系表单消息`,
      html: `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>联系表单消息</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px; }
            .content { padding: 20px 0; }
            .info-section { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea; }
            .message-section { background-color: #fff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
            h1 { margin: 0; font-size: 24px; }
            h2 { color: #667eea; margin-top: 0; }
            .label { font-weight: bold; color: #495057; }
            .value { margin-left: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 新的联系表单消息</h1>
              <p>来自 LingUBible 网站的联系表单</p>
            </div>
            
            <div class="content">
              <div class="info-section">
                <h2>📋 联系人信息</h2>
                <p><span class="label">姓名：</span><span class="value">${name}</span></p>
                <p><span class="label">电子邮件：</span><span class="value">${email}</span></p>
                <p><span class="label">提交时间：</span><span class="value">${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Hong_Kong' })}</span></p>
              </div>
              
              <div class="message-section">
                <h2>💬 消息内容</h2>
                <div style="white-space: pre-wrap; line-height: 1.6;">${message}</div>
              </div>
            </div>
            
            <div class="footer">
              <p>此邮件由 LingUBible 联系表单自动发送</p>
              <p>请直接回复此邮件与联系人沟通</p>
            </div>
          </div>
        </body>
        </html>
      `
    },
    'en': {
      subject: `Contact Form Message from ${name}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contact Form Message</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px; }
            .content { padding: 20px 0; }
            .info-section { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea; }
            .message-section { background-color: #fff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
            h1 { margin: 0; font-size: 24px; }
            h2 { color: #667eea; margin-top: 0; }
            .label { font-weight: bold; color: #495057; }
            .value { margin-left: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 New Contact Form Message</h1>
              <p>From LingUBible Website Contact Form</p>
            </div>
            
            <div class="content">
              <div class="info-section">
                <h2>📋 Contact Information</h2>
                <p><span class="label">Name:</span><span class="value">${name}</span></p>
                <p><span class="label">Email:</span><span class="value">${email}</span></p>
                <p><span class="label">Submitted:</span><span class="value">${new Date().toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' })}</span></p>
              </div>
              
              <div class="message-section">
                <h2>💬 Message Content</h2>
                <div style="white-space: pre-wrap; line-height: 1.6;">${message}</div>
              </div>
            </div>
            
            <div class="footer">
              <p>This email was automatically sent by LingUBible contact form</p>
              <p>Please reply directly to this email to communicate with the sender</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  };

  return templates[language] || templates['zh-TW'];
} 