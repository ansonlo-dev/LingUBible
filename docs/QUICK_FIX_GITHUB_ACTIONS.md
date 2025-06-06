# 🚨 GitHub Actions 快速修復指南

## 問題
GitHub Actions 失敗，錯誤訊息：
```
✗ Error: endpoint.startsWith is not a function
```

## 🔧 快速解決方案

### 步驟 1: 設置 GitHub Secrets

進入你的 GitHub 儲存庫 → **Settings** → **Secrets and variables** → **Actions**

添加以下 4 個 Secrets：

| Secret 名稱 | 值 | 說明 |
|------------|---|-----|
| `APPWRITE_ENDPOINT` | `https://fra.cloud.appwrite.io/v1` | Appwrite 端點 |
| `APPWRITE_PROJECT_ID` | `lingubible` | 項目 ID |
| `APPWRITE_EMAIL` | 你的 Appwrite 帳號 | 登入郵箱 |
| `APPWRITE_PASSWORD` | 你的 Appwrite 密碼 | 登入密碼 |

### 步驟 2: 觸發重新部署

推送任何變更或手動觸發 GitHub Actions。

## 🔒 更安全的方案（推薦）

### 使用 API 密鑰代替密碼

1. **創建 API 密鑰**：
   - 進入 [Appwrite 控制台](https://cloud.appwrite.io)
   - 選擇 `lingubible` 項目
   - 進入 **Overview** → **Integrations** → **API Keys**
   - 點擊 **Create API Key**
   - 設置：
     - Name: `GitHub Actions Deploy`
     - Scopes: `functions.write`
     - Expiration: 1年

2. **更新 GitHub Secrets**：
   - 添加 `APPWRITE_API_KEY`（使用上面創建的密鑰）
   - 可以刪除 `APPWRITE_EMAIL` 和 `APPWRITE_PASSWORD`

## ✅ 驗證修復

修復後，GitHub Actions 應該顯示：
```
✅ Using API Key authentication (recommended)
✅ API Key authentication successful
✅ Connection verified
📦 Deploying Send Verification Email function...
✅ Send Verification Email deployed successfully
📦 Deploying Cleanup Expired Codes function...
✅ Cleanup Expired Codes deployed successfully
📦 Deploying Get User Statistics function...
✅ Get User Statistics deployed successfully
🎉 All functions deployed successfully!
```

## 🆘 如果仍然失敗

1. **檢查 Secret 名稱**：確保完全匹配（區分大小寫）
2. **檢查 Secret 值**：確保沒有多餘的空格
3. **檢查權限**：確保 API 密鑰有 `functions.write` 權限
4. **查看詳細日誌**：在 GitHub Actions 中查看完整錯誤訊息

## 📚 詳細文檔

- [完整設置指南](./GITHUB_SECRETS_SETUP.md)
- [Appwrite 函數設置](./APPWRITE_FUNCTION_SETUP.md) 