#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 獲取命令行參數
const args = process.argv.slice(2);
const versionType = args[0]; // major, minor, patch
const customVersion = args[1]; // 自定義版本號

// 讀取 package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// 解析當前版本
const currentVersion = packageJson.version;
const [major, minor, patch] = currentVersion.split('.').map(Number);

let newVersion;

if (customVersion) {
  // 使用自定義版本號
  newVersion = customVersion;
} else {
  // 根據類型自動增加版本號
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

console.log(`🎉 版本已更新：${currentVersion} → ${newVersion}`);
console.log(`📝 請記得創建 GitHub Release：`);
console.log(`   git tag v${newVersion}`);
console.log(`   git push origin v${newVersion}`);
console.log(`   或在 GitHub 網頁上創建 Release`);

// 顯示版本狀態
const isStable = !newVersion.startsWith('0.');
console.log(`🏷️  版本狀態：${isStable ? '穩定版' : 'Beta 版'}`);
console.log(`📱 顯示格式：${isStable ? `v${newVersion}` : `Beta ${newVersion}`}`); 