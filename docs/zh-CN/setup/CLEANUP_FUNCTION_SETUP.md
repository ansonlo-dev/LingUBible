# 🧹 清理函數設置指南

## 問題解決

您遇到的錯誤：
```
The current user is not authorized to perform the requested action.
```

這是因為清理函數沒有設置 `APPWRITE_API_KEY` 環境變數。

## 🔧 設置步驟

### 1. 在 Appwrite Console 中設置環境變數

1. 登入 Appwrite Console
2. 進入您的專案
3. 點擊左側選單的 **Functions**
4. 選擇 **Cleanup Expired Codes** 函數
5. 進入 **Settings** → **Configuration** → **Environment variables**
6. 點擊 **Add variable**
7. 添加以下變數：

```
Key: APPWRITE_API_KEY
Value: [您的 Appwrite API Key - 與發送驗證碼函數使用相同的]
```

### 2. 確認 API Key 權限

確保您的 API Key 具有以下權限：
- `databases.read`
- `databases.write`

### 3. 測試清理函數

設置完環境變數後：
1. 在 Appwrite Console 中手動執行清理函數
2. 進入 **Functions** → **Cleanup Expired Codes** → **Executions**
3. 點擊 **Execute now**
4. 檢查執行日誌

## 🔍 故障排除

如果仍然出現權限錯誤：

1. **檢查 API Key 是否正確**
   - 確認 API Key 沒有過期
   - 確認 API Key 有正確的權限範圍

2. **檢查環境變數設置**
   - 確認變數名稱拼寫正確：`APPWRITE_API_KEY`
   - 確認變數值沒有多餘的空格

3. **重新部署函數**
   - 設置環境變數後，可能需要重新部署函數

## 📋 自動執行

清理函數已配置為每 6 小時自動執行一次：
- 執行時間：00:00, 06:00, 12:00, 18:00 (UTC)
- 每次最多清理 100 條過期記錄
- 超時時間：30 秒

## ✅ 驗證設置成功

成功設置後，您應該看到類似的日誌：
```
🧹 開始清理過期驗證碼
⏰ 當前時間: 2025-06-30T17:45:00.000Z
🔍 查詢過期的驗證碼...
📊 找到 X 條過期記錄
🗑️ 已刪除過期驗證碼: user@ln.edu.hk (過期時間: ...)
✅ 清理完成，成功刪除 X 條記錄，失敗 0 條
``` 