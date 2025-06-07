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
const REPO_OWNER = 'ansonlo-dev';  // 替換為您的 GitHub 用戶名
const REPO_NAME = 'LingUBible';    // 替換為您的倉庫名

/**
 * 獲取最新的 GitHub Release
 */
export const getLatestRelease = async (): Promise<GitHubRelease | null> => {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'LingUBible-App'
        }
      }
    );

    if (!response.ok) {
      console.warn('Failed to fetch latest release:', response.status);
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
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/releases`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'LingUBible-App'
        }
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
    
    if (latestRelease && !latestRelease.prerelease) {
      return parseVersionInfo(latestRelease);
    }

    // 如果最新版是 pre-release，獲取所有 releases 並找到最新的穩定版
    const allReleases = await getAllReleases();
    
    if (allReleases.length === 0) {
      return null;
    }

    // 如果沒有穩定版，返回最新的 pre-release
    const latestStable = allReleases.find(release => !release.prerelease);
    const releaseToUse = latestStable || allReleases[0];
    
    return parseVersionInfo(releaseToUse);
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