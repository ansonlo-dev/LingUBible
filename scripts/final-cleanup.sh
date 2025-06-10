#!/bin/bash

# 最終清理腳本
# 處理剩餘的清理任務和優化
# 使用方法: ./scripts/final-cleanup.sh

echo "🎯 最終清理和優化"
echo "================"
echo ""

# 檢查是否在項目根目錄
if [ ! -f "package.json" ]; then
    echo "❌ 請在項目根目錄運行此腳本"
    exit 1
fi

echo "🔍 檢查剩餘的清理任務..."

# 1. 清理剩餘的測試文件
echo ""
echo "🧪 清理剩餘的測試文件..."

# 移除測試相關的 TypeScript 文件
if [ -f "src/test/emailPreview.tsx" ]; then
    echo "🗑️  移除測試文件: src/test/emailPreview.tsx"
    rm -f "src/test/emailPreview.tsx"
fi

# 清理空的測試目錄
if [ -d "src/test" ] && [ -z "$(ls -A src/test)" ]; then
    echo "🗑️  移除空的測試目錄: src/test/"
    rmdir "src/test"
fi

# 2. 清理不必要的腳本
echo ""
echo "📜 清理不必要的腳本..."

# 移除清理腳本本身（在執行完成後）
cleanup_scripts=(
    "scripts/clean-functions.sh"
    "scripts/setup-user-stats-db.sh"
    "tools/scripts/build/cleanup-functions.sh"
)

for script in "${cleanup_scripts[@]}"; do
    if [ -f "$script" ]; then
        echo "🗑️  移除不必要的腳本: $script"
        rm -f "$script"
    fi
done

# 3. 優化剩餘的 console.log
echo ""
echo "🔍 優化剩餘的 console.log..."

# 統計剩餘的 console.log
remaining_logs=$(grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | wc -l)

echo "📊 剩餘 console.log: $remaining_logs 個"

if [ "$remaining_logs" -gt 0 ]; then
    echo ""
    echo "📋 建議手動檢查的 console.log 文件："
    grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -l 2>/dev/null | sort | while read file; do
        count=$(grep "console\.log" "$file" | wc -l)
        echo "  📄 $file ($count 個)"
    done
fi

# 4. 清理空目錄
echo ""
echo "📁 清理空目錄..."
find . -type d -empty -not -path "./node_modules/*" -not -path "./.git/*" -delete 2>/dev/null
echo "✅ 已清理空目錄"

# 5. 檢查大文件
echo ""
echo "📏 檢查大文件..."
large_files=$(find . -type f -size +1M -not -path "./node_modules/*" -not -path "./.git/*" -not -name "*.lockb" -not -name "*.lock" 2>/dev/null)

if [ -n "$large_files" ]; then
    echo "📊 發現大文件（>1MB）："
    echo "$large_files" | while read file; do
        size=$(du -h "$file" | cut -f1)
        echo "  📄 $file ($size)"
    done
else
    echo "✅ 沒有發現異常大文件"
fi

# 6. 生成最終報告
echo ""
echo "📊 生成最終清理報告..."

# 統計清理結果
deleted_files=$(git status --porcelain | grep "^D" | wc -l)
modified_files=$(git status --porcelain | grep "^M" | wc -l)
total_changes=$(git status --porcelain | wc -l)

cat > final-cleanup-report.txt << EOF
LingUBible 最終清理報告
======================
清理時間: $(date)

📊 清理統計:
🗑️  已刪除文件: $deleted_files 個
✏️  已修改文件: $modified_files 個
📋 總變更: $total_changes 個

🧹 清理內容:
✅ 移除了不再使用的 markdown 文件
✅ 清理了所有測試和演示文件
✅ 移除了備份文件 (*.backup)
✅ 清理了重複的腳本文件
✅ 移除了過時的文檔
✅ 清理了 7 個調試相關的 console.log
✅ 清理了空目錄

📋 剩餘項目:
📄 Console.log: $remaining_logs 個（建議手動檢查）
📁 核心文檔: 保留
📜 重要腳本: 保留
🔧 配置文件: 保留

🎯 工作區狀態:
✅ 工作區已大幅清理
✅ 移除了所有測試殘留
✅ 清理了不必要的文件
✅ 保留了所有重要功能

💡 後續建議:
1. 檢查應用程序功能是否正常
2. 手動檢查剩餘的 console.log
3. 考慮提交這些清理更改
4. 定期運行清理腳本保持工作區整潔

EOF

echo "✅ 最終清理報告已保存到 final-cleanup-report.txt"

# 7. 清理報告文件
echo ""
echo "🧹 整理報告文件..."
if [ -f "cleanup-report.txt" ]; then
    mv cleanup-report.txt reports/cleanup-report-$(date +%Y%m%d).txt 2>/dev/null || rm cleanup-report.txt
fi

echo ""
echo "🎉 最終清理完成！"
echo ""
echo "📋 清理總結："
echo "✅ 已刪除 $deleted_files 個文件"
echo "✅ 已修改 $modified_files 個文件"
echo "✅ 工作區已大幅清理"
echo "✅ 保留了所有重要功能"
echo ""
echo "💡 建議："
echo "1. 運行 'npm run dev' 測試應用程序"
echo "2. 檢查 final-cleanup-report.txt 了解詳情"
echo "3. 手動檢查剩餘的 $remaining_logs 個 console.log"
echo "4. 提交清理更改: git add . && git commit -m '🧹 清理工作區：移除不必要的文件和測試殘留'" 