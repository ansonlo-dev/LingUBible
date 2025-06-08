import { useState, useEffect, useCallback, useRef } from 'react';
import AppwriteUserStatsService from "@/services/api/appwriteUserStats";
import UserStatsService from "@/services/api/userStats";
import { useAuth } from "@/contexts/AuthContext";

interface UserStats {
  totalUsers: number;
  onlineUsers: number;
  onlineVisitors: number;
  todayLogins: number;
  thisMonthLogins: number;
  lastUpdated: string;
}

// 添加原始後端數據接口
interface BackendUserStats {
  totalRegisteredUsers: number;
  newUsersLast30Days: number;
  verifiedUsers: number;
  onlineUsers: number;
  onlineVisitors: number;
  todayLogins: number;
  thisMonthLogins: number;
  lastUpdated: string;
}

// 開發環境檢測
const isDevelopment = (import.meta.env.DEV || window.location.hostname === 'localhost') 
  && !import.meta.env.VITE_FORCE_REAL_STATS; // 允許通過環境變數強制啟用真實統計

// 模擬統計數據（開發環境使用）
const mockStats: UserStats = {
  totalUsers: 42,
  onlineUsers: 3,
  onlineVisitors: 2,
  todayLogins: 8,
  thisMonthLogins: 156,
  lastUpdated: new Date().toISOString()
};

// 全局緩存變數
let globalStatsCache: UserStats | null = null;
let globalBackendStatsCache: BackendUserStats | null = null; // 添加原始後端數據緩存
let lastFetchTime = 0;
let isCurrentlyFetching = false;
let globalIntervalId: NodeJS.Timeout | null = null;
let instanceCount = 0; // 追蹤實例數量
const CACHE_DURATION = 5 * 60 * 1000; // 5分鐘緩存
const UPDATE_INTERVAL = 2 * 60 * 1000; // 2分鐘更新間隔（大幅減少）
const EVENT_THROTTLE_TIME = 10 * 1000; // 事件節流：10秒內最多處理一次

// 事件節流
let lastEventTime = 0;

export function useUserStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>(() => {
    // 開發環境直接使用模擬數據
    if (isDevelopment) {
      return mockStats;
    }
    
    // 如果有緩存，直接使用但確保合理性
    if (globalStatsCache) {
      return {
        ...globalStatsCache,
        onlineUsers: Math.max(globalStatsCache.onlineUsers || 0, 0),
        onlineVisitors: Math.max(globalStatsCache.onlineVisitors || 0, 1), // 至少有當前訪客
        totalUsers: Math.max(globalStatsCache.totalUsers || 0, 0)
      };
    }
    
    // 首次訪問時提供合理的初始值，而不是全部為 0
    return {
      totalUsers: 0,
      onlineUsers: 1, // 至少有當前訪客
      onlineVisitors: 1, // 當前訪客
      todayLogins: 0,
      thisMonthLogins: 0,
      lastUpdated: new Date().toISOString()
    };
  });
  
  // 優化載入狀態：只在真正需要等待時才顯示載入
  const [isLoading, setIsLoading] = useState(() => {
    // 開發環境或有緩存時不顯示載入
    if (isDevelopment || globalStatsCache) {
      return false;
    }
    // 首次訪問時也不顯示載入，而是在背景獲取數據
    return false;
  });
  
  const isInitializedRef = useRef(false);
  const instanceIdRef = useRef(++instanceCount);

  const appwriteUserStatsService = AppwriteUserStatsService.getInstance();
  const localUserStatsService = UserStatsService.getInstance();

  // 檢查是否需要更新緩存
  const shouldUpdateCache = useCallback(() => {
    const now = Date.now();
    return !globalStatsCache || (now - lastFetchTime) > CACHE_DURATION;
  }, []);

  // 更新統計數據 - 使用全局緩存避免重複調用
  const updateStats = useCallback(async (forceUpdate = false, showLoading = false) => {
    // 開發環境使用模擬數據，避免調用 Appwrite
    if (isDevelopment) {
      const devStats = {
        ...mockStats,
        onlineUsers: Math.floor(Math.random() * 5) + 1,
        onlineVisitors: Math.floor(Math.random() * 3) + 1,
        lastUpdated: new Date().toISOString()
      };
      setStats(devStats);
      setIsLoading(false);
      return;
    }

    // 如果正在獲取中，直接返回
    if (isCurrentlyFetching && !forceUpdate) {
      return;
    }

    // 檢查緩存是否仍然有效
    if (!forceUpdate && !shouldUpdateCache()) {
      if (globalStatsCache) {
        // 確保緩存數據的合理性：至少有當前訪客
        const adjustedCacheStats = {
          ...globalStatsCache,
          onlineUsers: Math.max(globalStatsCache.onlineUsers || 0, 0),
          onlineVisitors: Math.max(globalStatsCache.onlineVisitors || 0, 1), // 至少有當前訪客
          totalUsers: Math.max(globalStatsCache.totalUsers || 0, 0)
        };
        setStats(adjustedCacheStats);
        setIsLoading(false);
      }
      return;
    }

    // 只在明確要求時才顯示載入狀態
    if (showLoading) {
      setIsLoading(true);
    }

    isCurrentlyFetching = true;
    
    try {
      // 優先使用 Function 方法（更安全）
      let globalStats;
      try {
        globalStats = await appwriteUserStatsService.getStatsViaFunction();
        
        // 保存原始後端數據
        if (globalStats._backendData) {
          globalBackendStatsCache = globalStats._backendData;
        }
      } catch (error) {
        globalStats = await appwriteUserStatsService.getStats();
      }
      
      // 更新全局緩存
      globalStatsCache = globalStats;
      lastFetchTime = Date.now();
      
      // 確保在線數據的合理性：至少有當前訪客
      const adjustedStats = {
        ...globalStats,
        onlineUsers: Math.max(globalStats.onlineUsers || 0, 0),
        onlineVisitors: Math.max(globalStats.onlineVisitors || 0, 1), // 至少有當前訪客
        totalUsers: Math.max(globalStats.totalUsers || 0, 0)
      };
      
      setStats(adjustedStats);
      setIsLoading(false);
      
    } catch (error) {
      console.error('Hook: 獲取統計數據失敗:', error);
      
      // 如果有緩存，繼續使用緩存
      if (globalStatsCache) {
        // 確保緩存數據的合理性：至少有當前訪客
        const adjustedCacheStats = {
          ...globalStatsCache,
          onlineUsers: Math.max(globalStatsCache.onlineUsers || 0, 0),
          onlineVisitors: Math.max(globalStatsCache.onlineVisitors || 0, 1), // 至少有當前訪客
          totalUsers: Math.max(globalStatsCache.totalUsers || 0, 0)
        };
        setStats(adjustedCacheStats);
      } else {
        // 返回默認值，但保持當前訪客數
        const defaultStats = {
          totalUsers: 0,
          onlineUsers: 1, // 至少有當前訪客
          onlineVisitors: 1, // 當前訪客
          todayLogins: 0,
          thisMonthLogins: 0,
          lastUpdated: new Date().toISOString()
        };
        setStats(defaultStats);
      }
      setIsLoading(false);
    } finally {
      isCurrentlyFetching = false;
    }
  }, [appwriteUserStatsService, shouldUpdateCache]);

  // 用戶登入
  const handleUserLogin = useCallback(async (userId: string): Promise<string> => {
    try {
      const sessionId = await appwriteUserStatsService.userLogin(userId);
      // 登入後強制更新統計（生產環境）
      if (!isDevelopment) {
        await updateStats(true);
      }
      return sessionId;
    } catch (error) {
      console.error('用戶登入失敗:', error);
      throw error;
    }
  }, [appwriteUserStatsService, updateStats]);

  // 用戶登出
  const handleUserLogout = useCallback(async (sessionId: string) => {
    try {
      await appwriteUserStatsService.userLogout(sessionId);
      // 登出後強制更新統計（生產環境）
      if (!isDevelopment) {
        await updateStats(true);
      }
    } catch (error) {
      console.error('用戶登出失敗:', error);
    }
  }, [appwriteUserStatsService, updateStats]);

  // 發送 ping
  const sendPing = useCallback(async (sessionId?: string) => {
    try {
      return await appwriteUserStatsService.sendPing(sessionId);
    } catch (error) {
      console.error('發送 ping 失敗:', error);
      return false;
    }
  }, [appwriteUserStatsService]);

  // 初始化和定期更新 - 使用單一全局定時器
  useEffect(() => {
    // 開發環境直接設置為已載入
    if (isDevelopment) {
      setIsLoading(false);
      return;
    }
    
    // 初始載入（如果沒有緩存）- 靜默載入，不顯示載入狀態
    if (!globalStatsCache) {
      updateStats(false, false); // 不強制更新，不顯示載入
    }

    // 只在第一個實例中設置定時器（生產環境）
    if (!globalIntervalId && instanceIdRef.current === 1) {
      globalIntervalId = setInterval(() => {
        updateStats(false, false); // 定期更新也不顯示載入狀態
      }, UPDATE_INTERVAL); // 2分鐘更新一次，大幅減少頻率
    }

    // 監聽統計更新事件（節流處理）
    const handleStatsUpdate = () => {
      const now = Date.now();
      if (now - lastEventTime < EVENT_THROTTLE_TIME) {
        return;
      }
      lastEventTime = now;
      
      if (!isDevelopment) {
        updateStats(true, false); // 強制更新但不顯示載入
      }
    };
    
    window.addEventListener('userStatsUpdated', handleStatsUpdate);

    // 清理函數
    return () => {
      window.removeEventListener('userStatsUpdated', handleStatsUpdate);
      
      // 減少實例計數
      instanceCount--;
      
      // 如果是最後一個實例，清理全局定時器
      if (instanceCount === 0 && globalIntervalId) {
        clearInterval(globalIntervalId);
        globalIntervalId = null;
      }
    };
  }, [updateStats]);

  // 標記初始化完成
  useEffect(() => {
    if (!isInitializedRef.current && !isLoading) {
      isInitializedRef.current = true;
    }
  }, [isLoading]);

  return {
    stats,
    backendStats: globalBackendStatsCache, // 添加原始後端數據
    isLoading,
    updateStats: (force = false) => updateStats(force, true),
    userLogin: handleUserLogin,
    userLogout: handleUserLogout,
    sendPing
  };
} 