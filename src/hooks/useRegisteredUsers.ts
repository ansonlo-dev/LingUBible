import { useState, useEffect, useCallback } from 'react';
import { useUserStats } from './useUserStats';

interface RegisteredUsersStats {
  totalRegisteredUsers: number;
  newUsersLast30Days: number;
  verifiedUsers: number; // 保留但不在前端顯示
  lastUpdated: string;
}

export const useRegisteredUsers = () => {
  const { stats: userStats, backendStats, isLoading: userStatsLoading } = useUserStats();
  const [stats, setStats] = useState<RegisteredUsersStats>({
    totalRegisteredUsers: 0,
    newUsersLast30Days: 0,
    verifiedUsers: 0,
    lastUpdated: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 將 userStats 轉換為 RegisteredUsersStats 格式
  useEffect(() => {
    if (!userStatsLoading && userStats) {
      console.log('🔄 useRegisteredUsers: Processing user stats...', {
        userStats,
        backendStats,
        hasBackendStats: !!backendStats,
        backendNewUsers: backendStats?.newUsersLast30Days,
        fallbackValue: userStats.thisMonthLogins
      });

      const convertedStats: RegisteredUsersStats = {
        totalRegisteredUsers: userStats.totalUsers || 0,
        // 優先使用原始後端數據中的 newUsersLast30Days，如果是 undefined 才使用 fallback
        newUsersLast30Days: backendStats?.newUsersLast30Days !== undefined 
          ? backendStats.newUsersLast30Days 
          : (userStats.thisMonthLogins || 0),
        verifiedUsers: backendStats?.verifiedUsers || userStats.totalUsers || 0,
        lastUpdated: userStats.lastUpdated
      };

      setStats(convertedStats);
      setLoading(false);
      setError(null);
    }
  }, [userStats, backendStats, userStatsLoading]);

  // 手動刷新（實際上會觸發 userStats 的刷新）
  const refreshStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // 注意：實際的刷新由 useUserStats 處理
    // 這裡只是重置狀態，數據會通過 useEffect 更新
  }, []);

  return {
    stats,
    loading: loading || userStatsLoading,
    error,
    refreshStats
  };
}; 