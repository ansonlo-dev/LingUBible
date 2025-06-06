import { Client, Databases } from 'appwrite';

interface RegisteredUsersStats {
  totalRegisteredUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  lastUpdated: string;
}

class RegisteredUsersService {
  private static instance: RegisteredUsersService;
  private client: Client;
  private databases: Databases;
  private cachedStats: RegisteredUsersStats | null = null;
  private lastCacheTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 分鐘緩存
  private readonly DATABASE_ID = 'user-stats-db';

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
        console.log('使用緩存的用戶統計數據');
        return this.cachedStats;
      }

      console.log('從用戶統計服務獲取數據...');
      
      // 從用戶統計服務獲取數據
      const stats = await this.getStatsFromUserStatsService();
      
      // 更新緩存
      this.cachedStats = stats;
      this.lastCacheTime = now;

      return stats;

    } catch (error) {
      console.error('獲取用戶統計失敗:', error);
      
      // 返回預設值
      return {
        totalRegisteredUsers: 0,
        verifiedUsers: 0,
        unverifiedUsers: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // 從數據庫直接獲取註冊用戶統計
  private async getStatsFromUserStatsService(): Promise<RegisteredUsersStats> {
    try {
      console.log('從數據庫獲取註冊用戶統計...');
      
      // 直接從 logged-users 集合計算總註冊用戶數
      const totalUsers = await this.getTotalRegisteredUsersFromDatabase();
      
      console.log(`獲取到 ${totalUsers} 個已註冊用戶`);
      
      return {
        totalRegisteredUsers: totalUsers,
        verifiedUsers: totalUsers, // 假設所有用戶都已驗證
        unverifiedUsers: 0,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('從數據庫獲取註冊用戶統計失敗:', error);
      
      // 返回預設值
      return {
        totalRegisteredUsers: 0,
        verifiedUsers: 0,
        unverifiedUsers: 0,
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