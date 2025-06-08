import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PWAManifestData {
  name: string;
  short_name: string;
  description: string;
  version?: string;
  version_name?: string;
  lang: string;
  dir: string;
  theme_color: string;
  background_color: string;
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
    purpose?: string;
  }>;
  screenshots?: Array<{
    src: string;
    sizes: string;
    type: string;
    form_factor: string;
    label: string;
  }>;
  shortcuts?: Array<{
    name: string;
    short_name: string;
    description: string;
    url: string;
    icons: Array<{
      src: string;
      sizes: string;
      type: string;
    }>;
  }>;
}

interface PWAManifestState {
  manifest: PWAManifestData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

export function usePWAManifest() {
  const { language } = useLanguage();
  const [state, setState] = useState<PWAManifestState>({
    manifest: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  // 獲取 manifest 數據
  const fetchManifest = async (lang: string = language) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const manifestUrl = `/manifest-dynamic.json?lang=${lang}&t=${Date.now()}`;
      
      const response = await fetch(manifestUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const manifestData = await response.json() as PWAManifestData;
      
      setState({
        manifest: manifestData,
        loading: false,
        error: null,
        lastUpdated: Date.now()
      });
      
      return manifestData;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ PWA Manifest 獲取失敗:`, errorMessage);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      
      return null;
    }
  };

  // 監聽語言變更
  useEffect(() => {
    fetchManifest(language);
  }, [language]);

  // 監聽 manifest 更新事件
  useEffect(() => {
    const handleManifestUpdate = (event: CustomEvent) => {
      const { language: newLang } = event.detail;
      
      // 重新獲取 manifest
      fetchManifest(newLang);
    };

    window.addEventListener('manifestUpdated', handleManifestUpdate as EventListener);
    
    return () => {
      window.removeEventListener('manifestUpdated', handleManifestUpdate as EventListener);
    };
  }, []);

  // 獲取本地化的應用名稱
  const getAppName = () => {
    return state.manifest?.name || 'LingUBible';
  };

  // 獲取本地化的應用描述
  const getAppDescription = () => {
    return state.manifest?.description || 'Platform for college students to review courses and lecturers';
  };

  // 獲取本地化的短名稱
  const getAppShortName = () => {
    return state.manifest?.short_name || 'LingUBible';
  };

  // 獲取應用圖標
  const getAppIcon = (size: string = '192x192') => {
    if (!state.manifest?.icons) return null;
    
    // 尋找指定大小的圖標
    const icon = state.manifest.icons.find(icon => icon.sizes === size);
    if (icon) return icon.src;
    
    // 如果找不到指定大小，返回第一個可用的圖標
    return state.manifest.icons[0]?.src || null;
  };

  // 獲取應用版本
  const getAppVersion = () => {
    return state.manifest?.version || null;
  };

  // 獲取格式化的版本名稱
  const getAppVersionName = () => {
    return state.manifest?.version_name || null;
  };

  // 檢查 manifest 是否已載入且為當前語言
  const isManifestReady = () => {
    return !state.loading && 
           state.manifest !== null && 
           state.manifest.lang === language &&
           state.error === null;
  };

  return {
    ...state,
    fetchManifest,
    getAppName,
    getAppDescription,
    getAppShortName,
    getAppIcon,
    getAppVersion,
    getAppVersionName,
    isManifestReady,
    currentLanguage: language
  };
} 