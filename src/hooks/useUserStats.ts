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

export function useUserStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    onlineUsers: 0,
    onlineVisitors: 0,
    todayLogins: 0,
    thisMonthLogins: 0,
    lastUpdated: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);
  const isInitializedRef = useRef(false);

  const appwriteUserStatsService = AppwriteUserStatsService.getInstance();
  const localUserStatsService = UserStatsService.getInstance();

  // 更新統計數據 - 使用 Appwrite 全球統計
  const updateStats = useCallback(async () => {
    try {
      console.log('Hook: 獲取全球統計數據...');
      
      // 優先使用 Function 方法（更安全）
      let globalStats;
      try {
        globalStats = await appwriteUserStatsService.getStatsViaFunction();
        console.log('Hook: 通過 Function 獲取全球統計數據', globalStats);
      } catch (error) {
        console.warn('Hook: Function 方法失敗，回退到直接查詢:', error);
        globalStats = await appwriteUserStatsService.getStats();
        console.log('Hook: 通過直接查詢獲取全球統計數據', globalStats);
      }
      
      setStats(globalStats);
      setIsLoading(false);
      console.log('Hook: 使用全球統計數據', globalStats);
      
    } catch (error) {
      console.error('Hook: 獲取統計數據失敗:', error);
      
      // 返回默認值
      setStats({
        totalUsers: 0,
        onlineUsers: 0,
        onlineVisitors: 0,
        todayLogins: 0,
        thisMonthLogins: 0,
        lastUpdated: new Date().toISOString()
      });
      setIsLoading(false);
      console.log('Hook: 使用默認統計數據');
    }
  }, [appwriteUserStatsService]);

  // 用戶登入
  const handleUserLogin = useCallback(async (userId: string): Promise<string> => {
    try {
      const sessionId = await appwriteUserStatsService.userLogin(userId);
      await updateStats();
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
      await updateStats();
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

  // 初始化和定期更新 - 無論用戶是否登入都執行
  useEffect(() => {
    console.log('Hook: 初始化統計系統', { user: !!user });
    
    // 初始載入
    updateStats();

    // 設置定期更新 - 縮短間隔以更快檢測變化
    const interval = setInterval(() => {
      console.log('Hook: 定期更新統計數據');
      updateStats();
    }, 30 * 1000); // 每30秒更新一次

    // 監聽統計更新事件
    const handleStatsUpdate = () => {
      console.log('Hook: 收到統計更新事件，立即刷新');
      updateStats();
      
      // 額外的延遲更新，確保數據一致性
      setTimeout(() => {
        console.log('Hook: 延遲確認更新');
        updateStats();
      }, 1000);
    };
    
    window.addEventListener('userStatsUpdated', handleStatsUpdate);

    // 清理函數
    return () => {
      clearInterval(interval);
      window.removeEventListener('userStatsUpdated', handleStatsUpdate);
      console.log('Hook: 清理定期更新和事件監聽');
    };
  }, [updateStats]); // 移除 user 依賴，確保總是執行

  // 標記初始化完成
  useEffect(() => {
    if (!isInitializedRef.current && !isLoading) {
      console.log('Hook: 初始化完成');
      isInitializedRef.current = true;
    }
  }, [isLoading]);

  return {
    stats,
    isLoading,
    handleUserLogin,
    handleUserLogout,
    sendPing,
    updateStats
  };
} 