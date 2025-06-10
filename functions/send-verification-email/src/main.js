import { Resend } from 'resend';
import { Client, Databases, Query, ID, Users } from 'node-appwrite';
import { generateEmailTemplate } from './email-template.js';

// 開發模式配置
const DEV_MODE = {
  // 臨時硬編碼開發模式為 true，因為環境變數設置有問題
  enabled: false, // process.env.DEV_MODE === 'true',
  
  // 開發模式下允許的測試郵件域名（現在允許所有域名）
  allowedTestDomains: [
    // 常見郵件服務
    '@gmail.com',
    '@outlook.com', 
    '@hotmail.com',
    '@yahoo.com',
    '@test.com',
    '@example.com',
    // 一次性郵件服務
    '@10minutemail.com',
    '@guerrillamail.com',
    '@mailinator.com',
    '@tempmail.org',
    '@yopmail.com',
    '@maildrop.cc',
    '@throwaway.email',
    '@temp-mail.org',
    // 開發模式下實際上允許任何域名
    '*' // 通配符表示允許所有域名
  ]
};

// 檢查郵件是否為有效的學生郵件或開發模式下的測試郵件
const isValidEmailForRegistration = (email) => {
  const emailLower = email.toLowerCase();
  
  // 學生郵件格式檢查
  const validStudentEmailPattern = /^[a-zA-Z0-9._%+-]+@(ln\.edu\.hk|ln\.hk)$/;
  const isStudentEmail = validStudentEmailPattern.test(emailLower);
  
  // 如果是學生郵件，直接返回 true
  if (isStudentEmail) {
    return true;
  }
  
  // 如果開發模式未啟用，只允許學生郵件
  if (!DEV_MODE.enabled) {
    return false;
  }
  
  // 開發模式下，允許任何有效的郵件格式（包括一次性郵件）
  const generalEmailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return generalEmailPattern.test(emailLower);
};

// 檢查是否為學生郵件
const isStudentEmail = (email) => {
  const emailLower = email.toLowerCase();
  const validStudentEmailPattern = /^[a-zA-Z0-9._%+-]+@(ln\.edu\.hk|ln\.hk)$/;
  return validStudentEmailPattern.test(emailLower);
};

// 檢查是否為一次性郵件
const isDisposableEmail = (email) => {
  const emailLower = email.toLowerCase();
  const disposableDomains = [
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
    'tempmail.org',
    'yopmail.com',
    'maildrop.cc',
    'throwaway.email',
    'temp-mail.org',
    'sharklasers.com',
    'grr.la',
    'guerrillamailblock.com',
    'pokemail.net',
    'spam4.me',
    'bccto.me',
    'chacuo.net',
    'dispostable.com',
    'fakeinbox.com',
    'mailnesia.com',
    'mytrashmail.com',
    'sogetthis.com',
    'spamgourmet.com',
    'suremail.info',
    'trbvm.com',
    'vpn.st',
    'zetmail.com'
  ];
  
  return disposableDomains.some(domain => emailLower.endsWith(`@${domain}`));
};

// 驗證 reCAPTCHA token
const verifyRecaptcha = async (token, ipAddress, log, error) => {
  try {
    // 如果沒有提供 token，在開發模式下跳過驗證
    if (!token) {
      if (DEV_MODE.enabled) {
        log('🔧 開發模式：跳過 reCAPTCHA 驗證（無 token）');
        return { success: true, score: 1.0 };
      } else {
        return { success: false, error: '缺少 reCAPTCHA token' };
      }
    }

    // 如果沒有配置密鑰，在開發模式下跳過驗證
    if (!process.env.RECAPTCHA_SECRET_KEY) {
      if (DEV_MODE.enabled) {
        log('🔧 開發模式：跳過 reCAPTCHA 驗證（無密鑰配置）');
        return { success: true, score: 1.0 };
      } else {
        error('❌ reCAPTCHA 密鑰未配置');
        return { success: false, error: 'reCAPTCHA 服務配置錯誤' };
      }
    }

    log('🔐 開始驗證 reCAPTCHA token');

    // 調用 Google reCAPTCHA API
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token,
        remoteip: ipAddress || ''
      })
    });

    if (!response.ok) {
      error('❌ reCAPTCHA API 請求失敗:', response.status, response.statusText);
      return { success: false, error: 'reCAPTCHA 驗證服務暫時不可用' };
    }

    const result = await response.json();
    log('🔍 reCAPTCHA 驗證結果:', { 
      success: result.success, 
      score: result.score, 
      action: result.action,
      hostname: result.hostname 
    });

    if (!result.success) {
      log('❌ reCAPTCHA 驗證失敗:', result['error-codes']);
      return { 
        success: false, 
        error: 'reCAPTCHA 驗證失敗，請重試',
        errorCodes: result['error-codes']
      };
    }

    // 檢查分數（reCAPTCHA v3）
    if (result.score !== undefined) {
      const minScore = 0.5; // 最低接受分數
      if (result.score < minScore) {
        log(`⚠️ reCAPTCHA 分數過低: ${result.score} < ${minScore}`);
        return { 
          success: false, 
          error: '安全驗證未通過，請稍後重試',
          score: result.score
        };
      }
    }

    log('✅ reCAPTCHA 驗證成功');
    return { 
      success: true, 
      score: result.score,
      action: result.action,
      hostname: result.hostname
    };

  } catch (err) {
    error('💥 reCAPTCHA 驗證異常:', err);
    return { 
      success: false, 
      error: 'reCAPTCHA 驗證過程中發生錯誤' 
    };
  }
};

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
    const { action = 'send', email, code, password, name, username, language = 'zh-TW', ipAddress, userAgent, recaptchaToken } = requestData;
    
    log('🎯 Action 參數:', action);
    log('📧 解析參數:', { action, email, code: code ? code.substring(0, 2) + '****' : 'undefined', password: password ? '***' : 'undefined', name, username, language });

    if (action === 'verify') {
      // 驗證驗證碼
      return await verifyCode(databases, email, code, ipAddress, userAgent, log, error, res);
    } else if (action === 'createAccount') {
      // 創建帳戶並自動設置為已驗證
      return await createVerifiedAccount(databases, users, email, password, name, ipAddress, userAgent, recaptchaToken, log, error, res);

    } else if (action === 'sendPasswordReset') {
      // 發送密碼重設郵件
      return await sendPasswordReset(users, email, ipAddress, userAgent, recaptchaToken, log, error, res);
    } else if (action === 'checkUsername') {
      // 檢查用戶名是否已被使用
      return await checkUsernameAvailability(users, username, log, error, res);
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
    log('📧 開始發送驗證碼流程:', { email, language, devMode: DEV_MODE.enabled });

    // 驗證參數
    if (!email) {
      return res.json({
        success: false,
        message: '缺少郵件地址'
      }, 400);
    }

    // 使用新的開發模式郵件驗證
    if (!isValidEmailForRegistration(email)) {
      log('❌ 郵件格式驗證失敗:', email, '開發模式:', DEV_MODE.enabled);
      const errorMessages = {
        'en': DEV_MODE.enabled 
          ? 'Please enter a valid email address format'
          : 'Only @ln.hk or @ln.edu.hk email addresses can register',
        'zh-TW': DEV_MODE.enabled 
          ? '請輸入有效的郵件地址格式'
          : '只有 @ln.hk 或 @ln.edu.hk 郵件地址的嶺南人才能註冊',
        'zh-CN': DEV_MODE.enabled 
          ? '请输入有效的邮件地址格式'
          : '只有 @ln.hk 或 @ln.edu.hk 邮件地址的学生才能注册'
      };
      return res.json({
        success: false,
        message: errorMessages[language] || errorMessages['zh-TW']
      }, 400);
    }

    // 開發模式提示
    if (DEV_MODE.enabled && !isStudentEmail(email)) {
      if (isDisposableEmail(email)) {
        log('🔧 開發模式：允許一次性郵件地址', email);
      } else {
        log('🔧 開發模式：允許測試郵件地址', email);
      }
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
      message: '驗證碼已發送到您的嶺南人信箱，請檢查郵件（包括垃圾郵件資料夾）'
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

    // 使用新的郵件模板生成器
    log('🎨 使用改進的郵件模板生成器');
    const emailTemplate = generateEmailTemplate(code, language);

    log('📬 準備發送郵件:', { to: email, subject: emailTemplate.subject });

    const result = await resend.emails.send({
      from: 'LingUBible <noreply@lingubible.com>',
      to: [email],
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
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
async function createVerifiedAccount(databases, users, email, password, name, ipAddress, userAgent, recaptchaToken, log, error, res) {
  try {
    log('🚀 開始創建已驗證的帳戶:', { email, name, devMode: DEV_MODE.enabled });

    // 驗證參數
    if (!email || !password || !name) {
      return res.json({
        success: false,
        message: '缺少必要參數'
      }, 400);
    }

    // 使用新的開發模式郵件驗證
    if (!isValidEmailForRegistration(email)) {
      log('❌ 郵件格式驗證失敗:', email, '開發模式:', DEV_MODE.enabled);
      return res.json({
        success: false,
        message: DEV_MODE.enabled 
          ? '請輸入有效的郵件地址格式'
          : '只有 @ln.hk 或 @ln.edu.hk 郵件地址的嶺南人才能註冊'
      }, 400);
    }

    // 開發模式提示
    if (DEV_MODE.enabled && !isStudentEmail(email)) {
      if (isDisposableEmail(email)) {
        log('🔧 開發模式：允許一次性郵件地址', email);
      } else {
        log('🔧 開發模式：允許測試郵件地址', email);
      }
    }

    // 驗證 reCAPTCHA（如果提供了 token）
    if (recaptchaToken || !DEV_MODE.enabled) {
      const recaptchaResult = await verifyRecaptcha(recaptchaToken, ipAddress, log, error);
      if (!recaptchaResult.success) {
        log('❌ reCAPTCHA 驗證失敗:', recaptchaResult.error);
        return res.json({
          success: false,
          message: recaptchaResult.error || 'reCAPTCHA 驗證失敗'
        }, 400);
      }
      log('✅ reCAPTCHA 驗證通過，分數:', recaptchaResult.score);
    }

    // 檢查郵件是否已通過驗證
    log('🔍 檢查郵件驗證狀態');
    
    let verificationRecord = null;
    
    // 開發模式下跳過驗證檢查
    if (DEV_MODE.enabled) {
      log('🔧 開發模式：跳過郵件驗證檢查');
    } else {
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
          message: '請先驗證您的嶺南人郵件地址'
        }, 400);
      }

      verificationRecord = verificationRecords.documents[0];
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
    }

    try {
      // 創建 Appwrite 帳戶
      log('🚀 創建 Appwrite 帳戶');
      
      // 在開發模式下，如果密碼不符合 Appwrite 要求，使用預設密碼
      let actualPassword = password;
      if (DEV_MODE.enabled) {
        // 檢查密碼是否符合 Appwrite 要求（8-265 字符，不是常見密碼）
        if (password.length < 8 || ['123', '1234', '12345', '123456', '1234567', 'password', 'admin', 'test', 'a', 'aa', 'aaa'].includes(password.toLowerCase())) {
          actualPassword = 'DevMode123!@#'; // 符合 Appwrite 要求的預設密碼
          log('🔧 開發模式：使用預設密碼創建帳戶，原密碼:', password.substring(0, 2) + '***');
        }
      }
      
      const newUser = await users.create(
        ID.unique(),
        email,
        undefined, // phone
        actualPassword,
        name
      );

      log('✅ 帳戶創建成功:', newUser.$id);

      // 自動設置帳戶為已驗證狀態
      log('🔐 設置帳戶為已驗證狀態');
      await users.updateEmailVerification(newUser.$id, true);

      log('✅ 帳戶已設置為已驗證狀態');

      // 清理驗證記錄（僅在非開發模式下）
      if (!DEV_MODE.enabled && verificationRecord) {
        log('🧹 清理驗證記錄');
        await databases.deleteDocument(
          'verification_system',
          'verification_codes',
          verificationRecord.$id
        );
      } else if (DEV_MODE.enabled) {
        log('🔧 開發模式：跳過清理驗證記錄');
      }

      return res.json({
        success: true,
        message: DEV_MODE.enabled 
          ? '帳戶創建成功！開發模式已自動驗證郵件'
          : '帳戶創建成功！您的嶺南人郵件已自動驗證',
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

// 管理員相關的禁用詞彙
const adminRelatedWords = [
  // 基本管理員詞彙
  'admin', 'administrator', 'administrators', 'admins',
  'root', 'system', 'sysadmin', 'systemadmin',
  'moderator', 'moderators', 'mod', 'mods',
  'staff', 'staffs', 'official', 'officials',
  'manager', 'managers', 'supervisor', 'supervisors',
  'owner', 'owners', 'master', 'masters',
  // 服務相關
  'service', 'services', 'support', 'supports',
  'help', 'helper', 'helpers', 'bot', 'bots',
  'api', 'apis', 'server', 'servers',
  // 測試相關
  'test', 'tests', 'testing', 'tester', 'testers',
  'demo', 'demos', 'sample', 'samples',
  'guest', 'guests', 'user', 'users',
  'null', 'undefined', 'none', 'empty',
  // 品牌相關
  'lingubible', 'ln', 'hk', 'lingnan',
  // 常見變體
  'webmaster', 'postmaster', 'hostmaster'
];

// 檢查用戶名是否包含管理員相關詞彙
function containsAdminWords(username) {
  const lowerUsername = username.toLowerCase();
  
  // 檢查是否完全匹配管理員詞彙
  if (adminRelatedWords.some(word => lowerUsername === word.toLowerCase())) {
    return true;
  }
  
  // 檢查是否包含管理員詞彙（作為子字符串）
  const strictAdminWords = [
    'admin', 'administrator', 'root', 'system', 'moderator', 'mod',
    'staff', 'official', 'manager', 'supervisor', 'owner', 'master',
    'support', 'service', 'bot', 'api', 'lingubible'
  ];
  
  return strictAdminWords.some(word => lowerUsername.includes(word.toLowerCase()));
}

// 檢查用戶名是否已被使用
async function checkUsernameAvailability(users, username, log, error, res) {
  try {
    log('🔍 開始檢查用戶名可用性:', { username });

    // 驗證參數
    if (!username || typeof username !== 'string') {
      return res.json({
        available: false,
        message: 'Invalid username parameter',
        messageKey: 'username.invalidParameter'
      }, 400);
    }

    const trimmedUsername = username.trim();
    
    // 檢查用戶名長度
    if (trimmedUsername.length < 2 || trimmedUsername.length > 10) {
      return res.json({
        available: false,
        message: 'Username length must be between 2-10 characters',
        messageKey: 'username.lengthError'
      }, 400);
    }

    // 檢查是否包含管理員相關詞彙
    if (containsAdminWords(trimmedUsername)) {
      log('❌ 用戶名包含管理員詞彙:', trimmedUsername);
              return res.json({
          available: false,
          message: 'This username is reserved by the system, please choose another one',
          messageKey: 'username.systemReserved'
        });
    }

    try {
      // 查找是否有用戶使用相同的用戶名
      // 注意：我們需要查找 name 字段，而不是 email
      const usersList = await users.list([
        Query.equal('name', trimmedUsername),
        Query.limit(1)
      ]);

      log('📋 查找結果:', {
        username: trimmedUsername,
        foundUsers: usersList.users.length,
        users: usersList.users.map(u => ({ id: u.$id, name: u.name, email: u.email }))
      });

      if (usersList.users.length > 0) {
        // 找到相同用戶名的用戶
        log('❌ 用戶名已被使用:', trimmedUsername);
        return res.json({
          available: false,
          message: 'This username is already taken, please choose another one',
          messageKey: 'username.alreadyTaken'
        });
      } else {
        // 用戶名可用
        log('✅ 用戶名可用:', trimmedUsername);
        return res.json({
          available: true,
          message: 'Username is available',
          messageKey: 'username.available'
        });
      }

    } catch (queryError) {
      error('❌ 查詢用戶名失敗:', queryError);
      
      // 處理常見錯誤
      if (queryError.message && queryError.message.includes('Invalid query')) {
        return res.json({
          available: false,
          message: 'Invalid query parameter',
          messageKey: 'username.invalidQuery'
        }, 400);
      }

      return res.json({
        available: false,
        message: `Error checking username: ${queryError.message || 'Please try again later'}`,
        messageKey: 'username.checkError'
      }, 500);
    }

  } catch (err) {
    error('💥 檢查用戶名異常:', err);
    return res.json({
      available: false,
      message: `Username check failed: ${err.message || 'Please try again later'}`,
      messageKey: 'username.checkError'
    }, 500);
  }
}

// 發送密碼重設郵件
async function sendPasswordReset(users, email, ipAddress, userAgent, recaptchaToken, log, error, res) {
  try {
    log('🚀 開始發送密碼重設郵件:', { email });

    // 驗證參數
    if (!email) {
      return res.json({
        success: false,
        message: '缺少郵件地址'
      }, 400);
    }

    // 驗證郵件格式
    if (!isValidEmailForRegistration(email)) {
      log('❌ 郵件格式驗證失敗:', email);
      return res.json({
        success: false,
        message: '請使用有效的嶺南人郵件地址（@ln.hk 或 @ln.edu.hk）'
      }, 400);
    }

    // 驗證 reCAPTCHA（如果提供了 token）
    if (recaptchaToken || !DEV_MODE.enabled) {
      const recaptchaResult = await verifyRecaptcha(recaptchaToken, ipAddress, log, error);
      if (!recaptchaResult.success) {
        log('❌ reCAPTCHA 驗證失敗:', recaptchaResult.error);
        return res.json({
          success: false,
          message: recaptchaResult.error || 'reCAPTCHA 驗證失敗'
        }, 400);
      }
      log('✅ reCAPTCHA 驗證通過，分數:', recaptchaResult.score);
    }

    try {
      // 檢查用戶是否存在
      log('🔍 檢查用戶是否存在');
      const usersList = await users.list([
        Query.equal('email', email),
        Query.limit(1)
      ]);

      // 為了保護隱私，無論用戶是否存在都返回成功訊息
      // 但只有當用戶存在時才真正發送郵件
      if (usersList.users.length > 0) {
        const user = usersList.users[0];
        log('✅ 找到用戶:', user.$id);

        // 使用 Appwrite 內建的密碼重設功能
        log('📧 發送密碼重設郵件');
        const { Client, Account } = await import('node-appwrite');
        
        const tempClient = new Client()
          .setEndpoint('https://fra.cloud.appwrite.io/v1')
          .setProject('lingubible');
        
        const tempAccount = new Account(tempClient);
        
        // 發送密碼重設郵件
        await tempAccount.createRecovery(
          email,
          'https://lingubible.com/reset-password' // 重設密碼頁面的 URL
        );

        log('✅ 密碼重設郵件已發送');
      } else {
        log('⚠️ 用戶不存在，但為了保護隱私仍返回成功訊息');
      }

      // 無論用戶是否存在，都返回成功訊息以保護隱私
      return res.json({
        success: true,
        message: '如果該郵件地址已註冊，我們已向您發送密碼重設連結。請檢查您的郵箱（包括垃圾郵件資料夾）。'
      });

    } catch (resetError) {
      error('❌ 發送密碼重設郵件失敗:', resetError);
      
      // 處理常見錯誤
      if (resetError.message && resetError.message.includes('Rate limit')) {
        return res.json({
          success: false,
          message: '請求過於頻繁，請稍後再試'
        }, 429);
      }

      // 為了保護隱私，即使發生錯誤也返回成功訊息
      return res.json({
        success: true,
        message: '如果該郵件地址已註冊，我們已向您發送密碼重設連結。請檢查您的郵箱（包括垃圾郵件資料夾）。'
      });
    }

  } catch (err) {
    error('💥 發送密碼重設郵件異常:', err);
    
    // 為了保護隱私，即使發生異常也返回成功訊息
    return res.json({
      success: true,
      message: '如果該郵件地址已註冊，我們已向您發送密碼重設連結。請檢查您的郵箱（包括垃圾郵件資料夾）。'
    });
  }
} 