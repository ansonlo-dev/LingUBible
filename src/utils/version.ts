import packageJson from '../../package.json';

/**
 * 獲取應用版本號
 */
export const getAppVersion = (): string => {
  return packageJson.version;
};

/**
 * 獲取格式化的版本號（用於顯示）
 * @param betaText - Beta 文字的翻譯，如果不提供則使用英文 "Beta"
 */
export const getFormattedVersion = (betaText?: string): string => {
  const version = getAppVersion();
  
  // 如果是 0.x.x 版本，顯示為 Beta
  if (version.startsWith('0.')) {
    return `${betaText || 'Beta'} ${version}`;
  }
  
  // 如果是 1.x.x 或更高版本，顯示為正式版
  return `v${version}`;
};

/**
 * 獲取版本狀態
 */
export const getVersionStatus = (): 'beta' | 'stable' => {
  const version = getAppVersion();
  return version.startsWith('0.') ? 'beta' : 'stable';
};

/**
 * 獲取構建信息
 */
export const getBuildInfo = () => {
  return {
    version: getAppVersion(),
    formattedVersion: getFormattedVersion(),
    status: getVersionStatus(),
    buildTime: new Date().toISOString(),
    environment: import.meta.env.VITE_APP_ENV || 'development'
  };
}; 