#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 獲取命令行參數
const args = process.argv.slice(2);
const versionType = args[0]; // major, minor, patch, or custom version
const customVersion = args[1]; // 自定義版本號（如果提供）
const skipConfirmation = args.includes('--yes') || args.includes('-y');

// 顏色輸出函數
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

// 執行命令並返回結果
function execCommand(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf8', ...options }).trim();
  } catch (error) {
    console.error(colors.red(`❌ 命令執行失敗: ${command}`));
    console.error(colors.red(error.message));
    process.exit(1);
  }
}

// 檢查是否在 git 倉庫中
function checkGitRepo() {
  try {
    execCommand('git rev-parse --git-dir');
  } catch {
    console.error(colors.red('❌ 當前目錄不是 Git 倉庫'));
    process.exit(1);
  }
}

// 檢查工作目錄是否乾淨
function checkWorkingDirectory() {
  const status = execCommand('git status --porcelain');
  if (status) {
    console.error(colors.red('❌ 工作目錄不乾淨，請先提交或暫存更改'));
    console.log(colors.yellow('未提交的更改:'));
    console.log(status);
    process.exit(1);
  }
}

// 確保在 main 分支
function checkMainBranch() {
  const currentBranch = execCommand('git branch --show-current');
  if (currentBranch !== 'main') {
    console.error(colors.red(`❌ 請在 main 分支上執行此腳本，當前分支: ${currentBranch}`));
    process.exit(1);
  }
}

// 拉取最新更改
function pullLatestChanges() {
  console.log(colors.blue('📥 拉取最新更改...'));
  execCommand('git pull origin main');
}

// 讀取並更新 package.json
function updatePackageVersion() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const currentVersion = packageJson.version;
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  let newVersion;
  
  if (customVersion) {
    newVersion = customVersion;
  } else {
    switch (versionType) {
      case 'major':
        newVersion = `${major + 1}.0.0`;
        break;
      case 'minor':
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case 'patch':
      default:
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
    }
  }
  
  // 更新 package.json
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  
  return { currentVersion, newVersion };
}

// 確認發布
function confirmRelease(currentVersion, newVersion) {
  if (skipConfirmation) return true;
  
  console.log(colors.bold('\n📋 發布摘要:'));
  console.log(`   當前版本: ${colors.cyan(currentVersion)}`);
  console.log(`   新版本:   ${colors.green(newVersion)}`);
  console.log(`   版本類型: ${colors.yellow(newVersion.startsWith('0.') ? 'Beta' : 'Stable')}`);
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(colors.yellow('\n❓ 確認發布此版本嗎? (y/N): '), (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// 提交版本更改
function commitVersionChange(newVersion) {
  console.log(colors.blue('📝 提交版本更改...'));
  execCommand('git add package.json');
  execCommand(`git commit -m "🔖 [version] Release version ${newVersion}"`);
}

// 創建並推送標籤
function createAndPushTag(newVersion) {
  const tagName = `v${newVersion}`;
  
  console.log(colors.blue(`🏷️  創建標籤: ${tagName}`));
  execCommand(`git tag ${tagName}`);
  
  console.log(colors.blue('📤 推送更改和標籤...'));
  execCommand('git push origin main');
  execCommand(`git push origin ${tagName}`);
  
  return tagName;
}

// 顯示成功信息
function showSuccessMessage(currentVersion, newVersion, tagName) {
  console.log(colors.green('\n🎉 版本發布成功!'));
  console.log(colors.bold('📊 發布詳情:'));
  console.log(`   舊版本: ${colors.cyan(currentVersion)}`);
  console.log(`   新版本: ${colors.green(newVersion)}`);
  console.log(`   標籤:   ${colors.yellow(tagName)}`);
  console.log(`   狀態:   ${colors.blue(newVersion.startsWith('0.') ? 'Beta 版本' : '穩定版本')}`);
  
  console.log(colors.bold('\n🚀 後續步驟:'));
  console.log(`   • GitHub Release 將自動創建`);
  console.log(`   • 查看發布: https://github.com/ansonlo-dev/LingUBible/releases/tag/${tagName}`);
  console.log(`   • 部署將自動觸發`);
}

// 顯示使用說明
function showUsage() {
  console.log(colors.bold('📖 使用說明:'));
  console.log('   node manual-release.js <type> [version] [options]');
  console.log('');
  console.log(colors.bold('參數:'));
  console.log('   type     版本類型: major, minor, patch');
  console.log('   version  自定義版本號 (可選)');
  console.log('');
  console.log(colors.bold('選項:'));
  console.log('   --yes, -y  跳過確認提示');
  console.log('');
  console.log(colors.bold('範例:'));
  console.log('   node manual-release.js patch        # 0.0.1 → 0.0.2');
  console.log('   node manual-release.js minor        # 0.0.1 → 0.1.0');
  console.log('   node manual-release.js major        # 0.0.1 → 1.0.0');
  console.log('   node manual-release.js patch 0.0.5  # 設定為 0.0.5');
  console.log('   node manual-release.js patch --yes  # 跳過確認');
}

// 主函數
async function main() {
  console.log(colors.bold(colors.blue('🚀 LingUBible 版本發布工具\n')));
  
  // 檢查參數
  if (!versionType || (versionType !== 'major' && versionType !== 'minor' && versionType !== 'patch' && !customVersion)) {
    showUsage();
    process.exit(1);
  }
  
  try {
    // 預檢查
    checkGitRepo();
    checkWorkingDirectory();
    checkMainBranch();
    pullLatestChanges();
    
    // 更新版本
    const { currentVersion, newVersion } = updatePackageVersion();
    
    // 確認發布
    const confirmed = await confirmRelease(currentVersion, newVersion);
    if (!confirmed) {
      console.log(colors.yellow('❌ 發布已取消'));
      // 恢復 package.json
      execCommand('git checkout package.json');
      process.exit(0);
    }
    
    // 執行發布
    commitVersionChange(newVersion);
    const tagName = createAndPushTag(newVersion);
    
    // 顯示成功信息
    showSuccessMessage(currentVersion, newVersion, tagName);
    
  } catch (error) {
    console.error(colors.red('❌ 發布過程中發生錯誤:'));
    console.error(colors.red(error.message));
    
    // 嘗試恢復
    try {
      execCommand('git checkout package.json');
      console.log(colors.yellow('🔄 已恢復 package.json'));
    } catch {
      console.log(colors.red('⚠️  無法自動恢復 package.json，請手動檢查'));
    }
    
    process.exit(1);
  }
}

// 執行主函數
main(); 