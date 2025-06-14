import { Resend } from 'resend';
import { Query, ID } from 'node-appwrite';
import { generateEmailTemplate } from './email-template.js';
import { generatePasswordResetEmailTemplate } from './password-reset-template.js';
import { generateContactFormEmailTemplate } from './contact-form-template.js';
import { verifyRecaptcha } from './recaptcha.js';
import { 
  DEV_MODE, 
  isValidEmailForRegistration, 
  isStudentEmail, 
  isDisposableEmail,
  containsAdminWords,
  generateSecureToken
} from './config.js';

// 發送驗證碼函數
export async function sendVerificationCode(requestData, context) {
  const { databases, log, error, res } = context;
  const { email, language, theme, ipAddress, userAgent } = requestData;

  try {
    log('📧 開始發送驗證碼流程:', { email, language, theme, devMode: DEV_MODE.enabled });

    // 驗證參數
    if (!email) {
      return res.json({
        success: false,
        message: 'Email address is required',
        messageKey: 'error.emailRequired'
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
          message: `Verification code already sent. Please check your inbox or wait ${remainingMinutes} minutes before resending`,
          messageKey: 'verification.codeAlreadySent',
          remainingMinutes
        }, 400);
      } else {
        // 刪除過期的驗證碼
        log('🗑️ 刪除過期的驗證碼');
        await databases.deleteDocument('verification_system', 'verification_codes', existingCode.$id);
      }
    }

    // 生成6位數驗證碼
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    log('🔢 生成驗證碼:', code.substring(0, 2) + '****');

    // 設置過期時間（15分鐘）
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // 儲存驗證碼到資料庫
    log('💾 儲存驗證碼到資料庫');
    const verificationDoc = await databases.createDocument(
      'verification_system',
      'verification_codes',
      ID.unique(),
      {
        email: email,
        code: code,
        expiresAt: expiresAt.toISOString(),
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
        attempts: 0,
        isVerified: false
      }
    );

    log('✅ 驗證碼已儲存，文檔 ID:', verificationDoc.$id);

    // 發送郵件
    const emailResult = await sendEmail(email, code, language, theme, process.env.RESEND_API_KEY, log, error);
    
    if (!emailResult.success) {
      // 如果郵件發送失敗，刪除已創建的驗證碼記錄
      await databases.deleteDocument('verification_system', 'verification_codes', verificationDoc.$id);
      return res.json({
        success: false,
        message: emailResult.message || 'Failed to send verification email',
        messageKey: 'error.emailServiceConfig'
      }, 500);
    }

    log('🎉 驗證碼發送成功');
    return res.json({
      success: true,
      message: 'Verification code sent successfully',
      messageKey: 'verification.codeSent'
    });

  } catch (err) {
    error('💥 發送驗證碼異常:', err);
    return res.json({
      success: false,
      message: `Service error: ${err.message || 'Please try again later'}`,
      messageKey: 'error.serviceError'
    }, 500);
  }
}

// 驗證驗證碼函數
export async function verifyCode(requestData, context) {
  const { databases, log, error, res } = context;
  const { email, code, ipAddress, userAgent } = requestData;

  try {
    log('🔍 開始驗證驗證碼:', { email, code: code ? code.substring(0, 2) + '****' : 'undefined' });

    // 驗證參數
    if (!email || !code) {
      return res.json({
        success: false,
        message: 'Email and verification code are required',
        messageKey: 'error.missingParameters'
      }, 400);
    }

    // 查找驗證碼記錄
    const verificationCodes = await databases.listDocuments(
      'verification_system',
      'verification_codes',
      [
        Query.equal('email', email),
        Query.equal('isVerified', false),
        Query.orderDesc('$createdAt'),
        Query.limit(1)
      ]
    );

    if (verificationCodes.documents.length === 0) {
      log('❌ 找不到驗證碼記錄');
      return res.json({
        success: false,
        message: 'No verification code found for this email',
        messageKey: 'verification.codeNotFound'
      }, 400);
    }

    const verificationDoc = verificationCodes.documents[0];
    const expiresAt = new Date(verificationDoc.expiresAt);
    const now = new Date();

    // 檢查是否過期
    if (expiresAt <= now) {
      log('⏰ 驗證碼已過期');
      await databases.deleteDocument('verification_system', 'verification_codes', verificationDoc.$id);
      return res.json({
        success: false,
        message: 'Verification code has expired',
        messageKey: 'verification.codeExpired'
      }, 400);
    }

    // 檢查嘗試次數
    if (verificationDoc.attempts >= 5) {
      log('🚫 驗證嘗試次數過多');
      await databases.deleteDocument('verification_system', 'verification_codes', verificationDoc.$id);
      return res.json({
        success: false,
        message: 'Too many verification attempts',
        messageKey: 'verification.tooManyAttempts'
      }, 400);
    }

    // 驗證碼比對
    if (verificationDoc.code !== code) {
      log('❌ 驗證碼不正確');
      // 增加嘗試次數
      await databases.updateDocument(
        'verification_system',
        'verification_codes',
        verificationDoc.$id,
        {
          attempts: verificationDoc.attempts + 1
        }
      );
      
      const remainingAttempts = 5 - (verificationDoc.attempts + 1);
      return res.json({
        success: false,
        message: `Invalid verification code. ${remainingAttempts} attempts remaining`,
        messageKey: 'verification.invalidCode',
        remainingAttempts
      }, 400);
    }

    // 驗證成功，標記為已驗證
    log('✅ 驗證碼驗證成功');
    await databases.updateDocument(
      'verification_system',
      'verification_codes',
      verificationDoc.$id,
      {
        isVerified: true
      }
    );

    return res.json({
      success: true,
      message: 'Email verification successful',
      messageKey: 'verification.success'
    });

  } catch (err) {
    error('💥 驗證驗證碼異常:', err);
    return res.json({
      success: false,
      message: `Service error: ${err.message || 'Please try again later'}`,
      messageKey: 'error.serviceError'
    }, 500);
  }
}

// 發送郵件函數
async function sendEmail(email, code, language, theme, apiKey, log, error) {
  try {
    log('📤 開始發送郵件:', { email, language, theme });

    if (!apiKey) {
      error('❌ Resend API 金鑰未配置');
      return {
        success: false,
        message: 'Email service configuration error'
      };
    }

    const resend = new Resend(apiKey);
    const template = generateEmailTemplate(code, language, theme);

    log('📧 發送郵件請求');
    const { data, error: resendError } = await resend.emails.send({
      from: 'LingUBible <noreply@lingubible.com>',
      to: [email],
      subject: template.subject,
      html: template.html,
    });

    if (resendError) {
      error('❌ Resend 郵件發送失敗:', resendError);
      return {
        success: false,
        message: 'Failed to send verification email'
      };
    }

    log('✅ 郵件發送成功，ID:', data?.id);
    return {
      success: true,
      emailId: data?.id
    };

  } catch (err) {
    error('💥 發送郵件異常:', err);
    return {
      success: false,
      message: 'Email sending error'
    };
  }
}

// 創建已驗證帳戶函數
export async function createVerifiedAccount(requestData, context) {
  const { databases, users, log, error, res } = context;
  const { email, password, name, ipAddress, userAgent, recaptchaToken } = requestData;

  try {
    log('👤 開始創建已驗證帳戶:', { email, name });

    // 驗證參數
    if (!email || !password || !name) {
      return res.json({
        success: false,
        message: 'Email, password, and name are required',
        messageKey: 'error.missingParameters'
      }, 400);
    }

    // 驗證 reCAPTCHA
    const recaptchaResult = await verifyRecaptcha(recaptchaToken, ipAddress, log, error);
    if (!recaptchaResult.success) {
      log('❌ reCAPTCHA 驗證失敗:', recaptchaResult.error);
      return res.json({
        success: false,
        message: recaptchaResult.error || 'reCAPTCHA verification failed',
        messageKey: 'error.recaptchaFailed'
      }, 400);
    }

    // 檢查郵件是否已驗證
    const verificationCodes = await databases.listDocuments(
      'verification_system',
      'verification_codes',
      [
        Query.equal('email', email),
        Query.equal('isVerified', true),
        Query.orderDesc('$createdAt'),
        Query.limit(1)
      ]
    );

    if (verificationCodes.documents.length === 0) {
      log('❌ 郵件未驗證');
      return res.json({
        success: false,
        message: 'Email not verified',
        messageKey: 'verification.emailNotVerified'
      }, 400);
    }

    const verificationDoc = verificationCodes.documents[0];
    const createdAt = new Date(verificationDoc.$createdAt);
    const now = new Date();
    const timeDiff = now.getTime() - createdAt.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    // 檢查驗證是否在24小時內（使用創建時間作為參考）
    if (hoursDiff > 24) {
      log('⏰ 郵件驗證已過期（超過24小時）');
      return res.json({
        success: false,
        message: 'Email verification has expired',
        messageKey: 'verification.verificationExpired'
      }, 400);
    }

    try {
      // 創建用戶帳戶
      log('🔨 創建用戶帳戶');
      const user = await users.create(
        ID.unique(),
        email,
        password,
        name
      );

      log('✅ 用戶帳戶創建成功，ID:', user.$id);

      // 標記用戶為已驗證
      await users.updateEmailVerification(user.$id, true);
      log('✅ 用戶郵件驗證狀態已更新');

      // 刪除驗證碼記錄（清理）
      await databases.deleteDocument('verification_system', 'verification_codes', verificationDoc.$id);
      log('🗑️ 驗證碼記錄已清理');

      return res.json({
        success: true,
        message: 'Account created successfully',
        messageKey: 'account.createSuccess',
        userId: user.$id
      });

    } catch (createError) {
      error('❌ 創建用戶失敗:', createError);
      
      // 檢查是否是重複郵件錯誤
      if (createError.code === 409 || createError.message?.includes('already exists')) {
        return res.json({
          success: false,
          message: 'An account with this email already exists',
          messageKey: 'account.emailExists'
        }, 409);
      }

      return res.json({
        success: false,
        message: `Account creation failed: ${createError.message || 'Please try again later'}`,
        messageKey: 'account.createFailed'
      }, 500);
    }

  } catch (err) {
    error('💥 創建帳戶異常:', err);
    return res.json({
      success: false,
      message: `Service error: ${err.message || 'Please try again later'}`,
      messageKey: 'error.serviceError'
    }, 500);
  }
}

// 檢查用戶名可用性函數
export async function checkUsernameAvailability(requestData, context) {
  const { users, log, error, res } = context;
  const { username } = requestData;

  try {
    log('🔍 檢查用戶名可用性:', username);

    // 驗證參數
    if (!username) {
      return res.json({
        success: false,
        message: 'Username parameter is required',
        messageKey: 'username.invalidParameter'
      }, 400);
    }

    // 檢查用戶名長度
    if (username.length < 3 || username.length > 20) {
      return res.json({
        success: false,
        available: false,
        message: 'Username must be between 3 and 20 characters',
        messageKey: 'username.lengthError'
      });
    }

    // 檢查是否包含管理員相關詞彙
    if (containsAdminWords(username)) {
      log('❌ 用戶名包含管理員相關詞彙:', username);
      return res.json({
        success: false,
        available: false,
        message: 'This username is reserved by the system',
        messageKey: 'username.systemReserved'
      });
    }

    try {
      // 嘗試查詢用戶名是否已存在
      const existingUsers = await users.list([
        Query.equal('name', username)
      ]);

      if (existingUsers.users.length > 0) {
        log('❌ 用戶名已被使用:', username);
        return res.json({
          success: false,
          available: false,
          message: 'This username is already taken',
          messageKey: 'username.alreadyTaken'
        });
      }

      log('✅ 用戶名可用:', username);
      return res.json({
        success: true,
        available: true,
        message: 'Username is available',
        messageKey: 'username.available'
      });

    } catch (queryError) {
      error('❌ 查詢用戶名失敗:', queryError);
      
      // 如果是查詢錯誤，可能是因為查詢格式問題
      if (queryError.code === 400) {
        return res.json({
          success: false,
          available: false,
          message: 'Invalid username format',
          messageKey: 'username.invalidQuery'
        }, 400);
      }

      return res.json({
        success: false,
        message: 'Unable to check username availability',
        messageKey: 'username.checkError'
      }, 500);
    }

  } catch (err) {
    error('💥 檢查用戶名異常:', err);
    return res.json({
      success: false,
      message: `Service error: ${err.message || 'Please try again later'}`,
      messageKey: 'error.serviceError'
    }, 500);
  }
}

// 發送密碼重設函數
export async function sendPasswordReset(requestData, context) {
  const { client, users, databases, log, error, res } = context;
  const { email, ipAddress, userAgent, recaptchaToken, language = 'zh-TW', theme = 'light' } = requestData;

  try {
    log('🔐 開始密碼重設流程:', { email, language, theme });

    // 驗證參數
    if (!email) {
      return res.json({
        success: false,
        message: 'Email address is required',
        messageKey: 'error.emailRequired'
      }, 400);
    }

    // 驗證 reCAPTCHA
    const recaptchaResult = await verifyRecaptcha(recaptchaToken, ipAddress, log, error);
    if (!recaptchaResult.success) {
      log('❌ reCAPTCHA 驗證失敗:', recaptchaResult.error);
      return res.json({
        success: false,
        message: recaptchaResult.error || 'reCAPTCHA verification failed',
        messageKey: 'error.recaptchaFailed'
      }, 400);
    }

    // 檢查用戶是否存在
    try {
      const userList = await users.list([
        Query.equal('email', email)
      ]);

      if (userList.users.length === 0) {
        log('❌ 用戶不存在:', email);
        // 為了安全起見，不透露用戶是否存在，返回成功訊息
        return res.json({
          success: true,
          message: 'If an account with this email exists, a password reset link has been sent',
          messageKey: 'password.resetSent'
        });
      }

      const user = userList.users[0];
      log('✅ 找到用戶:', user.$id);

      // 檢查速率限制
      const rateLimitResult = await checkPasswordResetRateLimit(databases, email, ipAddress, log, error);
      if (!rateLimitResult.allowed) {
        return res.json({
          success: false,
          message: rateLimitResult.message,
          messageKey: 'password.rateLimitExceeded',
          remainingMinutes: rateLimitResult.remainingMinutes
        }, 429);
      }

      // 清理過期的重設記錄
      await cleanupExpiredResets(databases, log, error);

      // 生成重設令牌
      const resetToken = generateSecureToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1小時後過期

      // 儲存重設記錄
      const resetDoc = await databases.createDocument(
        'verification_system',
        'password_resets',
        ID.unique(),
        {
          userId: user.$id,
          email: email,
          token: resetToken,
          expiresAt: expiresAt.toISOString(),
          ipAddress: ipAddress || 'unknown',
          userAgent: userAgent || 'unknown',
          used: false
        }
      );

      log('✅ 密碼重設記錄已創建:', resetDoc.$id);

      // 發送重設郵件
      const emailResult = await sendPasswordResetEmail(email, user.$id, resetToken, user.name || user.email.split('@')[0], language, theme, log, error);
      
      if (!emailResult.success) {
        // 如果郵件發送失敗，刪除重設記錄
        await databases.deleteDocument('verification_system', 'password_resets', resetDoc.$id);
        return res.json({
          success: false,
          message: 'Failed to send password reset email',
          messageKey: 'error.emailServiceConfig'
        }, 500);
      }

      return res.json({
        success: true,
        message: 'Password reset email sent successfully',
        messageKey: 'password.resetSent'
      });

    } catch (userError) {
      error('❌ 查詢用戶失敗:', userError);
      // 為了安全起見，不透露具體錯誤
      return res.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent',
        messageKey: 'password.resetSent'
      });
    }

  } catch (err) {
    error('💥 密碼重設異常:', err);
    return res.json({
      success: false,
      message: `Service error: ${err.message || 'Please try again later'}`,
      messageKey: 'error.serviceError'
    }, 500);
  }
}

// 完成密碼重設函數
export async function completePasswordReset(requestData, context) {
  const { databases, users, log, error, res } = context;
  const { userId, token, password, ipAddress } = requestData;

  try {
    log('🔐 開始完成密碼重設:', { userId, token: token ? token.substring(0, 8) + '****' : 'undefined' });

    // 驗證參數
    if (!userId || !token || !password) {
      return res.json({
        success: false,
        message: 'User ID, token, and new password are required',
        messageKey: 'error.missingParameters'
      }, 400);
    }

    // 驗證密碼強度
    if (password.length < 8) {
      return res.json({
        success: false,
        message: 'Password must be at least 8 characters long',
        messageKey: 'password.tooShort'
      }, 400);
    }

    // 查找重設記錄
    const resetRecords = await databases.listDocuments(
      'verification_system',
      'password_resets',
      [
        Query.equal('userId', userId),
        Query.equal('token', token),
        Query.equal('used', false),
        Query.orderDesc('$createdAt'),
        Query.limit(1)
      ]
    );

    if (resetRecords.documents.length === 0) {
      log('❌ 找不到有效的重設記錄');
      return res.json({
        success: false,
        message: 'Invalid or expired reset token',
        messageKey: 'password.invalidToken'
      }, 400);
    }

    const resetDoc = resetRecords.documents[0];
    const expiresAt = new Date(resetDoc.expiresAt);
    const now = new Date();

    // 檢查是否過期
    if (expiresAt <= now) {
      log('⏰ 重設令牌已過期');
      await databases.deleteDocument('verification_system', 'password_resets', resetDoc.$id);
      return res.json({
        success: false,
        message: 'Reset token has expired',
        messageKey: 'password.tokenExpired'
      }, 400);
    }

    try {
      // 更新用戶密碼
      log('🔄 更新用戶密碼');
      await users.updatePassword(userId, password);
      log('✅ 密碼更新成功');

      // 標記重設記錄為已使用
      await databases.updateDocument(
        'verification_system',
        'password_resets',
        resetDoc.$id,
        {
          used: true,
          usedAt: now.toISOString(),
          usedIp: ipAddress || 'unknown'
        }
      );

      log('✅ 重設記錄已標記為已使用');

      return res.json({
        success: true,
        message: 'Password reset successfully',
        messageKey: 'password.resetSuccess'
      });

    } catch (updateError) {
      error('❌ 更新密碼失敗:', updateError);
      return res.json({
        success: false,
        message: 'Failed to update password',
        messageKey: 'password.updateFailed'
      }, 500);
    }

  } catch (err) {
    error('💥 完成密碼重設異常:', err);
    return res.json({
      success: false,
      message: `Service error: ${err.message || 'Please try again later'}`,
      messageKey: 'error.serviceError'
    }, 500);
  }
}

// 驗證密碼重設 token 函數
export async function validatePasswordResetToken(requestData, context) {
  const { databases, log, error, res } = context;
  const { userId, token } = requestData;

  try {
    log('🔍 開始驗證密碼重設 token:', { userId, token: token ? token.substring(0, 8) + '****' : 'undefined' });

    // 驗證參數
    if (!userId || !token) {
      return res.json({
        success: false,
        message: 'User ID and token are required',
        messageKey: 'error.missingParameters'
      }, 400);
    }

    // 查找重設記錄
    const resetRecords = await databases.listDocuments(
      'verification_system',
      'password_resets',
      [
        Query.equal('userId', userId),
        Query.equal('token', token),
        Query.orderDesc('$createdAt'),
        Query.limit(1)
      ]
    );

    if (resetRecords.documents.length === 0) {
      log('❌ 找不到重設記錄');
      return res.json({
        success: false,
        message: 'Invalid reset token',
        messageKey: 'password.invalidToken'
      }, 400);
    }

    const resetDoc = resetRecords.documents[0];
    const expiresAt = new Date(resetDoc.expiresAt);
    const now = new Date();

    // 檢查是否已被使用
    if (resetDoc.used) {
      log('❌ 重設連結已被使用');
      return res.json({
        success: false,
        message: 'This reset link has already been used',
        messageKey: 'password.linkAlreadyUsed'
      }, 400);
    }

    // 檢查是否過期
    if (expiresAt <= now) {
      log('⏰ 重設令牌已過期');
      // 刪除過期的記錄
      await databases.deleteDocument('verification_system', 'password_resets', resetDoc.$id);
      return res.json({
        success: false,
        message: 'Reset token has expired',
        messageKey: 'password.tokenExpired'
      }, 400);
    }

    log('✅ 重設 token 驗證成功');
    return res.json({
      success: true,
      message: 'Reset token is valid',
      messageKey: 'password.tokenValid'
    });

  } catch (err) {
    error('💥 驗證密碼重設 token 異常:', err);
    return res.json({
      success: false,
      message: `Service error: ${err.message || 'Please try again later'}`,
      messageKey: 'error.serviceError'
    }, 500);
  }
}

// 發送聯絡表單郵件函數
export async function sendContactFormEmail(requestData, context) {
  const { log, error, res } = context;
  const { name, email, type, message, language = 'zh-TW', theme = 'light', recaptchaToken, ipAddress } = requestData;

  try {
    log('📧 開始發送聯絡表單郵件:', { name, email, type, language, theme });

    // 驗證參數
    if (!name || !email || !type || !message) {
      return res.json({
        success: false,
        message: 'Name, email, type, and message are required',
        messageKey: 'error.missingParameters'
      }, 400);
    }

    // 驗證郵件格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.json({
        success: false,
        message: 'Please enter a valid email address',
        messageKey: 'contact.invalidEmail'
      }, 400);
    }

    // 驗證姓名長度（不超過10個字）
    const nameWordCount = name.split(/\s+/).filter(word => word.length > 0).length;
    if (nameWordCount > 10) {
      return res.json({
        success: false,
        message: `Name cannot exceed 10 words, currently ${nameWordCount} words`,
        messageKey: 'contact.nameMaxWords',
        count: nameWordCount
      }, 400);
    }

    // 驗證訊息長度（至少30個字）
    const messageWordCount = message.split(/\s+/).filter(word => word.length > 0).length;
    if (messageWordCount < 30) {
      return res.json({
        success: false,
        message: `Message must be at least 30 words, currently ${messageWordCount} words`,
        messageKey: 'contact.messageMinWords',
        count: messageWordCount
      }, 400);
    }

    // 驗證 reCAPTCHA
    const recaptchaResult = await verifyRecaptcha(recaptchaToken, ipAddress, log, error);
    if (!recaptchaResult.success) {
      log('❌ reCAPTCHA 驗證失敗:', recaptchaResult.error);
      return res.json({
        success: false,
        message: recaptchaResult.error || 'reCAPTCHA verification failed',
        messageKey: 'error.recaptchaFailed'
      }, 400);
    }

    // 發送郵件
    const emailResult = await sendContactEmail(name, email, type, message, language, theme, log, error);
    
    if (!emailResult.success) {
      return res.json({
        success: false,
        message: emailResult.message || 'Failed to send contact form email',
        messageKey: 'contact.error'
      }, 500);
    }

    log('🎉 聯絡表單郵件發送成功');
    return res.json({
      success: true,
      message: 'Contact form submitted successfully',
      messageKey: 'contact.success'
    });

  } catch (err) {
    error('💥 發送聯絡表單郵件異常:', err);
    return res.json({
      success: false,
      message: `Service error: ${err.message || 'Please try again later'}`,
      messageKey: 'error.serviceError'
    }, 500);
  }
}

// 輔助函數：檢查密碼重設速率限制
async function checkPasswordResetRateLimit(databases, email, ipAddress, log, error) {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // 檢查同一郵件地址的重設請求
    const emailResets = await databases.listDocuments(
      'verification_system',
      'password_resets',
      [
        Query.equal('email', email),
        Query.greaterThan('$createdAt', oneHourAgo.toISOString()),
        Query.orderDesc('$createdAt')
      ]
    );

    if (emailResets.documents.length >= 3) {
      const lastReset = emailResets.documents[0];
      const nextAllowedTime = new Date(new Date(lastReset.$createdAt).getTime() + 60 * 60 * 1000);
      const remainingMinutes = Math.ceil((nextAllowedTime.getTime() - now.getTime()) / (1000 * 60));
      
      log('⚠️ 郵件地址重設請求過於頻繁:', email);
      return {
        allowed: false,
        message: `Too many password reset requests. Please wait ${remainingMinutes} minutes before trying again`,
        remainingMinutes
      };
    }

    // 檢查同一 IP 地址的重設請求
    if (ipAddress && ipAddress !== 'unknown') {
      const ipResets = await databases.listDocuments(
        'verification_system',
        'password_resets',
        [
          Query.equal('ipAddress', ipAddress),
          Query.greaterThan('$createdAt', oneHourAgo.toISOString())
        ]
      );

      if (ipResets.documents.length >= 5) {
        log('⚠️ IP 地址重設請求過於頻繁:', ipAddress);
        return {
          allowed: false,
          message: 'Too many password reset requests from this IP address',
          remainingMinutes: 60
        };
      }
    }

    return { allowed: true };

  } catch (err) {
    error('❌ 檢查速率限制失敗:', err);
    // 如果檢查失敗，允許請求繼續（寬鬆處理）
    return { allowed: true };
  }
}

// 輔助函數：清理過期的重設記錄
async function cleanupExpiredResets(databases, log, error) {
  try {
    const now = new Date();
    const expiredResets = await databases.listDocuments(
      'verification_system',
      'password_resets',
      [
        Query.lessThan('expiresAt', now.toISOString()),
        Query.limit(100)
      ]
    );

    if (expiredResets.documents.length > 0) {
      log('🗑️ 清理過期的重設記錄:', expiredResets.documents.length, '筆');
      
      for (const resetDoc of expiredResets.documents) {
        await databases.deleteDocument('verification_system', 'password_resets', resetDoc.$id);
      }
      
      log('✅ 過期重設記錄清理完成');
    }

  } catch (err) {
    error('❌ 清理過期重設記錄失敗:', err);
    // 清理失敗不影響主要功能
  }
}

// 輔助函數：發送密碼重設郵件
async function sendPasswordResetEmail(email, userId, resetToken, username, language = 'zh-TW', theme = 'light', log, error) {
  try {
    log('📤 開始發送密碼重設郵件:', { email, language, theme });

    if (!process.env.RESEND_API_KEY) {
      error('❌ Resend API 金鑰未配置');
      return {
        success: false,
        message: 'Email service configuration error'
      };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const template = generatePasswordResetEmailTemplate(userId, resetToken, username, language, theme);

    log('📧 發送密碼重設郵件請求');
    const { data, error: resendError } = await resend.emails.send({
      from: 'LingUBible <noreply@lingubible.com>',
      to: [email],
      subject: template.subject,
      html: template.html,
    });

    if (resendError) {
      error('❌ Resend 密碼重設郵件發送失敗:', resendError);
      return {
        success: false,
        message: 'Failed to send password reset email'
      };
    }

    log('✅ 密碼重設郵件發送成功，ID:', data?.id);
    return {
      success: true,
      emailId: data?.id
    };

  } catch (err) {
    error('💥 發送密碼重設郵件異常:', err);
    return {
      success: false,
      message: 'Password reset email sending error'
    };
  }
}

// 輔助函數：發送聯絡表單郵件
async function sendContactEmail(name, email, type, message, language, theme = 'light', log, error) {
  try {
    log('📤 開始發送聯絡表單郵件:', { name, email, type, language, theme });

    if (!process.env.RESEND_API_KEY) {
      error('❌ Resend API 金鑰未配置');
      return {
        success: false,
        message: 'Email service configuration error'
      };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const template = generateContactFormEmailTemplate(name, email, type, message, language, theme);

    log('📧 發送聯絡表單郵件請求');
    const { data, error: resendError } = await resend.emails.send({
      from: 'LingUBible Contact Form <noreply@lingubible.com>',
      to: ['contact@lingubible.com'],
      replyTo: [email],
      subject: template.subject,
      html: template.html,
    });

    if (resendError) {
      error('❌ Resend 聯絡表單郵件發送失敗:', resendError);
      return {
        success: false,
        message: 'Failed to send contact form email'
      };
    }

    log('✅ 聯絡表單郵件發送成功，ID:', data?.id);
    return {
      success: true,
      emailId: data?.id
    };

  } catch (err) {
    error('💥 發送聯絡表單郵件異常:', err);
    return {
      success: false,
      message: 'Contact form email sending error'
    };
  }
} 