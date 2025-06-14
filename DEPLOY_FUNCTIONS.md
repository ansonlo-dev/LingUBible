# Appwrite Functions Deployment Scripts

這些腳本用於解決 Appwrite 函數 VCS 部署大小過大的問題（從 180MB+ 減少到幾 MB）。

## 問題背景

- **VCS 部署問題**：函數與 Git 倉庫連接斷開，導致部署包含整個專案的前端依賴項
- **部署大小過大**：每個函數部署大小超過 180MB（包含 501 個不必要的包）
- **構建時間過長**：每次部署需要 50+ 秒

## 解決方案

使用 CLI 部署替代 VCS 部署，只包含函數所需的依賴項。

## 可用腳本

### 1. `deploy-functions.sh` - 完整版本

功能豐富的部署腳本，包含：
- ✅ 錯誤檢查和驗證
- ✅ 彩色輸出和進度顯示
- ✅ 部署統計和摘要
- ✅ 失敗處理和報告
- ✅ 可選的狀態檢查

```bash
# 使用方法
./deploy-functions.sh
```

### 2. `deploy-functions-simple.sh` - 簡化版本

快速部署腳本，適合日常使用：
- ✅ 快速執行
- ✅ 簡潔輸出
- ✅ 一鍵部署所有函數

```bash
# 使用方法
./deploy-functions-simple.sh
```

## 部署結果對比

| 函數 | VCS 部署 | CLI 部署 | 改善 |
|------|----------|----------|------|
| send-verification-email | 183MB | 8.3MB | 95.5% ↓ |
| cleanup-expired-codes | 183MB | 0.6MB | 99.7% ↓ |
| get-user-stats | 183MB | 0.6MB | 99.7% ↓ |

## 手動部署單個函數

如果需要單獨部署某個函數：

```bash
# 部署驗證郵件函數
appwrite functions create-deployment \
  --function-id=send-verification-email \
  --code=functions/send-verification-email \
  --activate=true

# 部署清理過期代碼函數
appwrite functions create-deployment \
  --function-id=cleanup-expired-codes \
  --code=functions/cleanup-expired-codes \
  --activate=true

# 部署用戶統計函數
appwrite functions create-deployment \
  --function-id=get-user-stats \
  --code=functions/get-user-stats \
  --activate=true
```

## 檢查函數狀態

```bash
# 列出所有函數
appwrite functions list

# 檢查特定函數
appwrite functions get --function-id=send-verification-email
```

## 前置要求

1. **Appwrite CLI**：確保已安裝並配置
   ```bash
   npm install -g appwrite-cli
   appwrite login
   ```

2. **專案結構**：腳本需要在專案根目錄執行
   ```
   LingUBible/
   ├── functions/
   │   ├── send-verification-email/
   │   ├── cleanup-expired-codes/
   │   └── get-user-stats/
   ├── deploy-functions.sh
   └── deploy-functions-simple.sh
   ```

## 故障排除

### 常見問題

1. **權限錯誤**
   ```bash
   chmod +x deploy-functions.sh
   chmod +x deploy-functions-simple.sh
   ```

2. **Appwrite CLI 未安裝**
   ```bash
   npm install -g appwrite-cli
   ```

3. **未登入 Appwrite**
   ```bash
   appwrite login
   ```

4. **函數目錄不存在**
   - 確保在專案根目錄執行腳本
   - 檢查 `functions/` 目錄是否存在

### 部署失敗處理

如果某個函數部署失敗：
1. 檢查函數目錄是否存在
2. 確認 `package.json` 文件存在
3. 檢查 Appwrite CLI 連接狀態
4. 查看詳細錯誤訊息

## 優勢

- 🚀 **快速部署**：幾秒鐘完成部署
- 📦 **小體積**：只包含必要依賴項
- 💰 **節省成本**：減少存儲和傳輸成本
- 🔧 **易於維護**：簡單的 CLI 命令
- 📊 **清晰反饋**：詳細的部署狀態和統計

## 注意事項

- 這些腳本使用 CLI 部署，不會自動從 Git 更新
- 如需自動部署，需要重新配置 VCS 連接
- 建議在部署前測試函數功能
- 定期檢查函數運行狀態 