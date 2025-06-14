# 開發模式控制

## 概述

本應用支援通過環境變數控制開發模式功能，包括測試頁面、開發工具等。這確保了生產環境的安全性和穩定性。

## 環境變數配置

### VITE_DEV_MODE

控制開發模式的主要開關。

**設置方式**：
在 `.env` 文件中設置：

```env
# 啟用開發模式
VITE_DEV_MODE=true

# 禁用開發模式
VITE_DEV_MODE=false
```

**預設值**：`false`（未設置時預設為禁用）

## 受影響的功能

### 1. 測試頁面路由

當 `VITE_DEV_MODE=false` 時：
- `/email-preview` - 郵件模板預覽頁面會被禁用
- 直接訪問會自動重定向到首頁

### 2. 側邊欄開發工具

當 `VITE_DEV_MODE=false` 時：
- 側邊欄中的「開發工具」區域會被隱藏
- 包括「郵件預覽」等開發專用連結

### 3. 註冊郵件限制

當 `VITE_DEV_MODE=false` 時：
- 只允許 `@ln.edu.hk` 和 `@ln.hk` 郵件地址註冊
- 禁用一次性郵件和測試郵件地址

當 `VITE_DEV_MODE=true` 時：
- 允許任何有效格式的郵件地址註冊
- 支援一次性郵件服務（如 10minutemail.com）

## 技術實現

### 配置檢查

應用使用統一的配置檢查：

```typescript
import { APP_CONFIG } from '@/utils/constants/config';

// 檢查開發模式是否啟用
const isDevModeEnabled = APP_CONFIG.DEV_MODE.ENABLED;
```

### 路由保護

使用 `DevModeRoute` 組件保護開發專用路由：

```tsx
import { DevModeRoute } from '@/components/dev/DevModeRoute';

<Route 
  path="/email-preview" 
  element={
    <DevModeRoute>
      <EmailPreview />
    </DevModeRoute>
  } 
/>
```

### 條件渲染

在組件中使用條件渲染：

```tsx
{APP_CONFIG.DEV_MODE.ENABLED && (
  <div>開發模式專用內容</div>
)}
```

## 部署建議

### 開發環境

```env
VITE_DEV_MODE=true
```

- 啟用所有開發工具
- 允許測試郵件地址
- 顯示開發專用功能

### 測試環境

```env
VITE_DEV_MODE=false
```

- 模擬生產環境行為
- 測試安全限制
- 驗證功能完整性

### 生產環境

```env
VITE_DEV_MODE=false
```

- **必須**設置為 `false`
- 確保安全性和穩定性
- 隱藏所有開發工具

## 安全考量

### 1. 環境變數驗證

- 只有字串 `'true'` 才會啟用開發模式
- 任何其他值（包括 `undefined`）都會禁用
- 嚴格的布林檢查：`=== 'true'`

### 2. 路由保護

- 使用 React Router 的 `Navigate` 組件重定向
- 自動重定向到安全頁面（預設為首頁）
- 不會暴露敏感的開發工具

### 3. 生產環境檢查

在部署前確認：
- [ ] `.env` 文件中 `VITE_DEV_MODE=false`
- [ ] 構建過程中沒有開發模式警告
- [ ] 測試頁面無法訪問
- [ ] 側邊欄沒有開發工具連結

## 故障排除

### 問題：開發工具不顯示

**解決方案**：
1. 檢查 `.env` 文件中 `VITE_DEV_MODE=true`
2. 重新啟動開發服務器
3. 清除瀏覽器快取

### 問題：生產環境仍顯示開發工具

**解決方案**：
1. 確認 `.env` 文件中 `VITE_DEV_MODE=false`
2. 重新構建應用：`bun run build`
3. 檢查部署環境的環境變數設置

### 問題：測試頁面訪問被拒絕

**解決方案**：
1. 確認開發模式已啟用
2. 檢查路由配置是否正確
3. 查看瀏覽器控制台錯誤訊息

## 最佳實踐

### 1. 環境分離

- 開發：`VITE_DEV_MODE=true`
- 測試：`VITE_DEV_MODE=false`
- 生產：`VITE_DEV_MODE=false`

### 2. 代碼組織

- 將開發專用組件放在 `src/components/dev/` 目錄
- 使用統一的配置檢查方式
- 添加適當的註釋說明

### 3. 文檔維護

- 記錄所有受開發模式影響的功能
- 更新部署檢查清單
- 保持文檔與代碼同步

## 相關文件

- `src/config/devMode.ts` - 開發模式配置
- `src/utils/constants/config.ts` - 應用配置常數
- `src/components/dev/DevModeRoute.tsx` - 路由保護組件
- `docs/features/email-preview.md` - 郵件預覽工具文檔 