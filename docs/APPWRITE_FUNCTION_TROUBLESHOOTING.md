# Appwrite 函數故障排除指南

## 常見錯誤和解決方案

### 1. 模組找不到錯誤

#### 錯誤訊息
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'node-appwrite' imported from /usr/local/server/src/function/src/main.js
```

#### 原因
- `package.json` 中缺少必要的依賴
- `package.json` 配置不完整
- 部署時依賴安裝失敗

#### 解決方案

1. **檢查 package.json 配置**：
   ```json
   {
     "name": "function-name",
     "version": "1.0.0",
     "description": "Function description",
     "main": "src/main.js",
     "type": "module",
     "scripts": {
       "start": "node src/main.js"
     },
     "dependencies": {
       "node-appwrite": "^13.0.0"
     },
     "engines": {
       "node": ">=18.0.0"
     }
   }
   ```

2. **重新安裝依賴**：
   ```bash
   cd functions/your-function
   rm bun.lockb
   bun install
   ```

3. **重新部署函數**：
   ```bash
   appwrite functions create-deployment \
     --function-id your-function-id \
     --entrypoint src/main.js \
     --code functions/your-function \
     --activate true
   ```

#### 關鍵要點
- ✅ 必須包含 `"engines": {"node": ">=18.0.0"}`
- ✅ 確保 `node-appwrite` 版本為 `^13.0.0`
- ✅ 使用 `"type": "module"` 支援 ES6 模組

### 2. 認證錯誤

#### 錯誤訊息
```
User (role: guests) missing scope (users.read)
```

#### 原因
- API 密鑰權限不足
- 環境變數未正確設置

#### 解決方案

1. **檢查 API 密鑰權限**：
   - 進入 Appwrite 控制台
   - 檢查 API 密鑰是否有 `users.read` 權限

2. **檢查環境變數**：
   ```bash
   appwrite functions list-variables --function-id your-function-id
   ```

3. **設置正確的環境變數**：
   ```bash
   appwrite functions update-variable \
     --function-id your-function-id \
     --key APPWRITE_API_KEY \
     --value "your-api-key"
   ```

### 3. 數據庫連接錯誤

#### 錯誤訊息
```
Database with the requested ID could not be found
```

#### 原因
- 數據庫 ID 錯誤
- 數據庫不存在
- 權限不足

#### 解決方案

1. **檢查數據庫 ID**：
   ```javascript
   // 確保使用正確的數據庫 ID
   await databases.createDocument(
     'user-stats-db',  // 確保這個 ID 正確
     'collection-id',
     'document-id',
     data
   );
   ```

2. **創建數據庫和集合**：
   ```bash
   # 創建數據庫
   appwrite databases create \
     --database-id user-stats-db \
     --name "User Statistics Database"
   
   # 創建集合
   appwrite databases create-collection \
     --database-id user-stats-db \
     --collection-id user-stats-cache \
     --name "User Stats Cache"
   ```

### 4. 函數超時錯誤

#### 錯誤訊息
```
Function execution timed out
```

#### 原因
- 函數執行時間超過設定的超時限制
- 無限循環或長時間運行的操作

#### 解決方案

1. **增加超時時間**：
   ```bash
   appwrite functions update \
     --function-id your-function-id \
     --timeout 30
   ```

2. **優化函數代碼**：
   - 減少 API 調用次數
   - 使用分頁查詢大量數據
   - 添加適當的錯誤處理

### 5. 部署失敗

#### 錯誤訊息
```
Deployment failed to build
```

#### 原因
- 代碼語法錯誤
- 依賴版本衝突
- 文件結構不正確

#### 解決方案

1. **檢查代碼語法**：
   ```bash
   cd functions/your-function
   node --check src/main.js
   ```

2. **檢查文件結構**：
   ```
   functions/your-function/
   ├── src/
   │   └── main.js
   ├── package.json
   └── bun.lockb
   ```

3. **本地測試**：
   ```bash
   cd functions/your-function
   bun install
   bun start
   ```

## 調試技巧

### 1. 查看函數日誌

```bash
# 查看最近的執行
appwrite functions list-executions --function-id your-function-id --limit 5

# 查看特定執行的詳細日誌
appwrite functions get-execution \
  --function-id your-function-id \
  --execution-id execution-id
```

### 2. 本地調試

```javascript
// 在函數中添加詳細日誌
export default async ({ req, res, log, error }) => {
  try {
    log('函數開始執行');
    log('環境變數檢查:', {
      endpoint: process.env.APPWRITE_FUNCTION_ENDPOINT,
      projectId: process.env.APPWRITE_FUNCTION_PROJECT_ID,
      hasApiKey: !!process.env.APPWRITE_API_KEY
    });
    
    // 你的函數邏輯
    
  } catch (err) {
    error('函數執行失敗:', err.message);
    error('錯誤堆疊:', err.stack);
  }
};
```

### 3. 測試函數

```bash
# 手動執行函數
appwrite functions create-execution --function-id your-function-id

# 使用 curl 測試
curl -X POST \
  https://fra.cloud.appwrite.io/v1/functions/your-function-id/executions \
  -H "X-Appwrite-Project: your-project-id" \
  -H "X-Appwrite-Key: your-api-key"
```

## 最佳實踐

### 1. 函數結構

```javascript
import { Client, Databases } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  try {
    // 1. 初始化客戶端
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    // 2. 驗證輸入
    log('函數開始執行');

    // 3. 執行業務邏輯
    const result = await performBusinessLogic();

    // 4. 返回結果
    return res.json({
      success: true,
      data: result
    });

  } catch (err) {
    error('函數執行失敗:', err.message);
    
    return res.json({
      success: false,
      error: err.message
    });
  }
};
```

### 2. 錯誤處理

```javascript
// 總是提供備用方案
try {
  const result = await primaryOperation();
  return result;
} catch (primaryError) {
  log('主要操作失敗，嘗試備用方案:', primaryError.message);
  
  try {
    const fallbackResult = await fallbackOperation();
    return fallbackResult;
  } catch (fallbackError) {
    error('備用方案也失敗:', fallbackError.message);
    return defaultValue;
  }
}
```

### 3. 環境變數檢查

```javascript
// 在函數開始時檢查必要的環境變數
const requiredEnvVars = [
  'APPWRITE_FUNCTION_ENDPOINT',
  'APPWRITE_FUNCTION_PROJECT_ID',
  'APPWRITE_API_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

## 相關文檔

- [Appwrite 函數文檔](https://appwrite.io/docs/functions)
- [Node.js SDK 文檔](https://appwrite.io/docs/server/nodejs)
- [函數設置指南](./APPWRITE_FUNCTION_SETUP.md) 