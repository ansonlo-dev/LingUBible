#!/bin/bash

# 工作區清理腳本
# 清理不再使用的文件、console.log、測試文件等
# 使用方法: ./scripts/cleanup-workspace.sh

echo "🧹 LingUBible 工作區清理工具"
echo "================================"
echo ""

# 檢查是否在項目根目錄
if [ ! -f "package.json" ] || [ ! -f "appwrite.json" ]; then
    echo "❌ 請在項目根目錄運行此腳本"
    exit 1
fi

echo "📋 將要清理的內容："
echo "1. 🗑️  移除不再使用的 markdown 文件"
echo "2. 🗑️  移除測試和演示文件"
echo "3. 🗑️  移除備份文件"
echo "4. 🗑️  移除重複的腳本文件"
echo "5. 🧹 清理 console.log（開發用）"
echo "6. 🗑️  清理 dist 目錄中的測試文件"
echo ""

read -p "您確定要繼續嗎？(yes/NO): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ 操作已取消"
    exit 1
fi

echo ""
echo "🚀 開始清理..."

# 1. 移除不再使用的 markdown 文件
echo ""
echo "📝 清理不再使用的 markdown 文件..."

# 移除備份文件
echo "🗑️  移除備份文件..."
find . -name "*.backup" -type f -not -path "./node_modules/*" -delete
echo "✅ 已移除所有 .backup 文件"

# 移除重複的指南文件
echo "🗑️  移除重複的指南文件..."
rm -f "./404-CUSTOMIZATION-GUIDE.md"
rm -f "./LOGO_STANDARDIZATION_GUIDE.md"
rm -f "./META_SETUP_GUIDE.md"
rm -f "./MIGRATION_TO_BUN.md"
rm -f "./PWA_DESKTOP_FIX_SUMMARY.md"
rm -f "./RECAPTCHA_HIDDEN_GUIDE.md"
echo "✅ 已移除重複的指南文件"

# 移除 public 和 dist 中的 README 文件
echo "🗑️  移除 public 和 dist 中的 README 文件..."
rm -f "./public/BADGE_HIDE_README.md"
rm -f "./public/RECAPTCHA_HIDE_README.md"
rm -f "./dist/BADGE_HIDE_README.md"
rm -f "./dist/RECAPTCHA_HIDE_README.md"
echo "✅ 已移除 public 和 dist 中的 README 文件"

# 2. 移除測試和演示文件
echo ""
echo "🧪 清理測試和演示文件..."

# 移除測試 HTML 文件
echo "🗑️  移除測試 HTML 文件..."
rm -rf "./public/dev/"
rm -rf "./dist/dev/"
rm -rf "./docs/testing/"
rm -rf "./docs/zh-CN/testing/"
rm -rf "./docs/zh-TW/testing/"
echo "✅ 已移除所有測試 HTML 文件"

# 移除演示頁面
echo "🗑️  移除演示頁面..."
rm -rf "./src/pages/demo/"
echo "✅ 已移除演示頁面"

# 移除測試腳本
echo "🗑️  移除測試腳本..."
rm -f "./tools/scripts/version/test-version-system.js"
echo "✅ 已移除測試腳本"

# 3. 移除重複的腳本文件
echo ""
echo "📜 清理重複的腳本文件..."

# 保留最新的腳本，移除舊版本
echo "🗑️  移除舊版本的函數重置腳本..."
rm -f "./scripts/reset-functions.sh"
rm -f "./scripts/reset-functions-fixed.sh"
# 保留 reset-functions-final.sh 作為最終版本

echo "🗑️  移除重複的部署腳本..."
rm -f "./scripts/deploy-appwrite-function.sh"
rm -f "./scripts/recreate-functions.sh"
echo "✅ 已移除重複的腳本文件"

# 4. 清理不必要的文檔
echo ""
echo "📚 清理不必要的文檔..."

# 移除過時的文檔
echo "🗑️  移除過時的文檔..."
rm -f "./docs/APPWRITE_FUNCTION_TROUBLESHOOTING.md"
rm -f "./docs/QUICK_FIX_GITHUB_ACTIONS.md"
rm -f "./docs/development/PROJECT_STRUCTURE_OPTIMIZATION.md"
rm -f "./docs/development/REFACTORING_PLAN.md"
rm -f "./docs/development/REFACTORING_SUMMARY.md"
rm -f "./docs/development/README_CHECKLIST.md"
rm -f "./docs/development/README_IMAGES_GUIDE.md"
rm -f "./docs/development/VERSION_MANAGEMENT.md"
rm -f "./docs/development/WORKBOX_FIXES.md"
echo "✅ 已移除過時的文檔"

# 5. 清理工具配置文件
echo ""
echo "🔧 清理工具配置文件..."
rm -f "./tools/configs/readme-snippets.md"
echo "✅ 已清理工具配置文件"

# 6. 清理 console.log（可選）
echo ""
echo "🔍 掃描 console.log..."

# 統計 console.log 數量
console_count=$(grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | wc -l)

if [ "$console_count" -gt 0 ]; then
    echo "📊 找到 $console_count 個 console.log"
    echo ""
    echo "⚠️  注意：某些 console.log 可能用於調試或重要日誌"
    echo "建議手動檢查以下文件中的 console.log："
    
    grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -l 2>/dev/null | head -10
    
    echo ""
    read -p "是否要自動移除明顯的調試 console.log？(yes/NO): " -r
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        # 移除明顯的調試 console.log（保留重要的日誌）
        echo "🧹 移除調試 console.log..."
        
        # 移除簡單的調試語句
        find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs sed -i '/console\.log.*調試/d'
        find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs sed -i '/console\.log.*debug/d'
        find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs sed -i '/console\.log.*test/d'
        
        echo "✅ 已移除明顯的調試 console.log"
    else
        echo "⏭️  跳過 console.log 清理"
    fi
else
    echo "✅ 沒有找到 console.log"
fi

# 7. 清理空目錄
echo ""
echo "📁 清理空目錄..."
find . -type d -empty -not -path "./node_modules/*" -not -path "./.git/*" -delete 2>/dev/null
echo "✅ 已清理空目錄"

# 8. 生成清理報告
echo ""
echo "📊 生成清理報告..."

cat > cleanup-report.txt << EOF
LingUBible 工作區清理報告
========================
清理時間: $(date)

已移除的文件類型:
✅ 備份文件 (*.backup)
✅ 重複的指南文件
✅ 測試 HTML 文件
✅ 演示頁面
✅ 過時的文檔
✅ 重複的腳本文件
✅ 工具配置文件
✅ 空目錄

保留的重要文件:
📝 README.md
📝 CHANGELOG.md
📝 主要文檔 (docs/)
📜 核心腳本
🔧 配置文件

建議後續操作:
1. 檢查 git status 確認清理結果
2. 測試應用程序功能
3. 提交清理更改
4. 手動檢查剩餘的 console.log

EOF

echo "✅ 清理報告已保存到 cleanup-report.txt"

echo ""
echo "🎉 工作區清理完成！"
echo ""
echo "📋 清理總結："
echo "✅ 移除了不再使用的文件"
echo "✅ 清理了測試和演示文件"
echo "✅ 移除了重複的腳本和文檔"
echo "✅ 清理了空目錄"
echo ""
echo "💡 建議："
echo "1. 運行 'git status' 檢查更改"
echo "2. 測試應用程序確保功能正常"
echo "3. 檢查 cleanup-report.txt 了解詳情"
echo "4. 手動檢查剩餘的 console.log" 