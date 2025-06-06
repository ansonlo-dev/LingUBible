import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DocumentHeadProps {
  title?: string;
  description?: string;
}

export function DocumentHead({ title, description }: DocumentHeadProps) {
  const { t, language } = useLanguage();

  // 獲取初始語言的函數（與 LanguageContext 中的邏輯一致）
  const getInitialLanguage = (): string => {
    if (typeof window === 'undefined') return 'en';
    
    // 首先檢查 cookie
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'language' && ['en', 'zh-TW', 'zh-CN'].includes(value)) {
        return value;
      }
    }
    
    // 如果沒有 cookie，檢測瀏覽器語言
    const browserLang = navigator.language || navigator.languages?.[0];
    if (browserLang) {
      if (browserLang.startsWith('zh-TW') || 
          browserLang.startsWith('zh-Hant') || 
          browserLang === 'zh-HK' || 
          browserLang === 'zh-MO') {
        return 'zh-TW';
      } else if (browserLang.startsWith('zh-CN') || 
                 browserLang.startsWith('zh-Hans') || 
                 browserLang.startsWith('zh-SG')) {
        return 'zh-CN';
      }
    }
    
    return 'en'; // 默認英文
  };

  // 不再需要動態 manifest 更新，使用統一的英文 manifest

  useEffect(() => {
    // 設置頁面標題
    const pageTitle = title || t('site.title');
    document.title = pageTitle;

    // 設置語言屬性
    document.documentElement.lang = language === 'zh-TW' ? 'zh-TW' : 
                                   language === 'zh-CN' ? 'zh-CN' : 'en';

    // 設置描述
    const pageDescription = description || t('site.description');
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.setAttribute('content', pageDescription);
    }

    // 設置 Open Graph 標題
    const ogTitleMeta = document.querySelector('meta[property="og:title"]');
    if (ogTitleMeta) {
      ogTitleMeta.setAttribute('content', pageTitle);
    }

    // 設置 Open Graph 描述
    const ogDescriptionMeta = document.querySelector('meta[property="og:description"]');
    if (ogDescriptionMeta) {
      ogDescriptionMeta.setAttribute('content', pageDescription);
    }

    // 設置 PWA 應用標題
    const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appleTitleMeta) {
      appleTitleMeta.setAttribute('content', t('site.name'));
    }

  }, [t, language, title, description]);

  return null; // 這個組件不渲染任何內容
} 