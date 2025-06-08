# 🖼️ Meta 圖片設置指南

## ✅ 已完成的設置

我已經為您完成了以下設置：

1. **更新了 `index.html`** - 添加了完整的 Open Graph 和 Twitter 卡片 meta 標籤
2. **使用 PNG 格式** - 所有 meta 標籤都指向 `meta-image.png`
3. **優化了 SEO** - 添加了關鍵字、robots 標籤和 canonical 連結
4. **多語言支持** - 設置了繁體中文作為主要語言

## 🔧 需要您完成的步驟

### 1. 更新域名

目前 meta 標籤中使用的是佔位符域名 `your-domain.com`，您需要替換為您的實際域名。

**方法一：使用自動腳本**
```bash
node update-domain.js your-actual-domain.com
```

**方法二：手動替換**
在 `index.html` 中將所有的 `https://your-domain.com` 替換為您的實際域名。

### 2. 確認文件位置

確保以下文件在正確的位置：
- ✅ `public/meta-image.png` - 您的 meta 圖片（1200x628 像素）
- ✅ `index.html` - 已更新的 HTML 文件

### 3. 測試 Meta 標籤

部署後，使用以下工具測試您的 meta 標籤：

#### Facebook/Meta
- 🔗 [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- 輸入您的網站 URL
- 點擊 "Scrape Again" 如果需要刷新快取

#### Twitter
- 🔗 [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- 輸入您的網站 URL
- 預覽卡片效果

#### LinkedIn
- 🔗 [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- 輸入您的網站 URL
- 檢查預覽效果

#### 通用工具
- 🔗 [OpenGraph.xyz](https://www.opengraph.xyz/)
- 🔗 [Meta Tags](https://metatags.io/)

## 📋 當前的 Meta 標籤設置

```html
<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://your-domain.com/" />
<meta property="og:title" content="LingUBible - 嶺南大學課程與講師評價平台" />
<meta property="og:description" content="讓每一次評價都成為學習路上的指路明燈。專為嶺南大學學生設計的課程和講師評價平台。" />
<meta property="og:image" content="https://your-domain.com/meta-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="628" />
<meta property="og:image:alt" content="LingUBible - 嶺南大學課程與講師評價平台" />
<meta property="og:site_name" content="LingUBible" />

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content="https://your-domain.com/" />
<meta property="twitter:title" content="LingUBible - 嶺南大學課程與講師評價平台" />
<meta property="twitter:description" content="讓每一次評價都成為學習路上的指路明燈。專為嶺南大學學生設計的課程和講師評價平台。" />
<meta property="twitter:image" content="https://your-domain.com/meta-image.png" />
<meta property="twitter:image:alt" content="LingUBible - 嶺南大學課程與講師評價平台" />
```

## 🎯 圖片規格確認

您的 `meta-image.png` 應該符合以下規格：
- **尺寸**: 1200 x 628 像素
- **比例**: 1.91:1
- **格式**: PNG
- **檔案大小**: 建議小於 1MB
- **內容**: 包含 LingUBible logo、標題和特色說明

## 🔍 常見問題

### Q: 為什麼社交媒體還是顯示舊的圖片？
A: 社交媒體平台會快取 meta 資訊。請使用上述的調試工具強制刷新快取。

### Q: 圖片沒有顯示怎麼辦？
A: 檢查：
1. 圖片 URL 是否正確
2. 圖片是否可以公開訪問
3. 圖片格式和尺寸是否符合要求

### Q: 可以使用不同語言的 meta 標籤嗎？
A: 可以！您可以根據用戶的語言偏好動態設置不同的 meta 標籤內容。

## 📞 需要幫助？

如果您在設置過程中遇到任何問題，請檢查：
1. 域名是否正確設置
2. 圖片文件是否在正確位置
3. 網站是否已正確部署
4. 使用調試工具檢查 meta 標籤是否正確載入 