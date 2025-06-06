# Appwrite 用戶統計系統設置指南

## 📋 概述

要實現真正的多用戶在線狀態追蹤，您需要在 Appwrite 中設置以下數據庫結構。

## 🗄️ 數據庫設置

### 1. 創建數據庫

在 Appwrite 控制台中：

1. 進入 **Databases** 頁面
2. 點擊 **Create Database**
3. 設置數據庫 ID：`user-stats-db`
4. 設置數據庫名稱：`User Statistics Database`

### 2. 創建集合

#### 集合 1：用戶會話 (user-sessions)

**基本設置：**
- Collection ID: `user-sessions`
- Collection Name: `User Sessions`
- Permissions: 
  - Read: `users`
  - Create: `users`
  - Update: `users`
  - Delete: `users`

**屬性 (Attributes)：**

| 屬性名 | 類型 | 大小 | 必填 | 陣列 | 預設值 | 說明 |
|--------|------|------|------|------|--------|------|
| `userId` | String | 255 | ✅ | ❌ | - | 用戶 ID |
| `sessionId` | String | 255 | ✅ | ❌ | - | 會話 ID |
| `loginTime` | DateTime | - | ✅ | ❌ | - | 登入時間 |
| `lastPing` | DateTime | - | ✅ | ❌ | - | 最後 ping 時間 |
| `deviceInfo` | String | 1000 | ❌ | ❌ | - | 設備信息 |
| `ipAddress` | String | 45 | ❌ | ❌ | - | IP 地址 |

**索引 (Indexes)：**

| 索引名 | 類型 | 屬性 | 排序 |
|--------|------|------|------|
| `userId_index` | Key | `userId` | ASC |
| `sessionId_index` | Key | `sessionId` | ASC |
| `lastPing_index` | Key | `lastPing` | DESC |

#### 集合 2：統計數據 (user-stats)

**基本設置：**
- Collection ID: `user-stats`
- Collection Name: `User Statistics`
- Permissions:
  - Read: `users`
  - Create: `users`
  - Update: `users`
  - Delete: `users`

**屬性 (Attributes)：**

| 屬性名 | 類型 | 大小 | 必填 | 陣列 | 預設值 | 說明 |
|--------|------|------|------|------|--------|------|
| `totalUsers` | Integer | - | ✅ | ❌ | 0 | 總用戶數 |
| `todayLogins` | Integer | - | ✅ | ❌ | 0 | 今日登入數 |
| `thisMonthLogins` | Integer | - | ✅ | ❌ | 0 | 本月登入數 |
| `lastUpdated` | DateTime | - | ✅ | ❌ | - | 最後更新時間 |

#### 集合 3：已登入用戶 (logged-users)

**基本設置：**
- Collection ID: `logged-users`
- Collection Name: `Logged Users`
- Permissions:
  - Read: `users`
  - Create: `users`
  - Update: `users`
  - Delete: `users`

**屬性 (Attributes)：**

| 屬性名 | 類型 | 大小 | 必填 | 陣列 | 預設值 | 說明 |
|--------|------|------|------|------|--------|------|
| `userId` | String | 255 | ✅ | ❌ | - | 用戶 ID |
| `firstLogin` | DateTime | - | ✅ | ❌ | - | 首次登入時間 |

**索引 (Indexes)：**

| 索引名 | 類型 | 屬性 | 排序 |
|--------|------|------|------|
| `userId_unique` | Unique | `userId` | ASC |

## 🔧 環境變數設置

確保您的 `.env` 文件包含正確的 Appwrite 配置：

```env
VITE_APPWRITE_ENDPOINT=https://your-appwrite-endpoint
VITE_APPWRITE_PROJECT_ID=your-project-id
```

## 🚀 啟用新系統

### 1. 更新 useUserStats Hook

修改 `src/hooks/useUserStats.ts`：

```typescript
// 替換導入
import AppwriteUserStatsService from "@/services/api/appwriteUserStats";

export function useUserStats() {
  // 使用 Appwrite 版本
  const userStatsService = AppwriteUserStatsService.getInstance();
  
  // 其他代碼保持不變...
}
```

### 2. 更新 App.tsx

修改 ping 系統配置：

```typescript
// 在 AppContent 組件中
usePingSystem({
  enabled: true,
  pingInterval: 60 * 1000, // 每 60 秒 ping 一次
  activityEvents: ['click', 'keydown', 'scroll', 'mousemove', 'touchstart']
});
```

## 📊 工作原理

### 數據流程：

```
用戶 A 登入 → Appwrite 數據庫 ← 用戶 B 登入
     ↓                ↓                ↓
   Ping A         統計服務          Ping B
     ↓                ↓                ↓
所有用戶都能看到 → 實時在線數量 ← 所有用戶都能看到
```

### Ping 機制：

1. **用戶登入**：在 `user-sessions` 集合中創建記錄
2. **定期 Ping**：每 60 秒更新 `lastPing` 時間
3. **清理過期**：刪除 2 分鐘無 ping 的會話
4. **統計計算**：實時計算在線用戶數

## 🔍 測試驗證

### 1. 多設備測試

1. 在不同設備/瀏覽器中打開應用
2. 分別登入不同帳戶
3. 查看 Footer 中的在線用戶數是否正確增加

### 2. Ping 測試

1. 打開瀏覽器開發者工具
2. 查看 Network 標籤
3. 確認每 60 秒有 Appwrite API 請求

### 3. 超時測試

1. 登入後關閉瀏覽器
2. 等待 2 分鐘
3. 在其他設備查看在線數量是否減少

## 🛠️ 故障排除

### 常見問題：

1. **權限錯誤**：確保集合權限設置正確
2. **網路錯誤**：檢查 Appwrite 端點配置
3. **數據不同步**：確認索引設置正確

### 調試工具：

使用 `/dev/test-ping-system.html` 頁面進行詳細測試和調試。

## 📈 性能優化

### 建議：

1. **批量清理**：定期批量刪除過期會話
2. **索引優化**：確保查詢使用正確的索引
3. **緩存策略**：考慮在前端緩存統計數據

### 監控：

在 Appwrite 控制台監控：
- 數據庫使用量
- API 請求頻率
- 錯誤日誌

## 🎯 完成後的效果

✅ **真正的多用戶在線狀態追蹤**
✅ **跨設備同步**
✅ **實時更新**
✅ **準確的統計數據**
✅ **自動清理過期會話**

現在您的應用將能夠準確顯示所有用戶的在線狀態！ 