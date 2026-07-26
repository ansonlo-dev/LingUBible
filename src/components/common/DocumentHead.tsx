import { useEffect, useRef, useMemo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useLocation } from 'react-router-dom';
import {
  getPageSEO,
  getLocaleCode,
  generateStructuredData,
  getPageTypeFromPath,
  isNoIndexPath,
  SEOData
} from '@/utils/seo/helpers';
import { SEO_CONFIG, SupportedLanguage } from '@/utils/seo/config';

interface DocumentHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  /** 找不到內容的頁面（軟性 404）用：靜態代管無法回傳 404 狀態碼，只能靠 noindex */
  noIndex?: boolean;
}

// App.tsx 會全域掛一個沒有 props 的 DocumentHead，而課程／講師頁另外掛一個帶
// 專屬標題的。若兩者都寫入 head，全域那個會把專屬標題蓋成通用網站標題，
// Google 就會再次看到上千頁相同的 <title>。因此頁面級的實例掛載時「認領」head，
// 全域實例在有人認領時直接跳過。
let pageLevelHeadClaims = 0;

export function DocumentHead({ title, description, keywords, ogImage, noIndex }: DocumentHeadProps) {
  const { language } = useLanguage();
  const location = useLocation();
  const lastUpdateRef = useRef<string>('');
  const isPageLevel = Boolean(title || description || keywords || ogImage || noIndex);

  useEffect(() => {
    if (!isPageLevel) return;
    pageLevelHeadClaims += 1;
    return () => {
      pageLevelHeadClaims -= 1;
    };
  }, [isPageLevel]);

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
    const structuredData = generateStructuredData(
      pageType,
      language as SupportedLanguage,
      canonicalUrl
    );

    return {
      canonicalUrl,
      pageType,
      seoData,
      structuredData,
      noIndex: Boolean(noIndex) || isNoIndexPath(location.pathname),
      localeCode: getLocaleCode(language as SupportedLanguage)
    };
  }, [language, location.pathname, title, description, keywords, ogImage, noIndex]);

  useEffect(() => {
    // 頁面級實例已接手時，全域實例不要覆寫
    if (!isPageLevel && pageLevelHeadClaims > 0) {
      return;
    }

    // 創建一個唯一標識符來檢查是否需要更新
    const updateKey = JSON.stringify({
      path: location.pathname,
      lang: language,
      title,
      description,
      keywords,
      ogImage,
      noIndex
    });

    // 如果內容沒有改變，跳過更新
    if (lastUpdateRef.current === updateKey) {
      return;
    }

    lastUpdateRef.current = updateKey;

    const { canonicalUrl, seoData, structuredData, localeCode, noIndex } = memoizedData;

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

    // 每頁只有一個正規網址（語言由 cookie / ?lang= 切換，不另開 URL），
    // 因此不輸出 hreflang；殘留的舊標籤要移除，避免 Google 去索引 ?lang= 重複頁。
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link => link.remove());

    // 私人／功能性頁面不應進入索引
    updateMetaTag('meta[name="robots"]', noIndex ? 'noindex, follow' : 'index, follow');

    // 設置 PWA 應用標題
    updateMetaTag('meta[name="apple-mobile-web-app-title"]', SEO_CONFIG.SITE_NAME);

    // 更新結構化數據（只在內容改變時）
    const updateStructuredData = () => {
      // 只更新自己建立的那一個，不能碰預渲染輸出的 Course / Person / BreadcrumbList
      const existingScript = document.getElementById('seo-structured-data');
      const newContent = JSON.stringify(structuredData);

      if (existingScript) {
        // 只在內容真正改變時才更新
        if (existingScript.textContent !== newContent) {
          existingScript.textContent = newContent;
        }
      } else {
        const script = document.createElement('script');
        script.id = 'seo-structured-data';
        script.type = 'application/ld+json';
        script.textContent = newContent;
        document.head.appendChild(script);
      }
    };

    updateStructuredData();

  }, [memoizedData, language, location.pathname, title, description, keywords, ogImage, noIndex]);

  return null; // 這個組件不渲染任何內容
} 