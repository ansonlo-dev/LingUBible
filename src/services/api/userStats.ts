interface UserStats {
  totalUsers: number;
  onlineUsers: number;
  onlineVisitors: number;
  todayLogins: number;
  thisMonthLogins: number;
  lastUpdated: string;
}

interface UserSession {
  userId: string | null;
  loginTime: number;
  lastPing: number;
  sessionId: string;
  isVisitor: boolean;
}

class UserStatsService {
  private static instance: UserStatsService;
  private stats: UserStats;
  private sessions: Map<string, UserSession> = new Map();
  private updateInterval: number | null = null;
  private pingInterval: number | null = null;
  private readonly SESSION_TIMEOUT = 2 * 60 * 1000; // 2 分鐘無 ping 視為離線（更短的超時時間）
  private readonly UPDATE_INTERVAL = 30 * 1000; // 每 30 秒更新一次統計
  private readonly PING_INTERVAL = 60 * 1000; // 每 60 秒發送一次 ping
  private isInitialized = false;
  private currentSessionId: string | null = null;

  private constructor() {
    this.stats = this.loadStatsFromStorage();
    this.loadSessionsFromStorage();
    this.startPeriodicUpdate();
    this.startPingSystem();
    this.setupBeforeUnloadHandler();
    this.isInitialized = true;
    
    // 如果當前沒有會話，創建訪客會話
    if (!this.currentSessionId) {
      this.createVisitorSession();
    }
    
    console.log('UserStatsService 初始化完成 (基於 Ping 系統)');
  }

  public static getInstance(): UserStatsService {
    if (!UserStatsService.instance) {
      UserStatsService.instance = new UserStatsService();
    }
    return UserStatsService.instance;
  }

  // 載入統計數據
  private loadStatsFromStorage(): UserStats {
    try {
      const stored = localStorage.getItem('userStats');
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // 檢查是否需要重置今日統計
        const today = new Date().toDateString();
        const lastUpdated = new Date(parsed.lastUpdated).toDateString();
        
        if (today !== lastUpdated) {
          parsed.todayLogins = 0;
          console.log('新的一天，重置今日登入統計');
        }
        
        // 確保有 onlineVisitors 欄位
        if (parsed.onlineVisitors === undefined) {
          parsed.onlineVisitors = 0;
        }
        
        return parsed;
      }
    } catch (error) {
      console.error('載入統計數據失敗:', error);
    }
    
    return {
      totalUsers: 0,
      onlineUsers: 0,
      onlineVisitors: 0,
      todayLogins: 0,
      thisMonthLogins: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  // 載入會話數據
  private loadSessionsFromStorage(): void {
    try {
      const stored = localStorage.getItem('userSessions');
      if (stored) {
        const sessions = JSON.parse(stored);
        const now = Date.now();
        let loadedCount = 0;
        
        // 清理過期會話（基於 lastPing）
        Object.entries(sessions).forEach(([sessionId, session]: [string, any]) => {
          if (now - session.lastPing < this.SESSION_TIMEOUT) {
            this.sessions.set(sessionId, session);
            loadedCount++;
          }
        });
        
        console.log(`載入了 ${loadedCount} 個活躍會話`);
        this.updateOnlineUsersCount();
      }
    } catch (error) {
      console.error('載入會話數據失敗:', error);
    }
  }

  // 保存統計數據
  private saveStatsToStorage(): void {
    try {
      localStorage.setItem('userStats', JSON.stringify(this.stats));
    } catch (error) {
      console.error('保存統計數據失敗:', error);
    }
  }

  // 保存會話數據
  private saveSessionsToStorage(): void {
    try {
      const sessionsObj = Object.fromEntries(this.sessions);
      localStorage.setItem('userSessions', JSON.stringify(sessionsObj));
    } catch (error) {
      console.error('保存會話數據失敗:', error);
    }
  }

  // 用戶登入 - 創建會話並開始 ping
  public userLogin(userId: string): string {
    const now = Date.now();
    
    // 檢查當前是否有訪客會話，如果有則轉換為用戶會話
    if (this.currentSessionId) {
      const currentSession = this.sessions.get(this.currentSessionId);
      if (currentSession && currentSession.isVisitor) {
        // 將訪客會話轉換為用戶會話
        currentSession.userId = userId;
        currentSession.isVisitor = false;
        currentSession.loginTime = now;
        currentSession.lastPing = now;
        
        // 新登入統計
        this.stats.todayLogins++;
        this.stats.thisMonthLogins++;
        
        // 檢查是否是新用戶
        if (!this.hasUserLoggedInBefore(userId)) {
          this.stats.totalUsers++;
          console.log(`新用戶 ${userId} 註冊，總用戶數: ${this.stats.totalUsers}`);
        }
        
        this.updateOnlineUsersCount();
        this.saveStatsToStorage();
        this.saveSessionsToStorage();
        
        console.log(`訪客轉換為用戶 ${userId}，會話 ID: ${this.currentSessionId}，在線用戶數: ${this.stats.onlineUsers}`);
        return this.currentSessionId;
      }
    }
    
    // 每次登入都創建新會話，不檢查是否已有活躍會話
    // 這樣可以正確追蹤不同設備上的同一用戶
    
    // 創建新會話
    const sessionId = this.generateSessionId();
    this.currentSessionId = sessionId;
    
    // 新登入統計
    this.stats.todayLogins++;
    this.stats.thisMonthLogins++;
    
    // 檢查是否是新用戶
    if (!this.hasUserLoggedInBefore(userId)) {
      this.stats.totalUsers++;
      console.log(`新用戶 ${userId} 註冊，總用戶數: ${this.stats.totalUsers}`);
    }
    
    // 創建會話
    this.sessions.set(sessionId, {
      userId,
      loginTime: now,
      lastPing: now,
      sessionId,
      isVisitor: false
    });
    
    this.updateOnlineUsersCount();
    this.saveStatsToStorage();
    this.saveSessionsToStorage();
    
    console.log(`用戶 ${userId} 登入，會話 ID: ${sessionId}，在線用戶數: ${this.stats.onlineUsers}`);
    return sessionId;
  }

  // 用戶登出 - 停止 ping 並移除會話
  public userLogout(sessionId: string): void {
    if (this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId);
      this.sessions.delete(sessionId);
      
      // 如果是當前會話，清除 currentSessionId
      if (this.currentSessionId === sessionId) {
        this.currentSessionId = null;
      }
      
      this.updateOnlineUsersCount();
      this.saveSessionsToStorage();
      console.log(`用戶 ${session?.userId} 登出，會話 ID: ${sessionId}，在線用戶數: ${this.stats.onlineUsers}`);
    } else {
      console.log(`嘗試登出不存在的會話: ${sessionId}`);
    }
  }

  // 發送 ping - 更新會話的最後 ping 時間
  public sendPing(sessionId?: string): boolean {
    const targetSessionId = sessionId || this.currentSessionId;
    
    if (!targetSessionId) {
      console.log('沒有活躍會話，無法發送 ping');
      return false;
    }
    
    const session = this.sessions.get(targetSessionId);
    if (session) {
      session.lastPing = Date.now();
      this.saveSessionsToStorage();
      console.log(`Ping 發送成功 - 用戶: ${session.userId}, 會話: ${targetSessionId}`);
      return true;
    } else {
      console.log(`嘗試 ping 不存在的會話: ${targetSessionId}`);
      return false;
    }
  }

  // 自動 ping 系統 - 為當前用戶自動發送 ping
  private startPingSystem(): void {
    this.pingInterval = setInterval(() => {
      if (this.currentSessionId) {
        this.sendPing();
      }
    }, this.PING_INTERVAL);
    
    console.log(`Ping 系統已啟動，間隔: ${this.PING_INTERVAL / 1000} 秒`);
  }

  // 獲取統計數據（不觸發更新，避免重複計算）
  public getStats(): UserStats {
    return { ...this.stats };
  }

  // 手動刷新統計數據
  public refreshStats(): UserStats {
    this.cleanupExpiredSessions();
    this.updateOnlineUsersCount();
    this.saveStatsToStorage();
    return { ...this.stats };
  }

  // 清理過期會話（基於 lastPing）
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const beforeCount = this.sessions.size;
    
    const activeSessions = Array.from(this.sessions.values())
      .filter(session => now - session.lastPing < this.SESSION_TIMEOUT);
    
    // 清理並重建會話 Map
    this.sessions.clear();
    activeSessions.forEach(session => {
      this.sessions.set(session.sessionId, session);
    });
    
    const afterCount = this.sessions.size;
    if (beforeCount !== afterCount) {
      console.log(`清理過期會話 (基於 ping): ${beforeCount} -> ${afterCount}`);
      this.saveSessionsToStorage();
    }
  }

  // 更新在線用戶數
  private updateOnlineUsersCount(): void {
    const previousUserCount = this.stats.onlineUsers;
    const previousVisitorCount = this.stats.onlineVisitors;
    
    // 分別計算登入用戶和訪客
    let userCount = 0;
    let visitorCount = 0;
    
    this.sessions.forEach(session => {
      if (session.isVisitor) {
        visitorCount++;
      } else {
        userCount++;
      }
    });
    
    this.stats.onlineUsers = userCount;
    this.stats.onlineVisitors = visitorCount;
    this.stats.lastUpdated = new Date().toISOString();
    
    if (previousUserCount !== this.stats.onlineUsers || previousVisitorCount !== this.stats.onlineVisitors) {
      console.log(`在線統計更新: 用戶 ${previousUserCount} -> ${this.stats.onlineUsers}, 訪客 ${previousVisitorCount} -> ${this.stats.onlineVisitors}`);
    }
  }

  // 檢查用戶是否之前登入過
  private hasUserLoggedInBefore(userId: string): boolean {
    try {
      const loggedUsers = JSON.parse(localStorage.getItem('loggedUsers') || '[]');
      if (loggedUsers.includes(userId)) {
        return true;
      }
      loggedUsers.push(userId);
      localStorage.setItem('loggedUsers', JSON.stringify(loggedUsers));
      return false;
    } catch {
      return false;
    }
  }

  // 生成會話 ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 開始定期更新
  private startPeriodicUpdate(): void {
    this.updateInterval = setInterval(() => {
      this.cleanupExpiredSessions();
      this.updateOnlineUsersCount();
      this.saveStatsToStorage();
    }, this.UPDATE_INTERVAL);
    
    console.log(`統計更新系統已啟動，間隔: ${this.UPDATE_INTERVAL / 1000} 秒`);
  }

  // 設置頁面關閉處理
  private setupBeforeUnloadHandler(): void {
    window.addEventListener('beforeunload', () => {
      // 頁面關閉時不立即移除會話，讓 ping 超時機制處理
      this.saveStatsToStorage();
      this.saveSessionsToStorage();
    });
  }

  // 清理資源
  public cleanup(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // 獲取活躍會話列表（用於調試）
  public getActiveSessions(): UserSession[] {
    return Array.from(this.sessions.values());
  }

  // 獲取詳細統計信息（用於調試）
  public getDetailedStats(): any {
    const now = Date.now();
    const sessions = this.getActiveSessions();
    
    return {
      stats: this.getStats(),
      activeSessions: sessions,
      sessionCount: this.sessions.size,
      isInitialized: this.isInitialized,
      currentSessionId: this.currentSessionId,
      pingInfo: sessions.map(session => ({
        userId: session.userId,
        sessionId: session.sessionId,
        lastPingAgo: Math.floor((now - session.lastPing) / 1000),
        isActive: (now - session.lastPing) < this.SESSION_TIMEOUT
      }))
    };
  }

  // 重置所有數據（用於測試）
  public resetAllData(): void {
    console.log('開始重置所有用戶統計數據...');
    
    // 清除內存中的數據
    this.sessions.clear();
    this.currentSessionId = null;
    this.stats = {
      totalUsers: 0,
      onlineUsers: 0,
      onlineVisitors: 0,
      todayLogins: 0,
      thisMonthLogins: 0,
      lastUpdated: new Date().toISOString()
    };
    
    // 清除 localStorage 中的所有相關數據
    try {
      localStorage.removeItem('userStats');
      localStorage.removeItem('userSessions');
      localStorage.removeItem('loggedUsers');
      console.log('localStorage 數據已清除');
    } catch (error) {
      console.error('清除 localStorage 失敗:', error);
    }
    
    // 立即保存空數據，確保持久化
    this.saveStatsToStorage();
    this.saveSessionsToStorage();
    
    console.log('所有用戶統計數據已重置完成');
  }

  // 模擬增加用戶數據（用於演示）
  public simulateUserActivity(): void {
    const demoUsers = ['demo_user_1', 'demo_user_2', 'demo_user_3', 'demo_user_4', 'demo_user_5'];
    
    // 20% 機率有新用戶登入
    if (Math.random() > 0.8) {
      const randomUser = demoUsers[Math.floor(Math.random() * demoUsers.length)];
      this.userLogin(randomUser);
    }
    
    // 模擬現有用戶的 ping 活動
    const sessions = this.getActiveSessions();
    sessions.forEach(session => {
      if (Math.random() > 0.95) { // 5% 機率用戶登出
        this.userLogout(session.sessionId);
      } else if (Math.random() > 0.7) { // 30% 機率發送 ping
        this.sendPing(session.sessionId);
      }
    });
  }

  // 更新用戶活動（保持向後兼容）
  public updateUserActivity(sessionId: string): void {
    // 將活動更新轉換為 ping
    this.sendPing(sessionId);
  }

  // 創建訪客會話
  private createVisitorSession(): string {
    const sessionId = this.generateSessionId();
    this.currentSessionId = sessionId;
    
    this.sessions.set(sessionId, {
      userId: null,
      loginTime: Date.now(),
      lastPing: Date.now(),
      sessionId,
      isVisitor: true
    });
    
    this.updateOnlineUsersCount();
    this.saveStatsToStorage();
    this.saveSessionsToStorage();
    
    console.log(`訪客會話創建，會話 ID: ${sessionId}，在線訪客數: ${this.stats.onlineVisitors}`);
    return sessionId;
  }

  // 公開方法：為訪客創建會話（供外部調用）
  public initVisitorSession(): string {
    if (!this.currentSessionId || !this.sessions.has(this.currentSessionId)) {
      return this.createVisitorSession();
    }
    return this.currentSessionId;
  }
}

export default UserStatsService; 