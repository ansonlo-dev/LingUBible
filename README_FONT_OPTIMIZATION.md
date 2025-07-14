# 🎨 LXGW WenKai 字體優化快速入門

## 📋 快速實施步驟

### 1. 安裝依賴

```bash
# 安裝 fonttools（字體子集化工具）
pip install fonttools

# 驗證安裝
pyftsubset --help
```

### 2. 下載和處理字體

```bash
# 自動下載和處理字體
bun run font:process

# 或手動操作
bun run font:download
bun run font:subset public/fonts/LXGWWenKai-Regular.ttf
```

### 3. 導入字體樣式

```typescript
// src/App.tsx - 添加字體導入
import './styles/fonts.css';

// 或在 src/index.css 中添加
@import './styles/fonts.css';
```

### 4. 集成字體載入器

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

### 5. 更新 index.html（可選）

```html
<!-- 在 <head> 中添加字體預載入 -->
<link rel="preload" href="/fonts/LXGWWenKai-TC.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/LXGWWenKai-SC.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/LXGWWenKai-EN.woff2" as="font" type="font/woff2" crossorigin>
```

## 🎯 效果預期

實施後預期改善：

- **載入時間減少 60-80%**
- **字體文件大小減少 70-90%**
- **首次內容繪製提升 30-50%**

## 📊 字體文件大小比較

| 版本 | 原始大小 | 優化後大小 | 減少比例 |
|------|----------|------------|----------|
| 繁體中文 | ~15MB | ~3-4MB | 73-80% |
| 簡體中文 | ~15MB | ~2-3MB | 80-87% |
| 英文 | ~15MB | ~100-200KB | 98-99% |

## 🔧 自定義配置

### 調整字符集

修改 `scripts/font-subset.js` 中的字符集定義：

```javascript
// 添加特定詞彙
getTraditionalChineseCharSet() {
  return [
    // 基本字符集
    '的一是在不了...',
    
    // 你的專案特定詞彙
    '你的專案特定詞彙',
    
    // 其他字符...
  ].join('');
}
```

### 調整載入策略

修改 `src/utils/fontLoader.ts` 中的載入配置：

```typescript
// 調整超時時間
const loadPromise = this.createFontLoadPromise(config, 8000); // 8秒超時

// 調整顯示策略
display: 'swap' // 或 'fallback', 'optional'
```

## 📱 使用方式

### 在 CSS 中使用

```css
/* 自動選擇最適合的字體 */
.text-content {
  font-family: var(--font-family-base);
}

/* 指定語言字體 */
.chinese-text {
  font-family: 'LXGW WenKai TC', 'LXGW WenKai SC', sans-serif;
}
```

### 在 React 組件中使用

```typescript
import { useFontLoader } from '@/utils/fontLoader';

const MyComponent = () => {
  const { isFontLoaded } = useFontLoader();
  
  return (
    <div className={isFontLoaded('LXGW WenKai TC') ? 'font-loaded' : 'font-loading'}>
      <p>你的內容</p>
    </div>
  );
};
```

## 🚀 進階優化

### 網路感知載入

```typescript
// 根據網路狀況調整載入策略
const strategy = getNetworkAwareLoadingStrategy();
if (strategy === 'critical-only') {
  // 只載入當前語言字體
  loadLanguageFont(currentLanguage);
} else {
  // 載入所有字體
  preloadCriticalFonts();
}
```

### 性能監控

```typescript
// 開發模式下啟用性能監控
if (process.env.NODE_ENV === 'development') {
  window.fontLoader = fontLoader;
  
  // 查看載入統計
  console.log(fontLoader.getLoadingStats());
}
```

## 🔍 故障排除

### 常見問題

1. **字體載入失敗**
   ```bash
   # 檢查字體文件是否存在
   ls public/fonts/
   
   # 檢查文件大小
   du -h public/fonts/*.woff2
   ```

2. **子集化失敗**
   ```bash
   # 確認 fonttools 安裝
   pip show fonttools
   
   # 重新安裝
   pip install --upgrade fonttools
   ```

3. **載入速度慢**
   - 檢查文件大小是否過大
   - 確認是否啟用了緩存
   - 考慮使用 CDN

## 📈 性能測試

```bash
# 使用 Lighthouse 測試
npx lighthouse http://localhost:5173 --only-categories=performance

# 檢查字體載入時間
# 打開開發者工具 → Network → 篩選 Font
```

## 🎉 完成！

現在你的 LingUBible 項目已經配置了高效能的 LXGW WenKai 字體載入系統！

## 🤝 貢獻

如果你有改進建議或遇到問題，歡迎：

1. 提交 Issue
2. 創建 Pull Request
3. 分享使用心得

---

更多詳細信息請參閱 [完整實施指南](docs/LXGW_WENKAI_OPTIMIZATION.md)。 