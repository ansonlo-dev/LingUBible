module.exports = async ({ req, res, log, error }) => {
  try {
    const endpoint = process.env.APPWRITE_FUNCTION_ENDPOINT || 'https://appwrite.lingubible.com/v1';
    const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;

    log('開始獲取用戶統計...');

    // 取得總用戶數
    const usersResponse = await fetch(`${endpoint}/users?limit=1`, {
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
    log(`總用戶數: ${totalUsers}`);

    // 計算過去30天的新註冊用戶數（使用查詢，只取 total，不讀取文件內容）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    const newUsersQuery = JSON.stringify({ method: 'greaterThanEqual', attribute: '$createdAt', values: [thirtyDaysAgoISO] });
    const newUsersResponse = await fetch(`${endpoint}/users?queries[]=${encodeURIComponent(newUsersQuery)}&limit=1`, {
      method: 'GET',
      headers: {
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    let newUsersLast30Days = 0;
    if (newUsersResponse.ok) {
      const newUsersData = await newUsersResponse.json();
      newUsersLast30Days = newUsersData.total || 0;
    } else {
      log(`獲取30天新用戶失敗: ${newUsersResponse.status}`);
    }

    log(`30天內新用戶數: ${newUsersLast30Days}`);

    const stats = {
      totalRegisteredUsers: totalUsers,
      newUsersLast30Days: newUsersLast30Days,
      verifiedUsers: totalUsers,
      lastUpdated: new Date().toISOString()
    };

    log('用戶統計獲取成功');

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
