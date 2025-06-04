// 全局類型聲明

declare global {
  interface Window {
    updatePWAManifest?: () => void;
    LingUBibleManifest?: {
      generateManifest: (language?: string) => any;
      detectUserLanguage: () => string;
      manifestTranslations: Record<string, any>;
      updateManifestLink: () => void;
    };
  }
}

export {}; 