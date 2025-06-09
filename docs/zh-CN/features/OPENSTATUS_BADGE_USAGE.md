# OpenStatus 官方套件使用說明

## 概述

我們已經為您的專案整合了 [OpenStatus 官方 React 套件](https://docs.openstatus.dev/tools/react/)，這是一個由 OpenStatus 團隊維護的官方組件，可以顯示您服務的即時狀態。

## 功能特點

- ✅ **官方支援**: 使用 OpenStatus 官方維護的 React 套件
- 🎨 **原生設計**: 完全符合 OpenStatus 官方設計規範
- 🌙 **深色模式支援**: 自動適應明暗主題
- ⚡ **自動更新**: 每5分鐘自動檢查一次狀態
- 🔄 **完整狀態支援**: 支援所有 OpenStatus 狀態類型
- 🌐 **直接連結**: 點擊可直接跳轉到您的 OpenStatus 狀態頁面

## 狀態類型

根據 [OpenStatus 官方文檔](https://docs.openstatus.dev/tools/react/)，支援以下狀態：

| 狀態 | 顏色 | 說明 |
|------|------|------|
| operational | 綠色 | 服務正常運行 |
| degraded_performance | 黃色 | 服務性能下降 |
| partial_outage | 紅色 | 部分服務中斷 |
| major_outage | 紅色 | 主要服務中斷 |
| under_maintenance | 藍色 | 維護中 |
| incident | 橙色 | 發生事件 |
| unknown | 灰色 | 狀態未知 |

## 安裝

套件已經安裝在您的專案中：

```bash
bun install @openstatus/react
```

## 使用方法

### 基本用法

```tsx
import { OpenStatusWidget } from '@/components/OpenStatusWidget';

// 使用 OpenStatus slug
<OpenStatusWidget slug="your-status-slug" />

// 自定義連結 URL
<OpenStatusWidget 
  slug="your-status-slug" 
  href="https://status.yoursite.com" 
/>

// 添加自定義樣式
<OpenStatusWidget 
  slug="your-status-slug" 
  className="ml-4" 
/>
```

### 在 Footer 中的實現

徽章已經被添加到 Footer 組件中：

```tsx
// 桌面版和手機版
<OpenStatusWidget slug="status" href="https://www.openstatus.dev/" />
```

## 設定您的 OpenStatus 監控

### 1. 創建 OpenStatus 帳戶

1. 前往 [OpenStatus.dev](https://www.openstatus.dev/)
2. 註冊帳戶
3. 創建您的第一個監控

### 2. 設定監控

1. 在 OpenStatus 儀表板中點擊 "Create Monitor"
2. 輸入您要監控的 URL
3. 設定檢查頻率和位置
4. 保存監控設定

### 3. 創建狀態頁面

1. 在儀表板中點擊 "Status Page"
2. 創建您的狀態頁面
3. 選擇要顯示的監控項目
4. 獲取您的狀態頁面 slug

### 4. 更新組件

在 `src/components/Footer.tsx` 中更新 slug：

```tsx
<OpenStatusWidget 
  slug="your-actual-slug" 
  href="https://your-slug.openstatus.dev" 
/>
```

## 自定義配置

### 更改 OpenStatus Slug

在 `src/components/Footer.tsx` 中修改 `slug` 屬性：

```tsx
<OpenStatusWidget slug="your-status-page-slug" />
```

### 自定義連結

```tsx
<OpenStatusWidget 
  slug="your-slug" 
  href="https://status.yoursite.com" 
/>
```

### 調整檢查頻率

在 `src/components/OpenStatusWidget.tsx` 中修改檢查間隔：

```tsx
// 目前是每5分鐘檢查一次
const interval = setInterval(fetchStatus, 5 * 60 * 1000);

// 改為每分鐘檢查一次
const interval = setInterval(fetchStatus, 60 * 1000);
```

## 技術實現

### OpenStatus API 整合

我們的組件使用 OpenStatus 官方提供的 `getStatus` 函數：

```tsx
import { getStatus } from "@openstatus/react";

const response = await getStatus("your-slug");
// response.status 包含當前狀態
```

### 狀態映射

組件會自動將 OpenStatus 的狀態映射到適當的視覺樣式：

- `operational` → 綠色徽章
- `degraded_performance` → 黃色徽章  
- `partial_outage` / `major_outage` → 紅色徽章
- `under_maintenance` → 藍色徽章
- `incident` → 橙色徽章
- `unknown` → 灰色徽章

## 樣式自定義

徽章使用 Tailwind CSS 類別，您可以通過 `className` 屬性添加自定義樣式：

```tsx
<OpenStatusWidget 
  slug="your-slug"
  className="shadow-lg border-2" 
/>
```

## 進階用法

### 多服務監控

您可以創建多個徽章來監控不同的服務：

```tsx
<div className="flex gap-2">
  <OpenStatusWidget slug="api-status" />
  <OpenStatusWidget slug="cdn-status" />
  <OpenStatusWidget slug="database-status" />
</div>
```

### 自定義狀態頁面

如果您有自己的狀態頁面域名：

```tsx
<OpenStatusWidget 
  slug="your-slug" 
  href="https://status.yourcompany.com" 
/>
```

## 故障排除

### 常見問題

1. **徽章顯示 "Unknown"**
   - 檢查 slug 是否正確
   - 確認 OpenStatus 狀態頁面是否公開
   - 檢查網路連接

2. **無法載入狀態**
   - 確認 OpenStatus 服務正常運行
   - 檢查瀏覽器控制台是否有錯誤
   - 驗證 API 請求是否成功

3. **樣式問題**
   - 確認 Tailwind CSS 配置包含 OpenStatus 套件路徑
   - 檢查是否有樣式衝突

## Tailwind CSS 配置

確保您的 `tailwind.config.ts` 包含 OpenStatus 套件：

```typescript
export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "./node_modules/@openstatus/react/**/*.{js,ts,jsx,tsx}",
  ],
  // ... 其他配置
}
```

## 相關資源

- [OpenStatus 官方文檔](https://docs.openstatus.dev/)
- [React 套件文檔](https://docs.openstatus.dev/tools/react/)
- [OpenStatus GitHub](https://github.com/openstatusHQ/openstatus)
- [狀態頁面範例](https://www.openstatus.dev/)

## 致謝

此實作使用 [OpenStatus](https://www.openstatus.dev/) 官方 React 套件，感謝 OpenStatus 團隊提供優秀的開源監控平台。 