# PWA 版本同步功能

## 概述

LingUBible 實現了完整的 PWA 版本同步系統，確保 PWA manifest 中的版本信息與 GitHub 發布版本保持一致。

## 功能特點

### ✅ 自動版本同步
- **GitHub API 集成**：自動從 GitHub Releases 獲取最新版本
- **本地備用機制**：當 GitHub API 不可用時使用本地版本
- **多語言支援**：根據用戶語言動態生成 manifest
- **實時更新**：語言切換時自動更新 PWA manifest

### 🔄 版本來源優先級
1. **GitHub Releases API** (最高優先級)
2. **本地版本 API** (`/api/version.json`)
3. **硬編碼備用版本** (最後備用)

### 🌐 多語言 PWA Manifest
- **英文**：`LingUBible - Course & Lecturer Reviews (Beta 0.0.6)`
- **繁體中文**：`LingUBible - 課程與講師評價平台 (Beta 0.0.6)`
- **簡體中文**：`LingUBible - 课程与讲师评价平台 (Beta 0.0.6)`

## 技術實現

### 1. 版本信息結構

```json
{
  "version": "0.0.6",
  "formattedVersion": "Beta 0.0.6",
  "status": "beta",
  "releaseUrl": "https://github.com/ansonlo-dev/LingUBible/releases/tag/v0.0.6",
  "publishedAt": "2025-01-03T00:00:00Z"
}
```

### 2. PWA Manifest 版本字段

```json
{
  "name": "LingUBible - 課程與講師評價平台 (Beta 0.0.6)",
  "short_name": "LingUBible",
  "description": "真實可靠的Reg科聖經，幫助同學們作出明智的選擇 - Beta 0.0.6",
  "version": "0.0.6",
  "version_name": "Beta 0.0.6"
}
```

### 3. 核心文件

#### `public/manifest.js`
- 動態 PWA manifest 生成器
- 版本信息獲取邏輯
- 多語言支援

#### `public/api/version.json`
- 本地版本信息 API
- 構建時自動更新
- 包含構建時間和環境信息

#### `tools/scripts/version/update-pwa-version.js`
- PWA 版本更新腳本
- 從 package.json 讀取版本
- 生成版本 API 文件

#### `src/hooks/usePWAManifest.ts`
- React Hook for PWA manifest
- 版本信息獲取
- 語言變更監聽

## 自動化流程

### GitHub Actions 集成

```yaml
- name: Update PWA version
  run: |
    npm run pwa:update-version
    echo "PWA version information updated"

- name: Commit version update
  run: |
    git add package.json public/api/version.json
    git commit -m "🔖 [version] Auto update version to ${{ steps.update_version.outputs.NEW_VERSION }}"
```

### 構建時自動更新

```json
{
  "scripts": {
    "build": "npm run pwa:update-version && vite build",
    "pwa:update-version": "node tools/scripts/version/update-pwa-version.js"
  }
}
```

## 使用方法

### 1. 手動更新 PWA 版本

```bash
npm run pwa:update-version
```

### 2. 測試版本同步

```bash
npm run pwa:test-version
```

### 3. 在代碼中使用

```typescript
import { usePWAManifest } from '@/hooks/usePWAManifest';

function MyComponent() {
  const { 
    getAppVersion, 
    getAppVersionName, 
    getAppName 
  } = usePWAManifest();
  
  return (
    <div>
      <h1>{getAppName()}</h1>
      <p>版本: {getAppVersionName()}</p>
    </div>
  );
}
```

### 4. 全局 JavaScript API

```javascript
// 獲取版本信息
const versionInfo = await window.LingUBibleManifest.getVersionInfo();

// 生成 manifest
const manifest = await window.LingUBibleManifest.generateManifest('zh-TW');

// 更新 manifest
await window.LingUBibleManifest.updateManifestLink();
```

## 測試頁面

### PWA 版本同步測試
訪問 `/test-pwa-version.html` 進行完整的版本同步測試：

- ✅ 本地版本 API 測試
- ✅ GitHub 版本 API 測試  
- ✅ PWA Manifest 生成測試
- ✅ 版本同步狀態檢查
- ✅ 多語言切換測試

### 測試功能
1. **版本信息測試**：驗證各個版本源的可用性
2. **PWA Manifest 測試**：測試動態 manifest 生成
3. **版本同步測試**：比較所有版本源的一致性
4. **語言切換測試**：驗證多語言 manifest 更新

## 版本狀態

### Beta 版本 (0.x.x)
- 顯示格式：`Beta 0.0.6`
- PWA 名稱包含 Beta 標識
- 橙色版本徽章

### 穩定版本 (1.x.x+)
- 顯示格式：`v1.0.0`
- PWA 名稱不包含 Beta 標識
- 綠色版本徽章

## 故障排除

### 常見問題

1. **GitHub API 限制**
   - 解決方案：設置 `VITE_GITHUB_TOKEN` 環境變數
   - 備用機制：自動使用本地版本

2. **版本不同步**
   - 檢查：運行 `npm run pwa:update-version`
   - 驗證：訪問測試頁面檢查版本狀態

3. **PWA Manifest 未更新**
   - 清除瀏覽器緩存
   - 檢查 manifest link 是否正確更新

### 調試工具

```javascript
// 檢查當前 manifest
console.log(document.querySelector('link[rel="manifest"]').href);

// 測試版本獲取
window.LingUBibleManifest.getVersionInfo().then(console.log);

// 監聽 manifest 更新
window.addEventListener('manifestUpdated', console.log);
```

## 最佳實踐

1. **版本發布流程**
   - 使用 `npm run release:patch` 自動發布
   - GitHub Actions 自動更新 PWA 版本
   - 確保所有版本源同步

2. **開發環境**
   - 定期運行 `npm run pwa:update-version`
   - 使用測試頁面驗證功能
   - 檢查控制台日誌

3. **生產環境**
   - 構建時自動更新版本
   - 監控版本同步狀態
   - 設置適當的緩存策略

## 相關文件

- [`public/manifest.js`](../../public/manifest.js) - 動態 manifest 生成器
- [`public/api/version.json`](../../public/api/version.json) - 版本 API
- [`src/hooks/usePWAManifest.ts`](../../src/hooks/usePWAManifest.ts) - React Hook
- [`tools/scripts/version/update-pwa-version.js`](../../tools/scripts/version/update-pwa-version.js) - 更新腳本
- [`public/test-pwa-version.html`](../../public/test-pwa-version.html) - 測試頁面

---

*最後更新: 2025-01-03* 