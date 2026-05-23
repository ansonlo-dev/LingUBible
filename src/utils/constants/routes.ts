/**
 * 應用路由常量
 */

export const ROUTES = {
  // 主要頁面
  HOME: '/',
  
  // 認證相關
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  
  // 用戶相關
  USER_SETTINGS: '/settings',
  
  // 法律頁面
  TERMS: '/terms',
  PRIVACY: '/privacy',
  CONTACT: '/contact',
  
  // 錯誤頁面
  NOT_FOUND: '/404'
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = typeof ROUTES[RouteKey]; 