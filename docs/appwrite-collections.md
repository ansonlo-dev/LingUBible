# Appwrite 數據庫集合配置

## 用戶頭像集合 (user_avatars)

### 集合信息
- **集合ID**: `user_avatars`
- **數據庫ID**: `lingubible`
- **描述**: 存儲用戶自定義頭像設置

### 屬性配置

| 屬性名 | 類型 | 大小 | 必需 | 數組 | 默認值 | 描述 |
|--------|------|------|------|------|--------|------|
| userId | String | 255 | ✅ | ❌ | - | 用戶ID，關聯到用戶帳戶 |
| animal | String | 10 | ✅ | ❌ | - | 選擇的動物emoji |
| backgroundIndex | Integer | - | ✅ | ❌ | 0 | 背景顏色索引 |
| createdAt | DateTime | - | ✅ | ❌ | - | 創建時間 |
| updatedAt | DateTime | - | ✅ | ❌ | - | 更新時間 |

### 索引配置

| 索引名 | 類型 | 屬性 | 排序 | 唯一 |
|--------|------|------|------|------|
| userId_index | key | userId | ASC | ✅ |
| createdAt_index | key | createdAt | DESC | ❌ |

### 權限設置

#### 文檔權限
- **創建**: `users` (任何已登入用戶)
- **讀取**: `user:[USER_ID]` (只有用戶本人可以讀取)
- **更新**: `user:[USER_ID]` (只有用戶本人可以更新)
- **刪除**: `user:[USER_ID]` (只有用戶本人可以刪除)

#### 集合權限
- **創建文檔**: `users`
- **讀取文檔**: `users`
- **更新文檔**: `users`
- **刪除文檔**: `users`

### 創建步驟

1. 登入 Appwrite 控制台
2. 選擇 `lingubible` 項目
3. 進入 `Databases` → `lingubible` 數據庫
4. 點擊 `Create Collection`
5. 設置集合ID為 `user_avatars`
6. 按照上述配置添加屬性
7. 設置索引
8. 配置權限

### 使用說明

這個集合用於存儲用戶的自定義頭像設置，包括：
- 選擇的動物角色
- 背景顏色索引
- 創建和更新時間

每個用戶只能有一個自定義頭像記錄，通過 userId 進行唯一標識。

### 安全考慮

- 每個用戶只能訪問自己的頭像設置
- 使用用戶級別的權限控制確保數據安全
- 通過索引優化查詢性能 