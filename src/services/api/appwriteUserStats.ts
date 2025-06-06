import { Client, Databases, Functions, ID, Query } from 'appwrite';

interface UserStats {
  totalUsers: number;
  onlineUsers: number;
  todayLogins: number;
  thisMonthLogins: number;
  lastUpdated: string;
}

interface UserSession {
  $id?: string;
  userId: string;
  sessionId: string;
  loginTime: string;
  lastPing: string;
  deviceInfo?: string;
  ipAddress?: string;
}

class AppwriteUserStatsService {
  private static instance: AppwriteUserStatsService;
  private client: Client;
  private databases: Databases;
  private functions: Functions;
  private currentSessionId: string | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private readonly SESSION_TIMEOUT = 5 * 60 * 1000; // 5 分鐘（配合 2 分鐘 ping）
  private readonly PING_INTERVAL = 60 * 1000; // 60 秒
  private readonly DATABASE_ID = 'user-stats-db';
  private readonly SESSIONS_COLLECTION_ID = 'user-sessions';
  private readonly STATS_COLLECTION_ID = 'user-stats';

  private constructor() {
    // 檢查環境變數
    const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
    const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

    if (!endpoint || !projectId) {
      console.warn('AppwriteUserStatsService: 缺少環境變數，使用預設配置');
      console.warn('請創建 .env 文件並設置 VITE_APPWRITE_ENDPOINT 和 VITE_APPWRITE_PROJECT_ID');
      
      // 使用預設配置
      this.client = new Client()
        .setEndpoint('https://fra.cloud.appwrite.io/v1')
        .setProject('lingubible');
    } else {
      // 使用環境變數配置
      this.client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId);
    }

    this.databases = new Databases(this.client);
    this.functions = new Functions(this.client);

    console.log('AppwriteUserStatsService 初始化完成');
  }

  public static getInstance(): AppwriteUserStatsService {
    if (!AppwriteUserStatsService.instance) {
      AppwriteUserStatsService.instance = new AppwriteUserStatsService();
    }
    return AppwriteUserStatsService.instance;
  }

  // 用戶登入 - 創建會話記錄
  public async userLogin(userId: string): Promise<string> {
    try {
      const now = new Date().toISOString();
      const sessionId = this.generateSessionId();

      // 檢查是否已有活躍會話
      const existingSessions = await this.databases.listDocuments(
        this.DATABASE_ID,
        this.SESSIONS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.greaterThan('lastPing', new Date(Date.now() - this.SESSION_TIMEOUT).toISOString())
        ]
      );

      if (existingSessions.documents.length > 0) {
        // 更新現有會話
        const existingSession = existingSessions.documents[0] as unknown as UserSession;
        await this.databases.updateDocument(
          this.DATABASE_ID,
          this.SESSIONS_COLLECTION_ID,
          existingSession.$id!,
          {
            lastPing: now,
            sessionId: sessionId
          }
        );
        
        this.currentSessionId = sessionId;
        console.log(`用戶 ${userId} 已有活躍會話，更新 ping 時間`);
        return sessionId;
      }

      // 創建新會話
      const sessionData: Omit<UserSession, '$id'> = {
        userId,
        sessionId,
        loginTime: now,
        lastPing: now,
        deviceInfo: this.getDeviceInfo(),
        ipAddress: await this.getClientIP()
      };

      await this.databases.createDocument(
        this.DATABASE_ID,
        this.SESSIONS_COLLECTION_ID,
        ID.unique(),
        sessionData
      );

      this.currentSessionId = sessionId;
      
      // 更新統計數據
      await this.updateStats(userId);
      
      // 開始 ping 系統
      this.startPingSystem();

      console.log(`用戶 ${userId} 登入成功，會話 ID: ${sessionId}`);
      return sessionId;

    } catch (error) {
      console.error('用戶登入失敗:', error);
      throw error;
    }
  }

  // 用戶登出 - 移除會話記錄
  public async userLogout(sessionId?: string): Promise<void> {
    try {
      const targetSessionId = sessionId || this.currentSessionId;
      
      if (!targetSessionId) {
        console.log('沒有活躍會話可以登出');
        return;
      }

      // 查找並刪除會話
      const sessions = await this.databases.listDocuments(
        this.DATABASE_ID,
        this.SESSIONS_COLLECTION_ID,
        [Query.equal('sessionId', targetSessionId)]
      );

      if (sessions.documents.length > 0) {
        await this.databases.deleteDocument(
          this.DATABASE_ID,
          this.SESSIONS_COLLECTION_ID,
          sessions.documents[0].$id
        );

        console.log(`會話 ${targetSessionId} 已登出`);
      }

      if (this.currentSessionId === targetSessionId) {
        this.currentSessionId = null;
        this.stopPingSystem();
      }

    } catch (error) {
      console.error('用戶登出失敗:', error);
      throw error;
    }
  }

  // 發送 ping - 更新會話的最後 ping 時間
  public async sendPing(sessionId?: string): Promise<boolean> {
    try {
      const targetSessionId = sessionId || this.currentSessionId;
      
      if (!targetSessionId) {
        console.log('沒有活躍會話，無法發送 ping');
        return false;
      }

      const sessions = await this.databases.listDocuments(
        this.DATABASE_ID,
        this.SESSIONS_COLLECTION_ID,
        [Query.equal('sessionId', targetSessionId)]
      );

      if (sessions.documents.length > 0) {
        await this.databases.updateDocument(
          this.DATABASE_ID,
          this.SESSIONS_COLLECTION_ID,
          sessions.documents[0].$id,
          {
            lastPing: new Date().toISOString()
          }
        );

        console.log(`Ping 發送成功 - 會話: ${targetSessionId}`);
        return true;
      } else {
        console.log(`會話不存在: ${targetSessionId}`);
        return false;
      }

    } catch (error) {
      console.error('發送 ping 失敗:', error);
      return false;
    }
  }

  // 獲取統計數據
  public async getStats(): Promise<UserStats> {
    try {
      // 清理過期會話
      await this.cleanupExpiredSessions();

      // 獲取在線用戶數
      const activeSessions = await this.databases.listDocuments(
        this.DATABASE_ID,
        this.SESSIONS_COLLECTION_ID,
        [
          Query.greaterThan('lastPing', new Date(Date.now() - this.SESSION_TIMEOUT).toISOString())
        ]
      );

      // 獲取統計數據
      const statsDoc = await this.getOrCreateStatsDocument();

      return {
        totalUsers: statsDoc.totalUsers || 0,
        onlineUsers: activeSessions.documents.length,
        todayLogins: statsDoc.todayLogins || 0,
        thisMonthLogins: statsDoc.thisMonthLogins || 0,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('獲取統計數據失敗:', error);
      return {
        totalUsers: 0,
        onlineUsers: 0,
        todayLogins: 0,
        thisMonthLogins: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // 清理過期會話
  private async cleanupExpiredSessions(): Promise<void> {
    try {
      const expiredTime = new Date(Date.now() - this.SESSION_TIMEOUT).toISOString();
      
      const expiredSessions = await this.databases.listDocuments(
        this.DATABASE_ID,
        this.SESSIONS_COLLECTION_ID,
        [Query.lessThan('lastPing', expiredTime)]
      );

      // 批量刪除過期會話
      const deletePromises = expiredSessions.documents.map(session =>
        this.databases.deleteDocument(
          this.DATABASE_ID,
          this.SESSIONS_COLLECTION_ID,
          session.$id
        )
      );

      await Promise.all(deletePromises);

      if (expiredSessions.documents.length > 0) {
        console.log(`清理了 ${expiredSessions.documents.length} 個過期會話`);
      }

    } catch (error) {
      console.error('清理過期會話失敗:', error);
    }
  }

  // 更新統計數據
  private async updateStats(userId: string): Promise<void> {
    try {
      const statsDoc = await this.getOrCreateStatsDocument();
      const today = new Date().toDateString();
      const lastUpdated = new Date(statsDoc.lastUpdated || 0).toDateString();

      let updates: any = {};

      // 檢查是否是新的一天
      if (today !== lastUpdated) {
        updates.todayLogins = 1;
      } else {
        updates.todayLogins = (statsDoc.todayLogins || 0) + 1;
      }

      updates.thisMonthLogins = (statsDoc.thisMonthLogins || 0) + 1;

      // 檢查是否是新用戶
      if (!(await this.hasUserLoggedInBefore(userId))) {
        updates.totalUsers = (statsDoc.totalUsers || 0) + 1;
        await this.markUserAsLoggedIn(userId);
      }

      updates.lastUpdated = new Date().toISOString();

      await this.databases.updateDocument(
        this.DATABASE_ID,
        this.STATS_COLLECTION_ID,
        statsDoc.$id,
        updates
      );

    } catch (error) {
      console.error('更新統計數據失敗:', error);
    }
  }

  // 獲取或創建統計文檔
  private async getOrCreateStatsDocument(): Promise<any> {
    try {
      const stats = await this.databases.listDocuments(
        this.DATABASE_ID,
        this.STATS_COLLECTION_ID
      );

      if (stats.documents.length > 0) {
        return stats.documents[0];
      }

      // 創建新的統計文檔
      return await this.databases.createDocument(
        this.DATABASE_ID,
        this.STATS_COLLECTION_ID,
        ID.unique(),
        {
          totalUsers: 0,
          todayLogins: 0,
          thisMonthLogins: 0,
          lastUpdated: new Date().toISOString()
        }
      );

    } catch (error) {
      console.error('獲取統計文檔失敗:', error);
      throw error;
    }
  }

  // 檢查用戶是否之前登入過
  private async hasUserLoggedInBefore(userId: string): Promise<boolean> {
    try {
      const users = await this.databases.listDocuments(
        this.DATABASE_ID,
        'logged-users',
        [Query.equal('userId', userId)]
      );

      return users.documents.length > 0;
    } catch (error) {
      return false;
    }
  }

  // 標記用戶已登入過
  private async markUserAsLoggedIn(userId: string): Promise<void> {
    try {
      await this.databases.createDocument(
        this.DATABASE_ID,
        'logged-users',
        ID.unique(),
        {
          userId,
          firstLogin: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('標記用戶失敗:', error);
    }
  }

  // 自動 ping 系統
  private startPingSystem(): void {
    if (this.pingInterval) return;

    this.pingInterval = setInterval(async () => {
      if (this.currentSessionId) {
        await this.sendPing();
      }
    }, this.PING_INTERVAL);

    console.log(`Ping 系統已啟動，間隔: ${this.PING_INTERVAL / 1000} 秒`);
  }

  private stopPingSystem(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
      console.log('Ping 系統已停止');
    }
  }

  // 工具函數
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceInfo(): string {
    return `${navigator.userAgent} | ${window.screen.width}x${window.screen.height}`;
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  // 清理資源
  public cleanup(): void {
    this.stopPingSystem();
  }
}

export default AppwriteUserStatsService; 