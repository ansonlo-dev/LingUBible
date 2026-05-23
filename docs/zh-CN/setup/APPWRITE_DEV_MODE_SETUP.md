# Appwrite Function 開發模式設置指南

## 🎯 目標
在 Appwrite Function 中啟用開發模式，允許任何郵件地址註冊並跳過驗證檢查。

## 📋 設置步驟

### 1. 訪問 Appwrite 控制台
1. 打開瀏覽器，訪問：https://cloud.appwrite.io/
2. 登入您的帳戶
3. 選擇 `lingubible` 專案

### 2. 進入 Functions 設置
1. 在左側導航欄中點擊 **Functions**
2. 找到並點擊 **Send Verification Email** function
3. 點擊 **Settings** 標籤

### 3. 設置環境變數
1. 滾動到 **Environment variables** 部分
2. 點擊 **Add variable** 按鈕
3. 添加以下環境變數：

```
Key: DEV_MODE
Value: true
```

4. 點擊 **Update** 按鈕保存設置

### 4. 重新部署 Function（如果需要）
1. 在 **Deployments** 標籤中
2. 點擊最新部署旁的 **Redeploy** 按鈕
3. 等待部署完成

## 🔍 驗證設置

### 檢查 Function 日誌
1. 在 Function 頁面點擊 **Logs** 標籤
2. 執行一次註冊操作
3. 查看日誌中是否出現：
```
🔧 開發模式：跳過郵件驗證檢查
🔧 開發模式：跳過清理驗證記錄
```

### 測試註冊流程
1. 訪問 http://localhost:8081/register
2. 使用測試郵件（如 `test@gmail.com`）
3. 完成註冊流程
4. 應該能成功創建帳戶

## ⚠️ 重要提醒

### 生產環境設置
在部署到生產環境前，**必須**：
1. 將 `DEV_MODE` 環境變數設置為 `false` 或完全移除
2. 確保只有學校郵件可以註冊
3. 啟用完整的郵件驗證流程

### 安全考慮
- 開發模式會跳過所有安全檢查
- 任何郵件地址都可以註冊
- 不會進行真實的郵件驗證
- 僅用於開發和測試目的

## 🛠️ 故障排除

### 環境變數未生效
1. 確認環境變數名稱正確：`DEV_MODE`
2. 確認值為：`true`（小寫）
3. 重新部署 Function
4. 檢查 Function 日誌

### 仍然要求郵件驗證
1. 檢查 Function 日誌是否顯示開發模式訊息
2. 確認前端的 `.env` 檔案也設置了開發模式
3. 清除瀏覽器緩存並重試

### Function 部署失敗
1. 檢查 Function 程式碼是否有語法錯誤
2. 確認所有依賴項都已安裝
3. 查看部署日誌中的錯誤訊息

## 📞 支援

如果遇到問題：
1. 檢查 Appwrite Function 的執行日誌
2. 確認環境變數設置正確
3. 驗證前端和後端的開發模式都已啟用

---

**注意：開發模式僅用於開發和測試。在生產環境中使用會帶來嚴重的安全風險。** 