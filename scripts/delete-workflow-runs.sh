#!/bin/bash

# 刪除所有 GitHub 工作流程執行歷史記錄
# 使用方法: ./scripts/delete-workflow-runs.sh

echo "🗑️ 開始刪除所有 GitHub 工作流程執行歷史記錄..."

# 檢查是否安裝了 GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI 未安裝"
    echo "請先安裝 GitHub CLI: https://cli.github.com/"
    exit 1
fi

# 檢查是否已登入
if ! gh auth status &> /dev/null; then
    echo "❌ 請先登入 GitHub CLI"
    echo "運行: gh auth login"
    exit 1
fi

echo "📋 獲取所有工作流程執行記錄..."

# 獲取所有工作流程執行 ID
run_ids=$(gh api repos/:owner/:repo/actions/runs --paginate --jq '.workflow_runs[].id')

if [ -z "$run_ids" ]; then
    echo "✅ 沒有找到工作流程執行記錄"
    exit 0
fi

# 計算總數
total_runs=$(echo "$run_ids" | wc -l)
echo "📊 找到 $total_runs 個工作流程執行記錄"

echo ""
echo "⚠️  警告：此操作將刪除所有工作流程執行歷史記錄，包括日誌和構建產物！"
echo "這個操作不可逆轉！"
echo ""

read -p "您確定要繼續嗎？(yes/NO): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ 操作已取消"
    exit 1
fi

echo ""
echo "🗑️ 開始刪除工作流程執行記錄..."

# 刪除每個工作流程執行記錄
count=0
for run_id in $run_ids; do
    count=$((count + 1))
    echo "[$count/$total_runs] 刪除執行記錄 ID: $run_id"
    
    if gh api repos/:owner/:repo/actions/runs/$run_id -X DELETE; then
        echo "✅ 成功刪除"
    else
        echo "❌ 刪除失敗"
    fi
    
    # 添加小延遲以避免 API 限制
    sleep 0.1
done

echo ""
echo "🎉 完成！已嘗試刪除 $total_runs 個工作流程執行記錄"
echo ""
echo "💡 提示："
echo "- 某些執行記錄可能因為權限或狀態原因無法刪除"
echo "- 您可以在 GitHub 網頁界面中檢查剩餘的記錄"
echo "- 如果需要，可以重新運行此腳本" 