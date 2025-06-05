# 🔐 LingUBible 安全驗證系統

## 概述

LingUBible 使用基於 Appwrite 資料庫的安全驗證系統，確保學生郵件驗證過程的安全性和可靠性。

## 🏗️ 架構設計

### 後端存儲
- **資料庫**: Appwrite 雲端資料庫
- **集合**: `verification_codes` 在 `verification_system` 資料庫中
- **安全性**: 所有驗證邏輯都在後端進行

### 前端職責
- 用戶界面和體驗
- 基本參數驗證
- API 調用和錯誤處理

## 🛡️ 安全特性

### 1. **後端驗證**
- ✅ 驗證碼存儲在安全的 Appwrite 資料庫中
- ✅ 所有驗證邏輯在後端 Function 中執行
- ✅ 前端無法直接訪問或修改驗證碼

### 2. **防暴力破解**
- ✅ 最多 3 次驗證嘗試
- ✅ 超過嘗試次數自動刪除驗證碼
- ✅ IP 地址和 User Agent 追蹤
- ✅ 10 分鐘驗證碼過期時間

### 3. **防重複發送**
- ✅ 檢查現有未過期驗證碼
- ✅ 強制等待過期後才能重新發送
- ✅ 自動清理過期記錄

### 4. **郵件安全**
- ✅ 只允許 `@ln.hk` 和 `@ln.edu.hk` 域名
- ✅ 嚴格的郵件格式驗證
- ✅ 多語言支援的安全郵件模板

## 📊 資料庫結構

### `verification_codes` 集合

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `email` | string | ✅ | 學生郵件地址 |
| `code` | string | ✅ | 6 位數驗證碼 |
| `expiresAt` | datetime | ✅ | 過期時間 |
| `attempts` | integer | ✅ | 嘗試次數 (0-10) |
| `isVerified` | boolean | ✅ | 是否已驗證 |
| `ipAddress` | string | ❌ | 用戶 IP 地址 |
| `userAgent` | string | ❌ | 用戶瀏覽器信息 |

### 索引
- `email_index`: 快速查詢特定郵件的驗證碼
- `expires_index`: 快速查詢過期記錄

## 🔄 驗證流程

### 發送驗證碼
1. 前端驗證郵件格式
2. 調用 Appwrite Function (action: 'send')
3. 後端檢查現有驗證碼
4. 生成新驗證碼
5. 發送郵件
6. 存儲到資料庫

### 驗證驗證碼
1. 前端基本參數檢查
2. 調用 Appwrite Function (action: 'verify')
3. 後端查詢資料庫記錄
4. 檢查過期時間和嘗試次數
5. 比對驗證碼
6. 更新驗證狀態

## 🚀 API 使用

### 發送驗證碼
```javascript
const result = await studentVerificationService.sendVerificationCode(
  'student@ln.hk',
  'zh-TW'
);
```

### 驗證驗證碼
```javascript
const result = await studentVerificationService.verifyCode(
  'student@ln.hk',
  '123456'
);
```

## 🔧 部署和配置

### 環境變數
```bash
APPWRITE_API_KEY=your_appwrite_api_key
RESEND_API_KEY=your_resend_api_key
```

### Appwrite Function 權限
- `databases.read`: 讀取驗證碼記錄
- `databases.write`: 創建、更新、刪除記錄

### 資料庫權限
```json
{
  "$permissions": [
    "create(\"any\")",
    "read(\"any\")",
    "update(\"any\")",
    "delete(\"any\")"
  ]
}
```

## 🧹 維護

### 清理過期記錄
使用提供的清理腳本：

```bash
# 手動執行
node scripts/cleanup-expired-codes.js

# 設定 cron job (每小時執行)
0 * * * * cd /path/to/project && node scripts/cleanup-expired-codes.js
```

### 監控
- 監控驗證失敗率
- 追蹤異常 IP 活動
- 檢查郵件發送成功率

## 🔒 安全最佳實踐

### 已實施
- ✅ 後端驗證邏輯
- ✅ 嘗試次數限制
- ✅ 驗證碼過期機制
- ✅ IP 和 User Agent 追蹤
- ✅ 安全的郵件模板
- ✅ 嚴格的域名限制

### 建議增強
- 🔄 實施速率限制 (每 IP 每小時最多 X 次請求)
- 🔄 添加 CAPTCHA 驗證
- 🔄 實施異常行為檢測
- 🔄 添加郵件發送日誌
- 🔄 實施黑名單機制

## 🆚 安全性對比

| 特性 | 舊版本 (前端存儲) | 新版本 (後端存儲) |
|------|------------------|------------------|
| 驗證碼存儲 | ❌ 瀏覽器記憶體 | ✅ Appwrite 資料庫 |
| 驗證邏輯 | ❌ 前端可繞過 | ✅ 後端安全執行 |
| 暴力破解防護 | ❌ 可重置嘗試次數 | ✅ 後端強制限制 |
| 數據持久性 | ❌ 頁面刷新丟失 | ✅ 資料庫持久存儲 |
| 安全追蹤 | ❌ 無追蹤機制 | ✅ IP 和 UA 記錄 |
| 可擴展性 | ❌ 單機限制 | ✅ 雲端可擴展 |

## 📞 技術支援

如有安全相關問題或建議，請聯繫開發團隊。

---

**重要提醒**: 請確保 `APPWRITE_API_KEY` 和 `RESEND_API_KEY` 的安全性，不要在前端代碼中暴露這些敏感信息。 