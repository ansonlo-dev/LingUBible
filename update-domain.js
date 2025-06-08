#!/usr/bin/env node

/**
 * 更新 meta 標籤中的域名
 * 使用方法: node update-domain.js your-actual-domain.com
 */

const fs = require('fs');
const path = require('path');

// 獲取命令行參數
const newDomain = process.argv[2];

if (!newDomain) {
  console.error('❌ 請提供您的域名');
  console.log('使用方法: node update-domain.js your-domain.com');
  console.log('例如: node update-domain.js lingubible.com');
  process.exit(1);
}

// 驗證域名格式
const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
if (!domainRegex.test(newDomain)) {
  console.error('❌ 域名格式不正確');
  console.log('請提供有效的域名，例如: example.com');
  process.exit(1);
}

const indexPath = path.join(__dirname, 'index.html');

try {
  // 讀取 index.html
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // 替換所有的 your-domain.com
  const updatedContent = content.replace(/https:\/\/your-domain\.com/g, `https://${newDomain}`);
  
  // 檢查是否有變更
  if (content === updatedContent) {
    console.log('⚠️  沒有找到需要替換的域名佔位符');
    console.log('可能域名已經更新過了');
    process.exit(0);
  }
  
  // 寫回文件
  fs.writeFileSync(indexPath, updatedContent, 'utf8');
  
  console.log('✅ 域名更新成功！');
  console.log(`🔗 新域名: ${newDomain}`);
  console.log('📝 已更新的文件: index.html');
  console.log('');
  console.log('📋 接下來的步驟:');
  console.log('1. 確保 meta-image.png 文件已上傳到您的網站根目錄');
  console.log('2. 測試 meta 標籤是否正常工作:');
  console.log(`   - Facebook: https://developers.facebook.com/tools/debug/?q=https://${newDomain}`);
  console.log(`   - Twitter: https://cards-dev.twitter.com/validator`);
  console.log(`   - LinkedIn: https://www.linkedin.com/post-inspector/`);
  
} catch (error) {
  console.error('❌ 更新失敗:', error.message);
  process.exit(1);
} 