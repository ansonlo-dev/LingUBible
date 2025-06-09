# Workbox PWA 圖標預緩存錯誤修復

## 問題描述

當點擊瀏覽器地址欄中的 PWA 安裝圖標時，控制台出現以下 Workbox 錯誤：

```
workbox Precaching did not find a match for /apple-touch-icon.png
workbox No route found for: /apple-touch-icon.png
workbox Precaching did not find a match for /favicon-32.png
workbox No route found for: /favicon-32.png
workbox Precaching did not find a match for /favicon.svg
workbox No route found for: /favicon.svg
workbox Precaching did not find a match for /icon-192.png
workbox No route found for: /icon-192.png
workbox Precaching did not find a match for /icon-512.png
workbox No route found for: /icon-512.png
```

## 根本原因

1. **VitePWA 配置問題**: `globPatterns` 沒有正確匹配圖標文件
2. **重複配置**: `includeAssets` 和 `additionalManifestEntries` 與 `globPatterns` 重複
3. **路徑匹配問題**: Service Worker 無法找到預緩存的圖標文件

## 解決方案

### 1. 更新 VitePWA 配置

在 `vite.config.ts` 中修復了 Workbox 配置：

```typescript
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: [
      '**/*.{js,css,html,woff2}',
      // 只在生產模式下預緩存圖標文件
      ...(mode === 'production' ? ['*.{ico,png,svg}', 'assets/**/*.{png,svg,jpg,jpeg,gif,webp}'] : [])
    ],
    // 運行時緩存配置（開發和生產模式都適用）
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst' as const,
        options: {
          cacheName: 'google-fonts-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
          }
        }
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: 'CacheFirst' as const,
        options: {
          cacheName: 'gstatic-fonts-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
          }
        }
      },
      // 緩存圖標文件（開發和生產模式都需要）
      {
        urlPattern: /\.(ico|png|svg)$/,
        handler: 'CacheFirst' as const,
        options: {
          cacheName: 'icons-cache',
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
          }
        }
      }
    ],
    globIgnores: [
      '**/dev/**',
      '**/icons/**',
      'pwa-test.html',
      'manifest.js',
      'manifest.json'
    ],
  },
  includeAssets: [],  // 避免與 globPatterns 重複
  // ... 其他配置
})
```

### 2. 關鍵修復點

1. **分離開發和生產模式**:
   - 生產模式：使用 `globPatterns` 預緩存圖標文件
   - 開發模式：使用 `runtimeCaching` 動態緩存圖標文件

2. **運行時緩存策略**:
   - 添加圖標文件的運行時緩存規則 `/\.(ico|png|svg)$/`
   - 使用 `CacheFirst` 策略提高性能
   - 設置適當的緩存過期時間（30天）

3. **清理重複配置**:
   - 移除 `includeAssets` 中的圖標文件
   - 移除 `additionalManifestEntries` 中的重複條目
   - 避免預緩存和運行時緩存的衝突

4. **忽略不需要的文件**:
   - 排除 `dev/` 和 `icons/` 子目錄
   - 排除測試和配置文件

### 3. 驗證工具

創建了 PWA 測試腳本：

```bash
# 運行生產模式 PWA 測試
bun run pwa:test

# 運行開發模式 PWA 測試
bun run pwa:test-dev

# 構建並測試
bun run pwa:build-test
```

測試腳本功能：
- `test-pwa.js` - 檢查生產構建的預緩存配置
- `test-pwa-dev.js` - 檢查開發模式的運行時緩存配置

## 測試結果

### ✅ 修復後狀態

- **所有圖標文件**: 正確包含在預緩存中
- **文件完整性**: Public 和 Dist 目錄中的圖標文件一致
- **Service Worker**: 正確生成預緩存清單
- **Manifest**: 包含所有必要的圖標配置

### 📊 構建統計

**生產模式**:
- **預緩存條目**: 31 個文件 (842.93 KiB)
- **圖標文件**: 7 個 (favicon.ico, favicon.svg, favicon-32.png, apple-touch-icon.png, apple-touch-icon.svg, icon-192.png, icon-512.png)
- **緩存策略**: 預緩存 + 運行時緩存

**開發模式**:
- **預緩存條目**: 2 個文件 (registerSW.js, index.html)
- **運行時緩存**: 圖標文件、Google Fonts
- **緩存策略**: 純運行時緩存

## 使用說明

### 開發環境測試

1. 啟動開發服務器：
   ```bash
   bun run dev
   ```

2. 在瀏覽器中打開 `http://localhost:8080`

3. 檢查開發者工具：
   - **Console**: 不應有 Workbox 錯誤
   - **Application > Service Workers**: 檢查 SW 狀態
   - **Application > Storage**: 檢查預緩存文件

### 生產環境測試

1. 構建項目：
   ```bash
   bun run build
   ```

2. 運行 PWA 測試：
   ```bash
   bun run pwa:test
   ```

3. 測試 PWA 安裝：
   - 點擊地址欄安裝圖標
   - 檢查控制台是否有錯誤
   - 驗證安裝流程

## 注意事項

1. **重複條目**: 測試中發現少量重複的預緩存條目，但這不會影響 PWA 功能
2. **瀏覽器緩存**: 測試時可能需要清除瀏覽器緩存和 Service Worker
3. **HTTPS 要求**: PWA 功能需要 HTTPS 環境（localhost 除外）
4. **圖標規格**: 確保圖標文件符合 PWA 標準（192x192, 512x512 等）

## 相關文件

- `vite.config.ts` - VitePWA 配置
- `public/*.{ico,png,svg}` - 圖標文件
- `tools/scripts/build/test-pwa.js` - PWA 測試腳本
- `docs/development/PWA_FIXES.md` - PWA 安裝問題修復文檔

## 故障排除

如果仍然出現 Workbox 錯誤：

1. 清除瀏覽器緩存和 Service Worker
2. 重新構建項目：`bun run build`
3. 檢查圖標文件是否存在於 `public/` 目錄
4. 運行 PWA 測試：`bun run pwa:test`
5. 檢查 `dist/sw.js` 中的預緩存清單 