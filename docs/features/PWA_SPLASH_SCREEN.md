# PWA 啟動畫面自定義功能

## 概述

LingUBible 現在擁有完全自定義的 PWA 啟動畫面系統，提供了比原生白色背景更加吸引人的視覺體驗，並支援 Android 和 iOS 設備。

## ✨ 功能特點

### 🎨 視覺設計
- **品牌一致性**：使用 LingUBible 的紅色主題色彩
- **漸變背景**：從紅色到深紅色的美麗漸變
- **動態效果**：包含浮動粒子、光暈效果和進度條動畫
- **響應式設計**：自動適配各種屏幕尺寸和方向

### 📱 設備支援
- **iOS 設備**：iPhone 5/SE 到 iPhone 14 Pro Max，所有 iPad 型號
- **Android 設備**：從小屏到超大屏的各種尺寸
- **桌面設備**：完整的桌面瀏覽器支援

### 🔧 技術特性
- **智能檢測**：自動檢測 PWA 模式和首次啟動
- **多語言支援**：根據用戶語言顯示對應文字
- **性能優化**：使用 SVG 格式確保清晰度和載入速度
- **無障礙設計**：支援屏幕閱讀器和鍵盤導航

## 📁 文件結構

```
src/
├── components/features/pwa/
│   ├── PWASplashScreen.tsx          # 主要啟動畫面組件
│   └── PWAInstallBanner.tsx         # PWA 安裝橫幅（已存在）
├── hooks/
│   ├── usePWASplashScreen.ts        # 啟動畫面邏輯 Hook
│   └── usePWAManifest.ts            # PWA Manifest Hook（已存在）
└── dev/
    └── PWASplashScreenTrigger.tsx   # 開發者測試工具

public/
├── splash/                          # 啟動畫面圖片目錄
│   ├── iphone-*.svg                 # iPhone 各型號啟動畫面
│   ├── ipad-*.svg                   # iPad 各型號啟動畫面
│   ├── android-*.svg                # Android 各尺寸啟動畫面
│   ├── default.svg                  # 默認啟動畫面
│   └── README.md                    # 使用說明
├── test-splash-screen.html          # 測試頁面
└── splash-screens.html              # iOS meta 標籤（已整合到 index.html）

scripts/
└── generate-splash-screens.js       # 啟動畫面生成腳本
```

## 🚀 使用方法

### 1. 自動顯示（推薦）
啟動畫面會在以下情況自動顯示：
- 用戶從主屏幕啟動 PWA
- 首次訪問應用（PWA 模式）
- 從 Android 主屏幕圖標啟動

### 2. 手動觸發（開發測試）
```tsx
import { PWASplashScreen } from '@/components/features/pwa/PWASplashScreen';
import { usePWASplashScreen } from '@/hooks/usePWASplashScreen';

function MyComponent() {
  const { triggerSplashScreen } = usePWASplashScreen();
  
  return (
    <button onClick={triggerSplashScreen}>
      顯示啟動畫面
    </button>
  );
}
```

### 3. 開發者工具
使用 `PWASplashScreenTrigger` 組件進行測試：
```tsx
import { PWASplashScreenTrigger } from '@/components/dev/PWASplashScreenTrigger';

// 在開發環境中使用
<PWASplashScreenTrigger />
```

## 🎯 支援的設備尺寸

### iPhone 系列
- iPhone 5/SE (640×1136)
- iPhone 6/7/8 (750×1334)
- iPhone 6/7/8 Plus (1242×2208)
- iPhone X/XS/11 Pro (1125×2436)
- iPhone XR/11 (828×1792)
- iPhone XS Max/11 Pro Max (1242×2688)
- iPhone 12/13/14 (1170×2532)
- iPhone 12/13/14 Pro Max (1284×2778)
- iPhone 14 Pro (1179×2556)
- iPhone 14 Pro Max (1290×2796)

### iPad 系列
- iPad (1536×2048)
- iPad Pro 11" (1668×2388)
- iPad Pro 12.9" (2048×2732)

### Android 設備
- Small (480×854)
- Medium (720×1280)
- Large (1080×1920)
- XLarge (1440×2560)

## 🔧 配置選項

### PWASplashScreen 組件屬性
```tsx
interface PWASplashScreenProps {
  isVisible: boolean;        // 是否顯示
  onComplete?: () => void;   // 完成回調
  duration?: number;         // 顯示時長（毫秒，默認 3000）
}
```

### usePWASplashScreen Hook 返回值
```tsx
interface PWASplashScreenState {
  isVisible: boolean;        // 當前是否顯示
  shouldShow: boolean;       // 是否應該顯示
  isStandalone: boolean;     // 是否為 PWA 模式
  isFirstLaunch: boolean;    // 是否為首次啟動
  hideSplashScreen: () => void;      // 隱藏啟動畫面
  showSplashScreen: () => void;      // 顯示啟動畫面
  triggerSplashScreen: () => void;   // 手動觸發
}
```

## 🎨 自定義設計

### 修改啟動畫面設計
1. 編輯 `scripts/generate-splash-screens.js` 中的 SVG 模板
2. 運行生成腳本：
   ```bash
   node scripts/generate-splash-screens.js
   ```
3. 新的啟動畫面將自動生成到 `public/splash/` 目錄

### 修改動畫效果
編輯 `src/components/features/pwa/PWASplashScreen.tsx` 中的動畫類名和過渡效果。

### 修改 CSS 動畫
相關動畫樣式位於 `src/index.css` 中：
- `.animate-float` - 浮動粒子動畫
- `.animate-progress-bar` - 進度條動畫
- `.bg-gradient-radial` - 徑向漸變背景

## 📱 測試指南

### 在 iOS 設備上測試
1. 在 Safari 中打開應用
2. 點擊分享按鈕 → "加入主畫面"
3. 從主畫面啟動應用查看啟動畫面

### 在 Android 設備上測試
1. 在 Chrome 中打開應用
2. 點擊菜單 → "安裝應用"
3. 從主畫面啟動應用查看啟動畫面

### 使用測試頁面
訪問 `/test-splash-screen.html` 查看所有設備尺寸的啟動畫面預覽。

### 開發者工具
在開發環境中使用 `PWASplashScreenTrigger` 組件進行即時測試。

## 🔍 故障排除

### 啟動畫面不顯示
1. 確認應用已安裝為 PWA
2. 檢查瀏覽器控制台是否有錯誤
3. 確認 `sessionStorage` 中沒有 `pwa-launched` 標記

### iOS 設備上啟動畫面不正確
1. 確認設備尺寸匹配正確的 media query
2. 檢查 `apple-touch-startup-image` 標籤是否正確載入
3. 清除瀏覽器緩存並重新安裝 PWA

### Android 設備上背景顏色不正確
1. 確認 `manifest.json` 中的 `background_color` 設定
2. 檢查 PWA 是否正確安裝

## 🚀 性能優化

### 圖片優化
- 使用 SVG 格式確保在所有設備上清晰顯示
- 啟動畫面圖片大小已優化，載入速度快

### 動畫性能
- 使用 CSS transform 和 opacity 進行動畫
- 避免觸發重排和重繪
- 支援 `prefers-reduced-motion` 媒體查詢

### 記憶體使用
- 啟動畫面完成後自動清理
- 使用 React 的 useEffect 清理定時器

## 📈 未來改進

### 計劃中的功能
- [ ] 支援自定義主題色彩
- [ ] 添加更多動畫效果選項
- [ ] 支援視頻啟動畫面
- [ ] 添加載入進度指示器
- [ ] 支援深色模式啟動畫面

### 已知限制
- iOS Safari 對 SVG 動畫的支援有限
- 某些 Android 設備可能不支援自定義啟動畫面
- 啟動畫面顯示時間受系統限制

## 📞 技術支援

如果您在使用過程中遇到問題，請：
1. 查看瀏覽器控制台錯誤信息
2. 確認設備和瀏覽器版本
3. 使用測試頁面進行診斷
4. 聯繫開發團隊獲取支援

---

**更新時間：** 2025年1月3日  
**版本：** 1.0.0  
**作者：** LingUBible 開發團隊 