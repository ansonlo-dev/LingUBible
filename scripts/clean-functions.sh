#!/bin/bash

# 清理 Appwrite 函數的腳本
# 在部署前運行此腳本以確保函數大小最小

echo "🧹 開始清理 Appwrite 函數..."

# 檢查是否在項目根目錄
if [ ! -f "appwrite.json" ]; then
    echo "❌ 請在項目根目錄運行此腳本"
    exit 1
fi

# 清理 node_modules 目錄
echo "📦 清理 node_modules 目錄..."
find functions/ -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true

# 清理部署檔案
echo "🗑️ 清理舊的部署檔案..."
find functions/ -name "*.tar.gz" -type f -delete 2>/dev/null || true
find functions/ -name "*.zip" -type f -delete 2>/dev/null || true

# 清理日誌文件
echo "📝 清理日誌文件..."
find functions/ -name "*.log" -type f -delete 2>/dev/null || true
find functions/ -name "npm-debug.log*" -type f -delete 2>/dev/null || true
find functions/ -name "yarn-debug.log*" -type f -delete 2>/dev/null || true
find functions/ -name "yarn-error.log*" -type f -delete 2>/dev/null || true

# 清理臨時文件
echo "🗂️ 清理臨時文件..."
find functions/ -name ".DS_Store" -type f -delete 2>/dev/null || true
find functions/ -name "Thumbs.db" -type f -delete 2>/dev/null || true
find functions/ -name "*.tmp" -type f -delete 2>/dev/null || true

# 清理測試文件
echo "🧪 清理測試文件..."
find functions/ -name "*.test.js" -type f -delete 2>/dev/null || true
find functions/ -name "*.spec.js" -type f -delete 2>/dev/null || true

# 顯示清理後的大小
echo ""
echo "📊 清理後的函數大小："
du -sh functions/*
echo ""
echo "📊 總大小："
du -sh functions/

# 檢查是否有大文件
echo ""
echo "🔍 檢查是否有大文件 (>100KB)..."
large_files=$(find functions/ -type f -size +100k)
if [ -n "$large_files" ]; then
    echo "⚠️ 發現大文件："
    echo "$large_files"
    echo ""
    echo "請檢查這些文件是否需要包含在部署中"
else
    echo "✅ 沒有發現大文件"
fi

echo ""
echo "✅ 函數清理完成！"
echo ""
echo "📋 接下來的步驟："
echo "1. 檢查函數大小是否合理 (每個函數應該 < 1MB)"
echo "2. 運行部署命令："
echo "   appwrite deploy functions"
echo "   或"
echo "   appwrite functions create-deployment --function-id=<function-id> ..." 