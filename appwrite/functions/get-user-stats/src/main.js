import { Client, Databases, Users } from 'node-appwrite';

// 這是一個 Appwrite 函數，用於獲取用戶統計
// 使用服務器 SDK 來避免客戶端的隱私限制
export default async ({ req, res, log, error }) => {
  try {
    // 初始化 Appwrite 客戶端（服務器端）
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY); // 使用 API 密鑰

    const users = new Users(client);
    const databases = new Databases(client);

    log('開始獲取用戶統計...');

    // 獲取總用戶數
    const usersList = await users.list();
    const totalUsers = usersList.total;

    log(`獲取到總用戶數: ${totalUsers}`);

    // 計算過去30天的新註冊用戶數
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    let newUsersLast30Days = 0;
    let verifiedUsers = 0;

    // 遍歷用戶來計算統計數據
    for (const user of usersList.users) {
      // 計算已驗證用戶數（保留用於其他用途）
      if (user.emailVerification) {
        verifiedUsers++;
      }

      // 計算過去30天的新註冊用戶
      // user.registration 是用戶註冊時間的 ISO 字符串
      if (user.registration && user.registration >= thirtyDaysAgoISO) {
        newUsersLast30Days++;
      }
    }

    // 準備統計數據
    const stats = {
      totalRegisteredUsers: totalUsers,
      newUsersLast30Days: newUsersLast30Days,
      verifiedUsers: verifiedUsers, // 保留但不在前端顯示
      lastUpdated: new Date().toISOString()
    };

    log('用戶統計獲取成功:', JSON.stringify(stats));

    // 可選：將統計數據緩存到數據庫中
    try {
      await databases.createDocument(
        'user-stats-db',
        'user-stats-cache',
        'latest-stats',
        {
          ...stats,
          cachedAt: new Date().toISOString()
        }
      );
      log('統計數據已緩存到數據庫');
    } catch (cacheError) {
      // 如果文檔已存在，嘗試更新
      try {
        await databases.updateDocument(
          'user-stats-db',
          'user-stats-cache',
          'latest-stats',
          {
            ...stats,
            cachedAt: new Date().toISOString()
          }
        );
        log('統計數據已更新到數據庫');
      } catch (updateError) {
        log('緩存統計數據失敗:', updateError.message);
      }
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
        lastUpdated: new Date().toISOString()
      }
    });
  }
}; 