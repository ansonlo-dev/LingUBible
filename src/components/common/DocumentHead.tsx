import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DocumentHeadProps {
  title?: string;
  description?: string;
}

export function DocumentHead({ title, description }: DocumentHeadProps) {
  const { t, language } = useLanguage();

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