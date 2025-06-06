#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 開發模式 PWA 配置測試\n');

// 檢查 dev-dist 目錄中的文件
const devDistDir = path.join(process.cwd(), 'dev-dist');
const publicDir = path.join(process.cwd(), 'public');

console.log('📁 檢查開發模式構建輸出...');

// 需要檢查的圖標文件
const requiredIcons = [
  'favicon.ico',
  'favicon.svg',
  'favicon-32.png',
  'apple-touch-icon.png',
  'apple-touch-icon.svg',
  'icon-192.png',
  'icon-512.png'
];

// 檢查 public 目錄中的源文件
console.log('\n📂 Public 目錄中的圖標文件:');
requiredIcons.forEach(icon => {
  const filePath = path.join(publicDir, icon);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`  ✅ ${icon} (${(stats.size / 1024).toFixed(1)} KB)`);
  } else {
    console.log(`  ❌ ${icon} - 文件不存在`);
  }
});

// 檢查開發模式 Service Worker 文件
const devSwPath = path.join(devDistDir, 'sw.js');
if (fs.existsSync(devSwPath)) {
  console.log('\n🔧 開發模式 Service Worker 分析:');
  const swContent = fs.readFileSync(devSwPath, 'utf8');
  
  // 檢查圖標緩存規則
  const iconsCachePattern = /icons-cache/;
  const iconRoutePattern = /registerRoute\(\/\\\.\(ico\|png\|svg\)\$/;
  
  if (iconsCachePattern.test(swContent)) {
    console.log('  ✅ 圖標緩存策略已配置');
  } else {
    console.log('  ❌ 圖標緩存策略未找到');
  }
  
  if (iconRoutePattern.test(swContent)) {
    console.log('  ✅ 圖標路由規則已配置');
  } else {
    console.log('  ❌ 圖標路由規則未找到');
  }
  
  // 檢查字體緩存
  const fontsCachePattern = /google-fonts-cache|gstatic-fonts-cache/g;
  const fontsMatches = swContent.match(fontsCachePattern);
  if (fontsMatches && fontsMatches.length >= 2) {
    console.log('  ✅ 字體緩存策略已配置');
  } else {
    console.log('  ❌ 字體緩存策略配置不完整');
  }
  
  // 檢查預緩存條目
  const precacheMatch = swContent.match(/precacheAndRoute\(\[(.*?)\]/s);
  if (precacheMatch) {
    const precacheContent = precacheMatch[1];
    const entries = precacheContent.split(',').filter(entry => entry.includes('url'));
    console.log(`  📋 預緩存條目數量: ${entries.length}`);
    
    // 列出預緩存的文件
    entries.forEach(entry => {
      const urlMatch = entry.match(/"url":\s*"([^"]+)"/);
      if (urlMatch) {
        console.log(`    - ${urlMatch[1]}`);
      }
    });
  } else {
    console.log('  ❌ 無法解析預緩存清單');
  }
  
} else {
  console.log('\n❌ 開發模式 Service Worker 文件不存在');
  console.log('   請先運行 npm run dev 啟動開發服務器');
}

// 檢查開發模式 manifest
const devManifestPath = path.join(devDistDir, 'manifest.webmanifest');
if (fs.existsSync(devManifestPath)) {
  console.log('\n📱 開發模式 Manifest 分析:');
  try {
    const manifestContent = fs.readFileSync(devManifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    
    console.log(`  📝 應用名稱: ${manifest.name}`);
    console.log(`  🎨 主題色彩: ${manifest.theme_color}`);
    console.log(`  📐 顯示模式: ${manifest.display}`);
    console.log(`  🖼️  圖標數量: ${manifest.icons ? manifest.icons.length : 0}`);
  } catch (error) {
    console.log(`  ❌ Manifest 解析錯誤: ${error.message}`);
  }
} else {
  console.log('\n📱 開發模式 Manifest: 使用靜態配置');
}

console.log('\n🎯 開發模式測試建議:');
console.log('1. 運行 npm run dev 啟動開發服務器');
console.log('2. 在瀏覽器中打開 http://localhost:8080');
console.log('3. 打開開發者工具 > Application > Service Workers');
console.log('4. 檢查 Service Worker 是否正確註冊');
console.log('5. 在 Application > Storage > Cache Storage 中檢查緩存');
console.log('6. 測試圖標文件是否被正確緩存');
console.log('7. 檢查 Console 是否還有 Workbox 錯誤');

console.log('\n🔧 故障排除:');
console.log('- 如果 Service Worker 文件不存在，請運行 npm run dev');
console.log('- 如果圖標緩存規則缺失，請檢查 vite.config.ts 配置');
console.log('- 清除瀏覽器緩存和 Service Worker 後重新測試');

console.log('\n✨ 開發模式 PWA 測試完成！'); 