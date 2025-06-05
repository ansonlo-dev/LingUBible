import { Resend } from 'resend';

export default async ({ req, res, log, error }) => {
  // 設置 CORS 標頭
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Appwrite-Project',
  };

  // 處理 OPTIONS 請求
  if (req.method === 'OPTIONS') {
    return res.empty(headers);
  }

  try {
    log('📧 聯繫表單郵件發送請求');

    // 解析請求數據
    let requestData;
    try {
      const bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      requestData = typeof bodyData.body === 'string' ? JSON.parse(bodyData.body) : bodyData;
    } catch (parseError) {
      log('❌ 解析請求數據失敗:', parseError);
      return res.json({
        success: false,
        message: '無效的請求數據格式'
      }, 400, headers);
    }

    const { to, from, subject, html } = requestData;

    // 驗證必要參數
    if (!to || !from || !subject || !html) {
      log('❌ 缺少必要參數');
      return res.json({
        success: false,
        message: '缺少必要參數'
      }, 400, headers);
    }

    // 初始化 Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    // 發送郵件
    log('📤 正在發送聯繫表單郵件...');
    const emailResult = await resend.emails.send({
      from: 'noreply@lingubible.com',
      to: to,
      subject: subject,
      html: html,
      replyTo: from, // 設置回覆地址為用戶的郵件地址
    });

    if (emailResult.error) {
      log('❌ 郵件發送失敗:', emailResult.error);
      return res.json({
        success: false,
        message: '郵件發送失敗'
      }, 500, headers);
    }

    log('✅ 聯繫表單郵件發送成功:', emailResult.data?.id);

    return res.json({
      success: true,
      message: '郵件發送成功',
      emailId: emailResult.data?.id
    }, 200, headers);

  } catch (err) {
    log('❌ 處理聯繫表單郵件時發生錯誤:', err);
    error('聯繫表單郵件發送錯誤:', err);
    
    return res.json({
      success: false,
      message: '服務器內部錯誤'
    }, 500, headers);
  }
}; 