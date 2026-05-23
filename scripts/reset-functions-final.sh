#!/bin/bash

# 完全重置 Appwrite 函數 - 刪除並重新創建以使用 Bun 1.1 運行時
# 使用方法: ./scripts/reset-functions-final.sh

echo "🔥 開始完全重置 Appwrite 函數..."

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

# 清理函數文件
echo "🧹 清理函數文件..."
./scripts/clean-functions.sh

echo ""
echo "⚠️  重要警告："
echo "此腳本將完全刪除所有現有的 Appwrite 函數並重新創建它們。"
echo "這個操作不可逆轉！"
echo ""

read -p "您確定要繼續嗎？(yes/NO): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ 操作已取消"
    exit 1
fi

echo ""
echo "🗑️ 開始刪除現有函數..."

# 刪除現有函數
echo "刪除 send-verification 函數..."
appwrite functions delete --function-id=send-verification --yes 2>/dev/null || echo "函數可能已不存在"

echo "刪除 cleanup-expired-codes 函數..."
appwrite functions delete --function-id=cleanup-expired-codes --yes 2>/dev/null || echo "函數可能已不存在"

echo "刪除 get-user-stats 函數..."
appwrite functions delete --function-id=get-user-stats --yes 2>/dev/null || echo "函數可能已不存在"

echo ""
echo "⏳ 等待 5 秒讓刪除操作完成..."
sleep 5

echo ""
echo "🚀 開始創建新函數..."

# 創建 Send Verification Email 函數
echo "創建 Send Verification Email 函數..."
appwrite functions create \
    --function-id=send-verification \
    --name="Send Verification Email" \
    --runtime=bun-1.1 \
    --execute=any \
    --timeout=15 \
    --enabled=true \
    --logging=true \
    --entrypoint="src/main.js" \
    --commands="bun install" \
    --scopes="databases.read" \
    --scopes="databases.write"

if [ $? -eq 0 ]; then
    echo "✅ Send Verification Email 函數創建成功"
    
    # 部署函數代碼
    echo "部署 Send Verification Email 函數代碼..."
    appwrite functions create-deployment \
        --function-id=send-verification \
        --entrypoint="src/main.js" \
        --code="functions/send-verification-email" \
        --activate=true
else
    echo "❌ Send Verification Email 函數創建失敗"
fi

echo ""

# 創建 Cleanup Expired Codes 函數
echo "創建 Cleanup Expired Codes 函數..."
appwrite functions create \
    --function-id=cleanup-expired-codes \
    --name="Cleanup Expired Codes" \
    --runtime=bun-1.1 \
    --execute=any \
    --schedule="0 */6 * * *" \
    --timeout=30 \
    --enabled=true \
    --logging=true \
    --entrypoint="src/main.js" \
    --commands="bun install" \
    --scopes="databases.read" \
    --scopes="databases.write"

if [ $? -eq 0 ]; then
    echo "✅ Cleanup Expired Codes 函數創建成功"
    
    # 部署函數代碼
    echo "部署 Cleanup Expired Codes 函數代碼..."
    appwrite functions create-deployment \
        --function-id=cleanup-expired-codes \
        --entrypoint="src/main.js" \
        --code="functions/cleanup-expired-codes" \
        --activate=true
else
    echo "❌ Cleanup Expired Codes 函數創建失敗"
fi

echo ""

# 創建 Get User Stats 函數
echo "創建 Get User Stats 函數..."
appwrite functions create \
    --function-id=get-user-stats \
    --name="Get User Statistics" \
    --runtime=bun-1.1 \
    --execute=any \
    --timeout=15 \
    --enabled=true \
    --logging=true \
    --entrypoint="src/main.js" \
    --commands="bun install" \
    --scopes="users.read" \
    --scopes="databases.read" \
    --scopes="databases.write"

if [ $? -eq 0 ]; then
    echo "✅ Get User Statistics 函數創建成功"
    
    # 部署函數代碼
    echo "部署 Get User Statistics 函數代碼..."
    appwrite functions create-deployment \
        --function-id=get-user-stats \
        --entrypoint="src/main.js" \
        --code="functions/get-user-stats" \
        --activate=true
else
    echo "❌ Get User Statistics 函數創建失敗"
fi

echo ""
echo "🎉 函數重置完成！"
echo ""
echo "📋 接下來的步驟："
echo "1. 在 Appwrite 控制台中檢查所有函數是否顯示為 'Bun 1.1' 運行時"
echo "2. 設置環境變數："
echo "   - RESEND_API_KEY (用於 send-verification 函數)"
echo "   - RECAPTCHA_SECRET_KEY (用於 send-verification 函數)"
echo "   - APPWRITE_API_KEY (用於 get-user-stats 函數)"
echo "3. 測試函數是否正常工作"
echo ""
echo "🧪 測試命令："
echo "appwrite functions create-execution --function-id=send-verification --data='{\"action\":\"send\",\"email\":\"test@ln.hk\",\"language\":\"zh-TW\"}'"
echo ""
echo "✅ 所有函數現在應該使用 Bun 1.1 運行時！" 