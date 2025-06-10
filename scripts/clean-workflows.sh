#!/bin/bash

# 清理 GitHub Actions 工作流程文件
# 使用方法: ./scripts/clean-workflows.sh

echo "🧹 GitHub Actions 工作流程清理工具"
echo ""

# 檢查 .github/workflows 目錄
if [ ! -d ".github/workflows" ]; then
    echo "✅ 沒有找到 .github/workflows 目錄"
    exit 0
fi

echo "📁 當前工作流程文件："
ls -la .github/workflows/

echo ""
echo "⚠️  選項："
echo "1. 只刪除執行歷史（已完成）"
echo "2. 刪除所有工作流程文件"
echo "3. 禁用所有工作流程（保留文件但不執行）"
echo "4. 取消操作"
echo ""

read -p "請選擇操作 (1-4): " choice

case $choice in
    1)
        echo "✅ 執行歷史已在之前的腳本中刪除"
        ;;
    2)
        echo ""
        echo "⚠️  警告：這將刪除所有工作流程文件！"
        read -p "您確定要繼續嗎？(yes/NO): " -r
        if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            rm -rf .github/workflows/
            echo "✅ 已刪除所有工作流程文件"
        else
            echo "❌ 操作已取消"
        fi
        ;;
    3)
        echo ""
        echo "💡 要禁用工作流程，您可以："
        echo "1. 在 GitHub 網頁界面中手動禁用"
        echo "2. 或者重命名工作流程文件（添加 .disabled 後綴）"
        echo ""
        read -p "是否重命名所有工作流程文件為 .disabled？(yes/NO): " -r
        if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            for file in .github/workflows/*.yml .github/workflows/*.yaml; do
                if [ -f "$file" ]; then
                    mv "$file" "$file.disabled"
                    echo "✅ 已禁用: $(basename "$file")"
                fi
            done
        else
            echo "❌ 操作已取消"
        fi
        ;;
    4)
        echo "❌ 操作已取消"
        ;;
    *)
        echo "❌ 無效選擇"
        ;;
esac 