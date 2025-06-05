# 🔐 Appwrite 函數環境變數設置指南

## 必要的環境變數

您的 `send-verification-email` 函數需要以下環境變數：

### 1. APPWRITE_API_KEY
- **用途**: 用於 Appwrite 資料庫操作
- **權限**: 需要 `databases.read` 和 `databases.write` 權限
- **獲取方式**: 
  1. 登入 Appwrite Console
  2. 進入專案設置
  3. 點擊 "API Keys"
  4. 創建新的 API Key 或使用現有的

### 2. RESEND_API_KEY
- **用途**: 用於發送驗證郵件
- **獲取方式**:
  1. 登入 [Resend](https://resend.com)
  2. 進入 API Keys 頁面
  3. 創建新的 API Key

## 🔧 在 Appwrite Console 中設置環境變數

### 步驟：
1. 登入 Appwrite Console
2. 進入您的專案
3. 點擊左側選單的 **Functions**
4. 選擇 **Send Verification Email** 函數
5. 進入 **Settings** → **Configuration** → **Environment variables**
6. 點擊 **Add variable**
7. 添加以下變數：

```
Key: APPWRITE_API_KEY
Value: [您的 Appwrite API Key]

Key: RESEND_API_KEY  
Value: [您的 Resend API Key]
```

## 🚨 重要提醒

- **不要** 將 API Keys 提交到 Git 儲存庫
- **不要** 在代碼中硬編碼 API Keys
- 確保 API Keys 有正確的權限範圍
- 定期輪換 API Keys 以提高安全性

## ✅ 驗證設置

設置完環境變數後：
1. 重新部署函數（如果使用 Git 集成，推送代碼即可）
2. 在前端測試發送驗證碼功能
3. 檢查 Appwrite Console 中的函數執行日誌

## 🔍 故障排除

如果仍然出現錯誤：
1. 確認環境變數名稱拼寫正確
2. 確認 API Keys 有效且未過期
3. 檢查 Appwrite API Key 的權限範圍
4. 查看函數執行日誌獲取詳細錯誤信息 