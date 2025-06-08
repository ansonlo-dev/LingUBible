#!/usr/bin/env node

/**
 * 桌面 PWA 安裝功能測試腳本
 * 用於驗證生產環境中的 PWA 安裝按鈕問題
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 桌面 PWA 安裝功能檢查');
console.log('================================');

// 檢查必要文件
const requiredFiles = [
  'public/manifest.json',
  'public/manifest-dynamic.json',
  'public/sw-register.js',
  'public/favicon.ico',
  'public/favicon.svg',
  'public/favicon-96x96.png',
  'public/apple-touch-icon.png',
  'public/android/android-launchericon-192-192.png',
  'public/android/android-launchericon-512-512.png',
  'vite.config.ts',
  'index.html'
];

console.log('\n📁 檢查必要文件:');
let missingFiles = [];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - 文件不存在`);
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.log(`\n⚠️ 發現 ${missingFiles.length} 個缺失文件，可能影響 PWA 功能`);
} else {
  console.log('\n✅ 所有必要文件都存在');
}

// 檢查 Vite 配置
console.log('\n⚙️ 檢查 Vite PWA 配置:');
try {
  const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
  
  const checks = [
    { name: 'VitePWA 插件', pattern: /VitePWA\s*\(/ },
    { name: 'registerType autoUpdate', pattern: /registerType:\s*['"]autoUpdate['"]/ },
    { name: 'disable: false', pattern: /disable:\s*false/ },
    { name: 'Service Worker 配置', pattern: /workbox:\s*{/ },
    { name: 'Manifest 配置', pattern: /manifest:\s*{/ },
    { name: '圖標配置', pattern: /icons:\s*\[/ },
    { name: '生產環境圖標', pattern: /android\/\*\.png/ }
  ];

  checks.forEach(check => {
    if (check.pattern.test(viteConfig)) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name} - 配置可能有問題`);
    }
  });

} catch (error) {
  console.log(`❌ 無法讀取 vite.config.ts: ${error.message}`);
}

// 檢查 HTML manifest 引用
console.log('\n📄 檢查 HTML manifest 引用:');
try {
  const htmlContent = fs.readFileSync('index.html', 'utf8');
  
  if (htmlContent.includes('rel="manifest"')) {
    console.log('✅ HTML 包含 manifest 引用');
    
    if (htmlContent.includes('manifest-dynamic.json')) {
      console.log('✅ 使用動態 manifest');
    } else {
      console.log('⚠️ 未使用動態 manifest');
    }
    
    if (htmlContent.includes('sw-register.js')) {
      console.log('✅ 包含 Service Worker 註冊腳本');
    } else {
      console.log('❌ 缺少 Service Worker 註冊腳本');
    }
  } else {
    console.log('❌ HTML 缺少 manifest 引用');
  }
} catch (error) {
  console.log(`❌ 無法讀取 index.html: ${error.message}`);
}

// 檢查 Service Worker 註冊腳本
console.log('\n🔧 檢查 Service Worker 註冊腳本:');
try {
  const swRegister = fs.readFileSync('public/sw-register.js', 'utf8');
  
  const swChecks = [
    { name: 'beforeinstallprompt 監聽', pattern: /beforeinstallprompt/ },
    { name: 'appinstalled 監聽', pattern: /appinstalled/ },
    { name: '環境檢測', pattern: /(localhost.*dev-sw\.js|localhost.*sw\.js)/ },
    { name: '安裝提示處理', pattern: /deferredPrompt/ },
    { name: '手動安裝指引', pattern: /showManualInstallInstructions/ },
    { name: '全局 PWAUtils', pattern: /window\.PWAUtils/ }
  ];

  swChecks.forEach(check => {
    if (check.pattern.test(swRegister)) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name} - 功能可能缺失`);
    }
  });

} catch (error) {
  console.log(`❌ 無法讀取 sw-register.js: ${error.message}`);
}

// 檢查圖標文件大小
console.log('\n🖼️ 檢查圖標文件:');
const iconFiles = [
  'public/favicon.ico',
  'public/favicon-96x96.png',
  'public/apple-touch-icon.png',
  'public/android/android-launchericon-192-192.png',
  'public/android/android-launchericon-512-512.png'
];

iconFiles.forEach(file => {
  try {
    const stats = fs.statSync(file);
    const sizeKB = Math.round(stats.size / 1024);
    console.log(`✅ ${path.basename(file)} - ${sizeKB} KB`);
  } catch (error) {
    console.log(`❌ ${path.basename(file)} - 文件不存在或無法讀取`);
  }
});

// 生成診斷報告
console.log('\n📋 診斷建議:');
console.log('================================');

if (missingFiles.length === 0) {
  console.log('✅ 所有必要文件都存在');
} else {
  console.log('❌ 請確保所有必要文件都存在');
}

console.log('\n🔧 修復步驟（如果 PWA 安裝按鈕在桌面瀏覽器中不顯示）:');
console.log('1. 確保使用 HTTPS 或 localhost');
console.log('2. 檢查瀏覽器控制台是否有錯誤');
console.log('3. 驗證 Service Worker 是否正確註冊');
console.log('4. 確認 manifest 文件可以正常載入');
console.log('5. 檢查所有必要的圖標文件是否存在');
console.log('6. 嘗試在無痕模式下測試');
console.log('7. 清除瀏覽器緩存和 Service Worker');

console.log('\n🌐 測試 URL:');
console.log('- 開發環境: http://localhost:8080');
console.log('- PWA 診斷: http://localhost:8080/pwa-desktop-debug.html');
console.log('- 生產環境: https://your-domain.com');

console.log('\n📱 支援的瀏覽器:');
console.log('- Chrome 67+ (推薦)');
console.log('- Edge 79+ (推薦)');
console.log('- Firefox 58+ (有限支援)');
console.log('- Safari 11.1+ (iOS 限定)');

console.log('\n✅ 檢查完成！'); 