# 郵件模板系統文檔

## 概述

LingUBible 使用改進的郵件模板系統，結合 **Resend** 郵件服務提供專業的學生驗證郵件。系統採用結構化的 JavaScript 模板生成器，提供更好的維護性、可讀性和多語言支持。

## 技術架構

### 核心組件

1. **Resend 郵件服務**
   - 專業的郵件發送 API
   - 高送達率和可靠性
   - 支持 HTML 和純文字格式

2. **JavaScript 模板生成器**
   - 位置：`functions/send-verification-email/src/email-template.js`
   - 純 JavaScript 實現，無需 React 依賴
   - 支持多語言（繁體中文、簡體中文、英文）

3. **Appwrite Function 整合**
   - 後端郵件發送邏輯
   - 安全的 API 金鑰管理
   - 完整的錯誤處理和日誌記錄

## 模板功能特色

### 🎨 視覺設計
- **現代化設計**：使用 Inter 字體和響應式佈局
- **品牌一致性**：LingUBible 標誌和品牌色彩 (#dc2626)
- **可點擊連結**：標誌和品牌名稱連結到 lingubible.com
- **移動端優化**：在小螢幕上自動調整佈局

### 🌍 多語言支持
- **繁體中文** (zh-TW) - 預設語言
- **簡體中文** (zh-CN)
- **英文** (en)

### 📧 郵件內容
- **清晰的驗證碼顯示**：大字體、高對比度的驗證碼框
- **安全提醒**：包含過期時間、保密性和忽略指示
- **機構驗證**：明確說明只有嶺南大學學生可註冊
- **技術支援資訊**：提供聯繫方式

## 使用方式

### 基本調用

```javascript
import { generateEmailTemplate } from './email-template.js';

// 生成郵件模板
const emailTemplate = generateEmailTemplate('123456', 'zh-TW');

// 使用 Resend 發送
const result = await resend.emails.send({
  from: 'LingUBible <noreply@lingubible.com>',
  to: [email],
  subject: emailTemplate.subject,
  html: emailTemplate.html,
  text: emailTemplate.text
});
```

### 參數說明

| 參數 | 類型 | 說明 | 預設值 |
|------|------|------|--------|
| `code` | string | 6位數驗證碼 | 必填 |
| `language` | string | 語言代碼 | 'zh-TW' |

### 回傳值

```javascript
{
  html: string,     // HTML 格式郵件內容
  text: string,     // 純文字格式郵件內容  
  subject: string   // 郵件主題
}
```

## 模板結構

### HTML 模板特色

1. **響應式設計**
   ```css
   @media (max-width: 600px) {
     .container { width: 100%; }
     .code-text { font-size: 24px; }
   }
   ```

2. **驗證碼樣式**
   ```css
   .code-text {
     color: #dc2626;
     font-family: 'Courier New', monospace;
     font-size: 32px;
     letter-spacing: 6px;
   }
   ```

3. **品牌元素**
   - SVG 標誌內嵌
   - 一致的色彩方案
   - 可點擊的品牌連結

### 純文字版本

提供完整的純文字版本，確保在不支持 HTML 的郵件客戶端中也能正常顯示。

## 安全特性

### 🔒 驗證碼保護
- **時效性**：10分鐘自動過期
- **嘗試限制**：最多3次驗證機會
- **保密提醒**：明確告知不要分享驗證碼

### 🛡️ 郵件安全
- **發送者驗證**：使用認證的 noreply@lingubible.com
- **高優先級標記**：確保重要郵件不被忽略
- **唯一追蹤ID**：每封郵件都有唯一的參考ID

## 部署和維護

### 依賴項

```json
{
  "dependencies": {
    "resend": "^4.5.1",
    "node-appwrite": "^13.0.0"
  }
}
```

### 環境變數

確保在 Appwrite Function 中設置：
- `RESEND_API_KEY`：Resend 服務的 API 金鑰
- `APPWRITE_API_KEY`：Appwrite 項目的 API 金鑰

### 部署命令

```bash
# 安裝依賴
cd functions/send-verification-email
npm install

# 部署函數
cd ../..
appwrite push functions
```

## 測試和調試

### 測試模板生成

```bash
node -e "
import('./functions/send-verification-email/src/email-template.js').then(module => {
  const { generateEmailTemplate } = module;
  const result = generateEmailTemplate('123456', 'zh-TW');
  console.log('✅ 模板生成成功');
  console.log('主題:', result.subject);
  console.log('HTML 長度:', result.html.length);
  console.log('文字長度:', result.text.length);
});
"
```

### API 測試

```bash
curl -X POST https://fra.cloud.appwrite.io/v1/functions/send-verification/executions \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: lingubible" \
  -d '{
    "body": "{\"action\":\"send\",\"email\":\"test@ln.edu.hk\",\"language\":\"zh-TW\"}", 
    "async": false, 
    "method": "POST"
  }'
```

## 自定義和擴展

### 添加新語言

1. 在 `translations` 對象中添加新的語言條目
2. 更新 `subject` 生成邏輯
3. 測試新語言的顯示效果

### 修改樣式

1. 更新 `htmlTemplate` 中的 CSS 樣式
2. 確保響應式設計仍然有效
3. 測試在不同郵件客戶端中的顯示

### 添加新內容

1. 在 `translations` 中添加新的文字內容
2. 更新 HTML 和文字模板
3. 確保多語言一致性

## 最佳實踐

### 📧 郵件設計
- 保持簡潔明瞭的佈局
- 使用高對比度的色彩
- 確保重要資訊突出顯示
- 提供清晰的行動指示

### 🔧 代碼維護
- 保持模板代碼的可讀性
- 使用一致的命名規範
- 添加適當的註釋
- 定期測試不同語言版本

### 🚀 性能優化
- 最小化 HTML 大小
- 使用內嵌 CSS 確保兼容性
- 避免外部資源依賴
- 優化圖片和 SVG

## 故障排除

### 常見問題

1. **郵件未收到**
   - 檢查垃圾郵件資料夾
   - 驗證 RESEND_API_KEY 設置
   - 查看 Appwrite Function 執行日誌

2. **樣式顯示異常**
   - 確認郵件客戶端支持 HTML
   - 檢查 CSS 內嵌是否正確
   - 測試純文字版本

3. **多語言問題**
   - 驗證語言代碼格式
   - 檢查字符編碼設置
   - 確認翻譯內容完整

### 日誌分析

查看 Appwrite Function 執行日誌：
```bash
appwrite functions list-executions --function-id send-verification
appwrite functions get-execution --function-id send-verification --execution-id [ID]
```

## 更新歷史

- **v1.0** - 初始實現，使用原始 HTML 字符串
- **v2.0** - 改進的 JavaScript 模板生成器
- **v2.1** - 添加響應式設計和品牌連結
- **v2.2** - 優化多語言支持和安全特性

---

*此文檔隨系統更新而持續維護。如有問題或建議，請聯繫開發團隊。* 