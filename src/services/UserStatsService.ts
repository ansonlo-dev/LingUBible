interface UserStats {
  totalUsers: number;
  onlineUsers: number;
  todayLogins: number;
  thisMonthLogins: number;
  lastUpdated: string;
}

interface UserSession {
  userId: string;
  loginTime: number;
  lastActivity: number;
  sessionId: string;
}

class UserStatsService {
  private static instance: UserStatsService;
  private stats: UserStats;
  private sessions: Map<string, UserSession> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 分鐘無活動視為離線
  private readonly UPDATE_INTERVAL = 60 * 1000; // 每分鐘更新一次統計
  private isInitialized = false;

  private constructor() {
    this.stats = this.loadStatsFromStorage();
    this.loadSessionsFromStorage();
    this.startPeriodicUpdate();
    this.setupBeforeUnloadHandler();
    this.isInitialized = true;
    console.log('UserStatsService 初始化完成');
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
        // 檢查是否是今天的數據
        const today = new Date().toDateString();
        const lastUpdated = new Date(parsed.lastUpdated).toDateString();
        
        if (today !== lastUpdated) {
          // 新的一天，重置今日登入數
          parsed.todayLogins = 0;
          console.log('新的一天，重置今日登入數');
        }
        
        return parsed;
      }
    } catch (error) {
      console.error('載入用戶統計失敗:', error);
    }
    
    return {
      totalUsers: 0,
      onlineUsers: 0,
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
        
        // 清理過期會話
        Object.entries(sessions).forEach(([sessionId, session]: [string, any]) => {
          if (now - session.lastActivity < this.SESSION_TIMEOUT) {
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
      console.error('保存用戶統計失敗:', error);
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

  // 用戶登入
  public userLogin(userId: string): string {
    const now = Date.now();
    
    // 檢查是否已有活躍會話
    const existingSession = Array.from(this.sessions.values())
      .find(session => session.userId === userId && now - session.lastActivity < this.SESSION_TIMEOUT);
    
    if (existingSession) {
      // 更新現有會話的活動時間
      existingSession.lastActivity = now;
      this.saveSessionsToStorage();
      console.log(`用戶 ${userId} 已有活躍會話，更新活動時間`);
      return existingSession.sessionId;
    }
    
    // 創建新會話
    const sessionId = this.generateSessionId();
    
    // 新登入
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
      lastActivity: now,
      sessionId
    });
    
    this.updateOnlineUsersCount();
    this.saveStatsToStorage();
    this.saveSessionsToStorage();
    
    console.log(`用戶 ${userId} 登入，會話 ID: ${sessionId}，在線用戶數: ${this.stats.onlineUsers}`);
    return sessionId;
  }

  // 用戶登出
  public userLogout(sessionId: string): void {
    if (this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId);
      this.sessions.delete(sessionId);
      this.updateOnlineUsersCount();
      this.saveSessionsToStorage();
      console.log(`用戶 ${session?.userId} 登出，會話 ID: ${sessionId}，在線用戶數: ${this.stats.onlineUsers}`);
    } else {
      console.log(`嘗試登出不存在的會話: ${sessionId}`);
    }
  }

  // 更新用戶活動
  public updateUserActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
      this.saveSessionsToStorage();
      console.log(`更新用戶 ${session.userId} 活動時間`);
    } else {
      console.log(`嘗試更新不存在的會話活動: ${sessionId}`);
    }
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

  // 清理過期會話
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const beforeCount = this.sessions.size;
    
    const activeSessions = Array.from(this.sessions.values())
      .filter(session => now - session.lastActivity < this.SESSION_TIMEOUT);
    
    // 清理並重建會話 Map
    this.sessions.clear();
    activeSessions.forEach(session => {
      this.sessions.set(session.sessionId, session);
    });
    
    const afterCount = this.sessions.size;
    if (beforeCount !== afterCount) {
      console.log(`清理過期會話: ${beforeCount} -> ${afterCount}`);
      this.saveSessionsToStorage();
    }
  }

  // 更新在線用戶數（僅更新計數，不清理會話）
  private updateOnlineUsersCount(): void {
    const previousCount = this.stats.onlineUsers;
    this.stats.onlineUsers = this.sessions.size;
    this.stats.lastUpdated = new Date().toISOString();
    
    if (previousCount !== this.stats.onlineUsers) {
      console.log(`在線用戶數更新: ${previousCount} -> ${this.stats.onlineUsers}`);
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
  }

  // 設置頁面關閉處理
  private setupBeforeUnloadHandler(): void {
    window.addEventListener('beforeunload', () => {
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
  }

  // 獲取活躍會話列表（用於調試）
  public getActiveSessions(): UserSession[] {
    return Array.from(this.sessions.values());
  }

  // 獲取詳細統計信息（用於調試）
  public getDetailedStats(): any {
    return {
      stats: this.getStats(),
      activeSessions: this.getActiveSessions(),
      sessionCount: this.sessions.size,
      isInitialized: this.isInitialized
    };
  }

  // 重置所有數據（用於測試）
  public resetAllData(): void {
    console.log('開始重置所有用戶統計數據...');
    
    // 清除內存中的數據
    this.sessions.clear();
    this.stats = {
      totalUsers: 0,
      onlineUsers: 0,
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

  // 模擬增加用戶數據（用於演示，改進邏輯）
  public simulateUserActivity(): void {
    // 只有在已有用戶時才進行模擬活動
    if (this.sessions.size === 0) {
      console.log('沒有活躍用戶，跳過模擬活動');
      return;
    }
    
    const demoUsers = ['demo_user_1', 'demo_user_2', 'demo_user_3', 'demo_user_4', 'demo_user_5'];
    
    // 降低新用戶登入的機率
    if (Math.random() > 0.8) { // 20% 機率有新用戶登入
      const randomUser = demoUsers[Math.floor(Math.random() * demoUsers.length)];
      this.userLogin(randomUser);
    }
    
    // 模擬現有用戶活動
    const sessions = this.getActiveSessions();
    sessions.forEach(session => {
      if (Math.random() > 0.95) { // 5% 機率用戶登出
        this.userLogout(session.sessionId);
      } else if (Math.random() > 0.7) { // 30% 機率更新活動
        this.updateUserActivity(session.sessionId);
      }
    });
  }
}

export default UserStatsService; 