# Appwrite 函數設置指南

## 問題背景

登入時間過長是因為客戶端直接查詢數據庫來獲取用戶統計。根據 Appwrite 工作人員的建議：

> End users cannot fetch users because that would be a privacy concern. That data is available via a server SDK (with API key). So, I would suggest creating an Appwrite function that uses the server SDK to fetch that count.

## 解決方案

我們創建了一個 Appwrite 函數 `get-user-stats`，使用服務器 SDK 來獲取用戶統計，避免客戶端的隱私限制。

## 設置步驟

### 1. 安裝 Appwrite CLI

```bash
# 全局安裝 Appwrite CLI
npm install -g appwrite-cli

# 驗證安裝
appwrite --version
```

### 2. 登入 Appwrite

```bash
# 登入到 Appwrite Cloud
appwrite login

# 或者登入到自託管實例
appwrite login --endpoint https://your-appwrite-instance.com/v1
```

### 3. 初始化項目

```bash
# 在項目根目錄初始化 Appwrite 項目
appwrite init project

# 選擇現有項目或創建新項目
# Project ID: lingubible
# Project Name: LingUBible
```

### 4. 初始化函數

```bash
# 初始化函數配置
appwrite init function

# 設置函數參數：
# Function ID: get-user-stats
# Function Name: Get User Statistics
# Runtime: Node.js (node-18.0)
# Events: (留空，我們使用手動執行)
# Schedule: (留空)
# Timeout: 15 (秒)
# Path: appwrite/functions/get-user-stats
```

### 5. 配置項目設置

檢查並更新 `appwrite/appwrite.json`：

```bash
# 查看當前配置
cat appwrite/appwrite.json

# 如果需要，可以手動編輯配置文件
```

### 6. 設置 API 密鑰

在 Appwrite 控制台中創建 API 密鑰：

1. 進入 **Overview** > **Integrations** > **API Keys**
2. 點擊 **Create API Key**
3. 設置以下參數：
   - **Name**: `User Stats Function Key`
   - **Expiration**: 設置適當的過期時間
   - **Scopes**: 選擇 `users.read`

### 7. 設置環境變數

```bash
# 為函數設置環境變數
appwrite functions updateVariable \
    --functionId get-user-stats \
    --key APPWRITE_API_KEY \
    --value "your-api-key-here"

appwrite functions updateVariable \
    --functionId get-user-stats \
    --key APPWRITE_FUNCTION_ENDPOINT \
    --value "https://fra.cloud.appwrite.io/v1"

appwrite functions updateVariable \
    --functionId get-user-stats \
    --key APPWRITE_FUNCTION_PROJECT_ID \
    --value "lingubible"
```

### 8. 部署函數

#### 方法 1: 使用提供的腳本

```bash
# 給腳本執行權限
chmod +x scripts/deploy-appwrite-function.sh

# 執行部署腳本
./scripts/deploy-appwrite-function.sh
```

#### 方法 2: 使用 CLI 命令

```bash
# 切換到 appwrite 目錄
cd appwrite

# 部署函數
appwrite functions createDeployment \
    --functionId get-user-stats \
    --entrypoint "src/main.js" \
    --code "./functions/get-user-stats" \
    --activate true

# 返回項目根目錄
cd ..
```

#### 方法 3: 使用 appwrite deploy 命令

```bash
# 部署整個項目配置（推薦）
appwrite deploy

# 或只部署函數
appwrite deploy function get-user-stats
```

### 9. 創建數據庫和集合（可選）

#### 使用 CLI 創建數據庫

```bash
# 創建數據庫
appwrite databases create \
    --databaseId user-stats-db \
    --name "User Statistics Database"

# 創建集合
appwrite databases createCollection \
    --databaseId user-stats-db \
    --collectionId user-stats-cache \
    --name "User Stats Cache" \
    --permissions 'read("any")' 'write("any")'

# 創建屬性
appwrite databases createIntegerAttribute \
    --databaseId user-stats-db \
    --collectionId user-stats-cache \
    --key totalRegisteredUsers \
    --required true

appwrite databases createIntegerAttribute \
    --databaseId user-stats-db \
    --collectionId user-stats-cache \
    --key verifiedUsers \
    --required true

appwrite databases createIntegerAttribute \
    --databaseId user-stats-db \
    --collectionId user-stats-cache \
    --key unverifiedUsers \
    --required true

appwrite databases createDatetimeAttribute \
    --databaseId user-stats-db \
    --collectionId user-stats-cache \
    --key lastUpdated \
    --required true

appwrite databases createDatetimeAttribute \
    --databaseId user-stats-db \
    --collectionId user-stats-cache \
    --key cachedAt \
    --required true
```

### 10. 驗證部署

```bash
# 列出所有函數
appwrite functions list

# 查看特定函數詳情
appwrite functions get --functionId get-user-stats

# 查看函數部署
appwrite functions listDeployments --functionId get-user-stats

# 測試函數執行
appwrite functions createExecution --functionId get-user-stats
```

## CLI 常用命令

### 函數管理

```bash
# 查看函數列表
appwrite functions list

# 查看函數詳情
appwrite functions get --functionId get-user-stats

# 更新函數配置
appwrite functions update \
    --functionId get-user-stats \
    --name "Updated Function Name" \
    --timeout 30

# 刪除函數
appwrite functions delete --functionId get-user-stats
```

### 部署管理

```bash
# 查看部署列表
appwrite functions listDeployments --functionId get-user-stats

# 查看特定部署
appwrite functions getDeployment \
    --functionId get-user-stats \
    --deploymentId deployment-id

# 激活特定部署
appwrite functions updateDeployment \
    --functionId get-user-stats \
    --deploymentId deployment-id \
    --activate true
```

### 執行管理

```bash
# 手動執行函數
appwrite functions createExecution --functionId get-user-stats

# 查看執行歷史
appwrite functions listExecutions --functionId get-user-stats

# 查看特定執行詳情
appwrite functions getExecution \
    --functionId get-user-stats \
    --executionId execution-id
```

### 環境變數管理

```bash
# 查看環境變數
appwrite functions listVariables --functionId get-user-stats

# 添加環境變數
appwrite functions createVariable \
    --functionId get-user-stats \
    --key NEW_VAR \
    --value "new-value"

# 更新環境變數
appwrite functions updateVariable \
    --functionId get-user-stats \
    --variableId variable-id \
    --key UPDATED_VAR \
    --value "updated-value"

# 刪除環境變數
appwrite functions deleteVariable \
    --functionId get-user-stats \
    --variableId variable-id
```

## 工作原理

### 客戶端流程

1. **緩存檢查**: 首先檢查本地緩存（5分鐘有效期）
2. **函數調用**: 如果緩存過期，調用 Appwrite 函數
3. **備用方案**: 如果函數失敗，從緩存數據庫獲取
4. **最終備用**: 如果都失敗，返回預設值

### 服務器函數流程

1. **用戶統計**: 使用服務器 SDK 獲取總用戶數
2. **驗證狀態**: 計算已驗證和未驗證用戶數
3. **數據緩存**: 將結果緩存到數據庫
4. **返回結果**: 返回統計數據給客戶端

## 性能改進

### 修改前
- ❌ 客戶端直接查詢用戶數據庫
- ❌ 每次登入都執行複雜查詢
- ❌ 隱私問題和權限限制

### 修改後
- ✅ 服務器端函數處理用戶查詢
- ✅ 客戶端緩存減少函數調用
- ✅ 數據庫緩存提供備用方案
- ✅ 符合 Appwrite 最佳實踐

## 測試

### 測試函數

#### 使用 CLI 測試

```bash
# 執行函數並查看結果
appwrite functions createExecution --functionId get-user-stats

# 查看最近的執行結果
appwrite functions listExecutions --functionId get-user-stats --limit 1
```

#### 使用控制台測試

在 Appwrite 控制台中：

1. 進入 **Functions** > **get-user-stats**
2. 點擊 **Execute**
3. 檢查執行結果和日誌

### 測試客戶端

1. 清除瀏覽器緩存
2. 重新載入應用
3. 檢查網絡請求和控制台日誌
4. 驗證統計數據是否正確顯示

## 故障排除

### 常見問題

1. **CLI 登入問題**
   ```bash
   # 清除登入狀態重新登入
   appwrite logout
   appwrite login
   ```

2. **函數部署失敗**
   ```bash
   # 檢查函數配置
   appwrite functions get --functionId get-user-stats
   
   # 查看部署日誌
   appwrite functions listDeployments --functionId get-user-stats
   ```

3. **函數執行失敗**
   - 檢查 API 密鑰是否正確設置
   - 確認 API 密鑰有用戶讀取權限
   - 查看函數執行日誌

4. **權限錯誤**
   - 檢查函數的執行權限設置
   - 確認客戶端有調用函數的權限

5. **緩存問題**
   - 檢查數據庫和集合是否正確創建
   - 確認集合權限設置

### 日誌檢查

#### CLI 日誌檢查

```bash
# 查看函數執行日誌
appwrite functions listExecutions --functionId get-user-stats

# 查看特定執行的詳細日誌
appwrite functions getExecution \
    --functionId get-user-stats \
    --executionId execution-id
```

#### 控制台日誌檢查

- **函數日誌**: Appwrite 控制台 > Functions > get-user-stats > Executions
- **客戶端日誌**: 瀏覽器開發者工具控制台

## 維護

### 定期任務

1. **監控函數性能**: 檢查執行時間和成功率
   ```bash
   # 查看最近的執行統計
   appwrite functions listExecutions --functionId get-user-stats --limit 10
   ```

2. **更新緩存策略**: 根據使用情況調整緩存時間

3. **清理舊緩存**: 定期清理過期的緩存數據

### 自動化部署

創建 GitHub Actions 或其他 CI/CD 流程：

```yaml
# .github/workflows/deploy-appwrite.yml
name: Deploy Appwrite Functions

on:
  push:
    branches: [main]
    paths: ['appwrite/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install Appwrite CLI
        run: npm install -g appwrite-cli
        
      - name: Deploy Functions
        run: |
          echo "${{ secrets.APPWRITE_CLI_KEY }}" | appwrite login --stdin
          appwrite deploy function get-user-stats
        env:
          APPWRITE_ENDPOINT: ${{ secrets.APPWRITE_ENDPOINT }}
          APPWRITE_PROJECT: ${{ secrets.APPWRITE_PROJECT }}
```

### 擴展功能

- 添加更多統計指標
- 實現實時統計更新
- 添加統計數據的歷史記錄
- 實現函數的 A/B 測試 