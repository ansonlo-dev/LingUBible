#!/bin/bash

# 部署 Appwrite 函數的腳本
# 使用方法: ./scripts/deploy-appwrite-function.sh

echo "🚀 開始部署 Appwrite 函數..."

# 檢查是否安裝了 Appwrite CLI
if ! command -v appwrite &> /dev/null; then
    echo "❌ Appwrite CLI 未安裝"
    echo "請先安裝 Appwrite CLI: npm install -g appwrite-cli"
    exit 1
fi

# 檢查是否已登入
if ! appwrite client --version &> /dev/null; then
    echo "❌ 請先登入 Appwrite CLI"
    echo "運行: appwrite login"
    exit 1
fi

# 進入 appwrite 目錄
cd appwrite

# 部署函數
echo "📦 部署 get-user-stats 函數..."
appwrite functions createDeployment \
    --functionId=get-user-stats \
    --entrypoint="src/main.js" \
    --code="./functions/get-user-stats"

if [ $? -eq 0 ]; then
    echo "✅ 函數部署成功！"
    echo ""
    echo "📋 接下來的步驟："
    echo "1. 在 Appwrite 控制台中設置 API 密鑰環境變數 APPWRITE_API_KEY"
    echo "2. 確保函數有適當的執行權限"
    echo "3. 測試函數是否正常工作"
else
    echo "❌ 函數部署失敗"
    exit 1
fi 