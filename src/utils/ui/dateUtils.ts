/**
 * 日期時間工具函數
 */

/**
 * 格式化日期時間為 UTC+8 時區，精確到秒
 * @param dateString - ISO 日期字符串
 * @returns 格式化的日期時間字符串
 */
export const formatDateTimeUTC8 = (dateString: string): string => {
  const date = new Date(dateString);
  
  // 轉換為 UTC+8 時區
  const utc8Date = new Date(date.getTime() + (8 * 60 * 60 * 1000));
  
  // 格式化為 YYYY-MM-DD HH:mm:ss
  const year = utc8Date.getUTCFullYear();
  const month = String(utc8Date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utc8Date.getUTCDate()).padStart(2, '0');
  const hours = String(utc8Date.getUTCHours()).padStart(2, '0');
  const minutes = String(utc8Date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(utc8Date.getUTCSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * 格式化日期時間為相對時間（如：2小時前）
 * @param dateString - ISO 日期字符串
 * @returns 相對時間字符串
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}秒前`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}分鐘前`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}小時前`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}天前`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months}個月前`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years}年前`;
  }
};

/**
 * 格式化簡短日期（僅日期部分）
 * @param dateString - ISO 日期字符串
 * @returns 格式化的日期字符串
 */
export const formatDateOnly = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}; 