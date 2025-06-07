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
  "tag_name": "v0.0.7",
  "name": "Beta 0.0.7",
  "body": "## 🚀 新功能和改進\n\n### ✨ 主要更新\n- 版本更新至 0.0.7\n- PWA 版本同步功能\n- 多語言版本徽章支援\n- 性能優化和錯誤修復\n\n### 🔧 技術改進\n- 自動化版本管理系統\n- GitHub API 集成\n- 動態 PWA Manifest 生成\n- 代碼質量提升\n\n### 📱 用戶體驗\n- 版本信息實時同步\n- 多語言 PWA 支援\n- UI/UX 優化\n- 響應式設計改進\n\n---\n\n🌐 **線上體驗**: [lingubible.com](https://lingubible.com)\n📚 **文檔**: [部署指南](https://github.com/ansonlo-dev/LingUBible/tree/main/docs)\n🐛 **問題回報**: [GitHub Issues](https://github.com/ansonlo-dev/LingUBible/issues)",
  "draft": false,
  "prerelease": true
}'

echo ""
echo "✅ Release 創建完成！"
echo "🔗 查看: https://github.com/ansonlo-dev/LingUBible/releases"
