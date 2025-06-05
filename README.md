# Campus Comment Verse

一個專為校園社群設計的評論和討論平台，支援多語言（繁體中文、簡體中文、英文）。

## 🚀 功能特色

- 🌐 **多語言支援**：繁體中文、簡體中文、英文
- 🔐 **學生郵件驗證**：支援 @ln.hk 和 @ln.edu.hk 郵件地址
- 🛡️ **安全認證**：密碼強度檢查、郵件驗證
- 🎨 **現代化 UI**：使用 React + TypeScript + Tailwind CSS
- 📱 **響應式設計**：支援桌面和移動設備
- 🔧 **開發模式**：便於開發和測試

## 🛠️ 技術棧

- **前端**：React 18, TypeScript, Vite, Tailwind CSS
- **後端**：Appwrite (BaaS)
- **部署**：Vercel
- **郵件服務**：Resend

## 📚 文檔

所有詳細文檔都位於 [`docs/`](./docs/) 資料夾中：

### 🚀 快速開始
- [開發模式設置](./docs/DEV_MODE_SETUP.md)
- [開發模式測試指南](./docs/DEV_MODE_TESTING_GUIDE.md)
- [環境變數設置](./docs/ENVIRONMENT_VARIABLES_SETUP.md)

### 🔧 開發指南
- [多語言實現](./docs/MULTILINGUAL_IMPLEMENTATION.md)
- [學生郵件驗證設置](./docs/STUDENT_EMAIL_VERIFICATION_SETUP.md)
- [密碼安全功能](./docs/PASSWORD_SECURITY_FEATURES.md)
- [頭像系統](./docs/AVATAR_SYSTEM.md)

### 🚀 部署指南
- [Appwrite Git 部署指南](./docs/APPWRITE_GIT_DEPLOYMENT_GUIDE.md)
- [部署成功指南](./docs/DEPLOYMENT_SUCCESS_GUIDE.md)
- [Appwrite 開發模式設置](./docs/APPWRITE_DEV_MODE_SETUP.md)

### 🔒 安全相關
- [驗證安全](./docs/VERIFICATION_SECURITY.md)
- [自動驗證設置](./docs/AUTO_VERIFICATION_SETUP.md)

### 🎨 UI/UX
- [頭像閃爍修復](./docs/AVATAR_FLICKER_FIX.md)
- [OpenStatus 徽章使用](./docs/OPENSTATUS_BADGE_USAGE.md)

### 🛠️ 系統維護
- [郵件模板系統](./docs/EMAIL_TEMPLATE_SYSTEM.md)
- [清理功能設置](./docs/CLEANUP_FUNCTION_SETUP.md)
- [Appwrite 集合](./docs/appwrite-collections.md)

## 🏃‍♂️ 快速開始

### 1. 克隆專案
```bash
git clone https://github.com/your-username/campus-comment-verse.git
cd campus-comment-verse
```

### 2. 安裝依賴
```bash
npm install
```

### 3. 設置環境變數
創建 `.env` 檔案：
```bash
# 開發模式（可選）
VITE_DEV_MODE=true
VITE_DEV_BYPASS_PASSWORD=true

# Appwrite 配置
VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
```

### 4. 啟動開發伺服器
```bash
npm run dev
```

### 5. 開始開發
訪問 http://localhost:8081

## 🔧 開發模式

開發模式允許：
- 使用任何郵件地址註冊（不限於學校郵件）
- 繞過密碼強度檢查
- 自動完成郵件驗證

詳細設置請參考 [開發模式設置指南](./docs/DEV_MODE_SETUP.md)。

## 📝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

MIT License

---

**注意**：開發模式僅用於開發和測試。生產環境請務必關閉開發模式。 