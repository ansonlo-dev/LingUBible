# Appwrite 函數部署指南

## 🚀 部署前準備

### 1. 確保環境配置正確

```bash
# 檢查 Appwrite CLI 是否已安裝
appwrite --version

# 如果未安裝，請安裝 Appwrite CLI
bun install -g appwrite-cli

# 登入 Appwrite
appwrite login
```

### 2. 檢查項目配置

確保您在項目根目錄，並且 `appwrite.json` 文件存在：

```bash
# 檢查當前目錄
pwd
# 應該顯示: /path/to/LingUBible

# 檢查 appwrite.json 是否存在
ls -la appwrite.json
```

## 🧹 部署前清理 (重要!)

**在部署前，請務必運行清理腳本以確保函數大小最小：**

```bash
# 運行清理腳本
./scripts/clean-functions.sh
```

這個腳本會：
- 刪除所有 `node_modules` 目錄
- 清理舊的部署檔案 (*.tar.gz, *.zip)
- 移除日誌文件和臨時文件
- 檢查是否有大文件

## 📦 函數部署步驟

### 方法 1: 使用 Appwrite CLI 部署單個函數

```bash
# 部署 send-verification-email 函數
appwrite functions create-deployment \
    --function-id=send-verification \
    --entrypoint="src/main.js" \
    --code="functions/send-verification-email" \
    --activate=true

# 部署 cleanup-expired-codes 函數
appwrite functions create-deployment \
    --function-id=cleanup-expired-codes \
    --entrypoint="src/main.js" \
    --code="functions/cleanup-expired-codes" \
    --activate=true

# 部署 get-user-stats 函數
appwrite functions create-deployment \
    --function-id=get-user-stats \
    --entrypoint="src/main.js" \
    --code="functions/get-user-stats" \
    --activate=true
```

### 方法 2: 使用 appwrite.json 部署所有函數

```bash
# 部署所有函數
appwrite deploy functions
```

## 🔧 故障排除

### 問題 1: "Build archive was not created"

**原因**: 函數目錄中包含不必要的文件或缺少必要的文件

**解決方案**:
1. 確保函數目錄結構正確：
   ```
   functions/send-verification-email/
   ├── src/
   │   ├── main.js
   │   └── email-template.js
   ├── package.json
   ├── bun.lock
   └── .appwriteignore
   ```

2. 清理不必要的文件：
   ```bash
   # 刪除 node_modules 目錄
   rm -rf functions/*/node_modules
   
   # 刪除舊的部署檔案
   rm -f functions/*/deployment.tar.gz
   ```

3. 確保 lock 文件存在：
   ```bash
   cd functions/send-verification-email
   bun install
   cd ../cleanup-expired-codes
   bun install
   ```

### 問題 2: 依賴項安裝失敗

**原因**: package.json 配置問題或網路問題

**解決方案**:
1. 檢查 package.json 格式是否正確
2. 確保 `"type": "module"` 已設置（如果使用 ES modules）
3. 檢查依賴項版本是否兼容

### 問題 3: 運行時錯誤

**原因**: Node.js 版本不匹配或環境變數未設置

**解決方案**:
1. 確保 appwrite.json 中的運行時版本與 package.json 中的 engines 匹配
2. 在 Appwrite 控制台中設置必要的環境變數：
   - `RESEND_API_KEY`
   - `RECAPTCHA_SECRET_KEY`
   - `APPWRITE_API_KEY`

## 📋 部署檢查清單

- [ ] Appwrite CLI 已安裝並登入
- [ ] 函數目錄結構正確
- [ ] package.json 配置正確
- [ ] bun.lock 文件存在（對於有依賴項的函數）
- [ ] .appwriteignore 文件存在
- [ ] 沒有 node_modules 目錄
- [ ] 沒有舊的部署檔案
- [ ] 環境變數已在 Appwrite 控制台中設置
- [ ] 函數權限已正確配置

## 🧪 測試部署

部署成功後，測試函數是否正常工作：

```bash
# 測試 send-verification-email 函數
appwrite functions create-execution \
    --function-id=send-verification \
    --data='{"action":"send","email":"test@ln.edu.hk","language":"zh-TW"}'

# 檢查執行日誌
appwrite functions list-executions --function-id=send-verification
```

## 📚 相關文檔

- [Appwrite Functions 官方文檔](https://appwrite.io/docs/functions)
- [Appwrite CLI 文檔](https://appwrite.io/docs/command-line)
- [Node.js Runtime 文檔](https://appwrite.io/docs/functions-develop#nodejs) 