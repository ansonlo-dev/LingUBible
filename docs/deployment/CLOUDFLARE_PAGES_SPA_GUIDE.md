# Cloudflare Pages SPA 部署指南

## 🎯 問題解決方案

### 為什麼移除 `_redirects` 文件？

我們遇到了 Cloudflare Pages 部署時的無限循環錯誤：

```
Invalid _redirects configuration:
Line 2: Infinite loop detected in this rule. This would cause a redirect to strip `.html` or `/index` and end up triggering this rule again. [code: 10021]
```

### 🔧 解決方案

**移除 `_redirects` 文件**，因為：

1. **Cloudflare Pages 自動處理 SPA**：Cloudflare Pages 會自動檢測 React/Vue/Angular 等 SPA 應用，並自動配置路由
2. **避免配置衝突**：手動的 `_redirects` 規則可能與 Cloudflare 的自動配置衝突
3. **簡化部署**：無需手動配置重定向規則

### 📋 Cloudflare Pages 自動 SPA 處理

Cloudflare Pages 會自動：
- 為不存在的路由返回 `index.html`
- 正確處理靜態資源（JS、CSS、圖片等）
- 支持客戶端路由（React Router、Vue Router 等）

### 🌐 DNS 配置建議

根據您的 DNS 配置，建議：

1. **WWW 重定向**：在 Cloudflare Dashboard 中設置 Page Rules 而不是 `_redirects`
2. **CNAME 配置**：保持 `www` CNAME 指向 `lingubible.com`
3. **Worker 配置**：確保 Worker 指向正確的 Cloudflare Pages 項目

### 🧪 測試 SPA 路由

部署後測試以下 URL：
- `https://lingubible.com/` - 主頁
- `https://lingubible.com/auth/login` - 登入頁面
- `https://lingubible.com/user/profile` - 用戶資料
- `https://lingubible.com/api/version.json` - API 端點

### 🔍 如果仍有問題

如果 SPA 路由仍不工作：

1. **檢查 Cloudflare Pages 設置**：
   - 確保 Build command: `npm run build`
   - 確保 Output directory: `dist`
   - 確保 Framework preset: `Vite`

2. **檢查 DNS 設置**：
   - 確保 Worker 記錄指向正確的 Pages 項目
   - 確保沒有衝突的重定向規則

3. **檢查 Page Rules**：
   - 在 Cloudflare Dashboard 中檢查是否有衝突的 Page Rules

### 📦 版本信息

- 當前版本：0.1.16
- 修復：移除 `_redirects` 文件
- 狀態：等待部署測試

### 🎉 預期結果

移除 `_redirects` 文件後：
- ✅ 部署應該成功
- ✅ SPA 路由自動工作
- ✅ 靜態資源正常載入
- ✅ 無無限循環錯誤 