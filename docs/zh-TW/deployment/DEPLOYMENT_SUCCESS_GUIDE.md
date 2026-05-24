# 🎉 Appwrite 函數自動部署成功設置指南

## ✅ 問題解決總結

### 原始問題
```
Unable to move function with spacesmv: can't rename ''/tmp/builds/68407df9265600a76a69/code/functions/Send Verification Email'': No such file or directory
```

### 解決方案
**問題根因**: Appwrite 不支援包含空格的目錄名稱

**解決步驟**:
1. 重命名所有函數目錄，移除空格並使用連字符
2. 更新 `appwrite.json` 配置文件中的路徑
3. 使用正確的 CLI 命令進行部署

## 📁 目錄結構更改

### 之前（有問題）
```
functions/
├── Send Verification Email/
├── Verify Student Code/
└── Cleanup Expired Codes/
```

### 之後（已修復）
```
functions/
├── send-verification-email/
├── verify-student-code/
└── cleanup-expired-codes/
```

## 🔧 配置更新

### appwrite.json 更新
```json
{
  "functions": [
    {
      "$id": "send-verification",
      "name": "Send Verification Email",
      "path": "functions/send-verification-email"  // 更新為新路徑
    }
  ]
}
```

### GitHub Actions 工作流程更新
```yaml
- name: Deploy Functions
  run: |
    appwrite push functions --function-id send-verification --async
```

## 🚀 部署方法

### 方法 1: 使用 Appwrite Console Git 集成（推薦）

**設置步驟**:
1. 登入 Appwrite Console
2. 進入 Functions → Send Verification Email
3. Settings → Configuration → Git settings
4. 點擊 "Connect Git"
5. 選擇 GitHub 並授權
6. 配置設置：
   - Repository: `ansonlo-dev/LingUBible`
   - Production Branch: `main`
   - Root Directory: `functions/send-verification-email`
   - Entry Point: `src/main.js`

**優點**:
- ✅ 自動觸發部署
- ✅ 無需額外配置
- ✅ 官方支援
- ✅ 更安全（無需存儲密碼）

### 方法 2: 使用 GitHub Actions

**設置 GitHub Secrets**:
```
APPWRITE_ENDPOINT: https://sgp.cloud.appwrite.io/v1
APPWRITE_EMAIL: [您的郵箱]
APPWRITE_PASSWORD: [您的密碼]
```

**優點**:
- ✅ 更多控制
- ✅ 可以添加測試步驟
- ✅ 支援複雜工作流程

### 方法 3: 手動 CLI 部署

```bash
# 登入
appwrite login

# 部署函數
appwrite push functions --function-id send-verification
```

## 📋 部署驗證清單

- [x] 函數目錄名稱不包含空格
- [x] `appwrite.json` 路徑已更新
- [x] 函數代碼結構正確
- [x] 依賴項配置完整
- [x] CLI 命令測試成功
- [x] GitHub Actions 工作流程已更新

## 🔍 故障排除

### 常見問題及解決方案

1. **目錄名稱包含空格**
   - ❌ 問題: `functions/Send Verification Email/`
   - ✅ 解決: `functions/send-verification-email/`

2. **CLI 命令過時**
   - ❌ 問題: `appwrite deploy function --functionId`
   - ✅ 解決: `appwrite push functions --function-id`

3. **路徑配置錯誤**
   - 確保 `appwrite.json` 中的 `path` 與實際目錄結構一致

## 🎯 下一步建議

1. **設置 Git 集成**: 在 Appwrite Console 中連接 GitHub
2. **測試自動部署**: 修改函數代碼並推送到 main 分支
3. **監控部署**: 在 Console 中查看部署狀態和日誌
4. **設置環境變數**: 確保所有必要的環境變數已配置

## 📚 相關文檔

- [Appwrite Functions 文檔](https://appwrite.io/docs/products/functions)
- [Git 部署指南](https://appwrite.io/docs/products/functions/deploy-from-git)
- [CLI 參考](https://appwrite.io/docs/tooling/command-line)

---

**狀態**: ✅ 部署成功  
**最後更新**: $(date)  
**函數 ID**: send-verification  
**部署方法**: CLI 手動部署 + GitHub Actions 準備就緒 