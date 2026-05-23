# Google reCAPTCHA v3 設置指南

## 概述

本指南將幫助您為 LingUBible 設置 Google reCAPTCHA v3，以保護註冊表單免受機器人攻擊。

## 🚀 **快速設置**

### 1. 註冊 Google reCAPTCHA

1. 前往 [Google reCAPTCHA 控制台](https://www.google.com/recaptcha/admin)
2. 點擊 "+" 創建新網站
3. 填寫以下信息：
   - **標籤**：LingUBible
   - **reCAPTCHA 類型**：選擇 "reCAPTCHA v3"
   - **域名**：
     - `localhost` (開發環境)
     - `lingubible.com` (生產環境)
     - 您的自定義域名
   - **擁有者**：您的 Google 帳戶

### 2. 獲取金鑰

創建網站後，您將獲得兩個金鑰：
- **網站金鑰（Site Key）**：用於前端，公開可見
- **密鑰（Secret Key）**：用於後端驗證，必須保密

### 3. 配置環境變數

在您的 `.env` 文件中添加：

```env
# Google reCAPTCHA v3 配置
VITE_RECAPTCHA_SITE_KEY=6Lxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RECAPTCHA_SECRET_KEY=6Lxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**注意**：
- `VITE_RECAPTCHA_SITE_KEY` 是前端使用的網站金鑰
- `RECAPTCHA_SECRET_KEY` 是後端使用的密鑰，不要暴露在前端

### 4. 部署到 Appwrite Functions

確保在 Appwrite Functions 的環境變數中設置：
- `RECAPTCHA_SECRET_KEY`：您的 reCAPTCHA 密鑰

## 🔧 **開發模式**

在開發環境中，如果沒有配置 reCAPTCHA 金鑰，系統會自動跳過驗證：

```javascript
// 開發模式下的行為
if (!RECAPTCHA_SITE_KEY) {
  console.warn('⚠️ reCAPTCHA 網站金鑰未配置，CAPTCHA 功能將被禁用');
  // 自動通過驗證
}
```

## 🛡️ **安全設置**

### reCAPTCHA v3 分數閾值

系統設置最低接受分數為 **0.5**：
- **1.0**：很可能是人類
- **0.5**：中等風險（系統閾值）
- **0.0**：很可能是機器人

您可以在後端函數中調整此閾值：

```javascript
const minScore = 0.5; // 調整此值
if (result.score < minScore) {
  // 拒絕請求
}
```

### 域名限制

確保在 reCAPTCHA 控制台中只添加您信任的域名：
- ✅ `localhost`（開發）
- ✅ `lingubible.com`（生產）
- ❌ 不要添加通配符域名

## 📊 **監控和分析**

### 查看統計數據

1. 登入 [Google reCAPTCHA 控制台](https://www.google.com/recaptcha/admin)
2. 選擇您的網站
3. 查看：
   - 請求數量
   - 分數分佈
   - 惡意流量檢測

### 日誌監控

系統會記錄以下 reCAPTCHA 相關日誌：
- ✅ 驗證成功：`reCAPTCHA 驗證通過，分數: 0.8`
- ❌ 驗證失敗：`reCAPTCHA 分數過低: 0.3 < 0.5`
- ⚠️ 配置問題：`reCAPTCHA 密鑰未配置`

## 🔍 **故障排除**

### 常見問題

#### 1. "reCAPTCHA 驗證失敗"
**原因**：
- 網站金鑰錯誤
- 域名未在控制台中註冊
- 網路連接問題

**解決方案**：
- 檢查 `.env` 文件中的金鑰
- 確認域名已添加到 reCAPTCHA 控制台
- 檢查網路連接

#### 2. "安全驗證未通過"
**原因**：
- reCAPTCHA 分數過低（< 0.5）
- 可疑的用戶行為

**解決方案**：
- 降低分數閾值（不推薦）
- 要求用戶重試
- 檢查是否為機器人流量

#### 3. "reCAPTCHA 服務配置錯誤"
**原因**：
- 後端密鑰未配置
- Appwrite Functions 環境變數缺失

**解決方案**：
- 在 Appwrite Functions 中設置 `RECAPTCHA_SECRET_KEY`
- 重新部署 Functions

### 調試模式

啟用詳細日誌：

```javascript
// 在後端函數中
log('🔍 reCAPTCHA 驗證結果:', { 
  success: result.success, 
  score: result.score, 
  action: result.action,
  hostname: result.hostname 
});
```

## 🚀 **生產環境檢查清單**

- [ ] reCAPTCHA 網站已創建並配置正確的域名
- [ ] 前端環境變數 `VITE_RECAPTCHA_SITE_KEY` 已設置
- [ ] 後端環境變數 `RECAPTCHA_SECRET_KEY` 已設置
- [ ] Appwrite Functions 已部署並包含 reCAPTCHA 驗證
- [ ] 測試註冊流程確保 reCAPTCHA 正常工作
- [ ] 監控 reCAPTCHA 統計數據和日誌

## 📚 **相關資源**

- [Google reCAPTCHA v3 文檔](https://developers.google.com/recaptcha/docs/v3)
- [reCAPTCHA 控制台](https://www.google.com/recaptcha/admin)
- [Appwrite Functions 文檔](https://appwrite.io/docs/functions)

## 🆘 **支援**

如果您在設置過程中遇到問題：
1. 檢查瀏覽器控制台的錯誤信息
2. 查看 Appwrite Functions 的日誌
3. 確認所有環境變數都已正確設置
4. 聯繫技術支援團隊 