# Cloudflare Pages 重定向配置指南

## 🔧 修復的問題

### 原始錯誤
```
Invalid _redirects configuration:
Line 48: Only relative URLs are allowed.
Line 51: Infinite loop detected in this rule.
```

### 解決方案
1. **移除絕對 URL**: Cloudflare Pages 只允許相對 URL 重定向
2. **簡化語法**: 避免可能導致無限循環的複雜重定向規則

## 📄 當前 _redirects 配置

```
# Cloudflare Pages 重定向配置

# 靜態 HTML 文件 - 直接提供，不重定向
/pwa-install-debug.html 200
/pwa-engagement-test.html 200
/test-console-errors.html 200
/test-pwa-install.html 200
/pwa-desktop-debug.html 200
/pwa-language-test.html 200
/pwa-debug.html 200
/meta-image.html 200
/debug-registered-users.html 200
/test-deployment-fixes.html 200

# API 路由
/api/* 200

# 靜態資源
/assets/* 200
/android/* 200
/ios/* 200
/windows11/* 200
/splash_screens/* 200

# Manifest 和 PWA 文件
/manifest.json 200
/manifest.js 200
/manifest-dynamic.json 200
/site.webmanifest 200
/sw.js 200
/sw-register.js 200

# 圖標和圖片
/*.png 200
/*.svg 200
/*.ico 200
/*.webp 200

# 其他靜態文件
/robots.txt 200
/favicon.* 200

# SPA 路由處理 - 所有其他路由都返回 index.html
/* /index.html 200
```

## 🌐 WWW 重定向替代方案

由於 Cloudflare Pages 不支援在 `_redirects` 文件中使用絕對 URL，WWW 重定向需要在 Cloudflare Dashboard 中設置：

### 方法 1: Cloudflare Redirect Rules（推薦）

1. **進入 Cloudflare Dashboard**
   - 選擇 `lingubible.com` 域名
   - 點擊 **Rules** → **Redirect Rules**

2. **創建重定向規則**
   - 規則名稱：`WWW to non-WWW redirect`
   - 條件：`Hostname equals www.lingubible.com`
   - 動作：**Dynamic redirect**
   - 表達式：`concat("https://lingubible.com", http.request.uri.path)`
   - 狀態碼：**301**

### 方法 2: DNS 設置

```dns
# 主域名
lingubible.com → Cloudflare Pages

# www 子域名（CNAME 指向主域名）
www.lingubible.com → CNAME 指向 lingubible.com
```

## ✅ 配置驗證

### 測試 HTML 文件訪問
- ✅ `https://lingubible.com/pwa-install-debug.html`
- ✅ `https://lingubible.com/test-deployment-fixes.html`
- ✅ `https://lingubible.com/pwa-engagement-test.html`

### 測試 SPA 路由
- ✅ `https://lingubible.com/` → 正常載入
- ✅ `https://lingubible.com/auth/login` → 返回 index.html
- ✅ `https://lingubible.com/user/profile` → 返回 index.html

### 測試靜態資源
- ✅ `https://lingubible.com/assets/*` → 正常載入
- ✅ `https://lingubible.com/manifest.json` → 正常載入
- ✅ `https://lingubible.com/sw.js` → 正常載入

## 🚨 注意事項

1. **避免重複規則**: 不要在同一個文件中重複定義相同的路徑
2. **順序很重要**: 更具體的規則應該放在更通用的規則之前
3. **測試部署**: 每次修改後都要測試部署是否成功
4. **監控日誌**: 檢查 Cloudflare Pages 的部署日誌確認沒有錯誤

## 🔄 版本控制

當前配置版本：`0.1.9`
- ✅ 修復了絕對 URL 錯誤
- ✅ 消除了無限循環風險
- ✅ 簡化了重定向語法
- ✅ 保持了所有必要功能 