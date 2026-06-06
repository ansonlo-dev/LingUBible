import { Client, Functions } from 'appwrite';

interface UserStats {
  totalUsers: number;
  onlineUsers: number;
  onlineVisitors: number;
  todayLogins: number;
  thisMonthLogins: number;
  lastUpdated: string;
}

/**
 * 用戶統計服務（僅讀取註冊用戶統計）
 *
 * 註：原本的線上人數 / 訪客追蹤（ping、會話、Web Worker）已移除。
 * 此服務現在只透過 `get-user-stats` 雲端函數讀取註冊用戶相關統計。
 */
class AppwriteUserStatsService {
  private static instance: AppwriteUserStatsService;
  private client: Client;
  private functions: Functions;

  private constructor() {
    this.client = new Client()
      .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
      .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

    this.functions = new Functions(this.client);
  }

  public static getInstance(): AppwriteUserStatsService {
    if (!AppwriteUserStatsService.instance) {
      AppwriteUserStatsService.instance = new AppwriteUserStatsService();
    }
    return AppwriteUserStatsService.instance;
  }

  // 獲取統計數據 - 使用 Function（更安全）
  async getStatsViaFunction(): Promise<UserStats & { _backendData?: any }> {
    try {
      const result = await this.functions.createExecution(
        'get-user-stats', // Function ID
        JSON.stringify({}), // 空參數
        false // 不是異步執行
      );

      if (result.responseStatusCode === 200) {
        const response = JSON.parse(result.responseBody);

        // 檢查響應格式並提取數據
        if (response.success && response.data) {
          const backendData = response.data;

          // 將後端數據結構轉換為前端期望的 UserStats 格式
          const frontendStats: UserStats & { _backendData?: any } = {
            totalUsers: backendData.totalRegisteredUsers || 0,
            onlineUsers: backendData.onlineUsers || 0,
            onlineVisitors: backendData.onlineVisitors || 0,
            todayLogins: backendData.todayLogins || 0,
            thisMonthLogins: backendData.thisMonthLogins || 0,
            lastUpdated: backendData.lastUpdated || new Date().toISOString(),
            _backendData: backendData // 保存原始後端數據
          };

          return frontendStats;
        } else {
          throw new Error(`Function 返回錯誤: ${response.error || 'Unknown error'}`);
        }
      } else {
        throw new Error(`Function 執行失敗: ${result.responseBody}`);
      }
    } catch (error) {
      console.error('AppwriteUserStats: 通過 Function 獲取統計數據失敗:', error);
      return this.getDefaultStats();
    }
  }

  // 預設統計數據（函數呼叫失敗時的後備值）
  private getDefaultStats(): UserStats {
    return {
      totalUsers: 0,
      onlineUsers: 0,
      onlineVisitors: 0,
      todayLogins: 0,
      thisMonthLogins: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}

export default AppwriteUserStatsService;
