#!/bin/bash

# GitHub Release 創建腳本
# 使用前請設置 GITHUB_TOKEN 環境變數

if [ -z "${GITHUB_TOKEN}" ]; then
  echo "❌ 請設置 GITHUB_TOKEN 環境變數"
  echo "export GITHUB_TOKEN=your_token_here"
  exit 1
fi

echo "🚀 正在創建 GitHub Release..."

curl -X POST "https://api.github.com/repos/ansonlo-dev/LingUBible/releases" \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -d '{
  "tag_name": "v0.1.0",
  "name": "v0.1.0 - PWA 啟動畫面優化",
  "body": "## 🎨 PWA 啟動畫面書本圖示優化\n\n### ✨ 主要更新\n- 🔍 **增大書本圖示大小**: 將所有 PWA 啟動畫面中的書本圖示縮放比例增加 30-35%\n- 📐 **優化視覺比例**: 讓書本在圓角方形內佔據更多空間，提供更好的視覺效果\n- 📱 **全裝置支援**: 涵蓋所有裝置尺寸，包含 Android、iPhone、iPad 及其橫向模式\n- 🎯 **品牌識別強化**: 優化 PWA 使用者體驗，讓 LingUBible 品牌標識更加突出\n\n### 📱 影響範圍\n- ✅ 所有 Android 裝置啟動畫面 (small/medium/large/xlarge)\n- ✅ 所有 iPhone 裝置啟動畫面 (iPhone 6 到 iPhone 14 Pro Max)\n- ✅ 所有 iPad 裝置啟動畫面 (iPad Pro 11/12.9 系列)\n- ✅ 橫向和直向模式均已優化\n\n### 🚀 使用者體驗提升\n- 更清晰的品牌識別\n- 更專業的視覺呈現\n- 更好的啟動畫面視覺平衡\n- 提升整體 PWA 使用體驗\n\n---\n\n🌐 **線上體驗**: [lingubible.com](https://lingubible.com)\n📱 **PWA 安裝**: 在支援的瀏覽器中點擊「加到主畫面」體驗新的啟動畫面\n📚 **文檔**: [部署指南](https://github.com/ansonlo-dev/LingUBible/tree/main/docs)\n🐛 **問題回報**: [GitHub Issues](https://github.com/ansonlo-dev/LingUBible/issues)",
  "draft": false,
  "prerelease": false
}'

echo ""
echo "✅ Release 創建完成！"
echo "🔗 查看: https://github.com/ansonlo-dev/LingUBible/releases"
