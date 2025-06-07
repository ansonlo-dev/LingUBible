import { Client, Databases, Functions, ID, Query } from 'appwrite';

interface UserStats {
  totalUsers: number;
  onlineUsers: number;
  onlineVisitors: number;
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
  private activeSessions: Map<string, string> = new Map(); // userId -> sessionId
  private pingIntervals: Map<string, number> = new Map(); // sessionId -> interval
  private readonly SESSION_TIMEOUT = 5 * 60 * 1000; // 5 分鐘（配合 2 分鐘 ping）
  private readonly PING_INTERVAL = 120 * 1000; // 120 秒（2 分鐘）
  private readonly BACKGROUND_PING_INTERVAL = 60 * 1000; // 背景標籤頁：60 秒
  private readonly DATABASE_ID = 'user-stats-db';
  private readonly SESSIONS_COLLECTION_ID = 'user-sessions';
  private readonly STATS_COLLECTION_ID = 'user-stats';
  private visibilityChangeHandler: (() => void) | null = null;
  private pingWorker: Worker | null = null;
  private useWebWorker: boolean = true; // 是否使用 Web Worker

  private constructor() {
    this.client = new Client()
      .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
      .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

    this.databases = new Databases(this.client);
    this.functions = new Functions(this.client);

    // 初始化 Web Worker
    this.initializeWebWorker();

    // 設置頁面可見性監聽器
    this.setupVisibilityListener();

    // 頁面卸載時清理資源
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // 頁面隱藏時發送最後一次 ping
    window.addEventListener('pagehide', () => {
      this.sendFinalPings();
    });

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
        
        // 停止舊的 ping 系統
        const oldSessionId = this.activeSessions.get(userId);
        if (oldSessionId) {
          this.stopPingForSession(oldSessionId);
        }
        
        // 更新會話映射
        this.activeSessions.set(userId, sessionId);
        this.startPingForSession(sessionId);
        
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

      // 更新會話映射
      this.activeSessions.set(userId, sessionId);
      
      // 更新統計數據
      await this.updateStats(userId);
      
      // 開始 ping 系統
      this.startPingForSession(sessionId);

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
      // 如果沒有提供 sessionId，嘗試找到當前用戶的會話
      let targetSessionId = sessionId;
      
      if (!targetSessionId) {
        // 查找當前用戶的會話（這裡需要用戶 ID，但我們沒有，所以保持原邏輯）
        console.log('沒有提供會話 ID，無法登出');
        return;
      }

      // 查找並刪除會話
      const sessions = await this.databases.listDocuments(
        this.DATABASE_ID,
        this.SESSIONS_COLLECTION_ID,
        [Query.equal('sessionId', targetSessionId)]
      );

      if (sessions.documents.length > 0) {
        const session = sessions.documents[0] as unknown as UserSession;
        
        await this.databases.deleteDocument(
          this.DATABASE_ID,
          this.SESSIONS_COLLECTION_ID,
          sessions.documents[0].$id
        );

        // 清理會話映射
        this.activeSessions.delete(session.userId);
        this.stopPingForSession(targetSessionId);

        console.log(`會話 ${targetSessionId} 已登出`);
      }

    } catch (error) {
      console.error('用戶登出失敗:', error);
      throw error;
    }
  }

  // 發送 ping - 更新會話的最後 ping 時間
  public async sendPing(sessionId?: string): Promise<boolean> {
    try {
      if (!sessionId) {
        console.log('沒有提供會話 ID，無法發送 ping');
        return false;
      }

      const sessions = await this.databases.listDocuments(
        this.DATABASE_ID,
        this.SESSIONS_COLLECTION_ID,
        [Query.equal('sessionId', sessionId)]
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

        console.log(`Ping 發送成功 - 會話: ${sessionId}`);
        return true;
      } else {
        console.log(`會話不存在: ${sessionId}`);
        // 會話不存在，停止對應的 ping
        this.stopPingForSession(sessionId);
        return false;
      }

    } catch (error) {
      console.error('發送 ping 失敗:', error);
      return false;
    }
  }

  // 獲取統計數據 - 只有在有活動會話時才執行
  public async getStats(): Promise<UserStats> {
    try {
      // 檢查是否有活動會話，如果沒有則返回默認值
      if (this.activeSessions.size === 0) {
        console.log('AppwriteUserStatsService: 無活動會話，返回默認統計數據');
        return {
          totalUsers: 0,
          onlineUsers: 0,
          onlineVisitors: 0,
          todayLogins: 0,
          thisMonthLogins: 0,
          lastUpdated: new Date().toISOString()
        };
      }

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
        onlineVisitors: statsDoc.onlineVisitors || 0,
        todayLogins: statsDoc.todayLogins || 0,
        thisMonthLogins: statsDoc.thisMonthLogins || 0,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('獲取統計數據失敗:', error);
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

  // 初始化 Web Worker
  private initializeWebWorker(): void {
    if (typeof Worker !== 'undefined' && this.useWebWorker) {
      try {
        this.pingWorker = new Worker('/ping-worker.js');
        
        this.pingWorker.onmessage = (e) => {
          const { type, data } = e.data;
          
          switch (type) {
            case 'PING_SUCCESS':
              console.log(`Worker ping 成功 - 會話: ${data.sessionId}`);
              break;
            case 'PING_ERROR':
              console.error(`Worker ping 失敗 - 會話: ${data.sessionId}:`, data.error);
              break;
            case 'WORKER_STATUS':
              console.log('Worker 狀態:', data);
              break;
          }
        };

        this.pingWorker.onerror = (error) => {
          console.error('Web Worker 錯誤:', error);
          this.useWebWorker = false;
          this.pingWorker = null;
        };

        console.log('Web Worker 初始化成功');
      } catch (error) {
        console.error('Web Worker 初始化失敗:', error);
        this.useWebWorker = false;
      }
    } else {
      console.log('Web Worker 不可用，使用傳統 ping 方式');
      this.useWebWorker = false;
    }
  }

  // 設置頁面可見性監聽器
  private setupVisibilityListener(): void {
    if (typeof document.hidden !== 'undefined') {
      this.visibilityChangeHandler = () => {
        if (document.hidden) {
          console.log('標籤頁變為背景，切換到 Web Worker ping');
          this.switchToWorkerPing();
        } else {
          console.log('標籤頁變為前景，切換到主線程 ping');
          this.switchToMainThreadPing();
        }
      };

      document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    }
  }

  // 切換到 Web Worker ping
  private switchToWorkerPing(): void {
    if (!this.pingWorker || !this.useWebWorker) {
      // 如果沒有 Worker，使用調整後的主線程 ping
      this.adjustPingForBackground();
      return;
    }

    // 停止主線程的 ping
    this.pingIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.pingIntervals.clear();

    // 啟動 Worker ping
    this.activeSessions.forEach((sessionId) => {
      this.pingWorker!.postMessage({
        type: 'START_PING',
        data: {
          sessionId,
          interval: this.BACKGROUND_PING_INTERVAL,
          endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
          projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID
        }
      });
    });
  }

  // 切換到主線程 ping
  private switchToMainThreadPing(): void {
    // 停止 Worker ping
    if (this.pingWorker && this.useWebWorker) {
      this.pingWorker.postMessage({ type: 'STOP_PING' });
    }

    // 重新啟動主線程 ping
    this.activeSessions.forEach((sessionId) => {
      this.startPingForSession(sessionId);
    });
  }

  // 調整背景標籤頁的 ping 策略（備用方案）
  private adjustPingForBackground(): void {
    this.pingIntervals.forEach((interval, sessionId) => {
      clearInterval(interval);
      
      // 使用更短的間隔來對抗瀏覽器限制
      const newInterval = setInterval(async () => {
        await this.sendPing(sessionId);
      }, this.BACKGROUND_PING_INTERVAL);

      this.pingIntervals.set(sessionId, newInterval);
    });
  }

  // 恢復前景標籤頁的正常 ping（備用方案）
  private adjustPingForForeground(): void {
    this.pingIntervals.forEach((interval, sessionId) => {
      clearInterval(interval);
      
      // 恢復正常間隔
      const newInterval = setInterval(async () => {
        await this.sendPing(sessionId);
      }, this.PING_INTERVAL);

      this.pingIntervals.set(sessionId, newInterval);
    });
  }

  // 頁面隱藏時發送最後一次 ping
  private sendFinalPings(): void {
    this.activeSessions.forEach(async (sessionId) => {
      try {
        await this.sendPing(sessionId);
        console.log(`發送最後一次 ping - 會話: ${sessionId}`);
      } catch (error) {
        console.error('發送最後 ping 失敗:', error);
      }
    });
  }

  // 自動 ping 系統
  private startPingForSession(sessionId: string): void {
    if (this.pingIntervals.has(sessionId)) return;

    // 如果頁面在背景且有 Worker，使用 Worker
    if (document.hidden && this.pingWorker && this.useWebWorker) {
      this.pingWorker.postMessage({
        type: 'START_PING',
        data: {
          sessionId,
          interval: this.BACKGROUND_PING_INTERVAL,
          endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
          projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID
        }
      });
      return;
    }

    // 根據當前頁面狀態選擇間隔
    const interval = document.hidden ? this.BACKGROUND_PING_INTERVAL : this.PING_INTERVAL;
    
    const pingInterval = setInterval(async () => {
      await this.sendPing(sessionId);
    }, interval);

    this.pingIntervals.set(sessionId, pingInterval);
    console.log(`Ping 系統已啟動，會話: ${sessionId}，間隔: ${interval / 1000} 秒`);
  }

  private stopPingForSession(sessionId: string): void {
    // 停止主線程 ping
    if (this.pingIntervals.has(sessionId)) {
      clearInterval(this.pingIntervals.get(sessionId));
      this.pingIntervals.delete(sessionId);
      console.log(`主線程 Ping 系統已停止 - 會話: ${sessionId}`);
    }

    // 停止 Worker ping
    if (this.pingWorker && this.useWebWorker) {
      this.pingWorker.postMessage({ type: 'STOP_PING' });
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
    this.pingIntervals.forEach((interval, sessionId) => {
      clearInterval(interval);
    });
    this.pingIntervals.clear();

    // 清理 Web Worker
    if (this.pingWorker) {
      this.pingWorker.postMessage({ type: 'STOP_PING' });
      this.pingWorker.terminate();
      this.pingWorker = null;
    }

    // 移除事件監聽器
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }
  }
}

export default AppwriteUserStatsService; 