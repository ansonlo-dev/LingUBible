import { useEffect, useRef } from 'react';
import { useUserStats } from './useUserStats';
import { useAuth } from '@/contexts/AuthContext';

interface PingSystemOptions {
  enabled?: boolean;
  pingInterval?: number; // ping 間隔（毫秒）
  activityEvents?: string[]; // 要監聽的用戶活動事件
}

export function usePingSystem(options: PingSystemOptions = {}) {
  const {
    enabled = true,
    pingInterval = 120 * 1000, // 預設 120 秒（2 分鐘）
    activityEvents = ['click', 'keydown', 'scroll', 'mousemove', 'touchstart']
  } = options;

  const { user } = useAuth();
  const { sendPing } = useUserStats();
  const lastActivityRef = useRef<number>(Date.now());
  const pingIntervalRef = useRef<number | null>(null);
  const activityListenersRef = useRef<boolean>(false);

  // 記錄用戶活動
  const recordActivity = () => {
    lastActivityRef.current = Date.now();
  };

  // 設置活動監聽器
  const setupActivityListeners = () => {
    if (activityListenersRef.current) return;

    activityEvents.forEach(eventType => {
      document.addEventListener(eventType, recordActivity, { 
        passive: true,
        capture: true 
      });
    });

    activityListenersRef.current = true;
    console.log('Ping 系統: 活動監聽器已設置');
  };

  // 清除活動監聽器
  const cleanupActivityListeners = () => {
    if (!activityListenersRef.current) return;

    activityEvents.forEach(eventType => {
      document.removeEventListener(eventType, recordActivity, { capture: true });
    });

    activityListenersRef.current = false;
    console.log('Ping 系統: 活動監聽器已清除');
  };

  // 啟動 ping 系統
  const startPingSystem = () => {
    if (pingIntervalRef.current) return;

    pingIntervalRef.current = setInterval(async () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      
      // 只有在最近有活動時才發送 ping（避免無意義的 ping）
      if (timeSinceLastActivity < pingInterval * 2) {
        try {
          const success = await sendPing();
          if (success) {
            console.log('Ping 系統: 自動 ping 發送成功');
          }
        } catch (error) {
          console.error('Ping 系統: 自動 ping 發送失敗', error);
        }
      } else {
        console.log('Ping 系統: 用戶無活動，跳過 ping');
      }
    }, pingInterval);

    console.log(`Ping 系統: 已啟動，間隔 ${pingInterval / 1000} 秒`);
  };

  // 停止 ping 系統
  const stopPingSystem = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
      console.log('Ping 系統: 已停止');
    }
  };

  // 手動發送 ping
  const manualPing = async () => {
    recordActivity(); // 記錄活動
    return await sendPing();
  };

  // 獲取系統狀態
  const getSystemStatus = () => {
    return {
      enabled,
      isRunning: !!pingIntervalRef.current,
      hasActivityListeners: activityListenersRef.current,
      lastActivity: lastActivityRef.current,
      timeSinceLastActivity: Date.now() - lastActivityRef.current,
      pingInterval
    };
  };

  useEffect(() => {
    if (!enabled || !user) {
      console.log('Ping 系統: 已禁用或用戶未登入，跳過初始化');
      return;
    }

    setupActivityListeners();
    startPingSystem();

    // 頁面可見性變化處理
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Ping 系統: 頁面隱藏，停止 ping');
        stopPingSystem();
      } else {
        console.log('Ping 系統: 頁面可見，重新啟動 ping');
        recordActivity(); // 記錄活動
        startPingSystem();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 頁面焦點變化處理
    const handleFocus = () => {
      recordActivity();
      if (!pingIntervalRef.current) {
        startPingSystem();
      }
    };

    const handleBlur = () => {
      // 頁面失去焦點時不立即停止，讓可見性 API 處理
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      stopPingSystem();
      cleanupActivityListeners();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [enabled, pingInterval, user]);

  return {
    manualPing,
    getSystemStatus,
    recordActivity
  };
} 