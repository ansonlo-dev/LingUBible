#!/usr/bin/env node

/**
 * PWA 版本更新腳本
 * 自動更新 public/api/version.json 中的版本信息
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 項目根目錄
const projectRoot = path.resolve(__dirname, '../../../');

// 文件路徑
const packageJsonPath = path.join(projectRoot, 'package.json');
const versionApiPath = path.join(projectRoot, 'public/api/version.json');

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function updatePWAVersion() {
  try {
    log('🔄 開始更新 PWA 版本信息...', 'blue');

    // 讀取 package.json
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`找不到 package.json: ${packageJsonPath}`);
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const version = packageJson.version;
    const name = packageJson.name || 'LingUBible';
    const description = packageJson.description || 'Course and lecturer review platform';

    log(`📦 當前版本: ${version}`, 'cyan');

    // 創建版本信息對象
    const versionInfo = {
      version,
      name,
      description,
      buildTime: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      gitCommit: process.env.GITHUB_SHA || null,
      gitRef: process.env.GITHUB_REF || null
    };

    // 確保目錄存在
    const apiDir = path.dirname(versionApiPath);
    if (!fs.existsSync(apiDir)) {
      fs.mkdirSync(apiDir, { recursive: true });
      log(`📁 創建目錄: ${apiDir}`, 'yellow');
    }

    // 寫入版本信息
    fs.writeFileSync(versionApiPath, JSON.stringify(versionInfo, null, 2), 'utf8');
    
    log(`✅ PWA 版本信息已更新: ${versionApiPath}`, 'green');
    log(`📋 版本詳情:`, 'bold');
    log(`   版本: ${version}`, 'cyan');
    log(`   名稱: ${name}`, 'cyan');
    log(`   描述: ${description}`, 'cyan');
    log(`   構建時間: ${versionInfo.buildTime}`, 'cyan');
    log(`   環境: ${versionInfo.environment}`, 'cyan');
    
    if (versionInfo.gitCommit) {
      log(`   Git Commit: ${versionInfo.gitCommit}`, 'cyan');
    }
    
    if (versionInfo.gitRef) {
      log(`   Git Ref: ${versionInfo.gitRef}`, 'cyan');
    }

    return versionInfo;

  } catch (error) {
    log(`❌ 更新 PWA 版本信息失敗: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 如果直接運行此腳本
if (import.meta.url === `file://${process.argv[1]}`) {
  updatePWAVersion();
}

export { updatePWAVersion }; 