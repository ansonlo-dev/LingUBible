import { useEffect, useRef, useMemo } from 'react';
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
  const lastUpdateRef = useRef<string>('');

  // 記憶化計算，只在依賴項真正改變時重新計算
  const memoizedData = useMemo(() => {
    const canonicalUrl = `${SEO_CONFIG.BASE_URL}${location.pathname}`;
    const pageType = getPageTypeFromPath(location.pathname);
    const seoData = getPageSEO(pageType, language as SupportedLanguage, {
      title,
      description,
      keywords,
      ogImage
    });
    const alternateUrls = generateHreflangUrls(location.pathname);
    const structuredData = generateStructuredData(
      pageType,
      language as SupportedLanguage,
      canonicalUrl
    );

    return {
      canonicalUrl,
      pageType,
      seoData,
      alternateUrls,
      structuredData,
      localeCode: getLocaleCode(language as SupportedLanguage)
    };
  }, [language, location.pathname, title, description, keywords, ogImage]);

  useEffect(() => {
    // 創建一個唯一標識符來檢查是否需要更新
    const updateKey = JSON.stringify({
      path: location.pathname,
      lang: language,
      title,
      description,
      keywords,
      ogImage
    });

    // 如果內容沒有改變，跳過更新
    if (lastUpdateRef.current === updateKey) {
      return;
    }

    lastUpdateRef.current = updateKey;

    const { canonicalUrl, seoData, alternateUrls, structuredData, localeCode } = memoizedData;

    // 設置頁面標題（只在真正改變時）
    if (document.title !== seoData.title) {
      document.title = seoData.title;
    }

    // 設置語言屬性（只在真正改變時）
    const targetLang = language === 'zh-TW' ? 'zh-TW' : 
                      language === 'zh-CN' ? 'zh-CN' : 'en';
    if (document.documentElement.lang !== targetLang) {
      document.documentElement.lang = targetLang;
    }
    
    // 更新或創建 meta 標籤的優化函數
    const updateMetaTag = (selector: string, content: string) => {
      let meta = document.querySelector(selector) as HTMLMetaElement;
      if (meta) {
        // 只在內容真正改變時才更新
        if (meta.content !== content) {
          meta.content = content;
        }
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
    updateMetaTag('meta[property="og:locale"]', localeCode);
    updateMetaTag('meta[property="og:url"]', canonicalUrl);
    
    if (seoData.ogImage) {
      updateMetaTag('meta[property="og:image"]', seoData.ogImage);
    }

    // Twitter 標籤
    updateMetaTag('meta[name="twitter:title"]', seoData.title);
    updateMetaTag('meta[name="twitter:description"]', seoData.description);
    
    if (seoData.ogImage) {
      updateMetaTag('meta[name="twitter:image"]', seoData.ogImage);
    }

    // 設置 canonical URL（只在改變時）
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonicalLink) {
      if (canonicalLink.href !== canonicalUrl) {
        canonicalLink.href = canonicalUrl;
      }
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      canonicalLink.setAttribute('href', canonicalUrl);
      document.head.appendChild(canonicalLink);
    }

    // 更新 hreflang 標籤（只在路徑改變時）
    const existingHreflangs = document.querySelectorAll('link[rel="alternate"][hreflang]');
    const expectedHreflangs = Object.entries(alternateUrls).length + 1; // +1 for x-default

    // 只有在數量不匹配或路徑改變時才重新創建 hreflang 標籤
    if (existingHreflangs.length !== expectedHreflangs) {
      // 移除舊的 hreflang 標籤
      existingHreflangs.forEach(link => link.remove());

      // 添加新的 hreflang 標籤
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
    }

    // 設置 PWA 應用標題
    updateMetaTag('meta[name="apple-mobile-web-app-title"]', SEO_CONFIG.SITE_NAME);

    // 更新結構化數據（只在內容改變時）
    const updateStructuredData = () => {
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      const newContent = JSON.stringify(structuredData);
      
      if (existingScript) {
        // 只在內容真正改變時才更新
        if (existingScript.textContent !== newContent) {
          existingScript.textContent = newContent;
        }
      } else {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = newContent;
        document.head.appendChild(script);
      }
    };

    updateStructuredData();

  }, [memoizedData, language, location.pathname, title, description, keywords, ogImage]);

  return null; // 這個組件不渲染任何內容
} 