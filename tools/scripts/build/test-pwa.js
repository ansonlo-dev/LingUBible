#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 PWA 配置測試\n');

// 檢查 dist 目錄中的文件
const distDir = path.join(process.cwd(), 'dist');
const publicDir = path.join(process.cwd(), 'public');

console.log('📁 檢查構建輸出文件...');

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

// 檢查 dist 目錄中的構建文件
console.log('\n📦 Dist 目錄中的圖標文件:');
requiredIcons.forEach(icon => {
  const filePath = path.join(distDir, icon);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`  ✅ ${icon} (${(stats.size / 1024).toFixed(1)} KB)`);
  } else {
    console.log(`  ❌ ${icon} - 構建後缺失`);
  }
});

// 檢查 Service Worker 文件
const swPath = path.join(distDir, 'sw.js');
if (fs.existsSync(swPath)) {
  console.log('\n🔧 Service Worker 分析:');
  const swContent = fs.readFileSync(swPath, 'utf8');
  
  // 檢查預緩存清單
  const precacheMatch = swContent.match(/precacheAndRoute\(\[(.*?)\]/s);
  if (precacheMatch) {
    const precacheContent = precacheMatch[1];
    
    console.log('  📋 預緩存文件檢查:');
    requiredIcons.forEach(icon => {
      if (precacheContent.includes(`"${icon}"`)) {
        console.log(`    ✅ ${icon} - 已包含在預緩存中`);
      } else {
        console.log(`    ❌ ${icon} - 未包含在預緩存中`);
      }
    });
    
    // 檢查重複條目
    const duplicates = [];
    requiredIcons.forEach(icon => {
      const matches = (precacheContent.match(new RegExp(`"[^"]*${icon.replace('.', '\\.')}[^"]*"`, 'g')) || []);
      if (matches.length > 1) {
        duplicates.push({ icon, count: matches.length, matches });
      }
    });
    
    if (duplicates.length > 0) {
      console.log('\n  ⚠️  發現重複的預緩存條目:');
      duplicates.forEach(({ icon, count, matches }) => {
        console.log(`    ${icon}: ${count} 次`);
        matches.forEach(match => console.log(`      - ${match}`));
      });
    } else {
      console.log('\n  ✅ 沒有發現重複的預緩存條目');
    }
  } else {
    console.log('  ❌ 無法解析預緩存清單');
  }
} else {
  console.log('\n❌ Service Worker 文件不存在');
}

// 檢查 manifest 文件
const manifestPath = path.join(distDir, 'manifest.webmanifest');
if (fs.existsSync(manifestPath)) {
  console.log('\n📱 Manifest 文件分析:');
  try {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    
    console.log(`  📝 應用名稱: ${manifest.name}`);
    console.log(`  🎨 主題色彩: ${manifest.theme_color}`);
    console.log(`  📐 顯示模式: ${manifest.display}`);
    console.log(`  🖼️  圖標數量: ${manifest.icons ? manifest.icons.length : 0}`);
    
    if (manifest.icons) {
      console.log('  🎯 圖標配置:');
      manifest.icons.forEach(icon => {
        console.log(`    - ${icon.src} (${icon.sizes})`);
      });
    }
  } catch (error) {
    console.log(`  ❌ Manifest 解析錯誤: ${error.message}`);
  }
} else {
  console.log('\n❌ Manifest 文件不存在');
}

console.log('\n🎯 測試建議:');
console.log('1. 運行 npm run dev 啟動開發服務器');
console.log('2. 在瀏覽器中打開 http://localhost:8080');
console.log('3. 打開開發者工具，檢查 Console 是否有 Workbox 錯誤');
console.log('4. 在 Application > Service Workers 中檢查 SW 狀態');
console.log('5. 在 Application > Storage 中檢查預緩存文件');
console.log('6. 測試 PWA 安裝功能');

console.log('\n✨ PWA 測試完成！'); 