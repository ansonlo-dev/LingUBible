import { Client, Databases, Functions } from 'appwrite';

interface RegisteredUsersStats {
  totalRegisteredUsers: number;
  newUsersLast30Days: number;
  verifiedUsers: number; // 保留但不在前端顯示
  lastUpdated: string;
}

class RegisteredUsersService {
  private static instance: RegisteredUsersService;
  private client: Client;
  private databases: Databases;
  private functions: Functions;
  private cachedStats: RegisteredUsersStats | null = null;
  private lastCacheTime: number = 0;
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 分鐘緩存
  private readonly DATABASE_ID = 'user-stats-db';
  private readonly FUNCTION_ID = 'get-user-stats';

  private constructor() {
    // 檢查環境變數
    const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
    const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

    if (!endpoint || !projectId) {
      console.warn('RegisteredUsersService: 缺少環境變數，使用預設配置');
      
      // 使用預設配置
      this.client = new Client()
        .setEndpoint('https://fra.cloud.appwrite.io/v1')
        .setProject('lingubible');
    } else {
      this.client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId);
    }

    this.databases = new Databases(this.client);
    this.functions = new Functions(this.client);
    console.log('RegisteredUsersService 初始化完成');
  }

  public static getInstance(): RegisteredUsersService {
    if (!RegisteredUsersService.instance) {
      RegisteredUsersService.instance = new RegisteredUsersService();
    }
    return RegisteredUsersService.instance;
  }

  // 獲取已註冊用戶統計
  public async getRegisteredUsersStats(): Promise<RegisteredUsersStats> {
    try {
      // 檢查緩存
      const now = Date.now();
      if (this.cachedStats && (now - this.lastCacheTime) < this.CACHE_DURATION) {
        console.log('RegisteredUsersService: 使用緩存的用戶統計數據', this.cachedStats);
        return this.cachedStats;
      }

      console.log('RegisteredUsersService: 從 Appwrite 函數獲取用戶統計...');
      
      // 優先嘗試從 Appwrite 函數獲取數據
      const stats = await this.getStatsFromAppwriteFunction();
      
      // 更新緩存
      this.cachedStats = stats;
      this.lastCacheTime = now;

      console.log('RegisteredUsersService: 成功獲取並緩存統計數據', stats);
      return stats;

    } catch (error) {
      console.error('RegisteredUsersService: 獲取用戶統計失敗:', error);
      
      // 拋出錯誤而不是返回預設值，讓上層處理
      throw error;
    }
  }

  // 從 Appwrite 函數獲取用戶統計
  private async getStatsFromAppwriteFunction(): Promise<RegisteredUsersStats> {
    try {
      console.log('RegisteredUsersService: 調用 Appwrite 函數獲取用戶統計...');
      
      const execution = await this.functions.createExecution(this.FUNCTION_ID);
      
      console.log('RegisteredUsersService: 函數執行結果', {
        status: execution.status,
        responseStatusCode: execution.responseStatusCode,
        responseBody: execution.responseBody?.substring(0, 200) + '...'
      });
      
      if (execution.status === 'completed' && execution.responseStatusCode === 200) {
        const response = JSON.parse(execution.responseBody);
        
        if (response.success) {
          console.log('RegisteredUsersService: 從 Appwrite 函數獲取統計成功:', response.data);
          return response.data;
        } else {
          console.error('RegisteredUsersService: Appwrite 函數返回錯誤:', response.error);
          throw new Error(response.error);
        }
      } else {
        console.error('RegisteredUsersService: Appwrite 函數執行失敗:', {
          status: execution.status,
          responseStatusCode: execution.responseStatusCode,
          errors: execution.errors
        });
        throw new Error(`函數執行失敗: ${execution.status}`);
      }
    } catch (error) {
      console.error('RegisteredUsersService: 調用 Appwrite 函數失敗，回退到緩存數據:', error);
      
      // 如果 Appwrite 函數失敗，嘗試從緩存數據庫獲取
      return await this.getStatsFromCache();
    }
  }

  // 從緩存數據庫獲取統計（備用方案）
  private async getStatsFromCache(): Promise<RegisteredUsersStats> {
    try {
      console.log('從緩存數據庫獲取用戶統計...');
      
      const cacheResponse = await this.databases.getDocument(
        this.DATABASE_ID,
        'user-stats-cache',
        'latest-stats'
      );
      
      return {
        totalRegisteredUsers: cacheResponse.totalRegisteredUsers || 0,
        newUsersLast30Days: cacheResponse.newUsersLast30Days || 0,
        verifiedUsers: cacheResponse.verifiedUsers || 0,
        lastUpdated: cacheResponse.lastUpdated || new Date().toISOString()
      };
    } catch (error) {
      console.error('從緩存獲取統計失敗:', error);
      
      // 最後的備用方案：返回預設值
      return {
        totalRegisteredUsers: 0,
        newUsersLast30Days: 0,
        verifiedUsers: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // 從數據庫直接獲取註冊用戶統計（已棄用，保留作為備用）
  private async getStatsFromUserStatsService(): Promise<RegisteredUsersStats> {
    try {
      console.log('從數據庫獲取註冊用戶統計...');
      
      // 直接從 logged-users 集合計算總註冊用戶數
      const totalUsers = await this.getTotalRegisteredUsersFromDatabase();
      
      console.log(`獲取到 ${totalUsers} 個已註冊用戶`);
      
      return {
        totalRegisteredUsers: totalUsers,
        newUsersLast30Days: 0, // 無法從舊數據計算，設為0
        verifiedUsers: totalUsers, // 假設所有用戶都已驗證
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('從數據庫獲取註冊用戶統計失敗:', error);
      
      // 返回預設值
      return {
        totalRegisteredUsers: 0,
        newUsersLast30Days: 0,
        verifiedUsers: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // 直接從數據庫計算總註冊用戶數
  private async getTotalRegisteredUsersFromDatabase(): Promise<number> {
    try {
      // 從 logged-users 集合獲取所有已註冊用戶
      const loggedUsers = await this.databases.listDocuments(
        this.DATABASE_ID,
        'logged-users',
        [] // 不設置查詢條件，獲取所有用戶
      );

      console.log(`從 logged-users 集合獲取到 ${loggedUsers.total} 個已註冊用戶`);
      return loggedUsers.total || 0;
    } catch (error) {
      console.error('從數據庫計算用戶數失敗:', error);
      
      // 如果 logged-users 集合失敗，嘗試從 user-stats 集合獲取
      try {
        const statsResponse = await this.databases.listDocuments(
          this.DATABASE_ID,
          'user-stats',
          []
        );

        if (statsResponse.documents.length > 0) {
          const latestStats = statsResponse.documents[0];
          console.log(`從 user-stats 集合獲取到 ${latestStats.totalUsers} 個用戶`);
          return latestStats.totalUsers || 0;
        }
      } catch (statsError) {
        console.error('從 user-stats 集合獲取數據也失敗:', statsError);
      }
      
      return 0;
    }
  }

  // 獲取簡化的註冊用戶數量
  public async getRegisteredUsersCount(): Promise<number> {
    try {
      const stats = await this.getRegisteredUsersStats();
      return stats.totalRegisteredUsers;
    } catch (error) {
      console.error('獲取註冊用戶數量失敗:', error);
      return 0;
    }
  }

  // 清除緩存
  public clearCache(): void {
    this.cachedStats = null;
    this.lastCacheTime = 0;
    console.log('用戶統計緩存已清除');
  }
}

export default RegisteredUsersService; 