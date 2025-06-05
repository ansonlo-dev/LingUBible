# 學生郵件驗證系統設定指南

## 概述

本系統實現了基於 React Email 和 Resend 的學生郵件驗證功能，確保只有擁有 `@ln.hk` 和 `@ln.edu.hk` 郵件地址的學生才能註冊 LingUBible 帳戶。

## 功能特點

### 🔒 安全性
- **學生郵件限制**：只允許 `@ln.hk` 和 `@ln.edu.hk` 域名註冊
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
2. **域名檢查**：系統檢查是否為 `@ln.hk` 或 `@ln.edu.hk`
3. **驗證碼發送**：系統發送驗證碼到用戶郵件
4. **驗證碼輸入**：用戶輸入收到的驗證碼
5. **驗證結果**：系統驗證用戶輸入的驗證碼是否正確
6. **帳戶註冊**：如果驗證成功，系統註冊用戶帳戶

### 註冊流程
1. **郵件輸入**：用戶輸入學生郵件地址
2. **域名檢查**：系統檢查是否為 `@ln.hk` 或 `@ln.edu.hk`
3. **驗證碼發送**：系統發送驗證碼到用戶郵件
4. **驗證碼輸入**：用戶輸入收到的驗證碼
5. **驗證結果**：系統驗證用戶輸入的驗證碼是否正確
6. **帳戶註冊**：如果驗證成功，系統註冊用戶帳戶

private readonly ALLOWED_DOMAINS = ['@ln.hk', '@ln.edu.hk', '@newdomain.edu'];