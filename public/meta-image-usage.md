 # LingUBible Meta 圖片使用說明

## 檔案說明

我已經為您創建了兩個版本的 meta 圖片：

1. **`meta-image.svg`** - SVG 向量格式，檔案較小，可縮放
2. **`meta-image.html`** - HTML 版本，可用於生成 PNG 格式

## 圖片規格

- **尺寸**: 1200 x 628 像素
- **比例**: 1.91:1 (符合 Facebook、Twitter、LinkedIn 等社交媒體平台的 Open Graph 標準)
- **格式**: SVG / HTML (可轉換為 PNG)

## 設計特色

### 視覺元素
- 🎨 現代漸層背景 (藍色系)
- 📚 品牌 Logo (紅色書本圖示)
- 🏷️ 四個特色標籤
- ⭐ 裝飾性評分星星
- 📊 統計圖表元素
- 🌈 品牌色彩線條

### 文字內容
- **主標題**: LingUBible
- **副標題**: 嶺南大學課程與講師評價平台
- **標語**: 讓每一次評價都成為學習路上的指路明燈
- **特色標籤**: 📝 課程評價、👨‍🏫 講師評分、🔍 智能搜尋、🌐 多語言

## HTML meta 標籤使用方式

將以下 meta 標籤添加到您的 HTML `<head>` 部分：

```html
<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://your-domain.com/">
<meta property="og:title" content="LingUBible - 嶺南大學課程與講師評價平台">
<meta property="og:description" content="讓每一次評價都成為學習路上的指路明燈。專為嶺南大學學生設計的課程和講師評價平台。">
<meta property="og:image" content="https://your-domain.com/meta-image.svg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="628">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="https://your-domain.com/">
<meta property="twitter:title" content="LingUBible - 嶺南大學課程與講師評價平台">
<meta property="twitter:description" content="讓每一次評價都成為學習路上的指路明燈。專為嶺南大學學生設計的課程和講師評價平台。">
<meta property="twitter:image" content="https://your-domain.com/meta-image.svg">

<!-- LinkedIn -->
<meta property="og:image:alt" content="LingUBible - 嶺南大學課程與講師評價平台">
```

## 如何生成 PNG 版本

如果您需要 PNG 格式的圖片，可以：

1. **使用瀏覽器截圖**:
   - 在瀏覽器中打開 `meta-image.html`
   - 使用開發者工具設定視窗大小為 1200x628
   - 截圖保存為 PNG

2. **使用線上工具**:
   - 將 SVG 內容複製到線上 SVG 轉 PNG 工具
   - 設定輸出尺寸為 1200x628

3. **使用程式工具**:
   - 使用 Puppeteer、Playwright 等工具自動截圖
   - 使用 ImageMagick 或其他圖片處理工具

## 測試建議

在發布前，建議使用以下工具測試 meta 圖片效果：

- **Facebook**: [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- **Twitter**: [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- **LinkedIn**: [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- **通用工具**: [OpenGraph.xyz](https://www.opengraph.xyz/)

## 自訂建議

如果您想要修改圖片內容，可以：

1. 編輯 SVG 檔案中的文字內容
2. 調整顏色配置以符合品牌需求
3. 更換 Logo 或圖示元素
4. 修改版本號碼 (目前為 v0.0.8)

## 檔案位置

- SVG 版本: `/public/meta-image.svg`
- HTML 版本: `/public/meta-image.html`
- 使用說明: `/public/meta-image-usage.md` 