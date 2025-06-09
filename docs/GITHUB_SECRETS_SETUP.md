# GitHub Secrets 設置指南

## 問題背景

GitHub Actions 中的 Appwrite 函數部署失敗，錯誤訊息：
```
✗ Error: endpoint.startsWith is not a function
```

這個錯誤表示 GitHub Secrets 中的環境變數沒有正確設置。

## 解決方案

需要在 GitHub 儲存庫中設置以下 Secrets：

### 1. 進入 GitHub Secrets 設置

1. 進入你的 GitHub 儲存庫
2. 點擊 **Settings** 標籤
3. 在左側選單中點擊 **Secrets and variables** > **Actions**
4. 點擊 **New repository secret**

### 2. 設置必要的 Secrets

#### APPWRITE_ENDPOINT
- **Name**: `APPWRITE_ENDPOINT`
- **Value**: `https://fra.cloud.appwrite.io/v1`
- **說明**: Appwrite 服務器端點

#### APPWRITE_EMAIL
- **Name**: `APPWRITE_EMAIL`
- **Value**: 你的 Appwrite 帳號電子郵件
- **說明**: 用於登入 Appwrite 的電子郵件

#### APPWRITE_PASSWORD
- **Name**: `APPWRITE_PASSWORD`
- **Value**: 你的 Appwrite 帳號密碼
- **說明**: 用於登入 Appwrite 的密碼

#### APPWRITE_PROJECT_ID
- **Name**: `APPWRITE_PROJECT_ID`
- **Value**: `lingubible`
- **說明**: Appwrite 項目 ID

### 3. 驗證設置

設置完成後，你的 Secrets 列表應該包含：

```
✅ APPWRITE_ENDPOINT
✅ APPWRITE_EMAIL  
✅ APPWRITE_PASSWORD
✅ APPWRITE_PROJECT_ID
```

### 4. 觸發重新部署

設置完 Secrets 後：

1. 推送任何變更到 `main` 或 `master` 分支
2. 或者手動觸發 GitHub Actions
3. 檢查 Actions 標籤中的部署狀態

## 安全注意事項

### ⚠️ 重要提醒

1. **永遠不要**在代碼中硬編碼密碼或 API 密鑰
2. **定期更換**密碼和 API 密鑰
3. **使用最小權限原則**，只給予必要的權限
4. **監控**部署日誌，確保沒有敏感信息洩露

### 🔒 最佳實踐

1. **使用 API 密鑰**（推薦）：
   - 在 Appwrite 控制台創建 API 密鑰
   - 使用 API 密鑰代替用戶密碼
   - 設置適當的權限範圍

2. **環境隔離**：
   - 為不同環境（開發、測試、生產）使用不同的 Secrets
   - 使用不同的 Appwrite 項目

## 替代方案：使用 API 密鑰

### 創建 API 密鑰

1. 進入 Appwrite 控制台
2. 選擇你的項目
3. 進入 **Overview** > **Integrations** > **API Keys**
4. 點擊 **Create API Key**
5. 設置以下參數：
   - **Name**: `GitHub Actions Deploy Key`
   - **Expiration**: 設置適當的過期時間
   - **Scopes**: 選擇 `functions.write`

### 更新 GitHub Actions

如果使用 API 密鑰，可以簡化登入流程：

```yaml
- name: Login to Appwrite with API Key
  run: |
    appwrite client \
      --endpoint "${{ secrets.APPWRITE_ENDPOINT }}" \
      --project-id "${{ secrets.APPWRITE_PROJECT_ID }}" \
      --key "${{ secrets.APPWRITE_API_KEY }}"
```

並添加新的 Secret：
- **Name**: `APPWRITE_API_KEY`
- **Value**: 你創建的 API 密鑰

## 故障排除

### 常見錯誤

1. **endpoint.startsWith is not a function**
   - 原因：`APPWRITE_ENDPOINT` 未設置或為空
   - 解決：檢查 Secret 名稱和值

2. **Authentication failed**
   - 原因：電子郵件或密碼錯誤
   - 解決：驗證 `APPWRITE_EMAIL` 和 `APPWRITE_PASSWORD`

3. **Project not found**
   - 原因：項目 ID 錯誤
   - 解決：檢查 `APPWRITE_PROJECT_ID` 是否為 `lingubible`

### 調試步驟

1. **檢查 Secrets 設置**：
   ```bash
   # 在 GitHub Actions 中添加調試步驟
   - name: Debug environment
     run: |
       echo "Endpoint length: ${#APPWRITE_ENDPOINT}"
       echo "Email length: ${#APPWRITE_EMAIL}"
       # 不要輸出實際值！
   ```

2. **本地測試**：
   ```bash
   # 在本地測試相同的命令
   appwrite login \
     --endpoint "https://fra.cloud.appwrite.io/v1" \
     --email "your-email@example.com" \
     --password "your-password"
   ```

3. **檢查 CLI 版本**：
   ```bash
   # 確保使用最新版本的 Appwrite CLI
   bun install -g appwrite-cli@latest
   appwrite --version
   ```

## 相關文檔

- [GitHub Secrets 官方文檔](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Appwrite CLI 文檔](https://appwrite.io/docs/command-line)
- [Appwrite API 密鑰文檔](https://appwrite.io/docs/keys) 