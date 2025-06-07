import { useState, useEffect, useCallback, useRef } from 'react';
import AppwriteUserStatsService from "@/services/api/appwriteUserStats";
import { useAuth } from "@/contexts/AuthContext";

interface UserStats {
  totalUsers: number;
  onlineUsers: number;
  todayLogins: number;
  thisMonthLogins: number;
  lastUpdated: string;
}

export function useUserStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    onlineUsers: 0,
    todayLogins: 0,
    thisMonthLogins: 0,
    lastUpdated: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);
  const isInitializedRef = useRef(false);

  const userStatsService = AppwriteUserStatsService.getInstance();

  // 更新統計數據 - 只有在用戶登入時才執行
  const updateStats = useCallback(async () => {
    // 如果用戶未登入，只返回默認統計數據，不執行 API 調用
    if (!user) {
      setStats({
        totalUsers: 0,
        onlineUsers: 0,
        todayLogins: 0,
        thisMonthLogins: 0,
        lastUpdated: new Date().toISOString()
      });
      setIsLoading(false);
      return;
    }

    try {
      const newStats = await userStatsService.getStats();
      setStats(newStats);
      setIsLoading(false);
      console.log('Hook: 統計數據已更新', newStats);
    } catch (error) {
      console.error('更新用戶統計失敗:', error);
      setIsLoading(false);
    }
  }, [userStatsService, user]);

  // 用戶登入
  const handleUserLogin = useCallback(async (userId: string): Promise<string> => {
    try {
      const sessionId = await userStatsService.userLogin(userId);
      await updateStats();
      return sessionId;
    } catch (error) {
      console.error('用戶登入失敗:', error);
      throw error;
    }
  }, [userStatsService, updateStats]);

  // 用戶登出
  const handleUserLogout = useCallback(async (sessionId: string) => {
    try {
      await userStatsService.userLogout(sessionId);
      await updateStats();
    } catch (error) {
      console.error('用戶登出失敗:', error);
    }
  }, [userStatsService, updateStats]);

  // 發送 ping
  const sendPing = useCallback(async (sessionId?: string) => {
    try {
      return await userStatsService.sendPing(sessionId);
    } catch (error) {
      console.error('發送 ping 失敗:', error);
      return false;
    }
  }, [userStatsService]);

  // 初始化和定期更新 - 只有在用戶登入時才執行
  useEffect(() => {
    if (!user) {
      console.log('Hook: 用戶未登入，跳過統計初始化');
      setIsLoading(false);
      return;
    }

    console.log('Hook: 初始化用戶統計');
    
    // 初始載入
    updateStats();

    // 設置定期更新 - 縮短間隔以更快檢測變化
    const interval = setInterval(() => {
      console.log('Hook: 定期更新統計數據');
      updateStats();
    }, 60 * 1000); // 改為每1分鐘更新一次，更快檢測變化

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
  }, [updateStats, user]);

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