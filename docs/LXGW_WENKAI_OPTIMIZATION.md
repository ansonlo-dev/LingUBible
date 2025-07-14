# LXGW WenKai 字體優化實施指南

## 📋 概述

本指南提供了在 LingUBible 項目中實施 LXGW WenKai 字體的完整優化方案，包括字體子集化、載入策略、效能優化等。

## 🎯 優化目標

- **減少字體檔案大小**：透過子集化將原始字體分割為語言特定版本
- **提升載入速度**：使用漸進式載入和預載入策略
- **改善用戶體驗**：平滑的字體切換和回退機制
- **多語言支援**：針對繁體中文、簡體中文、英文的個別優化

## 📚 字體版本選擇

### 建議的字體文件配置

```bash
# 繁體中文用戶
LXGWWenKai-TC.woff2      # 約 3-4MB (子集化後)

# 簡體中文用戶  
LXGWWenKai-SC.woff2      # 約 2-3MB (子集化後)

# 英文用戶
LXGWWenKai-EN.woff2      # 約 100-200KB (子集化後)
```

## 🛠️ 實施步驟

### 第一步：下載字體文件

```bash
# 創建字體目錄
mkdir -p public/fonts/

# 下載 LXGW WenKai 字體
wget -O public/fonts/LXGWWenKai-Regular.ttf \
  https://github.com/lxgw/LxgwWenKai/releases/download/v1.330/LXGWWenKai-Regular.ttf

wget -O public/fonts/LXGWWenKai-Light.ttf \
  https://github.com/lxgw/LxgwWenKai/releases/download/v1.330/LXGWWenKai-Light.ttf

wget -O public/fonts/LXGWWenKai-Bold.ttf \
  https://github.com/lxgw/LxgwWenKai/releases/download/v1.330/LXGWWenKai-Bold.ttf
```

### 第二步：安裝字體子集化工具

```bash
# 安裝 fonttools (包含 pyftsubset)
pip install fonttools

# 或使用 conda
conda install -c conda-forge fonttools

# 驗證安裝
pyftsubset --help
```

### 第三步：執行字體子集化

```bash
# 使用我們的子集化工具
node scripts/font-subset.js public/fonts/LXGWWenKai-Regular.ttf

# 或手動執行
# 繁體中文子集
pyftsubset public/fonts/LXGWWenKai-Regular.ttf \
  --output-file=public/fonts/LXGWWenKai-TC.woff2 \
  --unicodes="U+4E00-9FFF,U+3400-4DBF,U+20000-2A6DF,U+F900-FAFF,U+2F800-2FA1F" \
  --flavor=woff2 \
  --layout-features="*"

# 簡體中文子集
pyftsubset public/fonts/LXGWWenKai-Regular.ttf \
  --output-file=public/fonts/LXGWWenKai-SC.woff2 \
  --unicodes="U+4E00-9FFF,U+3400-4DBF" \
  --flavor=woff2 \
  --layout-features="*"

# 英文子集
pyftsubset public/fonts/LXGWWenKai-Regular.ttf \
  --output-file=public/fonts/LXGWWenKai-EN.woff2 \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" \
  --flavor=woff2 \
  --layout-features="*"
```

### 第四步：整合到項目中

#### 1. 導入字體 CSS

```typescript
// src/App.tsx
import './styles/fonts.css';

// 或在 index.css 中導入
@import './styles/fonts.css';
```

#### 2. 使用字體載入器

```typescript
// src/components/common/FontLoader.tsx
import { useEffect } from 'react';
import { useFontLoader } from '@/utils/fontLoader';
import { useLanguage } from '@/hooks/useLanguage';

export const FontLoader = () => {
  const { language } = useLanguage();
  const { loadLanguageFont, preloadCriticalFonts } = useFontLoader();

  useEffect(() => {
    // 預載入關鍵字體
    preloadCriticalFonts();
  }, []);

  useEffect(() => {
    // 語言變更時載入對應字體
    if (language) {
      loadLanguageFont(language);
    }
  }, [language]);

  return null;
};
```

#### 3. 更新 App.tsx

```typescript
// src/App.tsx
import { FontLoader } from '@/components/common/FontLoader';

function App() {
  return (
    <div className="App">
      <FontLoader />
      {/* 其他組件 */}
    </div>
  );
}
```

## 📊 效能優化配置

### HTML 預載入

```html
<!-- index.html -->
<head>
  <!-- 預載入關鍵字體 -->
  <link rel="preload" href="/fonts/LXGWWenKai-TC.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/LXGWWenKai-SC.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/LXGWWenKai-EN.woff2" as="font" type="font/woff2" crossorigin>
</head>
```

### Vite 配置優化

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.woff2')) {
            return 'fonts/[name].[hash][extname]';
          }
          return 'assets/[name].[hash][extname]';
        },
      },
    },
  },
  // 字體文件不進行壓縮
  assetsInclude: ['**/*.woff2', '**/*.woff', '**/*.ttf'],
});
```

## 🔧 Tailwind CSS 配置

```javascript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        'lxgw': ['LXGW WenKai TC', 'LXGW WenKai SC', 'LXGW WenKai EN', 'sans-serif'],
        'lxgw-tc': ['LXGW WenKai TC', 'Noto Sans TC', 'sans-serif'],
        'lxgw-sc': ['LXGW WenKai SC', 'Noto Sans SC', 'sans-serif'],
        'lxgw-en': ['LXGW WenKai EN', 'Inter', 'sans-serif'],
      }
    }
  }
};
```

## 📱 響應式載入策略

### 根據網路狀況調整載入策略

```typescript
// src/utils/networkAwareLoader.ts
export const getNetworkAwareLoadingStrategy = () => {
  const connection = (navigator as any).connection;
  
  if (connection) {
    // 慢速網路：只載入當前語言字體
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      return 'critical-only';
    }
    
    // 快速網路：預載入所有字體
    if (connection.effectiveType === '4g') {
      return 'preload-all';
    }
  }
  
  // 默認策略
  return 'progressive';
};
```

## 🎛️ 開發工具配置

### 字體載入監控

```typescript
// src/utils/fontMonitor.ts
export const FontMonitor = {
  logLoadingStats: () => {
    const stats = fontLoader.getLoadingStats();
    console.log('字體載入統計:', stats);
  },
  
  measureLoadTime: async (fontFamily: string) => {
    const startTime = performance.now();
    
    try {
      await fontLoader.loadFont({
        family: fontFamily,
        url: `/fonts/${fontFamily}.woff2`
      });
      
      const endTime = performance.now();
      console.log(`${fontFamily} 載入時間: ${endTime - startTime}ms`);
      
    } catch (error) {
      console.error(`${fontFamily} 載入失敗:`, error);
    }
  }
};
```

## 🚀 部署最佳實踐

### CDN 配置

```nginx
# nginx.conf
location ~* \.(woff2|woff|ttf|otf)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin "*";
}
```

### Cloudflare Pages 配置

```toml
# wrangler.toml
[build]
command = "npm run build"
cwd = "."
watch_dir = "src"

[[build.environment_variables]]
name = "FONT_OPTIMIZATION"
value = "true"

[build.upload]
format = "service-worker"
```

## 📈 效能測試

### 載入時間測試

```bash
# 使用 Lighthouse 測試
npx lighthouse https://your-domain.com --only-categories=performance

# 使用 WebPageTest
curl -X POST "https://www.webpagetest.org/runtest.php" \
  -d "url=https://your-domain.com" \
  -d "runs=3" \
  -d "location=Dulles:Chrome"
```

### 字體載入分析

```javascript
// 在開發工具中執行
document.fonts.ready.then(() => {
  console.log('所有字體載入完成');
  console.log('已載入字體:', Array.from(document.fonts.values()).map(f => f.family));
});
```

## 🔍 故障排除

### 常見問題

1. **字體載入失敗**
   - 檢查字體文件路徑
   - 確認 CORS 設置
   - 驗證字體文件完整性

2. **載入速度慢**
   - 檢查字體文件大小
   - 優化子集化配置
   - 使用 CDN 加速

3. **回退字體不當**
   - 調整字體堆疊順序
   - 檢查系統字體可用性
   - 測試不同設備和瀏覽器

### 調試工具

```typescript
// 開發模式下啟用字體調試
if (process.env.NODE_ENV === 'development') {
  window.fontLoader = fontLoader;
  window.FontMonitor = FontMonitor;
}
```

## 🏆 最佳實踐總結

1. **使用子集化字體** - 針對不同語言創建專門的字體文件
2. **漸進式載入** - 優先載入關鍵字體，後續載入其他字體
3. **合理的回退策略** - 設置適當的系統字體回退
4. **網路感知載入** - 根據網路狀況調整載入策略
5. **緩存優化** - 設置適當的緩存策略
6. **監控和測試** - 定期測試字體載入效能

## 📊 預期效果

實施本優化方案後，預期能達到：

- **載入時間減少 60-80%**
- **字體文件大小減少 70-90%**
- **首次內容繪製 (FCP) 提升 30-50%**
- **累積佈局偏移 (CLS) 減少 40-60%**

## 🔄 持續優化

- 定期更新字體文件
- 監控載入效能指標
- 根據用戶反饋調整策略
- 關注新的字體載入技術 