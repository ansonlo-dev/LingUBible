import { useState, useEffect } from 'react';
import RegisteredUsersService from '@/services/api/registeredUsersService';

interface RegisteredUsersStats {
  totalRegisteredUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  lastUpdated: string;
}

export const useRegisteredUsers = () => {
  const [stats, setStats] = useState<RegisteredUsersStats>({
    totalRegisteredUsers: 0,
    verifiedUsers: 0,
    unverifiedUsers: 0,
    lastUpdated: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const registeredUsersService = RegisteredUsersService.getInstance();
      
      // 如果強制刷新，清除緩存
      if (forceRefresh) {
        registeredUsersService.clearCache();
      }
      
      const newStats = await registeredUsersService.getRegisteredUsersStats();
      setStats(newStats);
      console.log('註冊用戶統計已更新:', newStats);
    } catch (err) {
      console.error('獲取註冊用戶統計失敗:', err);
      setError(err instanceof Error ? err.message : '獲取統計失敗');
    } finally {
      setLoading(false);
    }
  };

  // 強制刷新數據（清除緩存）
  const forceRefresh = () => {
    console.log('強制刷新註冊用戶統計...');
    fetchStats(true);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
    forceRefresh
  };
}; 