#!/bin/bash

# 🧹 Appwrite 函數清理腳本
# 清理未使用和未實現的雲函數

echo "🧹 開始清理未使用的 Appwrite 函數..."
echo ""

# 檢查當前目錄
if [ ! -d "functions" ]; then
    echo "❌ 錯誤: 未找到 functions 目錄"
    echo "請在項目根目錄執行此腳本"
    exit 1
fi

# 顯示當前函數狀況
echo "📊 當前函數目錄狀況:"
ls -la functions/
echo ""

# 1. 刪除未實現的 verify-student-code
if [ -d "functions/verify-student-code" ]; then
    echo "🔍 檢查 verify-student-code..."
    if [ ! -f "functions/verify-student-code/src/main.js" ]; then
        echo "❌ verify-student-code 未實現 (缺少 main.js)"
        read -p "是否刪除 verify-student-code? (Y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            echo "⏭️  跳過刪除 verify-student-code"
        else
            echo "🗑️  刪除 verify-student-code..."
            rm -rf functions/verify-student-code/
            echo "✅ verify-student-code 已刪除"
        fi
    else
        echo "✅ verify-student-code 已實現，保留"
    fi
else
    echo "ℹ️  verify-student-code 目錄不存在"
fi

echo ""

# 2. 處理 send-contact-email
if [ -d "functions/send-contact-email" ]; then
    echo "📮 檢查 send-contact-email..."
    echo "ℹ️  此函數已實現但未在 appwrite.json 中配置"
    echo "ℹ️  如果不需要聯繫表單功能，可以刪除"
    echo ""
    read -p "是否刪除 send-contact-email? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  刪除 send-contact-email..."
        rm -rf functions/send-contact-email/
        echo "✅ send-contact-email 已刪除"
    else
        echo "✅ 保留 send-contact-email (可在未來啟用)"
    fi
else
    echo "ℹ️  send-contact-email 目錄不存在"
fi

echo ""

# 顯示清理後的狀況
echo "📊 清理後的函數目錄:"
ls -la functions/
echo ""

# 顯示 appwrite.json 中配置的函數
echo "⚙️  appwrite.json 中配置的函數:"
if command -v jq &> /dev/null; then
    jq -r '.functions[] | "- " + .name + " (" + ."$id" + ")"' appwrite.json
else
    echo "ℹ️  安裝 jq 以查看詳細配置: sudo apt install jq"
    grep -A 2 '"name":' appwrite.json | grep '"name":' | sed 's/.*"name": *"\([^"]*\)".*/- \1/'
fi

echo ""
echo "🎉 函數清理完成！"
echo ""
echo "📝 總結:"
echo "✅ 保留的函數 (已配置並部署):"
echo "   - send-verification-email (發送驗證郵件)"
echo "   - cleanup-expired-codes (清理過期驗證碼)"
echo ""
echo "💡 提示:"
echo "   - 如果需要聯繫表單功能，可以重新添加 send-contact-email"
echo "   - 所有保留的函數都在 Appwrite Console 中可見"
echo "   - 清理不會影響現有功能的正常運行" 