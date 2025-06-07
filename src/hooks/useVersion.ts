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
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check for updates',
        lastChecked: new Date()
      }));
    }
  };

  const getLatestVersion = async () => {
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

  const fetchLatestVersion = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const versionInfo = await getLatestVersionInfo();
      setLatestVersion(versionInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch version');
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