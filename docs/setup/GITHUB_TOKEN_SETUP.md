# GitHub Token 設置指南

## 🎯 目的

為了讓應用能夠訪問私有 GitHub 倉庫的 releases 資訊，或提高 GitHub API 的使用限制，您需要設置 GitHub Personal Access Token。

## 📊 API 限制對比

| 認證狀態 | 每小時請求限制 | 私有倉庫訪問 |
|---------|---------------|-------------|
| 未認證   | 60 次         | ❌ 不支援    |
| 已認證   | 5,000 次      | ✅ 支援      |

## 🔑 創建 GitHub Token

### 步驟 1：訪問 GitHub 設置
1. 登入 GitHub
2. 點擊右上角頭像 → **Settings**
3. 左側選單選擇 **Developer settings**
4. 選擇 **Personal access tokens** → **Tokens (classic)**

### 步驟 2：生成新 Token
1. 點擊 **Generate new token** → **Generate new token (classic)**
2. 填寫 Token 資訊：
   - **Note**: `LingUBible App - Release Access`
   - **Expiration**: 建議選擇 `90 days` 或 `1 year`
   - **Scopes**: 勾選以下權限：
     - ✅ **repo** (完整倉庫訪問權限)
       - 這包括私有倉庫的讀取權限
       - 包括 releases 的訪問權限

### 步驟 3：複製 Token
1. 點擊 **Generate token**
2. **立即複製 Token**（只會顯示一次！）
3. Token 格式類似：`ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## ⚙️ 配置應用

### 步驟 1：設置環境變數
1. 在專案根目錄創建 `.env` 文件（如果還沒有）
2. 添加以下內容：
```bash
# GitHub API 配置
VITE_GITHUB_TOKEN=ghp_your_actual_token_here
```

### 步驟 2：重啟開發服務器
```bash
npm run dev
```

## 🧪 測試設置

### 方法 1：使用測試頁面
訪問：`http://localhost:8081/test-version.html`

### 方法 2：檢查控制台
1. 打開瀏覽器開發者工具
2. 查看 Console 標籤
3. 應該看到成功的 API 回應而不是 403 錯誤

### 方法 3：檢查版本徽章
1. 訪問主頁面
2. 查看頁腳的版本徽章
3. 應該顯示從 GitHub 獲取的最新版本

## 🔒 安全注意事項

### ✅ 安全做法
- ✅ 將 `.env` 文件添加到 `.gitignore`
- ✅ 定期更新 Token（建議每 90 天）
- ✅ 只給予必要的權限
- ✅ 不要在代碼中硬編碼 Token

### ❌ 避免的做法
- ❌ 不要將 Token 提交到版本控制
- ❌ 不要在公開場所分享 Token
- ❌ 不要給予過多權限

## 🚀 生產環境部署

### Vercel
在 Vercel 控制台中設置環境變數：
```
VITE_GITHUB_TOKEN = ghp_your_actual_token_here
```

### Netlify
在 Netlify 控制台中設置環境變數：
```
VITE_GITHUB_TOKEN = ghp_your_actual_token_here
```

### 其他平台
根據您的部署平台文檔設置環境變數。

## 🔧 故障排除

### 問題：仍然收到 403 錯誤
**可能原因：**
- Token 權限不足
- Token 已過期
- 環境變數未正確設置

**解決方案：**
1. 檢查 Token 權限是否包含 `repo`
2. 檢查 Token 是否已過期
3. 重新生成 Token
4. 確認 `.env` 文件格式正確
5. 重啟開發服務器

### 問題：Token 不工作
**檢查清單：**
- [ ] Token 是否正確複製（沒有多餘空格）
- [ ] 環境變數名稱是否正確：`VITE_GITHUB_TOKEN`
- [ ] `.env` 文件是否在專案根目錄
- [ ] 是否重啟了開發服務器

## 📝 相關文檔

- [GitHub Personal Access Tokens 官方文檔](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [版本管理系統文檔](../development/VERSION_MANAGEMENT.md) 