# 🎯 reCAPTCHA 圖標隱藏方案（保留表單功能）

## 📋 概述

這個方案提供了精確的 reCAPTCHA 隱藏解決方案：
- ✅ **隱藏**：右下角的 reCAPTCHA 圖標
- ✅ **保留**：註冊表單中的 reCAPTCHA 驗證功能
- ✅ **保留**：所有表單的安全性和驗證回調

## 🎯 解決的問題

- 右下角 reCAPTCHA 圖標遮擋網站頁腳
- 不影響註冊、登入等表單的 reCAPTCHA 功能
- 保持網站的安全性和用戶體驗

## 📁 文件結構

```
public/
├── hide-recaptcha-badge-only.css  # CSS 精確隱藏樣式
├── badge-hide.js                  # JavaScript 智能隱藏腳本
├── test-badge-only.html           # 測試頁面
└── BADGE_HIDE_README.md           # 說明文件
```

## 🔧 實現原理

### 1. CSS 精確隱藏 (`hide-recaptcha-badge-only.css`)

**隱藏目標：**
```css
/* 只隱藏右下角的 reCAPTCHA badge */
.grecaptcha-badge {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
}

/* 隱藏固定定位在右下角的小元素 */
div[style*="position: fixed"][style*="bottom: 14px"][style*="right: 14px"] {
    display: none !important;
}
```

**保留目標：**
```css
/* 確保表單中的 reCAPTCHA 保持可見 */
form .g-recaptcha,
form [data-sitekey],
.auth-form .g-recaptcha {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: auto !important;
}
```

### 2. JavaScript 智能檢測 (`badge-hide.js`)

**核心功能：**
- 只隱藏 `.grecaptcha-badge` 類的元素
- 確保表單中的 reCAPTCHA 保持可見
- DOM 變化監控和自動調整
- 定期檢查機制

**保護機制：**
```javascript
// 確保表單中的 reCAPTCHA 保持可見
function ensureFormRecaptchaVisible() {
    const formSelectors = [
        'form .g-recaptcha',
        'form [data-sitekey]',
        '.auth-form .g-recaptcha'
    ];
    // 強制設置為可見
}
```

## 🧪 測試方法

### 1. 訪問測試頁面
```
http://localhost:5173/test-badge-only.html
```

### 2. 測試功能
- **創建假的右下角圖標** - 驗證隱藏效果
- **檢查隱藏狀態** - 查看統計資訊
- **模擬註冊表單** - 確認表單 reCAPTCHA 可見

### 3. 控制台命令
```javascript
// 手動隱藏右下角圖標
hideBadgeOnly()

// 確保表單 reCAPTCHA 可見
ensureFormRecaptcha()

// 顯示詳細狀態
showBadgeStatus()
```

## ✅ 功能對比

| 功能 | 完全隱藏方案 | 圖標隱藏方案 |
|------|-------------|-------------|
| 隱藏右下角圖標 | ✅ | ✅ |
| 保留表單驗證 | ❌ | ✅ |
| 保留安全功能 | ❌ | ✅ |
| 攔截腳本載入 | ✅ | ❌ |
| 覆蓋全局函數 | ✅ | ❌ |
| 影響表單提交 | ⚠️ 可能 | ❌ 不會 |

## 🔒 安全性

### ✅ 保留的功能
- 註冊表單的 reCAPTCHA 驗證
- 登入表單的 reCAPTCHA 驗證
- 所有 reCAPTCHA 驗證回調
- 表單提交的安全檢查

### 🚫 隱藏的元素
- 右下角固定定位的 reCAPTCHA 圖標
- 不在表單內的 reCAPTCHA badge

## 🚀 啟用狀態

### 自動啟用（已配置）
在 `index.html` 中已經引用：
```html
<link rel="stylesheet" href="/hide-recaptcha-badge-only.css">
<script src="/badge-hide.js" defer></script>
```

### 手動啟用
如需在其他頁面使用：
```html
<!-- 在 <head> 中添加 -->
<link rel="stylesheet" href="/hide-recaptcha-badge-only.css">
<script src="/badge-hide.js" defer></script>
```

## 📊 監控機制

### 1. DOM 變化監控
- 監聽新增的 reCAPTCHA 元素
- 自動隱藏新出現的 badge
- 確保表單 reCAPTCHA 保持可見

### 2. 定期檢查
- 每2秒檢查一次
- 備用安全機制
- 持續保護表單功能

### 3. 智能識別
- 區分右下角圖標和表單元素
- 基於元素位置和父容器判斷
- 精確的選擇器匹配

## 📝 日誌輸出

腳本會在控制台輸出詳細日誌：
```
🎯 reCAPTCHA 圖標隱藏腳本已載入（保留表單功能）
🚀 初始化 reCAPTCHA 圖標隱藏
🎯 已隱藏右下角 reCAPTCHA 圖標: <element>
✅ reCAPTCHA 圖標隱藏初始化完成
```

## 🛠️ 故障排除

### 問題：右下角圖標仍然顯示
1. 檢查控制台是否有錯誤
2. 確認腳本和樣式已載入
3. 手動執行 `hideBadgeOnly()`
4. 檢查元素是否有特殊類名

### 問題：表單 reCAPTCHA 不顯示
1. 檢查表單是否有正確的類名
2. 手動執行 `ensureFormRecaptcha()`
3. 確認元素在表單容器內

### 問題：表單無法提交
1. 這個方案不應該影響表單提交
2. 檢查 reCAPTCHA 驗證是否正常
3. 查看網絡請求是否成功

## 🔄 與其他方案的切換

### 從完全隱藏方案切換
1. 替換 CSS 文件引用
2. 替換 JavaScript 文件引用
3. 測試表單功能是否恢復

### 回到位置調整方案
1. 使用 `recaptcha-position-fix.js`
2. 使用 `recaptcha-override.css`
3. 圖標會重新顯示但位置調整

## 📞 支援

如有問題或需要協助，請：
1. 查看瀏覽器控制台日誌
2. 使用測試頁面進行診斷
3. 檢查表單 reCAPTCHA 是否正常工作

---

**最後更新：** 2024年6月8日  
**版本：** 1.0.0  
**狀態：** 已部署並測試  
**推薦程度：** ⭐⭐⭐⭐⭐ （平衡了隱藏需求和功能保留） 