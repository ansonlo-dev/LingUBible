import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserStatsService from '@/services/api/userStats';

export function useVisitorSession() {
  const { user } = useAuth();
  const isInitialized = useRef(false);
  const userStatsService = UserStatsService.getInstance();

  useEffect(() => {
    // 只在第一次載入時初始化
    if (isInitialized.current) return;
    
    // 如果用戶未登入，初始化訪客會話
    if (!user) {
      console.log('初始化訪客會話...');
      userStatsService.initVisitorSession();
    }
    
    isInitialized.current = true;
  }, [user, userStatsService]);
} 