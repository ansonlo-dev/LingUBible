# PWA 啟動畫面使用說明

## 文件說明
本目錄包含為 LingUBible PWA 生成的啟動畫面圖片，支援各種設備尺寸。

## 文件列表
- `iphone-legacy.svg` (640x1136) - iPhone 5/SE
- `iphone-6.svg` (750x1334) - iPhone 6/7/8
- `iphone-6-plus.svg` (1242x2208) - iPhone 6/7/8 Plus
- `iphone-x.svg` (1125x2436) - iPhone X/XS/11 Pro
- `iphone-x-landscape.svg` (2436x1125) - iPhone X/XS/11 Pro Landscape
- `iphone-xr.svg` (828x1792) - iPhone XR/11
- `iphone-xr-landscape.svg` (1792x828) - iPhone XR/11 Landscape
- `iphone-xs-max.svg` (1242x2688) - iPhone XS Max/11 Pro Max
- `iphone-xs-max-landscape.svg` (2688x1242) - iPhone XS Max/11 Pro Max Landscape
- `iphone-12.svg` (1170x2532) - iPhone 12/13/14
- `iphone-12-landscape.svg` (2532x1170) - iPhone 12/13/14 Landscape
- `iphone-12-pro-max.svg` (1284x2778) - iPhone 12/13/14 Pro Max
- `iphone-12-pro-max-landscape.svg` (2778x1284) - iPhone 12/13/14 Pro Max Landscape
- `iphone-14-pro.svg` (1179x2556) - iPhone 14 Pro
- `iphone-14-pro-landscape.svg` (2556x1179) - iPhone 14 Pro Landscape
- `iphone-14-pro-max.svg` (1290x2796) - iPhone 14 Pro Max
- `iphone-14-pro-max-landscape.svg` (2796x1290) - iPhone 14 Pro Max Landscape
- `ipad.svg` (1536x2048) - iPad
- `ipad-landscape.svg` (2048x1536) - iPad Landscape
- `ipad-pro-11.svg` (1668x2388) - iPad Pro 11"
- `ipad-pro-11-landscape.svg` (2388x1668) - iPad Pro 11" Landscape
- `ipad-pro-12.svg` (2048x2732) - iPad Pro 12.9"
- `ipad-pro-12-landscape.svg` (2732x2048) - iPad Pro 12.9" Landscape
- `android-small.svg` (480x854) - Android Small
- `android-medium.svg` (720x1280) - Android Medium
- `android-large.svg` (1080x1920) - Android Large
- `android-xlarge.svg` (1440x2560) - Android XLarge
- `default.svg` (1080x1920) - Default

## 使用方法

### 1. 在 HTML 中引用 (iOS)
將 `public/splash-screens.html` 的內容添加到您的 `index.html` 的 `<head>` 部分。

### 2. 在 PWA Manifest 中配置 (Android)
Android 設備會自動使用 manifest 中的 `background_color` 和圖標。

### 3. 自定義啟動畫面組件
使用 `PWASplashScreen` 組件來顯示自定義的啟動動畫。

## 注意事項
- SVG 格式確保在所有設備上都有清晰的顯示效果
- 如需 PNG 格式，可使用工具將 SVG 轉換為對應尺寸的 PNG
- iOS 設備需要精確的尺寸匹配才能正確顯示啟動畫面

## 更新啟動畫面
如需修改設計，請編輯 `scripts/generate-splash-screens.js` 中的 SVG 模板，然後重新運行腳本。

生成時間: 2025/6/8 上午9:11:44
