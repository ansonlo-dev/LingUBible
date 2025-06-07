import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppwriteUserStatsService from '@/services/api/appwriteUserStats';

export function useVisitorSession() {
  const { user } = useAuth();
  const isInitialized = useRef(false);
  const currentSessionId = useRef<string | null>(null);
  const appwriteUserStatsService = AppwriteUserStatsService.getInstance();

  useEffect(() => {
    // 只在用戶未登入時創建或重用訪客會話
    if (user || isInitialized.current) return;
    
    console.log('useVisitorSession: 檢查用戶狀態', { user: !!user });
    
    // 如果用戶未登入，創建或重用全球訪客會話
    const initVisitorSession = async () => {
      try {
        console.log('useVisitorSession: 初始化訪客會話...');
        const sessionId = await appwriteUserStatsService.createVisitorSession();
        currentSessionId.current = sessionId;
        console.log('useVisitorSession: 訪客會話已初始化', sessionId);
      } catch (error) {
        console.error('useVisitorSession: 初始化訪客會話失敗', error);
      }
    };

    initVisitorSession();
    isInitialized.current = true;
  }, [user, appwriteUserStatsService]);

  // 當用戶登入時，清理訪客會話狀態
  useEffect(() => {
    if (user && currentSessionId.current) {
      console.log('useVisitorSession: 用戶已登入，清理訪客會話狀態');
      // 不需要手動刪除會話，userLogin 方法會處理轉換
      currentSessionId.current = null;
      isInitialized.current = false; // 允許用戶登出後重新創建訪客會話
    }
  }, [user]);

  // 當用戶登出時，重置狀態以便重新創建訪客會話
  useEffect(() => {
    if (!user && !currentSessionId.current && isInitialized.current) {
      console.log('useVisitorSession: 用戶已登出，重置會話狀態');
      isInitialized.current = false;
    }
  }, [user]);
} 