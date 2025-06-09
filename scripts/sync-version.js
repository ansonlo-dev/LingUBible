#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 讀取 package.json 中的版本號
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = packageJson.version;

console.log(`📦 當前版本: ${currentVersion}`);

// 更新 Service Worker 註冊腳本中的版本號
const swRegisterPath = path.join(__dirname, '..', 'public', 'sw-register.js');
let swRegisterContent = fs.readFileSync(swRegisterPath, 'utf8');

// 使用正則表達式替換版本號
const versionRegex = /const CURRENT_VERSION = '[^']+';/;
const newVersionLine = `const CURRENT_VERSION = '${currentVersion}';`;

if (versionRegex.test(swRegisterContent)) {
  swRegisterContent = swRegisterContent.replace(versionRegex, newVersionLine);
  fs.writeFileSync(swRegisterPath, swRegisterContent);
  console.log(`✅ 已更新 sw-register.js 中的版本號為: ${currentVersion}`);
} else {
  console.warn('⚠️ 未找到版本號模式，請檢查 sw-register.js 文件');
}

// 更新 index.html 中的版本號（如果存在）
const indexHtmlPath = path.join(__dirname, '..', 'public', 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  let indexContent = fs.readFileSync(indexHtmlPath, 'utf8');
  const htmlVersionRegex = /data-version="[^"]+"/;
  
  if (htmlVersionRegex.test(indexContent)) {
    indexContent = indexContent.replace(htmlVersionRegex, `data-version="${currentVersion}"`);
    fs.writeFileSync(indexHtmlPath, indexContent);
    console.log(`✅ 已更新 index.html 中的版本號為: ${currentVersion}`);
  }
}

console.log('🎉 版本同步完成！'); 