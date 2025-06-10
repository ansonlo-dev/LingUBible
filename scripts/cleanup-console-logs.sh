#!/bin/bash

# Console.log 清理腳本
# 智能清理不再需要的 console.log 語句
# 使用方法: ./scripts/cleanup-console-logs.sh

echo "🔍 Console.log 清理工具"
echo "======================="
echo ""

# 檢查是否在項目根目錄
if [ ! -f "package.json" ]; then
    echo "❌ 請在項目根目錄運行此腳本"
    exit 1
fi

echo "📊 掃描 console.log 語句..."

# 統計所有 console.log
total_logs=$(grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | wc -l)

if [ "$total_logs" -eq 0 ]; then
    echo "✅ 沒有找到 console.log 語句"
    exit 0
fi

echo "📋 找到 $total_logs 個 console.log 語句"
echo ""

# 分析不同類型的 console.log
echo "🔍 分析 console.log 類型..."

# 調試相關的 console.log
debug_logs=$(grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | grep -i -E "(調試|debug|test|測試)" | wc -l)

# 錯誤相關的 console.log
error_logs=$(grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | grep -i -E "(error|錯誤|失敗|fail)" | wc -l)

# 成功相關的 console.log
success_logs=$(grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | grep -i -E "(success|成功|完成|✅)" | wc -l)

# 數據相關的 console.log
data_logs=$(grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | grep -i -E "(data|數據|response|回應)" | wc -l)

echo "📊 Console.log 分類統計："
echo "🐛 調試相關: $debug_logs"
echo "❌ 錯誤相關: $error_logs"
echo "✅ 成功相關: $success_logs"
echo "📦 數據相關: $data_logs"
echo "📄 其他: $((total_logs - debug_logs - error_logs - success_logs - data_logs))"
echo ""

# 顯示包含 console.log 的文件
echo "📁 包含 console.log 的文件："
grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -l 2>/dev/null | sort

echo ""
echo "🎯 清理選項："
echo "1. 只移除明顯的調試 console.log"
echo "2. 移除所有調試和測試相關的 console.log"
echo "3. 顯示詳細的 console.log 內容供手動檢查"
echo "4. 創建備份並進行智能清理"
echo "5. 取消操作"
echo ""

read -p "請選擇操作 (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🧹 移除明顯的調試 console.log..."
        
        # 備份計數
        backup_count=0
        
        # 移除明顯的調試語句
        if grep -r "console\.log.*調試" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -l 2>/dev/null | wc -l | grep -q "^[1-9]"; then
            find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs sed -i '/console\.log.*調試/d'
            backup_count=$((backup_count + 1))
        fi
        
        if grep -r "console\.log.*debug" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -l 2>/dev/null | wc -l | grep -q "^[1-9]"; then
            find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs sed -i '/console\.log.*debug/d'
            backup_count=$((backup_count + 1))
        fi
        
        if grep -r "console\.log.*test" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -l 2>/dev/null | wc -l | grep -q "^[1-9]"; then
            find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs sed -i '/console\.log.*test/d'
            backup_count=$((backup_count + 1))
        fi
        
        echo "✅ 已移除明顯的調試 console.log"
        ;;
        
    2)
        echo ""
        echo "🧹 移除調試和測試相關的 console.log..."
        
        # 移除更多類型的調試語句
        find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs sed -i '/console\.log.*調試/d'
        find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs sed -i '/console\.log.*debug/d'
        find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs sed -i '/console\.log.*test/d'
        find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs sed -i '/console\.log.*測試/d'
        find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs sed -i '/console\.log.*temp/d'
        find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs sed -i '/console\.log.*臨時/d'
        
        echo "✅ 已移除調試和測試相關的 console.log"
        ;;
        
    3)
        echo ""
        echo "📋 詳細的 console.log 內容："
        echo "=========================="
        
        grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -n 2>/dev/null | head -20
        
        if [ "$total_logs" -gt 20 ]; then
            echo ""
            echo "... 還有 $((total_logs - 20)) 個 console.log（顯示前 20 個）"
        fi
        
        echo ""
        echo "💡 建議手動檢查這些 console.log 並決定是否保留"
        ;;
        
    4)
        echo ""
        echo "🔄 創建備份並進行智能清理..."
        
        # 創建備份
        backup_dir="backup-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$backup_dir"
        
        # 備份包含 console.log 的文件
        grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -l 2>/dev/null | while read file; do
            mkdir -p "$backup_dir/$(dirname "$file")"
            cp "$file" "$backup_dir/$file"
        done
        
        echo "✅ 已創建備份到 $backup_dir"
        
        # 智能清理
        echo "🧠 進行智能清理..."
        
        # 移除明顯不需要的 console.log
        find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs sed -i '/console\.log.*調試/d'
        find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs sed -i '/console\.log.*debug/d'
        find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs sed -i '/console\.log.*test/d'
        find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs sed -i '/console\.log.*測試/d'
        find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs sed -i '/console\.log.*temp/d'
        find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs sed -i '/console\.log.*臨時/d'
        find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs sed -i '/console\.log(".*")/d'
        
        echo "✅ 智能清理完成"
        echo "📁 備份位置: $backup_dir"
        ;;
        
    5)
        echo "❌ 操作已取消"
        exit 0
        ;;
        
    *)
        echo "❌ 無效選擇"
        exit 1
        ;;
esac

# 統計清理後的結果
echo ""
echo "📊 清理結果："

new_total=$(grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | wc -l)
removed_count=$((total_logs - new_total))

echo "🗑️  移除: $removed_count 個 console.log"
echo "📋 剩餘: $new_total 個 console.log"

if [ "$new_total" -gt 0 ]; then
    echo ""
    echo "📁 仍包含 console.log 的文件："
    grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -l 2>/dev/null | sort
fi

echo ""
echo "✅ Console.log 清理完成！"
echo ""
echo "💡 建議："
echo "1. 檢查應用程序功能是否正常"
echo "2. 手動檢查剩餘的 console.log 是否必要"
echo "3. 考慮使用更好的日誌系統替代 console.log" 