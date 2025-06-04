import { Resend } from 'resend';
import { Client, Databases, Query, ID, Users } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  try {
    log('🚀 Function 開始執行');
    log('📝 請求方法:', req.method);
    log('📦 請求體內容:', req.body);

    // 檢查請求方法
    if (req.method !== 'POST') {
      log('❌ 請求方法錯誤:', req.method);
      return res.json({ 
        success: false, 
        message: '只允許 POST 請求' 
      }, 405);
    }

    // 解析請求體
    let requestData;
    try {
      if (!req.body || req.body.trim() === '') {
        log('❌ 請求體為空');
        return res.json({
          success: false,
          message: '請求數據為空'
        }, 400);
      }

      requestData = JSON.parse(req.body);
      log('📧 解析成功:', requestData);
      
    } catch (parseError) {
      error('❌ JSON 解析失敗:', parseError);
      return res.json({
        success: false,
        message: '請求數據格式錯誤'
      }, 400);
    }

    // 初始化 Appwrite 客戶端
    const client = new Client()
      .setEndpoint('https://fra.cloud.appwrite.io/v1')
      .setProject('lingubible')
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const users = new Users(client);

    // 根據 action 參數決定執行發送、驗證或創建帳戶
    const { action = 'send', email, code, password, name, language = 'zh-TW', ipAddress, userAgent } = requestData;
    
    log('🎯 Action 參數:', action);
    log('📧 解析參數:', { action, email, code: code ? code.substring(0, 2) + '****' : 'undefined', password: password ? '***' : 'undefined', name, language });

    if (action === 'verify') {
      // 驗證驗證碼
      return await verifyCode(databases, email, code, ipAddress, userAgent, log, error, res);
    } else if (action === 'createAccount') {
      // 創建帳戶並自動設置為已驗證
      return await createVerifiedAccount(databases, users, email, password, name, ipAddress, userAgent, log, error, res);
    } else {
      // 發送驗證碼
      return await sendVerificationCode(databases, email, language, ipAddress, userAgent, log, error, res);
    }

  } catch (err) {
    error('💥 Function 執行異常:', err);
    return res.json({
      success: false,
      message: `服務異常: ${err.message || '請稍後再試'}`
    }, 500);
  }
};

// 發送驗證碼函數
async function sendVerificationCode(databases, email, language, ipAddress, userAgent, log, error, res) {
  try {
    log('📧 開始發送驗證碼流程:', { email, language });

    // 驗證參數
    if (!email) {
      return res.json({
        success: false,
        message: '缺少郵件地址'
      }, 400);
    }

    // 驗證學生郵件
    const validEmailPattern = /^[a-zA-Z0-9._%+-]+@(ln\.edu\.hk|ln\.hk)$/;
    if (!validEmailPattern.test(email.toLowerCase())) {
      log('❌ 郵件格式驗證失敗:', email);
      const errorMessages = {
        'en': 'Only @ln.edu.hk or @ln.hk email addresses can register',
        'zh-TW': '只有 @ln.edu.hk 或 @ln.hk 郵件地址的學生才能註冊',
        'zh-CN': '只有 @ln.edu.hk 或 @ln.hk 邮件地址的学生才能注册'
      };
      return res.json({
        success: false,
        message: errorMessages[language] || errorMessages['zh-TW']
      }, 400);
    }

    // 檢查是否已有未過期的驗證碼
    log('🔍 檢查現有驗證碼');
    const existingCodes = await databases.listDocuments(
      'verification_system',
      'verification_codes',
      [
        Query.equal('email', email),
        Query.orderDesc('$createdAt'),
        Query.limit(1)
      ]
    );

    if (existingCodes.documents.length > 0) {
      const existingCode = existingCodes.documents[0];
      const expiresAt = new Date(existingCode.expiresAt);
      const now = new Date();

      if (expiresAt > now) {
        const remainingMinutes = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60));
        log('⏰ 驗證碼尚未過期，剩餘時間:', remainingMinutes, '分鐘');
        return res.json({
          success: false,
          message: `驗證碼已發送，請檢查您的信箱或等待 ${remainingMinutes} 分鐘後重新發送`
        }, 400);
      } else {
        // 刪除過期的驗證碼
        log('🗑️ 刪除過期驗證碼');
        await databases.deleteDocument(
          'verification_system',
          'verification_codes',
          existingCode.$id
        );
      }
    }

    // 生成新的驗證碼
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 分鐘後過期

    log('🔢 生成新驗證碼:', code.substring(0, 2) + '****');
    log('⏰ 過期時間:', expiresAt.toISOString());

    // 檢查 Resend API 金鑰
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      error('❌ RESEND_API_KEY 環境變數未設定');
      return res.json({
        success: false,
        message: '郵件服務配置錯誤'
      }, 500);
    }

    // 發送郵件
    const emailResult = await sendEmail(email, code, language, apiKey, log, error);
    
    if (!emailResult.success) {
      return res.json(emailResult, 500);
    }

    // 郵件發送成功，將驗證碼存儲到資料庫
    log('💾 將驗證碼存儲到資料庫');
    const documentData = {
      email: email,
      code: code,
      expiresAt: expiresAt.toISOString(),
      attempts: 0,
      isVerified: false,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null
    };
    
    log('📝 文檔數據:', documentData);
    
    await databases.createDocument(
      'verification_system',
      'verification_codes',
      ID.unique(),
      documentData
    );

    log('✅ 驗證碼已安全存儲到資料庫');
    return res.json({
      success: true,
      message: '驗證碼已發送到您的學生信箱，請檢查郵件（包括垃圾郵件資料夾）'
    });

  } catch (err) {
    error('💥 發送驗證碼異常:', err);
    return res.json({
      success: false,
      message: `發送失敗: ${err.message || '請稍後再試'}`
    }, 500);
  }
}

// 驗證驗證碼函數
async function verifyCode(databases, email, code, ipAddress, userAgent, log, error, res) {
  try {
    log('🔐 開始驗證碼驗證:', { email, code: code ? code.substring(0, 2) + '****' : 'undefined' });

    // 驗證參數
    if (!email || !code) {
      return res.json({
        success: false,
        message: '缺少必要參數'
      }, 400);
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      return res.json({
        success: false,
        message: '驗證碼必須是 6 位數字'
      }, 400);
    }

    // 查詢驗證碼記錄
    const verificationRecords = await databases.listDocuments(
      'verification_system',
      'verification_codes',
      [
        Query.equal('email', email),
        Query.orderDesc('$createdAt'),
        Query.limit(1)
      ]
    );

    if (verificationRecords.documents.length === 0) {
      log('❌ 找不到驗證碼記錄');
      return res.json({
        success: false,
        message: '請先發送驗證碼'
      }, 400);
    }

    const verificationRecord = verificationRecords.documents[0];
    log('📋 找到驗證碼記錄:', verificationRecord.$id);

    // 檢查是否已過期
    const now = new Date();
    const expiresAt = new Date(verificationRecord.expiresAt);
    
    if (expiresAt < now) {
      log('⏰ 驗證碼已過期');
      await databases.deleteDocument(
        'verification_system',
        'verification_codes',
        verificationRecord.$id
      );
      
      return res.json({
        success: false,
        message: '驗證碼已過期，請重新發送'
      }, 400);
    }

    // 檢查嘗試次數
    if (verificationRecord.attempts >= 3) {
      log('🚫 嘗試次數超過限制');
      await databases.deleteDocument(
        'verification_system',
        'verification_codes',
        verificationRecord.$id
      );
      
      return res.json({
        success: false,
        message: '驗證失敗次數過多，請重新發送驗證碼'
      }, 400);
    }

    // 檢查是否已驗證
    if (verificationRecord.isVerified) {
      log('✅ 驗證碼已經驗證過');
      return res.json({
        success: true,
        message: '郵件已驗證成功'
      });
    }

    // 驗證碼比對
    if (verificationRecord.code !== code) {
      log('❌ 驗證碼錯誤');
      
      // 增加嘗試次數
      const newAttempts = verificationRecord.attempts + 1;
      await databases.updateDocument(
        'verification_system',
        'verification_codes',
        verificationRecord.$id,
        {
          attempts: newAttempts,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null
        }
      );

      return res.json({
        success: false,
        message: `驗證碼錯誤，還有 ${3 - newAttempts} 次機會`
      }, 400);
    }

    // 驗證成功
    log('✅ 驗證碼驗證成功');
    await databases.updateDocument(
      'verification_system',
      'verification_codes',
      verificationRecord.$id,
      {
        isVerified: true,
        attempts: verificationRecord.attempts + 1,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null
      }
    );

    return res.json({
      success: true,
      message: '郵件驗證成功！現在可以設定密碼完成註冊'
    });

  } catch (err) {
    error('💥 驗證過程異常:', err);
    return res.json({
      success: false,
      message: `驗證失敗: ${err.message || '請稍後再試'}`
    }, 500);
  }
}

// 發送郵件函數
async function sendEmail(email, code, language, apiKey, log, error) {
  try {
    const resend = new Resend(apiKey);

    // 多語言翻譯
    const translations = {
      'en': {
        subject: '【LingUBible】Your Student Verification Code - Do Not Reply',
        title: 'Student Account Verification',
        greeting: 'Dear Student,',
        thankYou: 'Thank you for registering for a LingUBible student account. To ensure account security, please use the following verification code to complete the registration process:',
        importantReminder: 'Important Reminder:',
        expiry: 'This verification code will expire in 10 minutes',
        noShare: 'Do not share the verification code with others',
        ignoreEmail: 'If you did not request this verification code, please ignore this email',
        notice: 'Notice: Only Lingnan University students with @ln.edu.hk or @ln.hk email addresses can register for LingUBible.',
        support: 'If you have any questions, please contact our technical support team.',
        platform: 'LingUBible - Lingnan University Course & Lecturer Review Platform',
        license: 'Licensed under CC BY-SA',
        textGreeting: 'Dear Student,',
        textThankYou: 'Thank you for registering for a LingUBible student account. Please use the following verification code to complete registration:',
        textCode: 'Verification Code:',
        textReminder: 'Important Reminder:',
        textExpiry: '- This verification code will expire in 10 minutes',
        textNoShare: '- Do not share the verification code with others',
        textIgnore: '- If you did not request this verification code, please ignore this email',
        textNotice: 'Notice: Only Lingnan University students with @ln.edu.hk or @ln.hk email addresses can register.',
        textSupport: 'If you have any questions, please contact technical support.',
        textTeam: 'LingUBible Team'
      },
      'zh-TW': {
        subject: '【LingUBible】您的學生驗證碼 - 請勿回覆',
        title: '學生帳戶驗證',
        greeting: '親愛的同學，您好！',
        thankYou: '感謝您註冊 LingUBible 學生帳戶。為了確保帳戶安全，請使用以下驗證碼完成註冊程序：',
        importantReminder: '重要提醒：',
        expiry: '此驗證碼將在 10 分鐘後過期',
        noShare: '請勿將驗證碼分享給他人',
        ignoreEmail: '如果您沒有請求此驗證碼，請忽略此郵件',
        notice: '注意事項：只有使用 @ln.edu.hk 或 @ln.hk 郵件地址的嶺南大學學生才能註冊 LingUBible。',
        support: '如有任何問題，請聯繫我們的技術支援團隊。',
        platform: 'LingUBible - 嶺南大學課程與講師評價平台',
        license: '採用 CC BY-SA 授權',
        textGreeting: '親愛的同學，您好！',
        textThankYou: '感謝您註冊 LingUBible 學生帳戶。請使用以下驗證碼完成註冊：',
        textCode: '驗證碼：',
        textReminder: '重要提醒：',
        textExpiry: '- 此驗證碼將在 10 分鐘後過期',
        textNoShare: '- 請勿將驗證碼分享給他人',
        textIgnore: '- 如果您沒有請求此驗證碼，請忽略此郵件',
        textNotice: '注意：只有使用 @ln.edu.hk 或 @ln.hk 郵件地址的嶺南大學學生才能註冊。',
        textSupport: '如有問題，請聯繫技術支援。',
        textTeam: 'LingUBible 團隊'
      },
      'zh-CN': {
        subject: '【LingUBible】您的学生验证码 - 请勿回复',
        title: '学生账户验证',
        greeting: '亲爱的同学，您好！',
        thankYou: '感谢您注册 LingUBible 学生账户。为了确保账户安全，请使用以下验证码完成注册程序：',
        importantReminder: '重要提醒：',
        expiry: '此验证码将在 10 分钟后过期',
        noShare: '请勿将验证码分享给他人',
        ignoreEmail: '如果您没有请求此验证码，请忽略此邮件',
        notice: '注意事项：只有使用 @ln.edu.hk 或 @ln.hk 邮件地址的岭南大学学生才能注册 LingUBible。',
        support: '如有任何问题，请联系我们的技术支持团队。',
        platform: 'LingUBible - 岭南大学课程与讲师评价平台',
        license: '采用 CC BY-SA 授权',
        textGreeting: '亲爱的同学，您好！',
        textThankYou: '感谢您注册 LingUBible 学生账户。请使用以下验证码完成注册：',
        textCode: '验证码：',
        textReminder: '重要提醒：',
        textExpiry: '- 此验证码将在 10 分钟后过期',
        textNoShare: '- 请勿将验证码分享给他人',
        textIgnore: '- 如果您没有请求此验证码，请忽略此邮件',
        textNotice: '注意：只有使用 @ln.edu.hk 或 @ln.hk 邮件地址的岭南大学学生才能注册。',
        textSupport: '如有问题，请联系技术支持。',
        textTeam: 'LingUBible 团队'
      }
    };

    const t = translations[language] || translations['zh-TW'];

    // LingUBible SVG 標誌的 base64 編碼
    const logoSvgBase64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPCEtLSDlnJbop5LnuIXoibLohJnmma8gLS0+CiAgPHJlY3QgeD0iMzIiIHk9IjMyIiB3aWR0aD0iNDQ4IiBoZWlnaHQ9IjQ0OCIgcng9IjgwIiBmaWxsPSIjZGMyNjI2Ii8+CiAgCiAgPCEtLSDmm7jmnKzlnJbnpLsgKOeZveiJsikgLS0+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTI4LCAxNjApIj4KICAgIDwhLS0g5bem6aCBIC0tPgogICAgPHBhdGggZD0iTTAgMjQgQzAgMTIgMTIgMCAyNCAwIEwxMDQgMCBDMTE2IDAgMTI4IDEyIDEyOCAyNCBMMTI4IDE3NiBDMTI4IDE4OCAxMTYgMjAwIDEwNCAyMDAgTDI0IDIwMCBDMTIgMjAwIDAgMTg4IDAgMTc2IFoiIGZpbGw9IndoaXRlIi8+CiAgICA8IS0tIOWPs+mggSAtLT4KICAgIDxwYXRoIGQ9Ik0xMjggMjQgQzEyOCAxMiAxNDAgMCAxNTIgMCBMMjMyIDAgQzI0NCAwIDI1NiAxMiAyNTYgMjQgTDI1NiAxNzYgQzI1NiAxODggMjQ0IDIwMCAyMzIgMjAwIEwxNTIgMjAwIEMxNDAgMjAwIDEyOCAxODggMTI4IDE3NiBaIiBmaWxsPSJ3aGl0ZSIvPgogICAgPCEtLSDkuK3plpPoo5Xoqofoq5sgLS0+CiAgICA8bGluZSB4MT0iMTI4IiB5MT0iMjQiIHgyPSIxMjgiIHkyPSIyMDAiIHN0cm9rZT0iI2RjMjYyNiIgc3Ryb2tlLXdpZHRoPSI2Ii8+CiAgICA8IS0tIOabuOewiSAtLT4KICAgIDxwYXRoIGQ9Ik0xMTYgMjAwIEwxMTYgMjU2IEwxMjggMjQ0IEwxNDAgMjU2IEwxNDAgMjAwIiBmaWxsPSIjZGMyNjI2Ii8+CiAgPC9nPgo8L3N2Zz4=';

    // HTML 郵件模板
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="${language === 'en' ? 'en' : language === 'zh-CN' ? 'zh-CN' : 'zh-HK'}">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LingUBible ${t.title}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, 'Microsoft JhengHei', sans-serif; background-color: #f6f9fc; line-height: 1.6;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="padding: 20px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #eee;">
                    <a href="https://lingubible.com" style="text-decoration: none; color: inherit; display: inline-block;">
                      <div style="display: inline-flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 8px;">
                        <img src="${logoSvgBase64}" alt="LingUBible Logo" style="width: 48px; height: 48px; vertical-align: middle;" />
                        <h1 style="margin: 0; color: #dc2626; font-size: 28px; font-weight: bold; vertical-align: middle;">LingUBible</h1>
                      </div>
                    </a>
                    <p style="margin: 5px 0 0; color: #666; font-size: 14px;">${t.platform}</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 30px; color: #333; text-align: center; font-size: 24px;">${t.title}</h2>
                    
                    <p style="margin: 0 0 30px; color: #333; font-size: 16px;">
                      ${t.greeting}
                    </p>
                    
                    <p style="margin: 0 0 30px; color: #333; font-size: 16px;">
                      ${t.thankYou}
                    </p>
                    
                    <!-- Verification Code Box -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="text-align: center; padding: 30px 0;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto; background: #f8f9fa; border: 2px solid #dc2626; border-radius: 8px;">
                            <tr>
                              <td style="padding: 20px 40px; text-align: center;">
                                <div style="color: #dc2626; font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px;">
                                  ${code}
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 0 0 20px; color: #333; font-size: 16px;">
                      <strong>${t.importantReminder}</strong>
                    </p>
                    
                    <ul style="margin: 0 0 30px; color: #333; font-size: 16px; padding-left: 20px;">
                      <li>${t.expiry}</li>
                      <li>${t.noShare}</li>
                      <li>${t.ignoreEmail}</li>
                    </ul>
                    
                    <p style="margin: 0 0 30px; color: #333; font-size: 16px;">
                      <strong>${t.notice}</strong>
                    </p>
                    
                    <p style="margin: 0; color: #333; font-size: 16px;">
                      ${t.support}
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f8f9fa; border-top: 1px solid #eee; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0 0 10px; color: #8898aa; font-size: 12px;">
                      <a href="https://lingubible.com" style="color: #8898aa; text-decoration: none;">LingUBible</a> - ${t.platform.replace('LingUBible - ', '')}
                    </p>
                    <p style="margin: 0; color: #8898aa; font-size: 12px;">
                      ${t.license}
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // 純文字版本
    const emailText = `
${t.textGreeting}

${t.textThankYou}

${t.textCode} ${code}

${t.textReminder}
${t.textExpiry}
${t.textNoShare}
${t.textIgnore}

${t.textNotice}

${t.textSupport}

${t.textTeam}
    `;

    log('📬 準備發送郵件:', { to: email, subject: t.subject });

    const result = await resend.emails.send({
      from: 'LingUBible <noreply@lingubible.com>',
      to: [email],
      subject: t.subject,
      html: emailHtml,
      text: emailText,
      headers: {
        'X-Entity-Ref-ID': `lingubible-verification-${Date.now()}`,
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    });

    if (result.error) {
      error('❌ 發送郵件失敗:', result.error);
      return {
        success: false,
        message: `發送郵件失敗: ${result.error.message || '請稍後再試'}`
      };
    }

    if (!result.data) {
      error('❌ Resend API 回應異常');
      return {
        success: false,
        message: '郵件服務回應異常，請稍後再試'
      };
    }

    log('✅ 郵件發送成功:', result.data);
    return { success: true };

  } catch (err) {
    error('💥 郵件發送異常:', err);
    return {
      success: false,
      message: `郵件發送失敗: ${err.message || '請稍後再試'}`
    };
  }
}

// 創建帳戶並自動設置為已驗證
async function createVerifiedAccount(databases, users, email, password, name, ipAddress, userAgent, log, error, res) {
  try {
    log('🚀 開始創建已驗證的帳戶:', { email, name });

    // 驗證參數
    if (!email || !password || !name) {
      return res.json({
        success: false,
        message: '缺少必要參數'
      }, 400);
    }

    // 驗證學生郵件格式
    const validEmailPattern = /^[a-zA-Z0-9._%+-]+@(ln\.edu\.hk|ln\.hk)$/;
    if (!validEmailPattern.test(email.toLowerCase())) {
      log('❌ 郵件格式驗證失敗:', email);
      return res.json({
        success: false,
        message: '只有 @ln.edu.hk 或 @ln.hk 郵件地址的學生才能註冊'
      }, 400);
    }

    // 檢查郵件是否已通過驗證
    log('🔍 檢查郵件驗證狀態');
    const verificationRecords = await databases.listDocuments(
      'verification_system',
      'verification_codes',
      [
        Query.equal('email', email),
        Query.equal('isVerified', true),
        Query.orderDesc('$createdAt'),
        Query.limit(1)
      ]
    );

    if (verificationRecords.documents.length === 0) {
      log('❌ 郵件未通過驗證');
      return res.json({
        success: false,
        message: '請先驗證您的學生郵件地址'
      }, 400);
    }

    const verificationRecord = verificationRecords.documents[0];
    log('✅ 找到已驗證的郵件記錄:', verificationRecord.$id);

    // 檢查驗證記錄是否仍然有效（24小時內）
    const verifiedAt = new Date(verificationRecord.$updatedAt);
    const now = new Date();
    const hoursSinceVerification = (now.getTime() - verifiedAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceVerification > 24) {
      log('⏰ 驗證記錄已過期');
      return res.json({
        success: false,
        message: '郵件驗證已過期，請重新驗證'
      }, 400);
    }

    try {
      // 創建 Appwrite 帳戶
      log('👤 創建 Appwrite 帳戶');
      const newUser = await users.create(
        ID.unique(),
        email,
        undefined, // phone
        password,
        name
      );

      log('✅ 帳戶創建成功:', newUser.$id);

      // 自動設置帳戶為已驗證狀態
      log('🔐 設置帳戶為已驗證狀態');
      await users.updateEmailVerification(newUser.$id, true);

      log('✅ 帳戶已設置為已驗證狀態');

      // 清理驗證記錄
      log('🧹 清理驗證記錄');
      await databases.deleteDocument(
        'verification_system',
        'verification_codes',
        verificationRecord.$id
      );

      return res.json({
        success: true,
        message: '帳戶創建成功！您的學生郵件已自動驗證',
        userId: newUser.$id
      });

    } catch (createError) {
      error('❌ 創建帳戶失敗:', createError);
      
      // 處理常見錯誤
      if (createError.message && createError.message.includes('user with the same email already exists')) {
        return res.json({
          success: false,
          message: '此郵件地址已被註冊'
        }, 400);
      }

      return res.json({
        success: false,
        message: `創建帳戶失敗: ${createError.message || '請稍後再試'}`
      }, 500);
    }

  } catch (err) {
    error('💥 創建已驗證帳戶異常:', err);
    return res.json({
      success: false,
      message: `創建帳戶失敗: ${err.message || '請稍後再試'}`
    }, 500);
  }
} 