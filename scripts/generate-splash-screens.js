#!/usr/bin/env node

/**
 * PWA 啟動畫面圖片生成器
 * 為 iOS 和 Android 生成各種尺寸的啟動畫面
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 啟動畫面尺寸配置
const splashScreenSizes = [
  // iPhone
  { name: 'iphone-legacy', width: 640, height: 1136, description: 'iPhone 5/SE' },
  { name: 'iphone-6', width: 750, height: 1334, description: 'iPhone 6/7/8' },
  { name: 'iphone-6-plus', width: 1242, height: 2208, description: 'iPhone 6/7/8 Plus' },
  { name: 'iphone-x', width: 1125, height: 2436, description: 'iPhone X/XS/11 Pro' },
  { name: 'iphone-x-landscape', width: 2436, height: 1125, description: 'iPhone X/XS/11 Pro Landscape' },
  { name: 'iphone-xr', width: 828, height: 1792, description: 'iPhone XR/11' },
  { name: 'iphone-xr-landscape', width: 1792, height: 828, description: 'iPhone XR/11 Landscape' },
  { name: 'iphone-xs-max', width: 1242, height: 2688, description: 'iPhone XS Max/11 Pro Max' },
  { name: 'iphone-xs-max-landscape', width: 2688, height: 1242, description: 'iPhone XS Max/11 Pro Max Landscape' },
  { name: 'iphone-12', width: 1170, height: 2532, description: 'iPhone 12/13/14' },
  { name: 'iphone-12-landscape', width: 2532, height: 1170, description: 'iPhone 12/13/14 Landscape' },
  { name: 'iphone-12-pro-max', width: 1284, height: 2778, description: 'iPhone 12/13/14 Pro Max' },
  { name: 'iphone-12-pro-max-landscape', width: 2778, height: 1284, description: 'iPhone 12/13/14 Pro Max Landscape' },
  { name: 'iphone-14-pro', width: 1179, height: 2556, description: 'iPhone 14 Pro' },
  { name: 'iphone-14-pro-landscape', width: 2556, height: 1179, description: 'iPhone 14 Pro Landscape' },
  { name: 'iphone-14-pro-max', width: 1290, height: 2796, description: 'iPhone 14 Pro Max' },
  { name: 'iphone-14-pro-max-landscape', width: 2796, height: 1290, description: 'iPhone 14 Pro Max Landscape' },
  
  // iPad
  { name: 'ipad', width: 1536, height: 2048, description: 'iPad' },
  { name: 'ipad-landscape', width: 2048, height: 1536, description: 'iPad Landscape' },
  { name: 'ipad-pro-11', width: 1668, height: 2388, description: 'iPad Pro 11"' },
  { name: 'ipad-pro-11-landscape', width: 2388, height: 1668, description: 'iPad Pro 11" Landscape' },
  { name: 'ipad-pro-12', width: 2048, height: 2732, description: 'iPad Pro 12.9"' },
  { name: 'ipad-pro-12-landscape', width: 2732, height: 2048, description: 'iPad Pro 12.9" Landscape' },
  
  // Android 常見尺寸
  { name: 'android-small', width: 480, height: 854, description: 'Android Small' },
  { name: 'android-medium', width: 720, height: 1280, description: 'Android Medium' },
  { name: 'android-large', width: 1080, height: 1920, description: 'Android Large' },
  { name: 'android-xlarge', width: 1440, height: 2560, description: 'Android XLarge' },
  
  // 默認
  { name: 'default', width: 1080, height: 1920, description: 'Default' }
];

// 生成 SVG 啟動畫面
function generateSplashScreenSVG(width, height, isLandscape = false) {
  const logoSize = Math.min(width, height) * 0.15; // Logo 大小為較小邊的 15%
  const centerX = width / 2;
  const centerY = height / 2;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- 背景漸變 -->
  <defs>
    <linearGradient id="backgroundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#dc2626;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#ef4444;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#dc2626;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.3);stop-opacity:1" />
      <stop offset="70%" style="stop-color:rgba(255,255,255,0.1);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgba(255,255,255,0);stop-opacity:0" />
    </radialGradient>
  </defs>
  
  <!-- 背景 -->
  <rect width="${width}" height="${height}" fill="url(#backgroundGradient)"/>
  
  <!-- 背景光暈 -->
  <circle cx="${centerX}" cy="${centerY * 0.7}" r="${logoSize * 2}" fill="url(#glowGradient)" opacity="0.6"/>
  
  <!-- Logo 背景 -->
  <rect x="${centerX - logoSize/2}" y="${centerY - logoSize/2}" width="${logoSize}" height="${logoSize}" rx="${logoSize * 0.2}" fill="white" opacity="0.95"/>
  
  <!-- Logo 圖標 (BookOpen) -->
  <g transform="translate(${centerX}, ${centerY})">
    <g transform="scale(${logoSize/48})">
      <path d="M0 -8v16" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M-8 6a1 1 0 0 1-1-1V-5a1 1 0 0 1 1-1h4a4 4 0 0 1 4 4 4 4 0 0 1 4-4h4a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-5a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </g>
  </g>
  
  <!-- 應用名稱 -->
  <text x="${centerX}" y="${centerY + logoSize * 0.8}" text-anchor="middle" fill="white" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.max(24, width * 0.04)}" font-weight="bold">LingUBible</text>
  
  <!-- 副標題 -->
  <text x="${centerX}" y="${centerY + logoSize * 1.1}" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.max(16, width * 0.025)}" font-weight="500">課程與講師評價平台</text>
  
  <!-- 載入動畫點 -->
  <g transform="translate(${centerX}, ${centerY + logoSize * 1.5})">
    <circle cx="-12" cy="0" r="3" fill="rgba(255,255,255,0.6)">
      <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" begin="0s"/>
    </circle>
    <circle cx="0" cy="0" r="3" fill="rgba(255,255,255,0.6)">
      <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" begin="0.5s"/>
    </circle>
    <circle cx="12" cy="0" r="3" fill="rgba(255,255,255,0.6)">
      <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" begin="1s"/>
    </circle>
  </g>
  
  <!-- 底部文字 -->
  <text x="${centerX}" y="${height - 40}" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.max(12, width * 0.02)}">Powered by LingUBible</text>
</svg>`;
}

// 確保目錄存在
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ 創建目錄: ${dirPath}`);
  }
}

// 生成所有啟動畫面
function generateAllSplashScreens() {
  const splashDir = path.join(__dirname, '../public/splash');
  ensureDirectoryExists(splashDir);
  
  console.log('🎨 開始生成 PWA 啟動畫面...\n');
  
  splashScreenSizes.forEach(({ name, width, height, description }) => {
    const isLandscape = name.includes('landscape');
    const svgContent = generateSplashScreenSVG(width, height, isLandscape);
    const filePath = path.join(splashDir, `${name}.svg`);
    
    fs.writeFileSync(filePath, svgContent);
    console.log(`✅ ${name}.svg (${width}x${height}) - ${description}`);
  });
  
  console.log(`\n🎉 成功生成 ${splashScreenSizes.length} 個啟動畫面！`);
  console.log(`📁 文件位置: ${splashDir}`);
  
  // 生成使用說明
  generateUsageInstructions(splashDir);
}

// 生成使用說明
function generateUsageInstructions(splashDir) {
  const instructions = `# PWA 啟動畫面使用說明

## 文件說明
本目錄包含為 LingUBible PWA 生成的啟動畫面圖片，支援各種設備尺寸。

## 文件列表
${splashScreenSizes.map(({ name, width, height, description }) => 
  `- \`${name}.svg\` (${width}x${height}) - ${description}`
).join('\n')}

## 使用方法

### 1. 在 HTML 中引用 (iOS)
將 \`public/splash-screens.html\` 的內容添加到您的 \`index.html\` 的 \`<head>\` 部分。

### 2. 在 PWA Manifest 中配置 (Android)
Android 設備會自動使用 manifest 中的 \`background_color\` 和圖標。

### 3. 自定義啟動畫面組件
使用 \`PWASplashScreen\` 組件來顯示自定義的啟動動畫。

## 注意事項
- SVG 格式確保在所有設備上都有清晰的顯示效果
- 如需 PNG 格式，可使用工具將 SVG 轉換為對應尺寸的 PNG
- iOS 設備需要精確的尺寸匹配才能正確顯示啟動畫面

## 更新啟動畫面
如需修改設計，請編輯 \`scripts/generate-splash-screens.js\` 中的 SVG 模板，然後重新運行腳本。

生成時間: ${new Date().toLocaleString('zh-TW')}
`;

  fs.writeFileSync(path.join(splashDir, 'README.md'), instructions);
  console.log('📝 生成使用說明: splash/README.md');
}

// 執行生成
if (import.meta.url === `file://${process.argv[1]}`) {
  generateAllSplashScreens();
}

export {
  generateAllSplashScreens,
  generateSplashScreenSVG,
  splashScreenSizes
}; 