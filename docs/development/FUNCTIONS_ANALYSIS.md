# 🔧 Appwrite 函數使用狀況分析

## 📋 概述

本文檔分析 Campus Comment Verse 項目中 Appwrite 雲函數的使用狀況，幫助識別哪些函數正在使用，哪些可能是未使用的。

## 📁 函數目錄結構

```
functions/
├── 📧 send-verification-email/     # ✅ 正在使用
├── 🧹 cleanup-expired-codes/       # ✅ 正在使用 (定時任務)
├── 📮 send-contact-email/          # ❌ 未使用
└── 🔍 verify-student-code/         # ❌ 未完整實現
```

## 📊 函數使用狀況詳細分析

### ✅ 正在使用的函數

#### 1. `send-verification-email`
- **狀態**: ✅ 活躍使用
- **配置**: 已在 `appwrite.json` 中定義
- **部署**: 已部署到 Appwrite Console
- **用途**: 發送學生郵箱驗證碼
- **調用位置**:
  - `src/services/external/studentVerification.ts` (2 處)
  - `src/services/api/auth.ts` (1 處)
- **執行方式**: 手動觸發 (API 調用)

#### 2. `cleanup-expired-codes`
- **狀態**: ✅ 活躍使用
- **配置**: 已在 `appwrite.json` 中定義
- **部署**: 已部署到 Appwrite Console
- **用途**: 清理過期的驗證碼
- **調用位置**: 無直接調用 (定時任務)
- **執行方式**: 定時執行 (`0 */6 * * *` - 每 6 小時)

### ❌ 未使用的函數

#### 3. `send-contact-email`
- **狀態**: ❌ 未使用
- **配置**: 未在 `appwrite.json` 中定義
- **部署**: 未部署
- **用途**: 發送聯繫表單郵件
- **調用位置**: 無
- **問題**: 
  - 代碼已實現但未配置
  - 項目中沒有聯繫表單功能
  - 可能是計劃中的功能

#### 4. `verify-student-code`
- **狀態**: ❌ 未完整實現
- **配置**: 未在 `appwrite.json` 中定義
- **部署**: 未部署
- **用途**: 驗證學生代碼 (推測)
- **調用位置**: 無
- **問題**:
  - 目錄存在但無 `main.js` 文件
  - 功能未實現
  - 可能是早期開發時的殘留

## 🎯 建議操作

### 🧹 清理建議

#### 立即清理
1. **刪除 `verify-student-code` 目錄**
   ```bash
   rm -rf functions/verify-student-code/
   ```
   - 原因: 未實現且無實際用途

#### 考慮保留
2. **`send-contact-email` 函數**
   - 如果計劃添加聯繫表單功能，可以保留
   - 如果不需要，建議刪除
   - 代碼已完整實現，可隨時啟用

### 📝 配置更新

如果決定啟用 `send-contact-email`，需要：

1. **更新 `appwrite.json`**
   ```json
   {
     "$id": "send-contact-email",
     "execute": ["any"],
     "name": "Send Contact Email",
     "enabled": true,
     "logging": true,
     "runtime": "node-18.0",
     "scopes": [],
     "events": [],
     "schedule": "",
     "timeout": 15,
     "entrypoint": "src/main.js",
     "commands": "npm install",
     "specification": "s-0.5vcpu-512mb",
     "path": "functions/send-contact-email"
   }
   ```

2. **部署函數**
   ```bash
   appwrite deploy function
   ```

3. **添加前端調用代碼**

## 🔍 Appwrite Console 顯示分析

### 為什麼只看到 2 個函數？

根據分析，Appwrite Console 只顯示 2 個函數是正確的：

1. **`send-verification-email`** - 已配置並部署
2. **`cleanup-expired-codes`** - 已配置並部署

另外 2 個函數目錄：
- **`send-contact-email`** - 未在 `appwrite.json` 中配置
- **`verify-student-code`** - 未實現且未配置

### 📊 函數狀態總結

| 函數名稱 | 本地目錄 | appwrite.json | Console 顯示 | 實際使用 |
|:---|:---:|:---:|:---:|:---:|
| send-verification-email | ✅ | ✅ | ✅ | ✅ |
| cleanup-expired-codes | ✅ | ✅ | ✅ | ✅ |
| send-contact-email | ✅ | ❌ | ❌ | ❌ |
| verify-student-code | ✅ | ❌ | ❌ | ❌ |

## 🚀 優化建議

### 1. 立即執行
- 刪除 `verify-student-code` 目錄
- 決定是否保留 `send-contact-email`

### 2. 功能規劃
如果需要聯繫表單功能：
- 完善 `send-contact-email` 配置
- 添加前端聯繫表單頁面
- 部署並測試功能

### 3. 文檔更新
- 更新項目文檔中的函數說明
- 記錄函數的用途和調用方式

## 📝 清理腳本

創建一個清理腳本來移除未使用的函數：

```bash
#!/bin/bash
# 清理未使用的 Appwrite 函數

echo "🧹 清理未使用的 Appwrite 函數..."

# 刪除未實現的函數
if [ -d "functions/verify-student-code" ]; then
    echo "❌ 刪除 verify-student-code (未實現)"
    rm -rf functions/verify-student-code/
fi

# 詢問是否刪除 send-contact-email
if [ -d "functions/send-contact-email" ]; then
    read -p "❓ 是否刪除 send-contact-email? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 刪除 send-contact-email"
        rm -rf functions/send-contact-email/
    else
        echo "✅ 保留 send-contact-email"
    fi
fi

echo "✅ 清理完成！"
```

## 🎯 結論

**當前狀況是正常的** - Appwrite Console 只顯示 2 個函數是正確的，因為只有這 2 個函數被正確配置和部署。其他 2 個函數目錄是未使用或未完整實現的代碼，可以安全地清理。 