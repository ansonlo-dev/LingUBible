import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'react-router-dom';
import { 
  getPageSEO, 
  generateHreflangUrls, 
  getLocaleCode, 
  generateStructuredData,
  getPageTypeFromPath,
  SEOData 
} from '@/utils/seo/helpers';
import { SEO_CONFIG, SupportedLanguage } from '@/utils/seo/config';

interface DocumentHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
}

export function DocumentHead({ title, description, keywords, ogImage }: DocumentHeadProps) {
  const { language } = useLanguage();
  const location = useLocation();

  // 獲取當前頁面的完整 URL
  const getCanonicalUrl = () => {
    return `${SEO_CONFIG.BASE_URL}${location.pathname}`;
  };

  // 獲取頁面類型和 SEO 數據
  const pageType = getPageTypeFromPath(location.pathname);
  const seoData = getPageSEO(pageType, language as SupportedLanguage, {
    title,
    description,
    keywords,
    ogImage
  });

  useEffect(() => {
    // 設置頁面標題
    document.title = seoData.title;

    // 設置語言屬性
    document.documentElement.lang = language === 'zh-TW' ? 'zh-TW' : 
                                   language === 'zh-CN' ? 'zh-CN' : 'en';
    
    // 更新或創建 meta 標籤的通用函數
    const updateMetaTag = (selector: string, content: string) => {
      let meta = document.querySelector(selector);
      if (meta) {
        meta.setAttribute('content', content);
      } else {
        meta = document.createElement('meta');
        if (selector.includes('name=')) {
          meta.setAttribute('name', selector.match(/name="([^"]+)"/)?.[1] || '');
        } else if (selector.includes('property=')) {
          meta.setAttribute('property', selector.match(/property="([^"]+)"/)?.[1] || '');
        }
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    };

    // 基本 meta 標籤
    updateMetaTag('meta[name="description"]', seoData.description);
    updateMetaTag('meta[name="keywords"]', seoData.keywords);
    
    // Open Graph 標籤
    updateMetaTag('meta[property="og:title"]', seoData.title);
    updateMetaTag('meta[property="og:description"]', seoData.description);
    updateMetaTag('meta[property="og:locale"]', getLocaleCode(language as SupportedLanguage));
    updateMetaTag('meta[property="og:url"]', getCanonicalUrl());
    
    if (seoData.ogImage) {
      updateMetaTag('meta[property="og:image"]', seoData.ogImage);
    }

    // Twitter 標籤
    updateMetaTag('meta[name="twitter:title"]', seoData.title);
    updateMetaTag('meta[name="twitter:description"]', seoData.description);
    
    if (seoData.ogImage) {
      updateMetaTag('meta[name="twitter:image"]', seoData.ogImage);
    }

    // 設置 canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', getCanonicalUrl());
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      canonicalLink.setAttribute('href', getCanonicalUrl());
      document.head.appendChild(canonicalLink);
    }

    // 移除舊的 hreflang 標籤
    const oldHreflangs = document.querySelectorAll('link[rel="alternate"][hreflang]');
    oldHreflangs.forEach(link => link.remove());

    // 添加新的 hreflang 標籤
    const alternateUrls = generateHreflangUrls(location.pathname);
    Object.entries(alternateUrls).forEach(([lang, url]) => {
      const hreflangLink = document.createElement('link');
      hreflangLink.setAttribute('rel', 'alternate');
      hreflangLink.setAttribute('hreflang', lang);
      hreflangLink.setAttribute('href', url);
      document.head.appendChild(hreflangLink);
    });

    // 添加 x-default hreflang
    const defaultHreflang = document.createElement('link');
    defaultHreflang.setAttribute('rel', 'alternate');
    defaultHreflang.setAttribute('hreflang', 'x-default');
    defaultHreflang.setAttribute('href', alternateUrls.en);
    document.head.appendChild(defaultHreflang);

    // 設置 PWA 應用標題
    updateMetaTag('meta[name="apple-mobile-web-app-title"]', SEO_CONFIG.SITE_NAME);

    // 添加結構化數據 (JSON-LD)
    const addStructuredData = () => {
      // 移除舊的結構化數據
      const oldScript = document.querySelector('script[type="application/ld+json"]');
      if (oldScript) {
        oldScript.remove();
      }

      const structuredData = generateStructuredData(
        pageType,
        language as SupportedLanguage,
        getCanonicalUrl()
      );

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    };

    addStructuredData();

  }, [language, seoData, location.pathname, pageType]);

  return null; // 這個組件不渲染任何內容
} 