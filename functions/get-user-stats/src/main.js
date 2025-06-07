// 使用 fetch API 而不是 node-appwrite SDK
// 這是一個 Appwrite 函數，用於獲取用戶統計
module.exports = async ({ req, res, log, error }) => {
  try {
    const endpoint = process.env.APPWRITE_FUNCTION_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
    const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;

    log('開始獲取用戶統計...');

    // 使用 REST API 獲取用戶列表
    const usersResponse = await fetch(`${endpoint}/users`, {
      method: 'GET',
      headers: {
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!usersResponse.ok) {
      throw new Error(`Failed to fetch users: ${usersResponse.status} ${usersResponse.statusText}`);
    }

    const usersData = await usersResponse.json();
    const totalUsers = usersData.total;

    log(`獲取到總用戶數: ${totalUsers}`);

    // 計算過去30天的新註冊用戶數
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    let newUsersLast30Days = 0;
    let verifiedUsers = 0;

    // 遍歷用戶來計算統計數據
    for (const user of usersData.users) {
      // 計算已驗證用戶數（保留用於其他用途）
      if (user.emailVerification) {
        verifiedUsers++;
      }

      // 計算過去30天的新註冊用戶
      if (user.registration && user.registration >= thirtyDaysAgoISO) {
        newUsersLast30Days++;
      }
    }

    // 獲取在線用戶和訪客統計
    log('開始獲取在線用戶統計...');
    
    // 獲取所有會話（先不過濾，在代碼中處理）
    const sessionsResponse = await fetch(`${endpoint}/databases/user-stats-db/collections/user-sessions/documents?limit=1000`, {
      method: 'GET',
      headers: {
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    let onlineUsers = 0;
    let onlineVisitors = 0;
    let todayLogins = 0;
    let thisMonthLogins = 0;

    if (sessionsResponse.ok) {
      const sessionsData = await sessionsResponse.json();
      log(`獲取到 ${sessionsData.total} 個會話`);

      // 計算活躍會話的時間閾值（2分鐘前）
      const activeThreshold = new Date();
      activeThreshold.setMinutes(activeThreshold.getMinutes() - 2);

      // 計算今天和本月的時間閾值
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const thisMonthISO = thisMonth.toISOString();

      // 統計活躍會話
      const activeUserIds = new Set();
      
      for (const session of sessionsData.documents) {
        // 檢查會話是否活躍（最後 ping 時間在2分鐘內）
        const lastPingTime = new Date(session.lastPing);
        const isActive = lastPingTime > activeThreshold;

        if (isActive) {
          // 檢查是否為訪客
          if (session.isVisitor || !session.userId || session.userId === '') {
            onlineVisitors++;
          } else {
            // 避免重複計算同一用戶的多個會話
            activeUserIds.add(session.userId);
          }
        }

        // 計算今天和本月的登入次數（不限於活躍會話）
        if (session.loginTime >= todayISO) {
          todayLogins++;
        }
        if (session.loginTime >= thisMonthISO) {
          thisMonthLogins++;
        }
      }

      onlineUsers = activeUserIds.size;
      log(`在線統計: ${onlineUsers} 用戶, ${onlineVisitors} 訪客`);
    } else {
      log('獲取會話數據失敗:', sessionsResponse.status, sessionsResponse.statusText);
    }

    // 準備統計數據
    const stats = {
      totalRegisteredUsers: totalUsers,
      newUsersLast30Days: newUsersLast30Days,
      verifiedUsers: verifiedUsers,
      onlineUsers: onlineUsers,
      onlineVisitors: onlineVisitors,
      todayLogins: todayLogins,
      thisMonthLogins: thisMonthLogins,
      lastUpdated: new Date().toISOString()
    };

    log('用戶統計獲取成功:', JSON.stringify(stats));

    // 可選：將統計數據緩存到數據庫中
    try {
      const cacheData = {
        ...stats,
        cachedAt: new Date().toISOString()
      };

      // 嘗試創建或更新緩存文檔
      const cacheResponse = await fetch(`${endpoint}/databases/user-stats-db/collections/user-stats-cache/documents`, {
        method: 'POST',
        headers: {
          'X-Appwrite-Project': projectId,
          'X-Appwrite-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentId: 'latest-stats',
          data: cacheData
        })
      });

      if (!cacheResponse.ok && cacheResponse.status === 409) {
        // 文檔已存在，嘗試更新
        const updateResponse = await fetch(`${endpoint}/databases/user-stats-db/collections/user-stats-cache/documents/latest-stats`, {
          method: 'PATCH',
          headers: {
            'X-Appwrite-Project': projectId,
            'X-Appwrite-Key': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            data: cacheData
          })
        });

        if (updateResponse.ok) {
          log('統計數據已更新到數據庫');
        }
      } else if (cacheResponse.ok) {
        log('統計數據已緩存到數據庫');
      }
    } catch (cacheError) {
      log('緩存統計數據失敗:', cacheError.message);
    }

    return res.json({
      success: true,
      data: stats
    });

  } catch (err) {
    error('獲取用戶統計失敗:', err.message);
    
    return res.json({
      success: false,
      error: err.message,
      data: {
        totalRegisteredUsers: 0,
        newUsersLast30Days: 0,
        verifiedUsers: 0,
        onlineUsers: 0,
        onlineVisitors: 0,
        todayLogins: 0,
        thisMonthLogins: 0,
        lastUpdated: new Date().toISOString()
      }
    });
  }
}; 