# Appwrite 函數自動部署設置指南

## 方法 1: 使用 Appwrite 內建 Git 集成（推薦）

### 前置條件
- 您的 Appwrite 專案必須可以從網際網路存取
- 如果在本地開發，需要使用 ngrok 等代理工具

### 步驟 1: 在 Appwrite Console 中設置 Git 集成

1. 登入 Appwrite Console
2. 進入您的專案
3. 點擊左側選單的 **Functions**
4. 選擇您要設置自動部署的函數（例如：Send Verification Email）
5. 進入 **Settings** > **Configuration** > **Git settings**
6. 點擊 **Connect Git**
7. 選擇 GitHub 作為您的 Git 提供商
8. 授權 Appwrite 存取您的 GitHub 帳戶
9. 選擇包含您函數代碼的儲存庫
10. 設置以下配置：
    - **Production Branch**: `main` 或 `master`
    - **Root Directory**: `functions/send-verification-email`（注意：使用不含空格的目錄名稱）
    - **Entry Point**: `src/main.js`

### 步驟 2: 配置函數結構

確保您的函數目錄結構如下：
```
functions/
├── send-verification-email/     # 發送驗證郵件函數
│   ├── src/
│   │   └── main.js             # 入口點文件
│   ├── package.json            # 依賴配置
│   └── package-lock.json       # 鎖定版本
├── verify-student-code/         # 驗證學生代碼函數
│   └── ...
└── cleanup-expired-codes/       # 清理過期代碼函數
    └── ...
```

**重要提醒**: Appwrite 不支援包含空格的目錄名稱，請確保所有函數目錄名稱都使用連字符（-）而不是空格。

### 步驟 3: 測試自動部署

1. 對您的函數代碼進行修改
2. 提交更改到 Git
3. 推送到您設置的生產分支（main/master）
4. Appwrite 將自動檢測更改並開始新的部署
5. 在 Appwrite Console 的 **Deployments** 標籤中查看部署狀態

## 方法 2: 使用 GitHub Actions（適用於更複雜的工作流程）

如果您需要更多控制或想要在部署前執行測試，可以使用 GitHub Actions。

### 設置 GitHub Secrets

在您的 GitHub 儲存庫中設置以下 Secrets：
- `APPWRITE_ENDPOINT`: 您的 Appwrite 端點 URL
- `APPWRITE_PROJECT_ID`: 您的專案 ID
- `APPWRITE_API_KEY`: 具有函數部署權限的 API 金鑰

### 工作流程文件已創建

參考 `.github/workflows/deploy-appwrite-functions.yml` 文件。

## 自動部署觸發條件

### 推送到生產分支
- 當您推送提交到生產分支時，新的部署將被創建、構建並自動激活
- 新部署將立即替換當前活動的部署

### 推送到其他分支
- 當您推送到非生產分支時，將創建新部署但不會激活
- 這些部署不會處理傳入請求，直到手動激活

## 故障排除

### 常見問題
1. **部署失敗**: 檢查函數的構建設置和依賴項
2. **代碼文件缺失**: 確保所有必要文件都在 Root Directory 中
3. **權限問題**: 確認 GitHub App 具有正確的權限

### 調試步驟
1. 檢查 Appwrite Console 中的部署日誌
2. 確認 Git 配置設置正確
3. 驗證函數的入口點和根目錄路徑
4. 檢查構建命令是否正確執行

## 最佳實踐

1. **使用分支策略**: 在功能分支上開發，合併到主分支進行部署
2. **版本控制**: 使用有意義的提交訊息來追蹤更改
3. **測試**: 在非生產分支上測試更改
4. **監控**: 定期檢查部署狀態和執行日誌
5. **備份**: 保持重要配置的備份

## 進階配置

### 共享代碼
如果您在多個函數之間共享代碼：
1. 將根目錄設置為 monorepo 的共同根目錄
2. 在構建設置中使用 `cd <working directory>` 導航到函數目錄
3. 或者使用 Git submodules 在每個函數儲存庫中包含共享代碼

### 環境變數
在 Appwrite Console 的函數設置中配置必要的環境變數，如：
- 資料庫連接字串
- API 金鑰
- 第三方服務配置 