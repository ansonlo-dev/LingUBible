#!/usr/bin/env node

/**
 * 英文文檔生成腳本
 * 此腳本幫助創建英文版本的文檔模板
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 文檔映射 - 中文標題到英文標題的映射
const docTitleMapping = {
  // Setup documents
  'DEV_MODE_SETUP.md': 'Development Mode Setup Guide',
  'APPWRITE_DEV_MODE_SETUP.md': 'Appwrite Development Mode Setup',
  'ENVIRONMENT_VARIABLES_SETUP.md': 'Environment Variables Setup',
  'AUTO_VERIFICATION_SETUP.md': 'Auto Verification Setup',
  'STUDENT_EMAIL_VERIFICATION_SETUP.md': 'Student Email Verification Setup',
  'CLEANUP_FUNCTION_SETUP.md': 'Cleanup Function Setup',
  
  // Features documents
  'AVATAR_SYSTEM.md': 'Avatar System',
  'EMAIL_TEMPLATE_SYSTEM.md': 'Email Template System',
  'PASSWORD_SECURITY_FEATURES.md': 'Password Security Features',
  'MULTILINGUAL_IMPLEMENTATION.md': 'Multilingual Implementation',
  'OPENSTATUS_BADGE_USAGE.md': 'OpenStatus Badge Usage',
  'AVATAR_FLICKER_FIX.md': 'Avatar Flicker Fix',
  'VERIFICATION_SECURITY.md': 'Verification Security',
  
  // Deployment documents
  'APPWRITE_GIT_DEPLOYMENT_GUIDE.md': 'Appwrite Git Deployment Guide',
  'DEPLOYMENT_SUCCESS_GUIDE.md': 'Deployment Success Guide',
  
  // Testing documents
  'DEV_MODE_TESTING_GUIDE.md': 'Development Mode Testing Guide'
};

// 生成語言徽章
function generateLanguageBadges(currentFile, category = '') {
  const pathPrefix = category ? `../${category}/` : '';
  return [
    `[![English](https://img.shields.io/badge/Language-English-blue)](${currentFile})`,
    `[![繁體中文](https://img.shields.io/badge/Language-繁體中文-red)](../zh-TW/${pathPrefix}${currentFile})`,
    `[![简体中文](https://img.shields.io/badge/Language-简体中文-green)](../zh-CN/${pathPrefix}${currentFile})`
  ].join('\n');
}

// 創建英文文檔模板
function createEnglishDocTemplate(filename, category, title) {
  const badges = generateLanguageBadges(filename, category);
  
  return `# ${title}

${badges}

## Overview

This document provides information about ${title.toLowerCase()}.

> **Note**: This is an English template. Please translate the content from the Traditional Chinese version located at \`docs/zh-TW/${category}/${filename}\`.

## Quick Start

[Add quick start instructions here]

## Configuration

[Add configuration details here]

## Usage

[Add usage instructions here]

## Troubleshooting

[Add troubleshooting information here]

## Support

If you encounter any issues, please:
1. Check the troubleshooting section above
2. Review the Traditional Chinese documentation for more details
3. Create an issue on GitHub

---

**Translation needed**: This document needs to be translated from the Traditional Chinese version. Please refer to \`docs/zh-TW/${category}/${filename}\` for the complete content.`;
}

// 主函數
function main() {
  console.log('📝 Creating English documentation templates...');
  
  const categories = ['setup', 'features', 'deployment', 'testing'];
  
  categories.forEach(category => {
    const categoryPath = path.join(__dirname, `../../../docs/${category}`);
    
    if (!fs.existsSync(categoryPath)) {
      console.log(`⚠️  Category directory not found: ${category}`);
      return;
    }
    
    // 讀取分類目錄中的文件
    const files = fs.readdirSync(categoryPath).filter(file => file.endsWith('.md'));
    
    files.forEach(file => {
      const filePath = path.join(categoryPath, file);
      const title = docTitleMapping[file] || file.replace('.md', '').replace(/_/g, ' ');
      
      // 檢查文件是否已經是英文版本（包含語言徽章）
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('Language-English-blue')) {
        console.log(`✅ ${category}/${file} already has language badges (likely English)`);
        return;
      }
      
      // 創建英文模板
      const template = createEnglishDocTemplate(file, category, title);
      
      // 備份原始文件（如果需要）
      const backupPath = path.join(categoryPath, `${file}.zh-TW.backup`);
      if (!fs.existsSync(backupPath)) {
        fs.writeFileSync(backupPath, content);
        console.log(`📋 Backed up original ${category}/${file} to ${file}.zh-TW.backup`);
      }
      
      // 寫入英文模板
      fs.writeFileSync(filePath, template);
      console.log(`📝 Created English template for ${category}/${file}`);
    });
  });
  
  console.log('\n🎉 English documentation templates created successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Review and translate the content from Traditional Chinese versions');
  console.log('2. Update the templates with actual content');
  console.log('3. Remove the "Translation needed" notes when complete');
  console.log('4. Test all internal links');
}

main(); 