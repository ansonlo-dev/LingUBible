# 🗂️ 項目結構優化建議

## 📋 當前問題分析

### `public/` 目錄問題
- 包含太多測試和調試文件
- 圖標文件和測試文件混在一起
- 缺乏清晰的分類

### 根目錄問題
- 重構文檔可以移到專門的目錄
- 空的 `api/` 目錄應該處理

## 🎯 優化建議

### 1. 重組 `public/` 目錄

```
public/
├── icons/              # 圖標文件
│   ├── favicon.ico
│   ├── favicon.svg
│   ├── favicon-32.png
│   ├── apple-touch-icon.png
│   ├── apple-touch-icon.svg
│   ├── icon-192.png
│   └── icon-512.png
├── assets/             # 靜態資源
│   ├── logo.svg
│   └── screenshots/    # PWA 截圖
├── manifest.json       # PWA manifest
├── manifest.js         # 動態 manifest
├── robots.txt          # SEO
└── dev/               # 開發和測試文件
    ├── debug-user-stats.html
    ├── reset-user-stats.html
    ├── test-user-stats.html
    ├── test-cookie-simple.html
    ├── test-cookie-language.html
    ├── test-pwa-install.html
    └── test-manifest.html
```

### 2. 創建 `tools/` 目錄

```
tools/
├── scripts/           # 自動化腳本
│   ├── build/
│   ├── docs/
│   └── refactor/
└── configs/           # 額外配置文件
    └── deployment/
```

### 3. 整理根目錄

```
根目錄/
├── docs/              # 文檔 (已組織好)
├── src/               # 源代碼 (已重構)
├── public/            # 靜態資源 (需重組)
├── functions/         # Appwrite 函數
├── tools/             # 工具和腳本 (新建)
├── .github/           # GitHub 配置
├── dist/              # 構建輸出
├── node_modules/      # 依賴
├── dev-dist/          # 開發構建
├── 配置文件...        # 各種配置文件
└── 項目文檔...        # README, LICENSE 等
```

## 🚀 實施步驟

### 步驟 1：重組 public 目錄
1. 創建子目錄結構
2. 移動文件到對應位置
3. 更新引用路徑

### 步驟 2：創建 tools 目錄
1. 移動 scripts 到 tools/scripts
2. 創建配置子目錄
3. 更新 package.json 腳本路徑

### 步驟 3：清理根目錄
1. 移動重構文檔到 docs/development/
2. 移除空的 api 目錄
3. 整理配置文件順序

## 📝 優化後的好處

1. **更清晰的結構**：每個目錄都有明確的用途
2. **更好的維護性**：相關文件組織在一起
3. **更專業的外觀**：減少根目錄的混亂
4. **更好的開發體驗**：測試文件分離，不影響生產 