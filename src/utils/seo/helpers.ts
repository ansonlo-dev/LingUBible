import { SEO_CONFIG, SupportedLanguage, PageType } from './config';

export interface SEOData {
  title: string;
  description: string;
  keywords: string;
  ogImage?: string;
  canonical?: string;
}

/**
 * 獲取頁面的 SEO 數據
 */
export function getPageSEO(
  pageType: PageType | 'default',
  language: SupportedLanguage,
  customData?: Partial<SEOData>
): SEOData {
  const langMeta = SEO_CONFIG.LANGUAGE_META[language];
  
  let pageMeta;
  if (pageType !== 'default' && SEO_CONFIG.PAGE_META[pageType]) {
    pageMeta = SEO_CONFIG.PAGE_META[pageType][language];
  }

  return {
    title: customData?.title || pageMeta?.title || langMeta.title,
    description: customData?.description || pageMeta?.description || langMeta.description,
    keywords: customData?.keywords || langMeta.keywords,
    ogImage: customData?.ogImage || SEO_CONFIG.DEFAULT_OG_IMAGE,
    canonical: customData?.canonical
  };
}

/**
 * 生成 hreflang URLs
 */
export function generateHreflangUrls(pathname: string): Record<string, string> {
  const urls: Record<string, string> = {};
  
  SEO_CONFIG.SUPPORTED_LANGUAGES.forEach(lang => {
    urls[lang] = `${SEO_CONFIG.BASE_URL}${pathname}?lang=${lang}`;
  });
  
  return urls;
}

/**
 * 獲取語言的 locale 代碼
 */
export function getLocaleCode(language: SupportedLanguage): string {
  return SEO_CONFIG.LANGUAGE_META[language].locale;
}

/**
 * 生成結構化數據
 */
export function generateStructuredData(
  pageType: PageType | 'default',
  language: SupportedLanguage,
  url: string,
  customData?: {
    name?: string;
    description?: string;
    additionalType?: string;
  }
) {
  const seoData = getPageSEO(pageType, language);
  
  const baseStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": customData?.name || (language === 'zh-TW' ? 'LingUBible - Reg科聖經' : SEO_CONFIG.SITE_NAME),
    "alternateName": language === 'zh-TW' ? ['Reg科聖經', '嶺南選課神器', '嶺大課程評價'] : undefined,
    "description": customData?.description || seoData.description,
    "url": url,
    "inLanguage": language,
    "about": {
      "@type": "Thing",
      "name": language === 'zh-TW' ? "嶺南大學課程評價" : "Lingnan University Course Reviews",
      "description": language === 'zh-TW' ? "為嶺南大學學生提供真實可靠的課程和講師評價平台" : "Reliable course and lecturer review platform for Lingnan University students"
    },
    "audience": {
      "@type": "Audience",
      "audienceType": language === 'zh-TW' ? "嶺南大學學生" : "Lingnan University Students"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${url}?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": SEO_CONFIG.SITE_NAME,
      "url": SEO_CONFIG.BASE_URL,
      "description": language === 'zh-TW' ? "專為嶺南大學學生設計的課程評價平台" : "Course review platform designed for Lingnan University students"
    },
    "keywords": seoData.keywords.split(',').map(k => k.trim())
  };

  // 根據頁面類型添加特定的結構化數據
  if (pageType === 'courses') {
    return {
      ...baseStructuredData,
      "@type": "EducationalOrganization",
      "additionalType": "UniversityDepartment"
    };
  }

  return baseStructuredData;
}

/**
 * 檢查是否為有效的語言代碼
 */
export function isValidLanguage(lang: string): lang is SupportedLanguage {
  return SEO_CONFIG.SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
}

/**
 * 獲取頁面類型從路徑
 */
export function getPageTypeFromPath(pathname: string): PageType | 'default' {
  if (pathname === '/' || pathname === '') return 'home';
  if (pathname.startsWith('/courses')) return 'courses';
  if (pathname === '/login') return 'login';
  if (pathname === '/register') return 'register';
  return 'default';
} 