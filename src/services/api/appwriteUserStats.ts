import { Client, TablesDB, Functions, ID, Query } from 'appwrite';
import { Permission, Role } from 'appwrite';

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
  userId: string | null; // 允許 null 以支持訪客
  sessionId: string;
  loginTime: string;
  lastPing: string;
  deviceInfo?: string;
  ipAddress?: string;
  isVisitor: boolean; // 標記是否為訪客
}

class AppwriteUserStatsService {
  private static instance: AppwriteUserStatsService;
  private client: Client;
  private tablesDB: TablesDB;
  private functions: Functions;
  private activeSessions: Map<string, string> = new Map(); // userId -> sessionId
  private pingIntervals: Map<string, NodeJS.Timeout> = new Map(); // sessionId -> interval
  private readonly SESSION_TIMEOUT = 5 * 60 * 1000; // 5 分鐘（配合 2 分鐘 ping）
  private readonly PING_INTERVAL = 120 * 1000; // 120 秒（2 分鐘）
  private readonly BACKGROUND_PING_INTERVAL = 60 * 1000; // 背景標籤頁：60 秒
  private readonly CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 分鐘清理一次
  private cleanupTimer: NodeJS.Timeout | null = null; // 清理定時器
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

    this.tablesDB = new TablesDB(this.client);
    this.functions = new Functions(this.client);

    // 初始化 Web Worker
    this.initializeWebWorker();

    // 設置頁面可見性監聽器
    this.setupVisibilityListener();

    // 啟動定期清理機制
    this.startPeriodicCleanup();

    // 頁面卸載時清理資源
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // 頁面隱藏時發送最後一次 ping
    window.addEventListener('pagehide', () => {
      this.sendFinalPings();
    });


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

      console.log('AppwriteUserStats: 用戶登入', { userId, sessionId });

      // 檢查是否已有活躍的用戶會話
      const existingUserSessions = await this.tablesDB.listRows({
        databaseId: this.DATABASE_ID,
        tableId: this.SESSIONS_COLLECTION_ID,
        queries: [
          Query.equal('userId', userId),
          Query.equal('isVisitor', false),
          Query.greaterThan('lastPing', new Date(Date.now() - this.SESSION_TIMEOUT).toISOString())
        ]
      });

      if (existingUserSessions.rows.length > 0) {
        // 更新現有用戶會話
        const existingSession = existingUserSessions.rows[0];
        await this.tablesDB.updateRow({
          databaseId: this.DATABASE_ID,
          tableId: this.SESSIONS_COLLECTION_ID,
          rowId: existingSession.$id,
          data: {
            lastPing: now,
            sessionId: sessionId
          }
        });
        
        // 停止舊的 ping 系統
        const oldSessionId = this.activeSessions.get(userId);
        if (oldSessionId) {
          this.stopPingForSession(oldSessionId);
        }
        
        // 更新會話映射
        this.activeSessions.set(userId, sessionId);
        this.startPingForSession(sessionId);
        
        console.log(`AppwriteUserStats: 用戶 ${userId} 已有活躍會話，更新 ping 時間`);
        
        // 清理當前設備的活躍訪客會話（避免雙重計算）
        await this.cleanupCurrentDeviceVisitorSessions();
        
        return sessionId;
      }

      // 檢查是否有訪客會話需要轉換
      const visitorSessions = await this.tablesDB.listRows({
        databaseId: this.DATABASE_ID,
        tableId: this.SESSIONS_COLLECTION_ID,
        queries: [
          Query.equal('isVisitor', true),
          Query.greaterThan('lastPing', new Date(Date.now() - this.SESSION_TIMEOUT).toISOString())
        ]
      });

      if (visitorSessions.rows.length > 0) {
        const currentDeviceInfo = this.getDeviceInfo();
        
        // 查找當前設備的訪客會話
        const currentDeviceVisitorSession = visitorSessions.rows.find(
          session => session.deviceInfo === currentDeviceInfo
        );

        if (currentDeviceVisitorSession) {
          // 轉換當前設備的訪客會話為用戶會話
          await this.tablesDB.updateRow({
            databaseId: this.DATABASE_ID,
            tableId: this.SESSIONS_COLLECTION_ID,
            rowId: currentDeviceVisitorSession.$id,
            data: {
              userId: userId,
              isVisitor: false,
              loginTime: now,
              lastPing: now,
              sessionId: sessionId
            },
            permissions: [
              // 更新文檔級權限
              Permission.read(Role.user(userId)),
              Permission.update(Role.user(userId)),
              Permission.delete(Role.user(userId))
            ]
          });

          // 更新會話映射
          this.activeSessions.set(userId, sessionId);
          this.startPingForSession(sessionId);

          console.log(`AppwriteUserStats: 當前設備的訪客會話已轉換為用戶會話`, { userId, sessionId });
          return sessionId;
        } else {
          // 如果沒有找到當前設備的訪客會話，清理當前設備的訪客會話並創建新的用戶會話
          console.log('AppwriteUserStats: 沒有找到當前設備的訪客會話，將創建新的用戶會話');
        }
      }

      // 創建新的用戶會話
      const sessionData = {
        userId,
        sessionId,
        loginTime: now,
        lastPing: now,
        deviceInfo: this.getDeviceInfo(),
        ipAddress: await this.getClientIP(),
        isVisitor: false
      };

      await this.tablesDB.createRow({
        databaseId: this.DATABASE_ID,
        tableId: this.SESSIONS_COLLECTION_ID,
        rowId: ID.unique(),
        data: sessionData,
        permissions: [
          // 文檔級權限：只有創建者可以訪問
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId))
        ]
      });

      // 更新會話映射
      this.activeSessions.set(userId, sessionId);
      
      // 更新統計數據
      await this.updateStats(userId);
      
      // 開始 ping 系統
      this.startPingForSession(sessionId);

      // 清理當前設備的活躍訪客會話（避免雙重計算）
      await this.cleanupCurrentDeviceVisitorSessions();

      console.log(`AppwriteUserStats: 用戶 ${userId} 登入成功，會話 ID: ${sessionId}`);
      return sessionId;

    } catch (error) {
      console.error('AppwriteUserStats: 用戶登入失敗:', error);
      throw error;
    }
  }

  // 用戶登出 - 移除會話記錄
  public async userLogout(sessionId?: string): Promise<void> {
    try {
      // 如果沒有提供 sessionId，嘗試找到當前用戶的會話
      const targetSessionId = sessionId;
      
      if (!targetSessionId) {
        // 查找當前用戶的會話（這裡需要用戶 ID，但我們沒有，所以保持原邏輯）
        console.log('沒有提供會話 ID，無法登出');
        return;
      }

      // 查找並刪除會話
      const sessions = await this.tablesDB.listRows({
        databaseId: this.DATABASE_ID,
        tableId: this.SESSIONS_COLLECTION_ID,
        queries: [Query.equal('sessionId', targetSessionId)]
      });

      if (sessions.rows.length > 0) {
        const session = sessions.rows[0] as unknown as UserSession;
        
        await this.tablesDB.deleteRow({
          databaseId: this.DATABASE_ID,
          tableId: this.SESSIONS_COLLECTION_ID,
          rowId: sessions.rows[0].$id
        });

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

      const sessions = await this.tablesDB.listRows({
        databaseId: this.DATABASE_ID,
        tableId: this.SESSIONS_COLLECTION_ID,
        queries: [Query.equal('sessionId', sessionId)]
      });

      if (sessions.rows.length > 0) {
        await this.tablesDB.updateRow({
          databaseId: this.DATABASE_ID,
          tableId: this.SESSIONS_COLLECTION_ID,
          rowId: sessions.rows[0].$id,
          data: {
            lastPing: new Date().toISOString()
          }
        });

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

  // 獲取統計數據 - 使用 Function（更安全）
  async getStatsViaFunction(): Promise<UserStats & { _backendData?: any }> {
    try {
  
      
      // 移除每次獲取統計時的清理操作，避免頻繁調用
      // await this.cleanupExpiredSessions();
      
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
      
      // 如果 Function 失敗，嘗試使用本地方法
      console.log('AppwriteUserStats: 嘗試使用本地方法獲取統計數據...');
      return await this.getStats();
    }
  }

  // 獲取統計數據 - 直接查詢（需要適當權限）
  async getStats(): Promise<UserStats> {
    try {
      console.log('AppwriteUserStats: 獲取統計數據...');
      
      // 清理過期會話
      await this.cleanupExpiredSessions();
      
      const cutoffTime = new Date(Date.now() - this.SESSION_TIMEOUT).toISOString();
      
      // 獲取活躍會話
      const activeSessions = await this.tablesDB.listRows({
        databaseId: this.DATABASE_ID,
        tableId: this.SESSIONS_COLLECTION_ID,
        queries: [Query.greaterThan('lastPing', cutoffTime)]
      });
      
      console.log('AppwriteUserStats: 活躍會話', activeSessions.rows);
      
      // 分別計算用戶和訪客
      let onlineUsers = 0;
      let onlineVisitors = 0;
      
      activeSessions.rows.forEach(session => {
        if (session.isVisitor) {
          onlineVisitors++;
        } else {
          onlineUsers++;
        }
      });
      
      // 獲取總用戶數（這需要訪問用戶集合的權限）
      let totalUsers = 0;
      try {
        const users = await this.tablesDB.listRows({
          databaseId: this.DATABASE_ID,
          tableId: 'users', // 假設用戶集合名稱
          queries: [Query.limit(1)]
        });
        totalUsers = users.total;
      } catch (error) {
        console.warn('無法獲取總用戶數:', error);
      }
      
      const stats: UserStats = {
        totalUsers,
        onlineUsers,
        onlineVisitors,
        todayLogins: 0, // 需要額外的查詢來計算
        thisMonthLogins: 0, // 需要額外的查詢來計算
        lastUpdated: new Date().toISOString()
      };
      
      console.log('AppwriteUserStats: 統計數據', stats);
      return stats;
      
    } catch (error) {
      console.error('獲取統計數據失敗:', error);
      
      // 返回默認值
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
      
      const expiredSessions = await this.tablesDB.listRows({
        databaseId: this.DATABASE_ID,
        tableId: this.SESSIONS_COLLECTION_ID,
        queries: [Query.lessThan('lastPing', expiredTime)]
      });

      // 批量刪除過期會話
      const deletePromises = expiredSessions.rows.map(session =>
        this.tablesDB.deleteRow({
          databaseId: this.DATABASE_ID,
          tableId: this.SESSIONS_COLLECTION_ID,
          rowId: session.$id
        })
      );

      await Promise.all(deletePromises);

      if (expiredSessions.rows.length > 0) {
        console.log(`🧹 清理了 ${expiredSessions.rows.length} 個過期會話`);
      }

    } catch (error) {
      console.error('清理過期會話失敗:', error);
    }
  }

  // 啟動定期清理機制
  private startPeriodicCleanup(): void {
    // 立即執行一次清理
    this.cleanupExpiredSessions().catch(error => {
      console.error('初始清理失敗:', error);
    });

    // 設置定期清理
    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanupExpiredSessions();
      } catch (error) {
        console.error('定期清理失敗:', error);
      }
    }, this.CLEANUP_INTERVAL);

    
  }

  // 停止定期清理
  private stopPeriodicCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      console.log('🛑 定期清理已停止');
    }
  }

  // 更新統計數據
  private async updateStats(userId: string): Promise<void> {
    try {
      const statsDoc = await this.getOrCreateStatsDocument();
      const today = new Date().toDateString();
      const lastUpdated = new Date(statsDoc.lastUpdated || 0).toDateString();

      const updates: any = {};

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

      await this.tablesDB.updateRow({
        databaseId: this.DATABASE_ID,
        tableId: this.STATS_COLLECTION_ID,
        rowId: statsDoc.$id,
        data: updates
      });

    } catch (error) {
      console.error('更新統計數據失敗:', error);
    }
  }

  // 獲取或創建統計文檔
  private async getOrCreateStatsDocument(): Promise<any> {
    try {
      const stats = await this.tablesDB.listRows({
        databaseId: this.DATABASE_ID,
        tableId: this.STATS_COLLECTION_ID
      });

      if (stats.rows.length > 0) {
        return stats.rows[0];
      }

      // 創建新的統計文檔
      return await this.tablesDB.createRow({
        databaseId: this.DATABASE_ID,
        tableId: this.STATS_COLLECTION_ID,
        rowId: ID.unique(),
        data: {
          totalUsers: 0,
          todayLogins: 0,
          thisMonthLogins: 0,
          lastUpdated: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('獲取統計文檔失敗:', error);
      throw error;
    }
  }

  // 檢查用戶是否之前登入過
  private async hasUserLoggedInBefore(userId: string): Promise<boolean> {
    try {
      const users = await this.tablesDB.listRows({
        databaseId: this.DATABASE_ID,
        tableId: 'logged-users',
        queries: [Query.equal('userId', userId)]
      });

      return users.rows.length > 0;
    } catch (error) {
      return false;
    }
  }

  // 標記用戶已登入過
  private async markUserAsLoggedIn(userId: string): Promise<void> {
    try {
      await this.tablesDB.createRow({
        databaseId: this.DATABASE_ID,
        tableId: 'logged-users',
        rowId: ID.unique(),
        data: {
          userId,
          firstLogin: new Date().toISOString()
        }
      });
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


      } catch (error) {
        console.error('Web Worker 初始化失敗:', error);
        this.useWebWorker = false;
      }
    } else {
      
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

    // 停止定期清理
    this.stopPeriodicCleanup();

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

  // 創建或重用訪客會話
  public async createVisitorSession(): Promise<string> {
    try {
      const currentDeviceInfo = this.getDeviceInfo();
      const cutoffTime = new Date(Date.now() - this.SESSION_TIMEOUT).toISOString();
      
  
      
      // 首先檢查是否已有當前設備的活躍訪客會話
      const existingVisitorSessions = await this.tablesDB.listRows({
        databaseId: this.DATABASE_ID,
        tableId: this.SESSIONS_COLLECTION_ID,
        queries: [
          Query.equal('isVisitor', true),
          Query.greaterThan('lastPing', cutoffTime)
        ]
      });

      // 查找當前設備的活躍訪客會話
      const currentDeviceSession = existingVisitorSessions.rows.find(
        session => session.deviceInfo === currentDeviceInfo
      );

      if (currentDeviceSession) {
        // 重用現有會話，更新 ping 時間
        const now = new Date().toISOString();
        await this.tablesDB.updateRow({
          databaseId: this.DATABASE_ID,
          tableId: this.SESSIONS_COLLECTION_ID,
          rowId: currentDeviceSession.$id,
          data: {
            lastPing: now
          }
        });

        // 開始 ping 系統
        this.startPingForSession(currentDeviceSession.sessionId);
        

        return currentDeviceSession.sessionId;
      }

      // 如果沒有現有會話，創建新的訪客會話
      const sessionId = this.generateSessionId();
      const now = new Date().toISOString();
      
      console.log('AppwriteUserStats: 創建新的訪客會話', { sessionId });
      
      const sessionData = {
        sessionId,
        userId: "", // 空字符串而不是 null
        isVisitor: true,
        loginTime: now,
        lastPing: now,
        deviceInfo: currentDeviceInfo,
        ipAddress: await this.getClientIP()
      };
      
      const session = await this.tablesDB.createRow({
        databaseId: this.DATABASE_ID,
        tableId: this.SESSIONS_COLLECTION_ID,
        rowId: ID.unique(),
        data: sessionData,
        permissions: [
          // 文檔級權限：允許任何人讀取和更新訪客會話
          Permission.read(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any())
        ]
      });
      
      // 開始 ping 系統
      this.startPingForSession(sessionId);
      
      console.log('AppwriteUserStats: 新訪客會話已創建', session);
      return sessionId;
    } catch (error) {
      console.error('AppwriteUserStats: 創建/重用訪客會話失敗:', error);
      throw error;
    }
  }

  // 將訪客會話轉換為用戶會話
  public async convertVisitorToUser(visitorSessionId: string, userId: string): Promise<string> {
    try {
      const now = new Date().toISOString();
      
      // 查找訪客會話
      const sessions = await this.tablesDB.listRows({
        databaseId: this.DATABASE_ID,
        tableId: this.SESSIONS_COLLECTION_ID,
        queries: [Query.equal('sessionId', visitorSessionId)]
      });

      if (sessions.rows.length > 0) {
        const session = sessions.rows[0] as unknown as UserSession;
        
        if (session.isVisitor) {
          // 轉換為用戶會話
          await this.tablesDB.updateRow({
            databaseId: this.DATABASE_ID,
            tableId: this.SESSIONS_COLLECTION_ID,
            rowId: session.$id!,
            data: {
              userId: userId,
              isVisitor: false,
              lastPing: now
            }
          });

          // 更新會話映射
          this.activeSessions.set(userId, visitorSessionId);
          
          // 更新統計數據
          await this.updateStats(userId);

          console.log(`訪客會話 ${visitorSessionId} 已轉換為用戶 ${userId} 的會話`);
          return visitorSessionId;
        }
      }

      // 如果找不到訪客會話，創建新的用戶會話
      return await this.userLogin(userId);

    } catch (error) {
      console.error('轉換訪客會話失敗:', error);
      // 如果轉換失敗，創建新的用戶會話
      return await this.userLogin(userId);
    }
  }

  // 清理當前設備的活躍訪客會話（避免雙重計算）
  private async cleanupCurrentDeviceVisitorSessions(): Promise<void> {
    try {
      const cutoffTime = new Date(Date.now() - this.SESSION_TIMEOUT).toISOString();
      const currentDeviceInfo = this.getDeviceInfo();
      
      const visitorSessions = await this.tablesDB.listRows({
        databaseId: this.DATABASE_ID,
        tableId: this.SESSIONS_COLLECTION_ID,
        queries: [
          Query.equal('isVisitor', true),
          Query.greaterThan('lastPing', cutoffTime)
        ]
      });

      // 只刪除當前設備的訪客會話
      const currentDeviceVisitorSessions = visitorSessions.rows.filter(
        session => session.deviceInfo === currentDeviceInfo
      );

      const deletePromises = currentDeviceVisitorSessions.map(session =>
        this.tablesDB.deleteRow({
          databaseId: this.DATABASE_ID,
          tableId: this.SESSIONS_COLLECTION_ID,
          rowId: session.$id
        })
      );

      await Promise.all(deletePromises);

      if (currentDeviceVisitorSessions.length > 0) {
        console.log(`清理了當前設備的 ${currentDeviceVisitorSessions.length} 個訪客會話`);
      }

    } catch (error) {
      console.error('清理當前設備訪客會話失敗:', error);
    }
  }
}

export default AppwriteUserStatsService; 