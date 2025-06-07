# 🚀 Cloudflare Workers 部署指南

## 為什麼選擇 Workers 而不是 Pages

根據 [Cloudflare 官方文檔](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/#compatibility-matrix)，Workers 提供更好的功能支援：
- ✅ 完整的日誌和監控功能
- ✅ Cron Triggers 支援
- ✅ 更好的 Durable Objects 集成
- ✅ [專門的 Vite Plugin](https://developers.cloudflare.com/workers/vite-plugin/)

## 🔧 部署步驟

### 1. 安裝 Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登入 Cloudflare

```bash
wrangler login
```

### 3. 配置 wrangler.toml

在專案根目錄創建 `wrangler.toml`：

```toml
name = "lingubible"
main = "dist/index.js"
compatibility_date = "2024-01-01"

[build]
command = "npm run build"

[vars]
# 環境變數將在 Cloudflare Dashboard 中設置

[[assets]]
bucket = "./dist"
```

### 4. 選擇部署方案

#### 方案 A：傳統 Wrangler 部署（推薦）

適合現有專案，無需升級 Vite 版本：

```bash
# 無需安裝額外套件，直接使用現有配置
```

#### 方案 B：Vite Plugin 部署（實驗性）

需要升級到 Vite 6（實驗性版本）：

```bash
# 升級 Vite 到 6.x
npm install --save-dev vite@^6.1.0 @cloudflare/vite-plugin

# 更新 vite.config.ts
```

**注意**：Vite 6 仍在實驗階段，建議生產環境使用方案 A。

### 5. 配置部署文件

#### 方案 A：使用 wrangler.toml

創建 `wrangler.toml`：

```toml
name = "lingubible"
main = "dist/index.js"
compatibility_date = "2024-01-01"

[build]
command = "npm run build"

[vars]
# 環境變數將在 Cloudflare Dashboard 中設置

[[assets]]
bucket = "./dist"
```

#### 方案 B：使用 Vite Plugin

如果選擇升級 Vite 6，更新 `vite.config.ts`：

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    cloudflare()
  ],
  // 保持其他現有配置...
})
```

### 6. 設置環境變數

在 Cloudflare Dashboard 中：
1. 進入 **Workers & Pages**
2. 選擇您的 Worker
3. 進入 **Settings** → **Variables**
4. 添加環境變數：

```
APPWRITE_API_KEY: [您的 Appwrite API Key]
APPWRITE_PROJECT_ID: [您的 Appwrite 專案 ID]
APPWRITE_ENDPOINT: https://fra.cloud.appwrite.io/v1
```

### 6. 安裝 Wrangler CLI

```bash
# 本地安裝（推薦）
npm install --save-dev wrangler

# 或全域安裝（需要 sudo 權限）
# sudo npm install -g wrangler
```

### 7. 登入 Cloudflare 並部署

```bash
# 登入 Cloudflare
npx wrangler login

# 首次部署
npm run deploy

# 或分步驟執行
npm run build
npx wrangler deploy
```

### 8. 設置自定義域名（可選）

在 Cloudflare Dashboard 中：
1. 進入 **Workers & Pages**
2. 選擇您的 Worker
3. 進入 **Settings** → **Triggers**
4. 點擊 **Add Custom Domain**
5. 輸入您的域名（例如：`lingubible.com`）

## 💰 費用說明

### Workers 免費方案包含：
- 每天 100,000 次請求
- 10ms CPU 時間限制
- 128MB 記憶體
- 1MB 腳本大小限制

### 付費方案（$5/月）包含：
- 每月 10,000,000 次請求
- 50ms CPU 時間限制
- 128MB 記憶體
- 10MB 腳本大小限制

對於您的專案，免費方案完全足夠使用。

## 🔧 開發環境設置

### 本地開發

```bash
# 使用 Wrangler 本地開發
wrangler dev

# 或使用 Vite（推薦）
npm run dev
```

### 環境變數管理

創建 `.dev.vars` 文件（本地開發用）：
```
APPWRITE_API_KEY=your_api_key_here
APPWRITE_PROJECT_ID=your_project_id_here
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
```

## 🔍 故障排除

### 1. Lockfile 錯誤（常見）

**錯誤信息**：`lockfile had changes, but lockfile is frozen`

**解決方案**：
```bash
# 更新 lockfile
bun install
# 或使用 npm
npm install

# 提交更改
git add bun.lockb package-lock.json
git commit -m "Update lockfile"
git push
```

### 2. 構建工具衝突

如果 Cloudflare 自動檢測到 bun 但您想使用 npm：

**方案 A**：刪除 `bun.lockb`
```bash
rm bun.lockb
npm install
git add package-lock.json
git commit -m "Switch to npm"
```

**方案 B**：使用 `.cloudflare/build.toml` 強制使用 npm（已配置）

### 3. 部署失敗
```bash
# 檢查 wrangler 配置
npx wrangler whoami

# 重新登入
npx wrangler logout
npx wrangler login
```

### 4. 環境變數問題
- 確認在 Cloudflare Dashboard 中正確設置了環境變數
- 檢查變數名稱拼寫是否正確

### 5. 本地構建測試
```bash
# 清理並重新構建
rm -rf dist node_modules
npm install
npm run build

# 測試構建結果
npm run preview
```

## 📊 監控和日誌

Workers 提供完整的監控功能：
1. 進入 **Workers & Pages** → 您的 Worker
2. 查看 **Metrics** 標籤頁了解使用情況
3. 查看 **Logs** 標籤頁查看即時日誌
4. 設置 **Alerts** 監控錯誤和使用量

## ✅ 驗證部署成功

部署成功後：
1. 訪問您的 Worker URL（例如：`https://lingubible.your-subdomain.workers.dev`）
2. 檢查測試版通知是否正常顯示
3. 測試多語言切換功能
4. 檢查 Cloudflare Dashboard 中的日誌 