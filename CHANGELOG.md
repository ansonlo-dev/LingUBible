# 更新日誌 (Changelog)

## [0.1.3] - 2024-01-XX - reCAPTCHA 安全驗證系統全面升級

### 🔐 主要新功能

#### 🛡️ 全面 reCAPTCHA 安全保護
- **登入表單 reCAPTCHA 支援**：智能驗證系統，只在多次登入失敗後啟用
- **忘記密碼表單 reCAPTCHA 支援**：高風險表單，總是需要安全驗證
- **統一 reCAPTCHA 體驗**：三個認證表單（註冊、登入、忘記密碼）都具有一致的安全保護

#### 🧠 智能 reCAPTCHA 系統
- **風險等級分類**：
  - 高風險：註冊、忘記密碼（總是需要驗證）
  - 中風險：登入（多次失敗後啟用）
  - 低風險：搜索、篩選（通常不需要）
- **用戶行為追蹤**：記錄登入失敗次數、快速提交行為、可疑活動
- **動態驗證邏輯**：根據用戶行為智能決定是否需要 reCAPTCHA

#### 🌍 多語言 reCAPTCHA 支援
- **完整翻譯**：reCAPTCHA 狀態指示器支援繁體中文、簡體中文、英文
- **動態語言切換**：reCAPTCHA 介面會根據用戶選擇的語言自動調整

### 🚀 新增功能

#### 🔑 忘記密碼功能完整實作
- **真實 API 端點**：使用 Appwrite 內建密碼重設功能
- **隱私保護**：無論用戶是否存在都返回成功訊息
- **reCAPTCHA 保護**：防止惡意密碼重設請求

#### 📱 優化的用戶介面
- **統一狀態指示器**：所有表單都顯示 "reCAPTCHA 安全驗證已載入"
- **合理佈局**：忘記密碼表單中 reCAPTCHA 指示器位於按鈕上方
- **視覺一致性**：藍色主題的安全驗證提示

### 🔧 技術改進

#### 新增 Hooks
- **`useLoginRecaptcha`**：登入表單專用的 reCAPTCHA hook
- **`useForgotPasswordRecaptcha`**：忘記密碼表單專用的 reCAPTCHA hook
- **智能驗證邏輯**：自動判斷是否需要 reCAPTCHA 驗證

#### 後端 API 擴展
- **`sendPasswordReset`** 函數：處理密碼重設請求
- **reCAPTCHA 驗證整合**：後端驗證 reCAPTCHA token
- **錯誤處理優化**：更好的錯誤訊息和用戶體驗

#### CSS 和 JavaScript 更新
- **表單選擇器擴展**：支援 `.login-form` 和 `.forgot-password-form`
- **reCAPTCHA 隱藏腳本更新**：確保表單中的 reCAPTCHA 保持可見
- **跨瀏覽器兼容性**：改善不同設備上的表現

### 📁 新增文件
- `src/hooks/useSmartRecaptcha.ts` - 智能 reCAPTCHA 系統（新增 hooks）
- 後端函數擴展：`sendPasswordReset` 功能

### 📝 修改文件
- `src/pages/auth/Login.tsx` - 添加 reCAPTCHA 支援
- `src/pages/auth/ForgotPassword.tsx` - 完整重構，添加真實 API 和 reCAPTCHA
- `src/contexts/AuthContext.tsx` - 新增 `sendPasswordReset` 方法
- `src/services/api/auth.ts` - 新增密碼重設 API 調用
- `src/contexts/LanguageContext.tsx` - 新增 reCAPTCHA 相關翻譯
- `functions/send-verification-email/src/main.js` - 新增密碼重設端點
- `public/hide-*.js` - 更新 reCAPTCHA 隱藏腳本

### 🛡️ 安全性提升
- **reCAPTCHA v3 分數驗證**：最低接受分數 0.5
- **智能威脅檢測**：根據用戶行為動態調整安全等級
- **隱私保護**：密碼重設功能不洩露用戶存在性
- **開發模式支援**：便於開發和測試

### ✨ 用戶體驗提升
- 🎯 **智能驗證**：減少不必要的 reCAPTCHA 挑戰
- 🌍 **多語言支援**：完整的本地化體驗
- 🔒 **安全感提升**：清晰的安全驗證狀態提示
- 📱 **一致性**：所有認證表單具有統一的安全保護

### 🔍 測試覆蓋
- ✅ 登入表單 reCAPTCHA 智能驗證
- ✅ 忘記密碼表單 reCAPTCHA 保護
- ✅ 多語言 reCAPTCHA 介面
- ✅ 後端密碼重設 API
- ✅ 隱私保護機制

---

## [2024-01-XX] - 控制台日誌優化與移動端搜索體驗大幅改善

### 🚀 主要新功能

#### 📱 全新移動端搜索體驗
- **新增 `MobileSearchModal` 組件**：專為移動設備設計的全屏搜索模態
- **響應式搜索架構**：
  - 桌面端（≥768px）：保持原有的下拉式搜索體驗
  - 移動端（<768px）：使用全屏模態搜索，避免焦點和定位問題
- **優化搜索結果佈局**：更緊湊的設計，改善滾動體驗
- **統一視覺樣式**：移動端搜索框具有與桌面版相同的紅色焦點邊框

### 🔧 重要修復

#### 移動端搜索問題解決
- ✅ **修復搜索框焦點問題**：解決移動端點擊搜索框後建議項目閃爍消失的問題
- ✅ **修復虛擬鍵盤衝突**：避免虛擬鍵盤彈出時的佈局問題
- ✅ **修復觸摸事件處理**：消除被動事件監聽器錯誤
- ✅ **修復輸入體驗**：確保用戶可以正常在搜索框中輸入

#### 控制台日誌優化
- ✅ **大幅減少 Workbox 日誌**：過濾不必要的 PWA 相關警告訊息
- ✅ **修復 401 錯誤**：未登入用戶不再觸發不必要的 API 調用
- ✅ **優化統計數據收集**：只有登入用戶才執行統計和 ping 功能
- ✅ **保留完整 PWA 功能**：確保 PWA 安裝按鈕和離線緩存正常運作

### 🛠️ 技術改進

#### Hook 優化
- **`useUserStats`**：添加用戶登入狀態檢查，避免未登入用戶觸發 API 調用
- **`usePingSystem`**：只有登入用戶才啟動 ping 系統
- **`useRegisteredUsers`**：優化用戶註冊統計邏輯

#### 服務層改進
- **`AppwriteUserStatsService`**：在 `getStats` 方法中檢查活動會話
- **`registeredUsersService`**：改善錯誤處理和數據獲取邏輯

#### TypeScript 修復
- 修復 `NodeJS.Timeout` 類型錯誤，改為使用 `number` 類型
- 改善類型安全性和代碼可維護性

### 📁 新增文件
- `src/components/common/MobileSearchModal.tsx` - 移動端搜索模態組件
- `public/debug-registered-users.html` - 調試工具
- `public/test-*.html` - 各種測試頁面

### 📝 修改文件
- `src/components/layout/Header.tsx` - 響應式搜索邏輯
- `src/components/common/SearchDialog.tsx` - 搜索對話框優化
- `src/hooks/useUserStats.ts` - 用戶統計邏輯優化
- `src/hooks/usePingSystem.ts` - Ping 系統優化
- `src/services/api/appwriteUserStats.ts` - 統計服務改進
- `vite.config.ts` - Vite 配置優化
- `src/index.css` - 樣式更新

### ✨ 用戶體驗提升
- 🎯 **乾淨的控制台輸出**：減少開發者困擾，提供更好的調試體驗
- 📱 **優秀的移動端體驗**：穩定的搜索交互，無控制台錯誤
- 🔄 **跨平台一致性**：桌面端和移動端都有優秀的搜索體驗
- ⚡ **性能優化**：減少不必要的 API 調用，提升應用響應速度

### 🔍 測試覆蓋
- ✅ 桌面端搜索功能正常
- ✅ 移動端全屏搜索模態正常
- ✅ PWA 功能完整保留
- ✅ 未登入用戶體驗優化
- ✅ 控制台日誌大幅減少

---

**提交哈希**: `d9a9a75`  
**影響文件**: 20 個文件，4876 行新增，115 行刪除  
**測試狀態**: ✅ 通過 