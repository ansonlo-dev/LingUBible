/**
 * GitHub API 服務
 * 用於獲取最新的 release 資訊
 */

interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  prerelease: boolean;
  draft: boolean;
  html_url: string;
  body: string;
}

interface VersionInfo {
  version: string;
  formattedVersion: string;
  status: 'beta' | 'stable';
  publishedAt: string;
  releaseUrl: string;
  isLatest: boolean;
}

const GITHUB_API_BASE = 'https://api.github.com';
const REPO_OWNER = 'ansonlo-dev';  // 您的 GitHub 用戶名
const REPO_NAME = 'LingUBible';    // 您的倉庫名

// GitHub Token（可選，用於私有倉庫或提高 API 限制）
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;

/**
 * 創建 API 請求的 headers
 */
const createHeaders = () => {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'LingUBible-App'
  };

  // 如果有 GitHub Token，添加認證 header
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
  }

  return headers;
};

/**
 * 檢查是否為開發環境
 */
const isDevelopmentEnvironment = (): boolean => {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' || 
           window.location.hostname.includes('localhost');
  }
  return false;
};

/**
 * 獲取最新的 GitHub Release
 */
export const getLatestRelease = async (): Promise<GitHubRelease | null> => {
  // 在開發環境中跳過 GitHub API 調用，避免 CORS 錯誤
  if (isDevelopmentEnvironment()) {
    console.log('Development environment detected, skipping GitHub API call to avoid CORS issues');
    return null;
  }

  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
      {
        headers: createHeaders()
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        console.warn('GitHub API rate limit exceeded or repository access denied');
      } else if (response.status === 404) {
        console.warn('No releases found or repository not found');
      } else {
        console.warn('Failed to fetch latest release:', response.status, response.statusText);
      }
      return null;
    }

    const release: GitHubRelease = await response.json();
    return release;
  } catch (error) {
    console.error('Error fetching latest release:', error);
    return null;
  }
};

/**
 * 獲取所有 releases（包括 pre-releases）
 */
export const getAllReleases = async (): Promise<GitHubRelease[]> => {
  // 在開發環境中跳過 GitHub API 調用，避免 CORS 錯誤
  if (isDevelopmentEnvironment()) {
    console.log('Development environment detected, skipping GitHub API call to avoid CORS issues');
    return [];
  }

  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/releases`,
      {
        headers: createHeaders()
      }
    );

    if (!response.ok) {
      console.warn('Failed to fetch releases:', response.status);
      return [];
    }

    const releases: GitHubRelease[] = await response.json();
    return releases;
  } catch (error) {
    console.error('Error fetching releases:', error);
    return [];
  }
};

/**
 * 解析版本號並格式化
 */
export const parseVersionInfo = (release: GitHubRelease): VersionInfo => {
  const version = release.tag_name.replace(/^v/, ''); // 移除 'v' 前綴
  const isStable = !version.startsWith('0.') && !release.prerelease;
  
  return {
    version,
    formattedVersion: isStable ? `v${version}` : `Beta ${version}`,
    status: isStable ? 'stable' : 'beta',
    publishedAt: release.published_at,
    releaseUrl: release.html_url,
    isLatest: true
  };
};

/**
 * 獲取最新版本資訊（優先獲取穩定版）
 */
export const getLatestVersionInfo = async (): Promise<VersionInfo | null> => {
  try {
    // 首先嘗試獲取最新的穩定版
    const latestRelease = await getLatestRelease();
    
    if (latestRelease) {
      return parseVersionInfo(latestRelease);
    }

    // 如果第一個 API 失敗（可能是 403 或其他錯誤），直接返回 null
    // 避免繼續嘗試其他 API 導致更多錯誤
    console.log('Latest release API failed, not attempting getAllReleases to avoid additional API errors');
    return null;
  } catch (error) {
    console.error('Error getting latest version info:', error);
    return null;
  }
};

/**
 * 比較版本號
 */
export const compareVersions = (version1: string, version2: string): number => {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;
    
    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }
  
  return 0;
};

/**
 * 檢查是否有新版本可用
 */
export const checkForUpdates = async (currentVersion: string): Promise<{
  hasUpdate: boolean;
  latestVersion?: VersionInfo;
  currentVersionInfo: {
    version: string;
    formattedVersion: string;
    status: 'beta' | 'stable';
  };
}> => {
  const latestVersion = await getLatestVersionInfo();
  const cleanCurrentVersion = currentVersion.replace(/^v/, '');
  
  const currentVersionInfo = {
    version: cleanCurrentVersion,
    formattedVersion: cleanCurrentVersion.startsWith('0.') ? `Beta ${cleanCurrentVersion}` : `v${cleanCurrentVersion}`,
    status: cleanCurrentVersion.startsWith('0.') ? 'beta' as const : 'stable' as const
  };

  if (!latestVersion) {
    return {
      hasUpdate: false,
      currentVersionInfo
    };
  }

  const hasUpdate = compareVersions(latestVersion.version, cleanCurrentVersion) > 0;

  return {
    hasUpdate,
    latestVersion: hasUpdate ? latestVersion : undefined,
    currentVersionInfo
  };
}; 