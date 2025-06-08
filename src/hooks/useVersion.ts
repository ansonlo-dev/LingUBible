import { useState, useEffect } from 'react';
import { getLatestVersionInfo, checkForUpdates } from '@/services/api/github';
import { getAppVersion } from '@/utils/version';

interface VersionState {
  currentVersion: string;
  formattedCurrentVersion: string;
  currentStatus: 'beta' | 'stable';
  latestVersion?: {
    version: string;
    formattedVersion: string;
    status: 'beta' | 'stable';
    publishedAt: string;
    releaseUrl: string;
  };
  hasUpdate: boolean;
  isLoading: boolean;
  error: string | null;
  lastChecked: Date | null;
}

interface UseVersionOptions {
  checkOnMount?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export const useVersion = (options: UseVersionOptions = {}) => {
  const {
    checkOnMount = true,
    autoRefresh = false,
    refreshInterval = 5 * 60 * 1000 // 5 minutes
  } = options;

  const [state, setState] = useState<VersionState>(() => {
    const currentVersion = getAppVersion();
    return {
      currentVersion,
      formattedCurrentVersion: currentVersion.startsWith('0.') ? `Beta ${currentVersion}` : `v${currentVersion}`,
      currentStatus: currentVersion.startsWith('0.') ? 'beta' : 'stable',
      hasUpdate: false,
      isLoading: false,
      error: null,
      lastChecked: null
    };
  });

  const checkVersion = async () => {
    // 檢查是否為開發環境
    const isDevelopmentEnvironment = () => {
      if (typeof window !== 'undefined') {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' || 
               window.location.hostname.includes('localhost');
      }
      return false;
    };

    // 在開發環境中跳過版本檢查，避免 CORS 錯誤
    if (isDevelopmentEnvironment()) {
      console.log('Development environment detected, skipping version check to avoid CORS issues');
      const currentVersion = state.currentVersion;
      setState(prev => ({
        ...prev,
        hasUpdate: false,
        isLoading: false,
        error: null,
        lastChecked: new Date(),
        latestVersion: {
          version: currentVersion,
          formattedVersion: currentVersion.startsWith('0.') ? `Beta ${currentVersion}` : `v${currentVersion}`,
          status: currentVersion.startsWith('0.') ? 'beta' : 'stable',
          publishedAt: new Date().toISOString(),
          releaseUrl: `https://github.com/ansonlo-dev/LingUBible/releases/tag/v${currentVersion}`
        }
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const updateInfo = await checkForUpdates(state.currentVersion);
      
      setState(prev => ({
        ...prev,
        hasUpdate: updateInfo.hasUpdate,
        latestVersion: updateInfo.latestVersion,
        isLoading: false,
        lastChecked: new Date()
      }));
    } catch (error) {
      // 如果無法獲取 GitHub 版本，創建一個備用版本資訊
      const currentVersion = state.currentVersion;
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check for updates',
        lastChecked: new Date(),
        latestVersion: {
          version: currentVersion,
          formattedVersion: currentVersion.startsWith('0.') ? `Beta ${currentVersion}` : `v${currentVersion}`,
          status: currentVersion.startsWith('0.') ? 'beta' : 'stable',
          publishedAt: new Date().toISOString(),
          releaseUrl: `https://github.com/ansonlo-dev/LingUBible/releases/tag/v${currentVersion}`
        }
      }));
    }
  };

  const getLatestVersion = async () => {
    // 檢查是否為開發環境
    const isDevelopmentEnvironment = () => {
      if (typeof window !== 'undefined') {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' || 
               window.location.hostname.includes('localhost');
      }
      return false;
    };

    // 在開發環境中跳過 GitHub API 調用，避免 CORS 錯誤
    if (isDevelopmentEnvironment()) {
      console.log('Development environment detected, skipping GitHub API call to avoid CORS issues');
      const currentVersion = state.currentVersion;
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        lastChecked: new Date(),
        latestVersion: {
          version: currentVersion,
          formattedVersion: currentVersion.startsWith('0.') ? `Beta ${currentVersion}` : `v${currentVersion}`,
          status: currentVersion.startsWith('0.') ? 'beta' : 'stable',
          publishedAt: new Date().toISOString(),
          releaseUrl: `https://github.com/ansonlo-dev/LingUBible/releases/tag/v${currentVersion}`
        }
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const latestVersionInfo = await getLatestVersionInfo();
      
      if (latestVersionInfo) {
        setState(prev => ({
          ...prev,
          latestVersion: latestVersionInfo,
          isLoading: false,
          lastChecked: new Date()
        }));
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'No releases found',
          lastChecked: new Date()
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch latest version',
        lastChecked: new Date()
      }));
    }
  };

  const refreshVersion = () => {
    checkVersion();
  };

  // Check version on mount
  useEffect(() => {
    if (checkOnMount) {
      checkVersion();
    }
  }, [checkOnMount]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      checkVersion();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  return {
    ...state,
    checkVersion,
    getLatestVersion,
    refreshVersion,
    // Utility functions
    isCurrentVersionBeta: state.currentStatus === 'beta',
    isLatestVersionBeta: state.latestVersion?.status === 'beta',
    canUpdate: state.hasUpdate && !state.isLoading,
    // Formatted display strings
    displayCurrentVersion: state.formattedCurrentVersion,
    displayLatestVersion: state.latestVersion?.formattedVersion,
    // Time since last check
    timeSinceLastCheck: state.lastChecked ? Date.now() - state.lastChecked.getTime() : null
  };
};

// Hook for just getting the latest version without comparison
export const useLatestVersion = () => {
  const [latestVersion, setLatestVersion] = useState<{
    version: string;
    formattedVersion: string;
    status: 'beta' | 'stable';
    publishedAt: string;
    releaseUrl: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 檢查是否為開發環境
  const isDevelopmentEnvironment = () => {
    if (typeof window !== 'undefined') {
      return window.location.hostname === 'localhost' || 
             window.location.hostname === '127.0.0.1' || 
             window.location.hostname.includes('localhost');
    }
    return false;
  };

  const createFallbackVersion = () => {
    const currentVersion = getAppVersion();
    return {
      version: currentVersion,
      formattedVersion: currentVersion.startsWith('0.') ? `Beta ${currentVersion}` : `v${currentVersion}`,
      status: currentVersion.startsWith('0.') ? 'beta' as const : 'stable' as const,
      publishedAt: new Date().toISOString(),
      releaseUrl: `https://github.com/ansonlo-dev/LingUBible/releases/tag/v${currentVersion}`
    };
  };

  const fetchLatestVersion = async () => {
    // 在開發環境中直接使用本地版本，避免 CORS 錯誤
    if (isDevelopmentEnvironment()) {
      console.log('Development environment detected, using local version to avoid CORS issues');
      setLatestVersion(createFallbackVersion());
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const versionInfo = await getLatestVersionInfo();
      if (versionInfo) {
        setLatestVersion(versionInfo);
      } else {
        // GitHub API 失敗，使用備用版本
        console.log('GitHub API failed, using fallback version');
        setLatestVersion(createFallbackVersion());
        setError('Using local version (GitHub API unavailable)');
      }
    } catch (err) {
      console.log('Error fetching version, using fallback:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch version');
      // 如果無法獲取 GitHub 版本，創建一個備用版本資訊
      setLatestVersion(createFallbackVersion());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestVersion();
  }, []);

  return {
    latestVersion,
    isLoading,
    error,
    refetch: fetchLatestVersion
  };
}; 