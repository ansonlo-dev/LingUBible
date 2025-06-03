# 學生郵件驗證系統設定指南

## 概述

本系統實現了基於 React Email 和 Resend 的學生郵件驗證功能，確保只有擁有 `@ln.edu.hk` 或 `@ln.hk` 郵件地址的學生才能註冊 LingUBible 帳戶。

## 功能特點

### 🔒 安全性
- **學生郵件限制**：只允許 `@ln.edu.hk` 和 `@ln.hk` 域名註冊
- **驗證碼過期**：10 分鐘自動過期
- **嘗試次數限制**：最多 3 次驗證嘗試
- **防重複發送**：需等待過期才能重新發送
- **自動清理**：過期驗證碼自動清理

### 🎨 用戶體驗
- **即時反饋**：實時顯示驗證狀態和錯誤訊息
- **倒數計時器**：顯示剩餘時間
- **美觀郵件模板**：專業的 HTML 郵件設計
- **響應式設計**：支援各種設備
- **無縫集成**：與現有認證系統完美整合

## 設定步驟

### 1. 註冊 Resend 帳戶

1. 前往 [Resend 官網](https://resend.com)
2. 點擊 "Sign Up" 註冊帳戶
3. 驗證您的郵件地址
4. 登入到 Resend 控制台

### 2. 獲取 API 金鑰

1. 在 Resend 控制台中，點擊 "API Keys"
2. 點擊 "Create API Key"
3. 輸入金鑰名稱（例如：`lingubible-verification`）
4. 選擇權限：`Sending access`
5. 點擊 "Add" 創建金鑰
6. **重要**：複製並安全保存 API 金鑰

### 3. 設定環境變數

在您的 `.env` 檔案中添加：

```env
VITE_RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

**注意**：
- 請將 `re_xxxxxxxxxxxxxxxxxxxxxxxxxx` 替換為您的實際 API 金鑰
- 確保 `.env` 檔案已添加到 `.gitignore` 中
- 生產環境中請使用環境變數管理服務

### 4. 域名設定（生產環境）

#### 添加發送域名
1. 在 Resend 控制台中，點擊 "Domains"
2. 點擊 "Add Domain"
3. 輸入您的域名（例如：`lingubible.com`）
4. 按照指示設定 DNS 記錄：
   - SPF 記錄
   - DKIM 記錄
   - DMARC 記錄（可選但建議）

#### 驗證域名
1. 設定完 DNS 記錄後，點擊 "Verify"
2. 等待驗證完成（可能需要幾分鐘到幾小時）
3. 驗證成功後，更新郵件發送地址

### 5. 更新發送地址

在 `src/services/studentVerificationService.ts` 中更新發送地址：

```typescript
// 發送郵件
const { data, error } = await resend.emails.send({
  from: 'LingUBible <noreply@yourdomain.com>', // 更新為您的域名
  to: [email],
  subject: '您的 LingUBible 學生驗證碼',
  html: emailHtml,
});
```

## 工作流程

### 註冊流程
1. **郵件輸入**：用戶輸入學生郵件地址
2. **域名檢查**：系統檢查是否為 `@ln.edu.hk` 或 `@ln.hk`
3. **發送驗證碼**：生成 6 位數驗證碼並發送郵件
4. **驗證碼輸入**：用戶輸入收到的驗證碼
5. **驗證檢查**：系統驗證驗證碼正確性
6. **密碼設定**：驗證成功後設定密碼
7. **帳戶創建**：在 Appwrite 中創建帳戶
8. **自動登入**：註冊成功後自動登入

### 安全檢查
- 郵件域名驗證
- 驗證碼過期檢查
- 嘗試次數限制
- 重複發送防護
- 帳戶創建前的最終驗證

## 自定義選項

### 修改允許的域名

在 `src/services/studentVerificationService.ts` 中：

```typescript
private readonly ALLOWED_DOMAINS = ['@ln.edu.hk', '@ln.hk', '@newdomain.edu'];
```

### 調整驗證碼設定

```typescript
private readonly MAX_ATTEMPTS = 3;           // 最大嘗試次數
private readonly CODE_EXPIRY_MINUTES = 10;   // 過期時間（分鐘）
```

### 自定義郵件模板

編輯 `src/emails/VerificationEmail.tsx` 來自定義：
- 郵件內容和樣式
- 品牌元素
- 顏色主題
- 文字內容

## 測試

### 開發環境測試

創建測試檔案 `src/test/emailPreview.tsx`：

```typescript
import { render } from '@react-email/render';
import { VerificationEmail } from '../emails/VerificationEmail';
import React from 'react';

// 在瀏覽器控制台中測試
export const testEmailRender = async () => {
  const html = await render(React.createElement(VerificationEmail, {
    verificationCode: '123456',
    userEmail: 'test@ln.edu.hk'
  }));
  
  console.log('Generated HTML:', html);
  return html;
};
```

### 功能測試清單

- [ ] 學生郵件域名檢查
- [ ] 非學生郵件拒絕
- [ ] 驗證碼發送
- [ ] 驗證碼驗證
- [ ] 過期處理
- [ ] 嘗試次數限制
- [ ] 重複發送防護
- [ ] 帳戶創建流程
- [ ] 錯誤處理

## 故障排除

### 常見問題

#### 1. 郵件發送失敗
**症狀**：收不到驗證碼郵件
**解決方案**：
- 檢查 API 金鑰是否正確
- 確認域名已驗證（生產環境）
- 檢查郵件是否在垃圾郵件資料夾
- 查看瀏覽器控制台錯誤訊息

#### 2. 驗證碼驗證失敗
**症狀**：輸入正確驗證碼但驗證失敗
**解決方案**：
- 檢查驗證碼是否過期
- 確認嘗試次數未超過限制
- 檢查郵件地址是否一致

#### 3. 註冊失敗
**症狀**：驗證成功但無法創建帳戶
**解決方案**：
- 檢查 Appwrite 連接
- 確認郵件已通過驗證
- 查看錯誤訊息詳情

### 調試技巧

1. **啟用詳細日誌**：
```typescript
console.log('Verification attempt:', { email, code, storedCode });
```

2. **檢查驗證狀態**：
```typescript
console.log('Email verified:', studentVerificationService.isEmailVerified(email));
```

3. **監控 API 調用**：
在瀏覽器開發者工具的 Network 標籤中監控 Resend API 調用

## 生產環境部署

### 環境變數設定
確保在生產環境中正確設定：
- `VITE_RESEND_API_KEY`
- 其他必要的環境變數

### 域名配置
- 設定自定義發送域名
- 配置 SPF、DKIM 記錄
- 啟用 DMARC（建議）

### 監控和日誌
- 設定郵件發送監控
- 記錄驗證失敗事件
- 監控 API 使用量

### 安全考慮
- 定期輪換 API 金鑰
- 監控異常發送活動
- 實施速率限制

## 進階功能

### 資料庫存儲（建議）
生產環境中建議使用 Redis 或資料庫替代記憶體存儲：

```typescript
// 使用 Redis 的示例
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

async setVerificationCode(email: string, code: VerificationCode) {
  await redis.setex(`verification:${email}`, 600, JSON.stringify(code));
}
```

### 郵件模板管理
- 支援多語言模板
- A/B 測試不同模板
- 動態內容個性化

### 分析和報告
- 驗證成功率統計
- 郵件送達率監控
- 用戶行為分析

## 支援

如果您遇到問題或需要協助：

1. 檢查本文檔的故障排除部分
2. 查看 [Resend 文檔](https://resend.com/docs)
3. 檢查 [React Email 文檔](https://react.email/docs)
4. 聯繫開發團隊

---

**注意**：請確保遵守相關的隱私法規和郵件發送最佳實踐。 