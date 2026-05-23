import React from 'react';
import { Navigate } from 'react-router-dom';
import { APP_CONFIG } from '@/utils/constants/config';

interface DevModeRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * 開發模式路由保護組件
 * 只有在開發模式啟用時才渲染子組件，否則重定向到指定頁面
 */
export const DevModeRoute: React.FC<DevModeRouteProps> = ({ 
  children, 
  redirectTo = '/' 
}) => {
  // 檢查開發模式是否啟用
  const isDevModeEnabled = APP_CONFIG.DEV_MODE.ENABLED;
  
  // 如果開發模式未啟用，重定向到指定頁面
  if (!isDevModeEnabled) {
    return <Navigate to={redirectTo} replace />;
  }
  
  // 開發模式啟用時，渲染子組件
  return <>{children}</>;
}; 