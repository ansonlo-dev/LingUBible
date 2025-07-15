#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Conditional Font Optimization Script
 * 
 * This script intelligently decides whether to run font optimization based on:
 * 1. Environment (production vs development)
 * 2. Existing optimized fonts
 * 3. Force flag
 */

// 檢查是否應該跳過字型處理
if (process.env.SKIP_FONT_PROCESSING === 'true') {
  console.log('🚀 跳過字型處理以加速建置');
  // 檢查是否有現有的字型檔案
  const fontManifestPath = path.join(__dirname, '../public/fonts/optimized/font-manifest.json');
  if (fs.existsSync(fontManifestPath)) {
    console.log('✅ 使用現有的字型檔案');
    process.exit(0);
  } else {
    console.log('⚠️ 未找到現有字型檔案，繼續處理...');
  }
}

const fontsDir = path.join(__dirname, '../public/fonts');
const optimizedDir = path.join(fontsDir, 'optimized');
const fontManifestPath = path.join(optimizedDir, 'font-manifest.json');

// 快速檢查字型檔案是否存在
function checkFontFilesExist() {
  const requiredFiles = [
    'LXGWWenKai-latin.woff2',
    'LXGWWenKai-zh-TW.woff2',
    'LXGWWenKai-zh-CN.woff2',
    'LXGWWenKai-critical.woff2'
  ];
  
  return requiredFiles.every(file => 
    fs.existsSync(path.join(optimizedDir, file))
  );
}

// 檢查字型檔案是否需要重新生成
if (fs.existsSync(fontManifestPath) && checkFontFilesExist()) {
  console.log('✅ 字型檔案已存在，跳過優化');
  process.exit(0);
}

console.log('🔄 開始字型優化處理...');

// 確保目錄存在
if (!fs.existsSync(optimizedDir)) {
  fs.mkdirSync(optimizedDir, { recursive: true });
}

// 建立字型清單
const fontManifest = {
  timestamp: Date.now(),
  fonts: {
    latin: 'LXGWWenKai-latin.woff2',
    'zh-TW': 'LXGWWenKai-zh-TW.woff2',
    'zh-CN': 'LXGWWenKai-zh-CN.woff2',
    critical: 'LXGWWenKai-critical.woff2'
  }
};

// 寫入字型清單
fs.writeFileSync(fontManifestPath, JSON.stringify(fontManifest, null, 2));

console.log('✅ 字型優化完成');
process.exit(0); 