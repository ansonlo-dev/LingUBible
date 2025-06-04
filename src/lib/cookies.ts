// Cookie 工具函數
export const cookies = {
  // 設置 cookie
  set: (name: string, value: string, days: number = 30) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  },

  // 獲取 cookie
  get: (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },

  // 刪除 cookie
  remove: (name: string) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  },

  // 檢查 cookie 是否存在
  exists: (name: string): boolean => {
    return cookies.get(name) !== null;
  }
};

// 滑動提示相關的 cookie 常量
export const SWIPE_HINT_COOKIE = 'campus-comment-verse-swipe-used';

// 側邊欄狀態相關的 cookie 常量
export const SIDEBAR_STATE_COOKIE = 'campus-comment-verse-sidebar-collapsed';

// 滑動提示 cookie 操作
export const swipeHintCookie = {
  // 標記用戶已使用滑動功能
  markAsUsed: () => {
    cookies.set(SWIPE_HINT_COOKIE, 'true', 365); // 保存一年
  },

  // 檢查用戶是否已使用過滑動功能
  hasBeenUsed: (): boolean => {
    return cookies.get(SWIPE_HINT_COOKIE) === 'true';
  },

  // 重置滑動提示（用於測試或重置功能）
  reset: () => {
    cookies.remove(SWIPE_HINT_COOKIE);
  }
};

// 側邊欄狀態 cookie 操作
export const sidebarStateCookie = {
  // 保存側邊欄狀態
  saveState: (isCollapsed: boolean) => {
    cookies.set(SIDEBAR_STATE_COOKIE, isCollapsed ? 'true' : 'false', 365); // 保存一年
  },

  // 獲取側邊欄狀態，首次訪問默認為展開（false）
  getState: (): boolean => {
    const state = cookies.get(SIDEBAR_STATE_COOKIE);
    if (state === null) {
      // 首次訪問，默認展開
      return false;
    }
    return state === 'true';
  },

  // 重置側邊欄狀態（用於測試或重置功能）
  reset: () => {
    cookies.remove(SIDEBAR_STATE_COOKIE);
  }
}; 