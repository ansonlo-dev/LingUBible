#!/bin/bash

# 重新創建 Appwrite 函數以使用 Bun 運行時
# 使用方法: ./scripts/recreate-functions.sh

echo "🚀 開始重新創建 Appwrite 函數以使用 Bun 運行時..."

# 檢查是否安裝了 Appwrite CLI
if ! command -v appwrite &> /dev/null; then
    echo "❌ Appwrite CLI 未安裝"
    echo "請先安裝 Appwrite CLI: bun install -g appwrite-cli"
    exit 1
fi

# 檢查是否已登入
if ! appwrite client --version &> /dev/null; then
    echo "❌ 請先登入 Appwrite CLI"
    echo "運行: appwrite login"
    exit 1
fi

# 確保在項目根目錄
if [ ! -f "appwrite.json" ]; then
    echo "❌ 請在項目根目錄運行此腳本"
    exit 1
fi

# 清理函數
echo "🧹 清理函數..."
./scripts/clean-functions.sh

echo ""
echo "⚠️  重要提示："
echo "1. 您需要在 Appwrite 控制台中手動刪除現有的函數"
echo "2. 然後運行以下命令重新創建函數："
echo ""

echo "📦 重新部署所有函數："
echo "appwrite push functions"
echo ""

echo "或者單獨部署每個函數："
echo ""

echo "# 1. Send Verification Email 函數"
echo "appwrite functions create-deployment \\"
echo "    --function-id=send-verification \\"
echo "    --entrypoint=\"src/main.js\" \\"
echo "    --code=\"functions/send-verification-email\" \\"
echo "    --activate=true"
echo ""

echo "# 2. Cleanup Expired Codes 函數"
echo "appwrite functions create-deployment \\"
echo "    --function-id=cleanup-expired-codes \\"
echo "    --entrypoint=\"src/main.js\" \\"
echo "    --code=\"functions/cleanup-expired-codes\" \\"
echo "    --activate=true"
echo ""

echo "# 3. Get User Stats 函數"
echo "appwrite functions create-deployment \\"
echo "    --function-id=get-user-stats \\"
echo "    --entrypoint=\"src/main.js\" \\"
echo "    --code=\"functions/get-user-stats\" \\"
echo "    --activate=true"
echo ""

echo "📋 函數配置摘要："
echo "- 運行時: bun-1.1"
echo "- 構建命令: bun install"
echo "- 入口點: src/main.js"
echo ""

echo "🔧 如果您想要自動重新創建函數，請確認以下步驟："
echo "1. 在 Appwrite 控制台中刪除現有函數"
echo "2. 運行: appwrite push functions"
echo ""

read -p "是否要嘗試自動部署函數？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 開始部署函數..."
    appwrite push functions
    
    if [ $? -eq 0 ]; then
        echo "✅ 函數部署成功！"
        echo ""
        echo "📋 接下來的步驟："
        echo "1. 在 Appwrite 控制台中檢查函數是否使用 Bun 1.1 運行時"
        echo "2. 設置環境變數 (如果需要)："
        echo "   - RESEND_API_KEY"
        echo "   - RECAPTCHA_SECRET_KEY"
        echo "   - APPWRITE_API_KEY"
        echo "3. 測試函數是否正常工作"
    else
        echo "❌ 函數部署失敗"
        echo "請檢查錯誤信息並手動在控制台中創建函數"
    fi
else
    echo "👍 請手動在 Appwrite 控制台中重新創建函數"
fi 