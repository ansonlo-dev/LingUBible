# PWA 安裝問題修復

## 問題描述

1. **Header 中的安裝圖標在路由切換後消失**
2. **原生 PWA 安裝提示沒有在右下角出現**

## 解決方案

### 1. 全局 PWA 狀態管理

創建了 `src/contexts/PWAContext.tsx` 來管理全局 PWA 狀態：

- 統一管理 `beforeinstallprompt` 事件
- 跨組件共享安裝狀態
- 避免路由切換時狀態丟失

### 2. 修復 Header 安裝圖標

更新了 `src/components/common/PWAInstallIcon.tsx`：

- 使用全局 PWA 上下文而不是本地狀態
- 確保圖標在路由切換後仍然可見
- 簡化了組件邏輯

### 3. 原生提示觸發器

創建了 `src/components/common/PWAPromptTrigger.tsx`：

- 監控用戶參與度
- 在適當時機觸發原生安裝提示
- 不阻止瀏覽器的原生行為

### 4. 應用結構更新

在 `src/App.tsx` 中：

- 添加了 `PWAProvider` 包裝整個應用
- 包含了 `PWAPromptTrigger` 組件
- 確保所有組件都能訪問 PWA 狀態

## 技術細節

### PWA Context 特性

```typescript
interface PWAContextType {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  canInstall: boolean;
  promptInstall: () => Promise<void>;
}
```

### 原生提示策略

1. **不阻止 `beforeinstallprompt` 事件**
   - 不調用 `e.preventDefault()`
   - 讓瀏覽器自然顯示提示

2. **用戶參與度追蹤**
   - 監聽點擊、滾動、鍵盤輸入
   - 達到閾值時準備觸發提示

3. **智能觸發時機**
   - 延遲觸發避免干擾用戶操作
   - 只在用戶活躍時顯示

## 測試方法

1. 訪問 `/pwa-test.html` 查看 PWA 狀態
2. 在不同頁面間導航，確認安裝圖標持續顯示
3. 與頁面互動，觀察原生安裝提示出現

## 瀏覽器支持

- ✅ Chrome/Edge: 完全支持原生提示
- ✅ Firefox: 支持手動安裝
- ✅ Safari: 支持添加到主屏幕
- ✅ 移動瀏覽器: 支持原生安裝體驗

## 注意事項

1. 原生提示的顯示時機由瀏覽器控制
2. 用戶參與度要求因瀏覽器而異
3. 已安裝的應用不會再顯示安裝提示
4. HTTPS 環境是必需的（localhost 除外） 