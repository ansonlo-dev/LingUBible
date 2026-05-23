import { Client, Databases, Users, Query } from 'node-appwrite';

// Appwrite Function for Bun runtime
export default async ({ req, res, log, error }) => {
  // Initialize Appwrite client
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || 'lingubible')
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const users = new Users(client);

  // Configuration constants
  const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'verification_system';
  const VERIFICATION_COLLECTION_ID = process.env.APPWRITE_VERIFICATION_COLLECTION_ID || 'verification_codes';

  // Check if email is a student email
  const isStudentEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    return email.endsWith('@ln.hk');
  };

  // Safe JSON parsing for Bun
  const safeJsonParse = (str) => {
    try {
      return str ? JSON.parse(str) : null;
    } catch (e) {
      log(`JSON parse error: ${e.message}`);
      return null;
    }
  };

  try {
    // Check if this is an event trigger (user creation or session creation)
    const eventType = req.headers['x-appwrite-trigger'];
    const eventData = safeJsonParse(req.bodyRaw);

    // Check if this is a manual cleanup request
    const requestBody = safeJsonParse(req.bodyRaw);
    if (requestBody && requestBody.action === 'immediate_cleanup') {
      log(`🚨 收到手動清理請求: ${requestBody.reason || 'unknown'}`);
      
      const { userId, email, reason } = requestBody;
      
      // For specific user cleanup, require userId and email
      if (reason !== 'non_student_email_session_cleanup' && (!userId || !email)) {
        return res.json({
          success: false,
          action: 'invalid_cleanup_request',
          message: '缺少必要的用戶信息',
          timestamp: new Date().toISOString()
        }, 400);
      }
      
      // Handle general non-student email cleanup
      if (reason === 'non_student_email_session_cleanup') {
        log(`🧹 執行非學生郵箱用戶清理任務`);
        
        let deletedUsers = 0;
        let blockedUsers = 0;
        
        try {
          // Clean all non-student email users
          const allUsers = await users.list([Query.limit(500)]);
          
          for (const user of allUsers.users) {
            const userEmail = user?.email;
            
            if (userEmail && !isStudentEmail(userEmail)) {
              try {
                // Delete all sessions first
                const sessions = await users.listSessions(user.$id);
                for (const session of sessions.sessions) {
                  await users.deleteSession(user.$id, session.$id);
                }
                
                // Try to delete user
                await users.delete(user.$id);
                deletedUsers++;
                log(`🗑️ 已刪除非學生郵箱用戶: ${userEmail}`);
              } catch (userError) {
                blockedUsers++;
                log(`⚠️ 無法刪除用戶但已阻止會話: ${userEmail}`);
              }
            }
          }
          
          return res.json({
            success: true,
            action: 'non_student_cleanup_success',
            message: `非學生郵箱用戶清理完成：刪除 ${deletedUsers} 個用戶，阻止 ${blockedUsers} 個用戶`,
            deletedUsers,
            blockedUsers,
            timestamp: new Date().toISOString()
          });
        } catch (cleanupError) {
          error(`非學生郵箱用戶清理失敗:`, cleanupError);
          return res.json({
            success: false,
            action: 'non_student_cleanup_failed',
            message: `非學生郵箱用戶清理失敗: ${cleanupError.message}`,
            error: cleanupError.message,
            timestamp: new Date().toISOString()
          }, 500);
        }
      }
      
      log(`🗑️ 手動清理用戶: ${email} (ID: ${userId}), 原因: ${reason}`);
      
      try {
        // First, delete all sessions
        const sessions = await users.listSessions(userId);
        for (const session of sessions.sessions) {
          await users.deleteSession(userId, session.$id);
        }
        log(`🚫 已刪除用戶 ${email} 的所有會話`);
        
        // Then, delete the user
        await users.delete(userId);
        log(`🗑️ 已刪除用戶: ${email}`);
        
        return res.json({
          success: true,
          action: 'manual_cleanup_success',
          message: `用戶已被成功刪除: ${email}`,
          userId,
          email,
          reason,
          timestamp: new Date().toISOString()
        });
      } catch (cleanupError) {
        error(`手動清理用戶 ${email} 失敗:`, cleanupError);
        return res.json({
          success: false,
          action: 'manual_cleanup_failed',
          message: `清理用戶失敗: ${email}`,
          error: cleanupError.message,
          userId,
          email,
          reason,
          timestamp: new Date().toISOString()
        }, 500);
      }
    }

    if (eventType?.includes('users.') && eventData) {
      log(`🚨 檢測到用戶事件: ${eventType}`);
      
      // Handle user creation event
      if (eventType.includes('.create') && !eventType.includes('sessions')) {
        const userData = eventData;
        const email = userData?.email;
        const userId = userData?.$id;
        
        if (!email || !userId) {
          log('⚠️ 用戶數據不完整，跳過處理');
          return res.json({
            success: false,
            action: 'invalid_user_data',
            message: '用戶數據不完整',
            timestamp: new Date().toISOString()
          });
        }
        
        log(`👤 新用戶創建: ${email} (ID: ${userId})`);
        
        if (!isStudentEmail(email)) {
          log(`❌ 非學生郵箱檢測到: ${email}`);
          
          try {
            // Immediately delete non-student email user
            await users.delete(userId);
            log(`🗑️ 已立即刪除非學生郵箱用戶: ${email}`);
            
            return res.json({
              success: true,
              action: 'user_deleted',
              message: `非學生郵箱用戶已被刪除: ${email}`,
              userId,
              email,
              timestamp: new Date().toISOString()
            });
          } catch (deleteError) {
            error(`刪除非學生用戶失敗: ${email}`, deleteError);
            
            // If unable to delete user, at least delete all sessions
            try {
              const sessions = await users.listSessions(userId);
              for (const session of sessions.sessions) {
                await users.deleteSession(userId, session.$id);
              }
              log(`🚫 已阻止非學生郵箱用戶登入: ${email}`);
              
              return res.json({
                success: true,
                action: 'sessions_deleted',
                message: `非學生郵箱用戶會話已被刪除: ${email}`,
                userId,
                email,
                timestamp: new Date().toISOString()
              });
            } catch (sessionError) {
              error(`刪除非學生用戶會話失敗: ${email}`, sessionError);
              return res.json({
                success: false,
                action: 'cleanup_failed',
                message: `無法清理非學生用戶: ${email}`,
                error: sessionError.message,
                timestamp: new Date().toISOString()
              }, 500);
            }
          }
        } else {
          log(`✅ 學生郵箱用戶創建成功: ${email}`);
          return res.json({
            success: true,
            action: 'student_user_approved',
            message: `學生用戶創建成功: ${email}`,
            userId,
            email,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Handle session creation event
      if (eventType.includes('sessions.') && eventType.includes('.create')) {
        const sessionData = eventData;
        const userId = sessionData?.userId;
        const sessionId = sessionData?.$id;
        
        if (!userId || !sessionId) {
          log('⚠️ 會話數據不完整，跳過處理');
          return res.json({
            success: false,
            action: 'invalid_session_data',
            message: '會話數據不完整',
            timestamp: new Date().toISOString()
          });
        }
        
        try {
          const user = await users.get(userId);
          const email = user?.email;
          
          if (!email) {
            log(`⚠️ 無法獲取用戶郵箱: ${userId}`);
            return res.json({
              success: false,
              action: 'no_user_email',
              message: `無法獲取用戶郵箱: ${userId}`,
              timestamp: new Date().toISOString()
            });
          }
          
          log(`🔐 新會話創建: ${email} (用戶ID: ${userId})`);
          
          if (!isStudentEmail(email)) {
            log(`❌ 非學生郵箱會話檢測到: ${email}`);
            
            // Immediately delete session
            await users.deleteSession(userId, sessionId);
            log(`🚫 已立即刪除非學生郵箱用戶會話: ${email}`);
            
            // Try to delete user
            try {
              await users.delete(userId);
              log(`🗑️ 已刪除非學生郵箱用戶: ${email}`);
            } catch (userDeleteError) {
              log(`⚠️ 無法刪除用戶，但已刪除會話: ${email}`);
            }
            
            return res.json({
              success: true,
              action: 'session_blocked',
              message: `非學生郵箱用戶會話已被阻止: ${email}`,
              userId,
              email,
              sessionId,
              timestamp: new Date().toISOString()
            });
          } else {
            log(`✅ 學生郵箱用戶會話創建成功: ${email}`);
            return res.json({
              success: true,
              action: 'student_session_approved',
              message: `學生用戶會話創建成功: ${email}`,
              userId,
              email,
              sessionId,
              timestamp: new Date().toISOString()
            });
          }
        } catch (getUserError) {
          error(`獲取用戶信息失敗: ${userId}`, getUserError);
          return res.json({
            success: false,
            action: 'get_user_failed',
            message: `無法獲取用戶信息: ${userId}`,
            error: getUserError.message,
            timestamp: new Date().toISOString()
          }, 500);
        }
      }
    }

    // If not an event trigger, perform periodic cleanup
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    let deletedCodes = 0;
    let deletedUsers = 0;
    let blockedUsers = 0;

    log('🧹 開始定期清理任務');

    // Clean expired verification codes (if database is configured)
    if (DATABASE_ID && VERIFICATION_COLLECTION_ID) {
      try {
        log('🔍 查詢過期的驗證碼...');
        const expiredCodes = await databases.listDocuments(
          DATABASE_ID,
          VERIFICATION_COLLECTION_ID,
          [Query.lessThan('expiresAt', oneHourAgo.toISOString())]
        );

        for (const doc of expiredCodes.documents) {
          await databases.deleteDocument(
            DATABASE_ID,
            VERIFICATION_COLLECTION_ID,
            doc.$id
          );
          deletedCodes++;
        }

        log(`✅ 已刪除 ${deletedCodes} 個過期驗證碼`);
      } catch (err) {
        error('清理驗證碼時發生錯誤:', err);
      }
    } else {
      log('⚠️ 數據庫配置未找到，跳過驗證碼清理');
    }

    // Immediately clean recently created non-student email users (past 5 minutes)
    try {
      log('🚨 檢查最近創建的非學生郵箱用戶...');
      const veryRecentUsers = await users.list([
        Query.greaterThan('$createdAt', fiveMinutesAgo.toISOString()),
        Query.limit(50)
      ]);

      for (const user of veryRecentUsers.users) {
        const email = user?.email;
        
        if (email && !isStudentEmail(email)) {
          try {
            // Immediately delete non-student email user
            await users.delete(user.$id);
            deletedUsers++;
            log(`🗑️ 立即刪除非學生郵箱用戶: ${email} (創建於: ${user.$createdAt})`);
          } catch (userError) {
            error(`刪除用戶 ${email} 時發生錯誤:`, userError);
            
            // If unable to delete user, at least delete all sessions
            try {
              const sessions = await users.listSessions(user.$id);
              for (const session of sessions.sessions) {
                await users.deleteSession(user.$id, session.$id);
              }
              blockedUsers++;
              log(`🚫 已阻止非學生郵箱用戶登入: ${email}`);
            } catch (sessionError) {
              error(`刪除用戶 ${email} 的會話時發生錯誤:`, sessionError);
            }
          }
        }
      }
    } catch (err) {
      error('清理最近創建的非學生用戶時發生錯誤:', err);
    }

    // Clean older non-student email users (past 24 hours)
    try {
      log('🔍 檢查過去24小時內創建的非學生郵箱用戶...');
      const recentUsers = await users.list([
        Query.greaterThan('$createdAt', oneDayAgo.toISOString()),
        Query.lessThan('$createdAt', fiveMinutesAgo.toISOString()),
        Query.limit(100)
      ]);

      for (const user of recentUsers.users) {
        const email = user?.email;
        
        if (email && !isStudentEmail(email)) {
          try {
            // Check if user has active sessions
            const sessions = await users.listSessions(user.$id);
            
            // Delete all sessions
            for (const session of sessions.sessions) {
              await users.deleteSession(user.$id, session.$id);
            }
            
            // Try to delete user
            await users.delete(user.$id);
            deletedUsers++;
            log(`🗑️ 已刪除非學生郵箱用戶: ${email}`);
          } catch (userError) {
            error(`處理用戶 ${email} 時發生錯誤:`, userError);
            blockedUsers++;
          }
        }
      }
    } catch (err) {
      error('清理非學生用戶時發生錯誤:', err);
    }

    // Additional security check: check all recently active non-student users
    try {
      log('🔒 執行額外安全檢查...');
      const allRecentUsers = await users.list([
        Query.limit(200) // Check the most recent 200 users
      ]);

      for (const user of allRecentUsers.users) {
        const email = user?.email;
        
        if (email && !isStudentEmail(email)) {
          try {
            // Check and delete all sessions
            const sessions = await users.listSessions(user.$id);
            if (sessions.sessions.length > 0) {
              for (const session of sessions.sessions) {
                await users.deleteSession(user.$id, session.$id);
              }
              blockedUsers++;
              log(`🚫 已阻止非學生郵箱用戶的活躍會話: ${email}`);
            }
          } catch (sessionError) {
            error(`檢查用戶 ${email} 的會話時發生錯誤:`, sessionError);
          }
        }
      }
    } catch (err) {
      error('執行額外安全檢查時發生錯誤:', err);
    }

    const summary = `定期清理完成：刪除了 ${deletedCodes} 個過期驗證碼，刪除了 ${deletedUsers} 個非學生用戶，阻止了 ${blockedUsers} 個非學生用戶登入`;
    log(`📊 ${summary}`);

    return res.json({
      success: true,
      action: 'periodic_cleanup',
      message: summary,
      deletedCodes,
      deletedUsers,
      blockedUsers,
      timestamp: now.toISOString(),
      securityLevel: 'enhanced',
      runtime: 'bun-1.1'
    });

  } catch (err) {
    error('函數執行過程中發生錯誤:', err);
    return res.json({
      success: false,
      message: '函數執行過程中發生錯誤',
      error: err.message,
      timestamp: new Date().toISOString(),
      runtime: 'bun-1.1'
    }, 500);
  }
}; 