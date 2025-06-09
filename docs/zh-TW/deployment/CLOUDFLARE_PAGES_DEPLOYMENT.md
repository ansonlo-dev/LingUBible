# 🚀 Cloudflare Pages 部署指南

## ✅ 為什麼選擇 Cloudflare Pages

您的 LingUBible 項目**完全兼容** Cloudflare Pages，因為：

### 🏗️ 架構優勢
- **純前端應用**：React + Vite 編譯為靜態文件
- **無服務器依賴**：使用 Appwrite Cloud 作為後端
- **無需 Docker**：靜態文件部署，無需容器化
- **全球 CDN**：Cloudflare 的全球網絡加速
- **免費且強大**：慷慨的免費額度

### 📊 數據流程
```
用戶 → Cloudflare Pages (靜態前端) → Appwrite Cloud API → 數據庫
```

## 🔧 部署步驟

### 方式選擇

您有兩種部署方式：
- **🚀 自動部署（推薦）**：連接 GitHub，推送代碼自動更新
- **📁 手動部署**：每次手動上傳文件

---

## 🚀 自動部署設置（推薦）

### 1. 連接 GitHub 倉庫

1. **登入 Cloudflare Dashboard**
   - 前往 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 點擊 **Pages** → **Create a project**

2. **連接 Git 倉庫**
   - 選擇 **Connect to Git**
   - 授權 Cloudflare 訪問您的 GitHub 帳戶
   - 選擇 `LingUBible` 倉庫

3. **配置構建設置**
   ```yaml
   Project name: lingubible
   Production branch: main
   Build command: bun run build
   Build output directory: dist
   Root directory: (留空)
   ```

### 2. 準備環境變數

#### 🔧 在 Cloudflare Pages 中設置環境變數

1. **進入 Cloudflare Pages 控制台**
   - 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 選擇您的 Pages 項目
   - 點擊 **Settings** → **Environment variables**

2. **添加以下環境變數**：

```bash
# 🔑 Appwrite 基本配置（必需）
VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=lingubible

# 🔐 API 密鑰配置（用於後端功能）
APPWRITE_API_KEY=your_appwrite_api_key_here
RESEND_API_KEY=your_resend_api_key_here

# 🚀 部署環境配置
VITE_APP_ENV=production

# 🛠️ 開發模式配置（生產環境設為 false）
VITE_DEV_MODE=false
VITE_DEV_BYPASS_PASSWORD=false
```

#### 📋 如何獲取 API 密鑰

##### 🔑 Appwrite API Key
1. 登入 [Appwrite Console](https://cloud.appwrite.io/)
2. 選擇您的 `lingubible` 項目
3. 點擊左側選單的 **Overview** → **Integrations**
4. 點擊 **API Keys** → **Create API Key**
5. 設置權限：
   - **Name**: `Cloudflare Pages Production`
   - **Scopes**: 選擇所需權限（建議選擇 `databases.read`, `databases.write`, `users.read`, `users.write`）
6. 複製生成的 API Key

##### 📧 Resend API Key
1. 登入 [Resend Dashboard](https://resend.com/dashboard)
2. 點擊左側選單的 **API Keys**
3. 點擊 **Create API Key**
4. 設置：
   - **Name**: `LingUBible Production`
   - **Permission**: `Sending access`
   - **Domain**: 選擇您的驗證域名
5. 複製生成的 API Key（格式：`re_xxxxxxxxxx`）

#### ⚠️ 安全注意事項

- **不要在前端代碼中暴露 API 密鑰**
- **APPWRITE_API_KEY** 和 **RESEND_API_KEY** 只在 Appwrite Functions 中使用
- **VITE_** 前綴的變數會被打包到前端，只放置非敏感信息

### 3. 完成自動部署設置

1. **點擊 Save and Deploy**
   - Cloudflare Pages 會自動開始第一次構建
   - 等待構建完成（通常 2-5 分鐘）

2. **獲取部署 URL**
   - 構建完成後，您會獲得一個 `.pages.dev` 域名
   - 例如：`https://lingubible.pages.dev`
   - 您可以稍後設置自定義域名（如 `lingubible.com`）

### 🔄 自動部署流程

設置完成後，每次您：
- 推送代碼到 `main` 分支 → 自動部署到生產環境
- 創建 Pull Request → 自動創建預覽環境
- 合併 PR → 自動更新生產環境

---

## 📁 手動部署方式

如果您不想使用 Git 集成，也可以手動上傳：

### 1. 本地構建
```bash
bun run build
```

### 2. 上傳 dist 文件夾
- 在 Cloudflare Pages 中選擇 **Upload assets**
- 上傳 `dist` 文件夾中的所有文件

---

## ⚙️ 構建設置詳細說明

無論使用哪種方式，構建設置都是：

```yaml
# 構建命令
Build command: bun run build

# 構建輸出目錄
Build output directory: dist

# Node.js 版本
Node.js version: 18 或 20

# 安裝命令（自動檢測）
Install command: bun install
```

## 📄 部署配置文件

### 創建 SPA 路由重定向文件

在項目根目錄的 `public` 文件夾中創建 `_redirects` 文件：

```
/*    /index.html   200
```

這個文件確保 React Router 的客戶端路由正常工作。

---

## 🌐 設置自定義域名

### 使用您自己的域名（如 lingubible.com）

如果您想使用自定義域名而不是 `.pages.dev`：

#### 1. 添加自定義域名
1. **在 Cloudflare Pages 中**：
   - 進入您的 Pages 項目
   - 點擊 **Custom domains** 標籤
   - 點擊 **Set up a custom domain**
   - 輸入您的域名（如 `lingubible.com`）

2. **DNS 配置**：
   - 如果域名已在 Cloudflare 管理：自動配置 ✅
   - 如果域名在其他服務商：需要添加 CNAME 記錄

#### 2. SSL 證書
- Cloudflare 會自動生成免費 SSL 證書
- 支持 HTTPS 強制重定向
- 通常 1-5 分鐘內生效

#### 3. SEO 優化：WWW 重定向設置

為了 SEO 優化，建議將 `www` 重定向到非 `www` 域名：

##### 方法 1：使用 _redirects 文件（推薦）
在 `public/_redirects` 文件中添加：
```
# WWW 重定向到非 WWW（SEO 優化）
https://www.lingubible.com/* https://lingubible.com/:splat 301!

# SPA 路由處理
/*    /index.html   200
```

##### 方法 2：使用 Cloudflare Redirect Rules
1. **進入 Cloudflare Dashboard**
   - 選擇 `lingubible.com` 域名
   - 點擊 **Rules** → **Redirect Rules**

2. **創建重定向規則**
   - 規則名稱：`WWW to non-WWW redirect`
   - 條件：`Hostname equals www.lingubible.com`
   - 動作：**Dynamic redirect**
   - 表達式：`concat("https://lingubible.com", http.request.uri.path)`
   - 狀態碼：**301**

##### DNS 記錄設置
```dns
# 主域名
lingubible.com → Cloudflare Pages

# www 子域名
www.lingubible.com → CNAME 指向 lingubible.com
```

---

## 🏷️ 版本管理和 GitHub Releases

### 自動版本號顯示

您的應用會自動從 `package.json` 讀取版本號並在 Footer 中顯示：

- **0.x.x 版本**：顯示為 `Beta 0.1.0`（橙色標籤）
- **1.x.x+ 版本**：顯示為 `v1.0.0`（綠色標籤）

### 版本管理命令

使用以下命令管理版本：

```bash
# 增加補丁版本（0.0.1 → 0.0.2）
bun run version:patch

# 增加次要版本（0.1.0 → 0.2.0）
bun run version:minor

# 增加主要版本（0.9.0 → 1.0.0）
bun run version:major

# 設置自定義版本
bun run version:set 0.1.0

# 查看當前版本信息
bun run version:info
```

### GitHub Releases 工作流程

#### 1. 創建新版本
```bash
# 更新版本號
bun run version:patch

# 提交更改
git add package.json
git commit -m "chore: bump version to v0.0.2"

# 創建並推送標籤
git tag v0.0.2
git push origin main
git push origin v0.0.2
```

#### 2. 自動 Release 創建
推送標籤後，GitHub Actions 會自動：
- ✅ 構建項目
- ✅ 創建 GitHub Release
- ✅ 生成 Changelog
- ✅ 上傳構建文件
- ✅ 根據版本號設置 Pre-release 狀態

#### 3. Cloudflare Pages 自動部署
由於 Cloudflare Pages 連接到您的 GitHub 倉庫：
- ✅ 推送到 `main` 分支自動觸發部署
- ✅ 新版本號會自動顯示在網站 Footer
- ✅ 無需手動干預

### 版本號策略

建議的版本號規劃：

```
0.1.0 - 0.9.x  → Beta 版本（開發階段）
1.0.0+         → 正式版本（穩定發布）

例如：
Beta 0.1.0  → 初始 Beta 版本
Beta 0.2.0  → 功能更新
Beta 0.9.0  → Release Candidate
v1.0.0      → 正式發布
v1.1.0      → 功能更新
v1.1.1      → 錯誤修復
```

---

## ⚙️ 配置 Appwrite Functions（重要）

由於您的項目使用了 Appwrite Functions 來處理後端邏輯（如學生郵箱驗證），需要確保這些 Functions 也能正常運作：

#### 📧 學生驗證 Function
1. **確認 Function 已部署**：
   - 登入 [Appwrite Console](https://cloud.appwrite.io/)
   - 檢查 **Functions** 部分是否有 `student-verification` Function

2. **更新 Function 環境變數**：
   ```bash
   APPWRITE_API_KEY=your_appwrite_api_key_here
   RESEND_API_KEY=your_resend_api_key_here
   ```

3. **測試 Function**：
   - 在 Appwrite Console 中測試 Function 執行
   - 確認郵件發送功能正常

#### 🔄 用戶統計 Function
1. **確認 Function 已部署**：
   - 檢查是否有處理用戶統計的相關 Functions

2. **驗證權限設置**：
   - 確認 Function 有足夠權限讀寫 `logged-users` 集合

#### ⚠️ 重要提醒
- Appwrite Functions 在雲端運行，與 Cloudflare Pages 無關
- 只要 Functions 正確配置，前端部署在任何地方都能正常調用
- 確保 API 密鑰在 Appwrite Functions 中正確設置，而不是在 Cloudflare Pages 中

## 🎯 已註冊學生統計功能

### ✅ 完全兼容
您關心的已註冊學生統計功能在 Cloudflare Pages 上**完全正常工作**：

1. **前端邏輯**：在瀏覽器中運行，直接調用 Appwrite API
2. **數據庫查詢**：通過 Appwrite SDK 直接查詢 `logged-users` 集合
3. **實時更新**：用戶登入/登出時自動更新統計
4. **緩存機制**：5分鐘緩存，優化性能

### 📊 數據流程
```
Cloudflare Pages (React App)
         ↓
    Appwrite SDK
         ↓
   logged-users 集合
         ↓
    統計數據顯示
```

## 🚀 部署優勢

### 1. **性能優勢**
- **全球 CDN**：用戶就近訪問
- **HTTP/3 支持**：更快的連接
- **自動壓縮**：減少傳輸大小

### 2. **開發體驗**
- **Git 集成**：推送代碼自動部署
- **預覽部署**：每個 PR 都有預覽環境
- **回滾功能**：一鍵回滾到之前版本

### 3. **成本效益**
- **免費額度**：
  - 500 次構建/月
  - 無限帶寬
  - 自定義域名
  - SSL 證書

## 🔍 驗證部署

部署後，檢查以下功能：

### ✅ 基本功能
- [ ] 網站正常加載
- [ ] 路由正常工作
- [ ] PWA 功能正常

### ✅ 已註冊學生統計
- [ ] 主頁顯示正確的註冊學生數量
- [ ] 登入後數字正確更新
- [ ] 登出後數字保持穩定（不變回 0）
- [ ] 瀏覽器控制台無錯誤

### 🔍 調試方法

#### 🐛 如果統計功能有問題：

1. **檢查前端環境變數**：
   - 確保 `VITE_APPWRITE_ENDPOINT` 和 `VITE_APPWRITE_PROJECT_ID` 正確
   - 在瀏覽器開發者工具中檢查網絡請求

2. **檢查 Appwrite Functions**：
   - 登入 Appwrite Console → Functions
   - 查看 Function 執行日誌
   - 確認 `APPWRITE_API_KEY` 和 `RESEND_API_KEY` 已設置

3. **驗證數據庫權限**：
   - 確認 `logged-users` 集合存在
   - 檢查集合的讀寫權限設置
   - 驗證 API Key 有足夠權限

#### 📧 如果郵件驗證功能有問題：

1. **檢查 Resend 配置**：
   - 確認 Resend API Key 有效
   - 檢查發送域名是否已驗證
   - 查看 Resend Dashboard 中的發送日誌

2. **檢查 Appwrite Function**：
   - 確認 `student-verification` Function 已部署
   - 檢查 Function 的環境變數設置
   - 查看 Function 執行日誌

#### 🔧 常見問題解決：

- **CORS 錯誤**：在 Appwrite Console 中添加您的 Cloudflare Pages 域名到 CORS 設置
- **API 調用失敗**：檢查 API Key 權限和有效性
- **郵件發送失敗**：確認 Resend 域名驗證和 API Key 權限

## 📝 部署檢查清單

### ✅ 環境變數配置
- [ ] `VITE_APPWRITE_ENDPOINT` 已設置
- [ ] `VITE_APPWRITE_PROJECT_ID` 已設置
- [ ] `APPWRITE_API_KEY` 已設置（用於 Appwrite Functions）
- [ ] `RESEND_API_KEY` 已設置（用於郵件發送）
- [ ] `VITE_APP_ENV=production` 已設置
- [ ] `VITE_DEV_MODE=false` 已設置
- [ ] `VITE_DEV_BYPASS_PASSWORD=false` 已設置

### ✅ 構建配置
- [ ] 構建命令設為 `bun run build`
- [ ] 輸出目錄設為 `dist`
- [ ] Node.js 版本設為 18 或 20
- [ ] `_redirects` 文件已創建

### ✅ 域名與安全
- [ ] 自定義域名已配置（如 `lingubible.com`）
- [ ] SSL 證書已自動生成並啟用
- [ ] DNS 記錄已正確配置
- [ ] Appwrite CORS 設置已更新（包含新域名）

### ✅ 功能驗證
- [ ] 網站正常加載
- [ ] 用戶註冊/登入功能正常
- [ ] 學生郵箱驗證功能正常
- [ ] 已註冊學生統計顯示正確
- [ ] Footer 顯示正確的版本號
- [ ] GitHub Releases 自動創建

## 🎉 結論

您的 LingUBible 項目**完全適合** Cloudflare Pages 部署：

- ✅ **無服務器需求**：純靜態前端
- ✅ **無需 Docker**：不需要容器化，直接部署靜態文件
- ✅ **已註冊學生統計**：通過 Appwrite API 正常工作
- ✅ **全球性能**：Cloudflare CDN 加速
- ✅ **免費部署**：無需租用服務器
- ✅ **簡單維護**：推送代碼即自動部署

### 🚀 開發和部署流程簡化

**本地開發**：
```bash
bun install && bun run dev
```

**部署**：
```bash
git push origin main  # 自動觸發部署
```

**無需**：
- ❌ Docker 容器
- ❌ 服務器管理
- ❌ 複雜配置
- ❌ 手動部署

部署後，您的已註冊學生統計功能會正常工作，顯示準確的用戶數量！ 