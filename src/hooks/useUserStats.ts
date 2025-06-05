import { useState, useEffect, useCallback, useRef } from 'react';
import UserStatsService from "@/services/api/userStats";

interface UserStats {
  totalUsers: number;
  onlineUsers: number;
  todayLogins: number;
  thisMonthLogins: number;
  lastUpdated: string;
}

export function useUserStats() {
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    onlineUsers: 0,
    todayLogins: 0,
    thisMonthLogins: 0,
    lastUpdated: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);
  const isInitializedRef = useRef(false);

  const userStatsService = UserStatsService.getInstance();

  // 更新統計數據
  const updateStats = useCallback(() => {
    try {
      const newStats = userStatsService.refreshStats(); // 使用 refreshStats 而不是 getStats
      setStats(newStats);
      setIsLoading(false);
      console.log('Hook: 統計數據已更新', newStats);
    } catch (error) {
      console.error('更新用戶統計失敗:', error);
      setIsLoading(false);
    }
  }, [userStatsService]);

  // 用戶登入
  const handleUserLogin = useCallback((userId: string): string => {
    const sessionId = userStatsService.userLogin(userId);
    updateStats();
    return sessionId;
  }, [userStatsService, updateStats]);

  // 用戶登出
  const handleUserLogout = useCallback((sessionId: string) => {
    userStatsService.userLogout(sessionId);
    updateStats();
  }, [userStatsService, updateStats]);

  // 更新用戶活動
  const updateUserActivity = useCallback((sessionId: string) => {
    userStatsService.updateUserActivity(sessionId);
  }, [userStatsService]);

  // 模擬用戶活動（用於演示）
  const simulateActivity = useCallback(() => {
    userStatsService.simulateUserActivity();
    updateStats();
  }, [userStatsService, updateStats]);

  // 獲取詳細統計信息（用於調試）
  const getDetailedStats = useCallback(() => {
    return userStatsService.getDetailedStats();
  }, [userStatsService]);

  // 重置所有數據
  const resetAllData = useCallback(() => {
    userStatsService.resetAllData();
    updateStats();
  }, [userStatsService, updateStats]);

  // 初始化和定期更新
  useEffect(() => {
    console.log('Hook: 初始化用戶統計');
    
    // 初始載入
    updateStats();

    // 設置定期更新
    const interval = setInterval(() => {
      console.log('Hook: 定期更新統計數據');
      updateStats();
    }, 30000); // 每30秒更新一次

    // 清理函數
    return () => {
      clearInterval(interval);
      console.log('Hook: 清理定期更新');
    };
  }, [updateStats]);

  // 移除自動模擬用戶創建，只保留標記初始化完成
  useEffect(() => {
    if (!isInitializedRef.current && !isLoading) {
      console.log('Hook: 初始化完成，不創建模擬用戶');
      isInitializedRef.current = true;
    }
  }, [isLoading]);

  // 大幅降低模擬活動頻率，幾乎不觸發
  useEffect(() => {
    const simulationInterval = setInterval(() => {
      // 只有在有現有用戶時才偶爾觸發模擬活動，且機率極低
      if (stats.onlineUsers > 0 && Math.random() > 0.98) { // 只有 2% 機率觸發
        console.log('Hook: 觸發輕微模擬活動');
        simulateActivity();
      }
    }, 60000); // 每60秒檢查一次

    return () => clearInterval(simulationInterval);
  }, [simulateActivity, stats.onlineUsers]);

  return {
    stats,
    isLoading,
    handleUserLogin,
    handleUserLogout,
    updateUserActivity,
    simulateActivity,
    updateStats,
    getDetailedStats,
    resetAllData
  };
} 