# 🔧 Campus Comment Verse - 重構計劃

## 📋 當前問題分析

### 1. 文件組織問題
- **組件過於扁平化**：所有組件都在 `src/components/` 根目錄下，缺乏分類
- **頁面組件混雜**：認證相關、設置相關、展示相關頁面沒有分類
- **工具函數分散**：部分工具函數可以更好地組織
- **配置文件過長**：`vite.config.ts` 包含太多邏輯，應該拆分

### 2. 代碼結構問題
- **App.tsx 過於龐大**：396 行代碼，包含太多邏輯
- **重複的主題邏輯**：主題設置邏輯可以抽取為 hook
- **硬編碼的配置**：一些配置應該集中管理

### 3. 維護性問題
- **缺乏統一的導入順序**：不同文件的導入順序不一致
- **類型定義分散**：一些類型定義可以更好地組織
- **缺乏統一的常量管理**

## 🎯 重構目標

1. **提高代碼可讀性**：清晰的文件結構和命名
2. **增強可維護性**：模塊化設計，職責分離
3. **保持功能完整性**：確保所有現有功能正常工作
4. **改善開發體驗**：更好的 IDE 支持和自動完成

## 📁 新的文件結構

```
src/
├── components/
│   ├── auth/              # 認證相關組件
│   │   ├── AuthModal.tsx
│   │   ├── StudentVerificationInput.tsx
│   │   └── PasswordStrengthChecker.tsx
│   ├── layout/            # 佈局相關組件
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── AppSidebar.tsx
│   │   └── Sidebar.tsx
│   ├── ui/                # 基礎 UI 組件 (保持不變)
│   ├── user/              # 用戶相關組件
│   │   ├── UserMenu.tsx
│   │   ├── AvatarCustomizer.tsx
│   │   ├── AvatarSettings.tsx
│   │   └── UserStatsDisplay.tsx
│   ├── common/            # 通用組件
│   │   ├── ThemeToggle.tsx
│   │   ├── LanguageSwitcher.tsx
│   │   ├── SearchDialog.tsx
│   │   └── DocumentHead.tsx
│   ├── features/          # 功能特定組件
│   │   ├── reviews/
│   │   │   ├── ReviewCard.tsx
│   │   │   ├── CourseCard.tsx
│   │   │   └── LecturerCard.tsx
│   │   ├── pwa/
│   │   │   ├── PWAInstallBanner.tsx
│   │   │   └── PWAStatusIndicator.tsx
│   │   └── animations/
│   │       ├── FloatingCircles.tsx
│   │       ├── FloatingGlare.tsx
│   │       └── RollingText.tsx
│   └── dev/               # 開發相關組件
│       ├── DevModeIndicator.tsx
│       └── PasswordDemo.tsx
├── pages/
│   ├── auth/              # 認證頁面
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── ForgotPassword.tsx
│   ├── user/              # 用戶相關頁面
│   │   ├── UserSettings.tsx
│   │   └── AvatarDemo.tsx
│   ├── demo/              # 演示頁面
│   │   └── LecturerDemo.tsx
│   ├── legal/             # 法律頁面
│   │   ├── Terms.tsx
│   │   ├── Privacy.tsx
│   │   └── Contact.tsx
│   ├── Index.tsx          # 首頁
│   └── NotFound.tsx       # 404 頁面
├── hooks/
│   ├── auth/              # 認證相關 hooks
│   ├── theme/             # 主題相關 hooks
│   │   └── useTheme.ts
│   ├── ui/                # UI 相關 hooks
│   │   └── use-swipe-gesture.ts
│   └── common/            # 通用 hooks
├── services/
│   ├── api/               # API 服務
│   │   ├── auth.ts
│   │   ├── avatar.ts
│   │   └── userStats.ts
│   └── external/          # 外部服務
│       └── studentVerification.ts
├── utils/
│   ├── auth/              # 認證相關工具
│   │   └── usernameValidator.ts
│   ├── ui/                # UI 相關工具
│   │   └── avatarUtils.ts
│   ├── constants/         # 常量定義
│   │   ├── routes.ts
│   │   ├── themes.ts
│   │   └── config.ts
│   └── helpers/           # 通用幫助函數
├── types/
│   ├── auth.ts            # 認證相關類型
│   ├── user.ts            # 用戶相關類型
│   ├── api.ts             # API 相關類型
│   └── common.ts          # 通用類型
├── config/
│   ├── app.ts             # 應用配置
│   ├── routes.ts          # 路由配置
│   └── theme.ts           # 主題配置
└── lib/
    ├── utils.ts           # 保持現有的工具函數
    └── cookies.ts         # Cookie 管理
```

## 🔄 重構步驟

### 階段 1：組件重組
1. 創建新的目錄結構
2. 移動組件到對應目錄
3. 更新所有導入路徑
4. 測試功能完整性

### 階段 2：頁面重組
1. 重組頁面目錄結構
2. 更新路由配置
3. 測試所有頁面導航

### 階段 3：服務和工具重組
1. 重組服務文件
2. 提取常量和配置
3. 創建統一的類型定義

### 階段 4：主應用重構
1. 拆分 App.tsx 的邏輯
2. 創建主題管理 hook
3. 簡化配置文件

### 階段 5：優化和清理
1. 統一導入順序
2. 添加 JSDoc 註釋
3. 優化 TypeScript 配置

## ⚠️ 注意事項

1. **保持向後兼容**：確保所有現有功能正常工作
2. **漸進式重構**：分階段進行，每個階段都要測試
3. **保留 Git 歷史**：使用 `git mv` 移動文件
4. **更新文檔**：同步更新相關文檔

## 🧪 測試策略

1. **功能測試**：確保所有頁面和功能正常
2. **路由測試**：驗證所有路由正確工作
3. **構建測試**：確保生產構建成功
4. **類型檢查**：確保 TypeScript 編譯無錯誤

## 📈 預期收益

1. **更好的開發體驗**：清晰的文件結構，更容易找到代碼
2. **提高維護效率**：模塊化設計，更容易修改和擴展
3. **減少錯誤**：更好的類型安全和代碼組織
4. **團隊協作**：統一的代碼風格和結構 