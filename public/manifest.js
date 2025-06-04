// 動態 PWA Manifest 生成器
// 根據用戶語言偏好生成對應的 manifest 內容

const manifestTranslations = {
  'en': {
    name: 'LingUBible - Course & Lecturer Reviews',
    short_name: 'LingUBible',
    description: 'Platform for college students to review courses and lecturers',
    lang: 'en',
    dir: 'ltr',
    screenshots: {
      desktop: 'Desktop view of LingUBible',
      mobile: 'Mobile view of LingUBible'
    },
    shortcuts: {
      search: {
        name: 'Search Courses',
        short_name: 'Search',
        description: 'Search for courses and reviews'
      },
      reviews: {
        name: 'My Reviews',
        short_name: 'Reviews',
        description: 'View my course reviews'
      }
    }
  },
  'zh-TW': {
    name: 'LingUBible - 課程與講師評價平台',
    short_name: 'LingUBible',
    description: '真實可靠的Reg科聖經，幫助同學們作出明智的選擇',
    lang: 'zh-TW',
    dir: 'ltr',
    screenshots: {
      desktop: 'LingUBible 桌面版視圖',
      mobile: 'LingUBible 手機版視圖'
    },
    shortcuts: {
      search: {
        name: '搜尋課程',
        short_name: '搜尋',
        description: '搜尋課程和評價'
      },
      reviews: {
        name: '我的評價',
        short_name: '評價',
        description: '查看我的課程評價'
      }
    }
  },
  'zh-CN': {
    name: 'LingUBible - 课程与讲师评价平台',
    short_name: 'LingUBible',
    description: '您诚实的课程和讲师评价平台，帮助同学们做出明智的决定',
    lang: 'zh-CN',
    dir: 'ltr',
    screenshots: {
      desktop: 'LingUBible 桌面版视图',
      mobile: 'LingUBible 手机版视图'
    },
    shortcuts: {
      search: {
        name: '搜索课程',
        short_name: '搜索',
        description: '搜索课程和评价'
      },
      reviews: {
        name: '我的评价',
        short_name: '评价',
        description: '查看我的课程评价'
      }
    }
  }
};

// 檢測用戶語言偏好
function detectUserLanguage() {
  // 1. 檢查 URL 參數
  const urlParams = new URLSearchParams(window.location.search);
  const langParam = urlParams.get('lang');
  if (langParam && manifestTranslations[langParam]) {
    return langParam;
  }

  // 2. 檢查 Cookie
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'language' && manifestTranslations[value]) {
      return value;
    }
  }

  // 3. 檢查瀏覽器語言
  const browserLang = navigator.language || navigator.languages?.[0];
  if (browserLang) {
    if (browserLang.startsWith('zh-TW') || 
        browserLang.startsWith('zh-Hant') || 
        browserLang === 'zh-HK' || 
        browserLang === 'zh-MO') {
      return 'zh-TW';
    } else if (browserLang.startsWith('zh-CN') || 
               browserLang.startsWith('zh-Hans') || 
               browserLang.startsWith('zh-SG') || 
               browserLang === 'zh') {
      return 'zh-CN';
    } else if (browserLang.startsWith('en')) {
      return 'en';
    }
  }

  // 4. 默認英文
  return 'en';
}

// 生成 manifest 對象
function generateManifest(language = 'en') {
  const translation = manifestTranslations[language] || manifestTranslations['en'];
  
  return {
    name: translation.name,
    short_name: translation.short_name,
    description: translation.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    background_color: "#ffffff",
    theme_color: "#dc2626",
    orientation: "any",
    prefer_related_applications: false,
    icons: [
      {
        src: "/favicon.svg?v=2",
        sizes: "32x32",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/favicon-32.png?v=2",
        sizes: "32x32",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/apple-touch-icon.svg?v=2",
        sizes: "180x180",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/apple-touch-icon.png?v=2",
        sizes: "180x180",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon-192.png?v=2",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/logo.svg?v=2",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any maskable"
      },
      {
        src: "/icon-512.png?v=2",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/logo.svg?v=2",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any maskable"
      }
    ],
    screenshots: [
      {
        src: "/screenshot-desktop.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: translation.screenshots.desktop
      },
      {
        src: "/screenshot-mobile.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: translation.screenshots.mobile
      }
    ],
    shortcuts: [
      {
        name: translation.shortcuts.search.name,
        short_name: translation.shortcuts.search.short_name,
        description: translation.shortcuts.search.description,
        url: "/?action=search",
        icons: [
          {
            src: "/icon-search.png",
            sizes: "96x96",
            type: "image/png"
          }
        ]
      },
      {
        name: translation.shortcuts.reviews.name,
        short_name: translation.shortcuts.reviews.short_name,
        description: translation.shortcuts.reviews.description,
        url: "/?action=reviews",
        icons: [
          {
            src: "/icon-reviews.png",
            sizes: "96x96",
            type: "image/png"
          }
        ]
      }
    ],
    categories: ["education", "social", "productivity"],
    lang: translation.lang,
    dir: translation.dir,
    edge_side_panel: {
      preferred_width: 400
    },
    launch_handler: {
      client_mode: "navigate-existing"
    },
    handle_links: "preferred",
    protocol_handlers: [
      {
        protocol: "web+lingubible",
        url: "/?handler=%s"
      }
    ]
  };
}

// 如果在瀏覽器環境中運行
if (typeof window !== 'undefined') {
  // 動態更新 manifest link
  function updateManifestLink() {
    const language = detectUserLanguage();
    const manifestLink = document.querySelector('link[rel="manifest"]');
    
    if (manifestLink) {
      // 更新 manifest URL 包含語言參數
      manifestLink.href = `/manifest.json?lang=${language}&t=${Date.now()}`;
    }
  }

  // 頁面載入時更新 manifest
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateManifestLink);
  } else {
    updateManifestLink();
  }

  // 監聽語言變化
  window.addEventListener('languagechange', updateManifestLink);
  
  // 監聽 cookie 變化（通過 storage 事件模擬）
  window.addEventListener('storage', (e) => {
    if (e.key === 'language-changed') {
      updateManifestLink();
    }
  });
}

// 導出函數供服務器端使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateManifest,
    detectUserLanguage,
    manifestTranslations
  };
}

// 全局函數供其他腳本使用
window.LingUBibleManifest = {
  generateManifest,
  detectUserLanguage,
  manifestTranslations,
  updateManifestLink: () => {
    const language = detectUserLanguage();
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      manifestLink.href = `/manifest.json?lang=${language}&t=${Date.now()}`;
    }
  }
}; 