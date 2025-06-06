#!/bin/bash

# 用戶統計數據庫設置腳本
# 此腳本將創建用戶統計追蹤所需的數據庫結構

echo "🚀 開始設置用戶統計數據庫..."

# 檢查 Appwrite CLI 是否已安裝
if ! command -v appwrite &> /dev/null; then
    echo "❌ Appwrite CLI 未安裝。請先安裝 Appwrite CLI。"
    exit 1
fi

echo "📋 檢查 Appwrite CLI 登入狀態..."

# 配置 Appwrite 連接
echo "🔧 配置 Appwrite 連接..."

echo "請輸入您的 Appwrite 端點 (例如: https://cloud.appwrite.io/v1):"
read -r APPWRITE_ENDPOINT

echo "請輸入您的項目 ID:"
read -r PROJECT_ID

echo "請輸入您的 API 密鑰:"
read -r API_KEY

# 設置 CLI 配置 - 使用正確的新版本命令格式
appwrite client --endpoint "$APPWRITE_ENDPOINT"
appwrite client --project-id "$PROJECT_ID"
appwrite client --key "$API_KEY"

echo "✅ Appwrite CLI 配置完成"

# 創建數據庫
echo "📊 創建用戶統計數據庫..."
DATABASE_ID="user-stats-db"

appwrite databases create \
    --database-id "$DATABASE_ID" \
    --name "User Statistics Database"

if [ $? -eq 0 ]; then
    echo "✅ 數據庫創建成功: $DATABASE_ID"
else
    echo "⚠️  數據庫可能已存在，繼續創建集合..."
fi

# 創建用戶會話集合
echo "👥 創建用戶會話集合..."
SESSIONS_COLLECTION="user-sessions"

appwrite databases create-collection \
    --database-id "$DATABASE_ID" \
    --collection-id "$SESSIONS_COLLECTION" \
    --name "User Sessions" \
    --permissions 'read("users")' 'create("users")' 'update("users")' 'delete("users")' \
    --document-security true

# 添加用戶會話屬性
echo "📝 添加用戶會話屬性..."

# userId 屬性
appwrite databases create-string-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$SESSIONS_COLLECTION" \
    --key "userId" \
    --size 255 \
    --required true

# sessionId 屬性
appwrite databases create-string-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$SESSIONS_COLLECTION" \
    --key "sessionId" \
    --size 255 \
    --required true

# loginTime 屬性
appwrite databases create-datetime-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$SESSIONS_COLLECTION" \
    --key "loginTime" \
    --required true

# lastPing 屬性
appwrite databases create-datetime-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$SESSIONS_COLLECTION" \
    --key "lastPing" \
    --required true

# deviceInfo 屬性
appwrite databases create-string-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$SESSIONS_COLLECTION" \
    --key "deviceInfo" \
    --size 1000 \
    --required false

# ipAddress 屬性
appwrite databases create-string-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$SESSIONS_COLLECTION" \
    --key "ipAddress" \
    --size 45 \
    --required false

echo "⏳ 等待屬性創建完成 (30秒)..."
sleep 30

# 創建索引
echo "🔍 創建用戶會話索引..."

appwrite databases create-index \
    --database-id "$DATABASE_ID" \
    --collection-id "$SESSIONS_COLLECTION" \
    --key "userId_index" \
    --type "key" \
    --attributes "userId"

appwrite databases create-index \
    --database-id "$DATABASE_ID" \
    --collection-id "$SESSIONS_COLLECTION" \
    --key "sessionId_index" \
    --type "key" \
    --attributes "sessionId"

appwrite databases create-index \
    --database-id "$DATABASE_ID" \
    --collection-id "$SESSIONS_COLLECTION" \
    --key "lastPing_index" \
    --type "key" \
    --attributes "lastPing" \
    --orders "DESC"

# 創建統計數據集合
echo "📈 創建統計數據集合..."
STATS_COLLECTION="user-stats"

appwrite databases create-collection \
    --database-id "$DATABASE_ID" \
    --collection-id "$STATS_COLLECTION" \
    --name "User Statistics" \
    --permissions 'read("users")' 'create("users")' 'update("users")' 'delete("users")' \
    --document-security true

# 添加統計數據屬性
echo "📊 添加統計數據屬性..."

appwrite databases create-integer-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$STATS_COLLECTION" \
    --key "totalUsers" \
    --required true \
    --min 0 \
    --max 2147483647 \
    --default 0

appwrite databases create-integer-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$STATS_COLLECTION" \
    --key "todayLogins" \
    --required true \
    --min 0 \
    --max 2147483647 \
    --default 0

appwrite databases create-integer-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$STATS_COLLECTION" \
    --key "thisMonthLogins" \
    --required true \
    --min 0 \
    --max 2147483647 \
    --default 0

appwrite databases create-datetime-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$STATS_COLLECTION" \
    --key "lastUpdated" \
    --required true

# 創建已登入用戶集合
echo "👤 創建已登入用戶集合..."
LOGGED_USERS_COLLECTION="logged-users"

appwrite databases create-collection \
    --database-id "$DATABASE_ID" \
    --collection-id "$LOGGED_USERS_COLLECTION" \
    --name "Logged Users" \
    --permissions 'read("users")' 'create("users")' 'update("users")' 'delete("users")' \
    --document-security true

# 添加已登入用戶屬性
echo "👥 添加已登入用戶屬性..."

appwrite databases create-string-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$LOGGED_USERS_COLLECTION" \
    --key "userId" \
    --size 255 \
    --required true

appwrite databases create-datetime-attribute \
    --database-id "$DATABASE_ID" \
    --collection-id "$LOGGED_USERS_COLLECTION" \
    --key "firstLogin" \
    --required true

echo "⏳ 等待屬性創建完成 (30秒)..."
sleep 30

# 創建唯一索引
echo "🔑 創建唯一索引..."
appwrite databases create-index \
    --database-id "$DATABASE_ID" \
    --collection-id "$LOGGED_USERS_COLLECTION" \
    --key "userId_unique" \
    --type "unique" \
    --attributes "userId"

echo "✅ 設置完成！"
echo ""
echo "📋 創建的資源摘要："
echo "   🗄️  數據庫: $DATABASE_ID"
echo "   📊 集合: $SESSIONS_COLLECTION, $STATS_COLLECTION, $LOGGED_USERS_COLLECTION"
echo ""
echo "🎉 用戶統計數據庫設置完成！您現在可以使用在線用戶追蹤功能了。" 