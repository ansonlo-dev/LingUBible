import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Cookie 工具函數
export const cookies = {
  set: (name: string, value: string, days: number = 365) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    const cookieString = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    document.cookie = cookieString;
  },
  
  get: (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        const value = c.substring(nameEQ.length, c.length);
        return value;
      }
    }
    return null;
  },
  
  remove: (name: string) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;SameSite=Lax`;
  }
};

// 主題工具函數 - 使用 localStorage 作為主要存儲
export const theme = {
  get: (): 'light' | 'dark' | null => {
    if (typeof window === 'undefined') return null;
    
    // 優先從 localStorage 讀取
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    
    // 備用：從 cookies 讀取
    const cookieTheme = cookies.get('theme');
    if (cookieTheme === 'dark' || cookieTheme === 'light') {
      // 同步到 localStorage
      localStorage.setItem('theme', cookieTheme);
      return cookieTheme;
    }
    
    return null;
  },
  
  set: (value: 'light' | 'dark') => {
    if (typeof window === 'undefined') return;
    
    // 同時保存到 localStorage 和 cookies
    localStorage.setItem('theme', value);
    cookies.set('theme', value, 365);
  
  },
  
  getSystemPreference: (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },
  
  getEffectiveTheme: (): 'light' | 'dark' => {
    const stored = theme.get();
    if (stored) {
      return stored;
    }
    
    // 如果沒有存儲的主題，檢測系統主題並自動保存
    const systemTheme = theme.getSystemPreference();

    
    // 自動保存檢測到的系統主題
    theme.set(systemTheme);
    
    return systemTheme;
  },

  // 檢查是否為首次訪問（沒有保存的主題）
  isFirstVisit: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem('theme') && !cookies.get('theme');
  }
};
