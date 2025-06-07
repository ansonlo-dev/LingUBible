#!/usr/bin/env node

/**
 * 創建缺失的 GitHub Release
 * 用於修復標籤已創建但 Release 未創建的情況
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

async function createMissingRelease() {
  try {
    log('🔍 檢查缺失的 GitHub Release...', 'blue');

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

    // 檢查是否已有 Release
    try {
      const result = execSync(`gh release view ${tagName}`, { stdio: 'pipe', encoding: 'utf8' });
      log(`⚠️ Release ${tagName} 已存在`, 'yellow');
      log('Release 詳情:', 'cyan');
      console.log(result);
      return;
    } catch (error) {
      log(`📝 Release ${tagName} 不存在，準備創建...`, 'yellow');
    }

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
📚 **文檔**: [部署指南](https://github.com/ansonlo-dev/LingUBible/tree/main/docs)
🐛 **問題回報**: [GitHub Issues](https://github.com/ansonlo-dev/LingUBible/issues)`;

    // 創建 Release
    log('🚀 正在創建 GitHub Release...', 'blue');

    const releaseCommand = [
      'gh', 'release', 'create', tagName,
      '--title', `"${releaseName}"`,
      '--notes', `"${changelog}"`,
      isPrerelease ? '--prerelease' : '',
      '--verify-tag'
    ].filter(Boolean).join(' ');

    log(`執行命令: ${releaseCommand}`, 'cyan');

    try {
      const result = execSync(releaseCommand, { stdio: 'pipe', encoding: 'utf8' });
      log(`✅ GitHub Release 創建成功！`, 'green');
      log(`🔗 Release URL: ${result.trim()}`, 'cyan');
      
      // 顯示成功信息
      log('\n🎉 Release 創建完成！', 'bold');
      log(`📦 版本: ${version}`, 'green');
      log(`🏷️ 標籤: ${tagName}`, 'green');
      log(`📋 名稱: ${releaseName}`, 'green');
      log(`🔗 URL: ${result.trim()}`, 'green');

    } catch (error) {
      log(`❌ 創建 Release 失敗: ${error.message}`, 'red');
      
      // 提供手動創建的指導
      log('\n📝 手動創建 Release 的步驟:', 'yellow');
      log('1. 訪問 GitHub 倉庫頁面', 'cyan');
      log('2. 點擊 "Releases" 標籤', 'cyan');
      log('3. 點擊 "Create a new release"', 'cyan');
      log(`4. 選擇標籤: ${tagName}`, 'cyan');
      log(`5. 設置標題: ${releaseName}`, 'cyan');
      log('6. 添加發布說明', 'cyan');
      log(`7. ${isPrerelease ? '勾選 "This is a pre-release"' : '確保未勾選 pre-release'}`, 'cyan');
      log('8. 點擊 "Publish release"', 'cyan');
      
      process.exit(1);
    }

  } catch (error) {
    log(`❌ 創建 Release 失敗: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 檢查是否安裝了 GitHub CLI
try {
  execSync('gh --version', { stdio: 'pipe' });
} catch (error) {
  log('❌ GitHub CLI (gh) 未安裝', 'red');
  log('請先安裝 GitHub CLI: https://cli.github.com/', 'yellow');
  process.exit(1);
}

// 檢查是否已登錄 GitHub CLI
try {
  execSync('gh auth status', { stdio: 'pipe' });
} catch (error) {
  log('❌ GitHub CLI 未登錄', 'red');
  log('請先登錄: gh auth login', 'yellow');
  process.exit(1);
}

// 運行主函數
createMissingRelease(); 