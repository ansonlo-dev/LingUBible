#!/usr/bin/env node

/**
 * 使用 GitHub API 創建 Release
 * 不依賴 GitHub CLI
 */

import { execSync } from 'child_process';
import fs from 'fs';

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function createReleaseWithAPI() {
  try {
    log('🔍 準備使用 GitHub API 創建 Release...', 'blue');

    // 讀取 package.json 獲取當前版本
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const version = packageJson.version;
    const tagName = `v${version}`;

    log(`📦 當前版本: ${version}`, 'cyan');
    log(`🏷️ 標籤名稱: ${tagName}`, 'cyan');

    // 檢查標籤是否存在
    try {
      execSync(`git rev-parse ${tagName}`, { stdio: 'pipe' });
      log(`✅ 標籤 ${tagName} 存在`, 'green');
    } catch (error) {
      log(`❌ 標籤 ${tagName} 不存在`, 'red');
      process.exit(1);
    }

    // 獲取倉庫信息
    const repoUrl = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
    const repoMatch = repoUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    
    if (!repoMatch) {
      log('❌ 無法解析 GitHub 倉庫信息', 'red');
      process.exit(1);
    }

    const [, owner, repo] = repoMatch;
    log(`📂 倉庫: ${owner}/${repo}`, 'cyan');

    // 確定發布類型
    const isPrerelease = version.startsWith('0.');
    const releaseName = isPrerelease ? `Beta ${version}` : `Version ${version}`;

    log(`🎯 發布類型: ${isPrerelease ? 'Pre-release (Beta)' : 'Stable Release'}`, 'cyan');
    log(`📋 發布名稱: ${releaseName}`, 'cyan');

    // 生成 changelog
    const changelog = `## 🚀 新功能和改進

### ✨ 主要更新
- 版本更新至 ${version}
- PWA 版本同步功能
- 多語言版本徽章支援
- 性能優化和錯誤修復

### 🔧 技術改進
- 自動化版本管理系統
- GitHub API 集成
- 動態 PWA Manifest 生成
- 代碼質量提升

### 📱 用戶體驗
- 版本信息實時同步
- 多語言 PWA 支援
- UI/UX 優化
- 響應式設計改進

---

🌐 **線上體驗**: [lingubible.com](https://lingubible.com)
📚 **文檔**: [部署指南](https://github.com/${owner}/${repo}/tree/main/docs)
🐛 **問題回報**: [GitHub Issues](https://github.com/${owner}/${repo}/issues)`;

    // 準備 API 請求數據
    const releaseData = {
      tag_name: tagName,
      name: releaseName,
      body: changelog,
      draft: false,
      prerelease: isPrerelease
    };

    // 創建 curl 命令
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases`;
    const curlCommand = `curl -X POST "${apiUrl}" \\
  -H "Accept: application/vnd.github+json" \\
  -H "Authorization: Bearer \${GITHUB_TOKEN}" \\
  -H "X-GitHub-Api-Version: 2022-11-28" \\
  -d '${JSON.stringify(releaseData, null, 2)}'`;

    log('\n🚀 準備創建 GitHub Release...', 'blue');
    log('\n📝 需要執行的命令:', 'yellow');
    log('─'.repeat(60), 'cyan');
    console.log(curlCommand);
    log('─'.repeat(60), 'cyan');

    log('\n⚠️ 注意事項:', 'yellow');
    log('1. 您需要設置 GITHUB_TOKEN 環境變數', 'cyan');
    log('2. Token 需要有 "repo" 權限', 'cyan');
    log('3. 可以在 GitHub Settings > Developer settings > Personal access tokens 創建', 'cyan');

    log('\n🔧 使用方法:', 'yellow');
    log('1. 創建 GitHub Personal Access Token', 'cyan');
    log('2. 設置環境變數: export GITHUB_TOKEN=your_token_here', 'cyan');
    log('3. 執行上面的 curl 命令', 'cyan');

    log('\n📋 或者手動在 GitHub 網頁上創建:', 'yellow');
    log(`1. 訪問: https://github.com/${owner}/${repo}/releases/new`, 'cyan');
    log(`2. 選擇標籤: ${tagName}`, 'cyan');
    log(`3. 設置標題: ${releaseName}`, 'cyan');
    log('4. 添加上面的發布說明', 'cyan');
    log(`5. ${isPrerelease ? '勾選 "This is a pre-release"' : '確保未勾選 pre-release'}`, 'cyan');
    log('6. 點擊 "Publish release"', 'cyan');

    // 保存 curl 命令到文件
    const scriptPath = 'create-release.sh';
    const scriptContent = `#!/bin/bash

# GitHub Release 創建腳本
# 使用前請設置 GITHUB_TOKEN 環境變數

if [ -z "\${GITHUB_TOKEN}" ]; then
  echo "❌ 請設置 GITHUB_TOKEN 環境變數"
  echo "export GITHUB_TOKEN=your_token_here"
  exit 1
fi

echo "🚀 正在創建 GitHub Release..."

${curlCommand}

echo ""
echo "✅ Release 創建完成！"
echo "🔗 查看: https://github.com/${owner}/${repo}/releases"
`;

    fs.writeFileSync(scriptPath, scriptContent);
    execSync(`chmod +x ${scriptPath}`);
    
    log(`\n💾 已保存執行腳本到: ${scriptPath}`, 'green');
    log('執行: ./create-release.sh', 'cyan');

  } catch (error) {
    log(`❌ 創建 Release 失敗: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 運行主函數
createReleaseWithAPI(); 