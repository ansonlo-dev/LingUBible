#!/usr/bin/env node

/**
 * 多語言文檔生成腳本
 * 此腳本幫助創建多語言版本的文檔結構
 */

const fs = require('fs');
const path = require('path');

// 支援的語言
const languages = {
  'en': 'English',
  'zh-TW': '繁體中文', 
  'zh-CN': '简体中文'
};

// 文檔資料夾結構
const docStructure = [
  'setup',
  'features', 
  'deployment',
  'testing'
];

// 語言選擇器模板
const languageBadges = {
  'en': '[![English](https://img.shields.io/badge/Language-English-blue)](README.md)',
  'zh-TW': '[![繁體中文](https://img.shields.io/badge/Language-繁體中文-red)](../zh-TW/README.md)',
  'zh-CN': '[![简体中文](https://img.shields.io/badge/Language-简体中文-green)](../zh-CN/README.md)'
};

// 為每個語言創建文檔結構
function createDocStructure() {
  const docsDir = path.join(__dirname, '../../../docs');
  
  // 為每種語言創建資料夾結構
  Object.keys(languages).forEach(lang => {
    if (lang === 'en') return; // 英文文檔在根目錄
    
    const langDir = path.join(docsDir, lang);
    
    // 創建語言目錄
    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir, { recursive: true });
    }
    
    // 創建子目錄
    docStructure.forEach(subDir => {
      const subDirPath = path.join(langDir, subDir);
      if (!fs.existsSync(subDirPath)) {
        fs.mkdirSync(subDirPath, { recursive: true });
      }
    });
  });
}

// 創建文檔索引模板
function createDocIndex(lang) {
  const isEnglish = lang === 'en';
  const pathPrefix = isEnglish ? '' : '../';
  
  const badges = [
    `[![English](https://img.shields.io/badge/Language-English-blue)](${pathPrefix}README.md)`,
    `[![繁體中文](https://img.shields.io/badge/Language-繁體中文-red)](${isEnglish ? 'zh-TW/' : '../zh-TW/'}README.md)`,
    `[![简体中文](https://img.shields.io/badge/Language-简体中文-green)](${isEnglish ? 'zh-CN/' : '../zh-CN/'}README.md)`
  ].join('\n');
  
  const content = {
    'en': `# 📚 LingUBible Documentation

${badges}

Welcome to the LingUBible project documentation!

## 🌍 Language / 語言

- **English** - [Documentation](${isEnglish ? '.' : '../'})
- **繁體中文** - [文檔](${isEnglish ? 'zh-TW/' : '../zh-TW/'})
- **简体中文** - [文档](${isEnglish ? 'zh-CN/' : '../zh-CN/'})

## 📁 Documentation Structure

### 🔧 [setup/](./setup/) - Setup & Configuration
### ⚡ [features/](./features/) - Features Documentation  
### 🚀 [deployment/](./deployment/) - Deployment Guides
### 🧪 [testing/](./testing/) - Testing Documentation

---

📝 **Note**: All documentation is continuously updated. Please ensure you're viewing the latest version.`,

    'zh-TW': `# 📚 LingUBible 文檔

${badges}

歡迎來到 LingUBible 專案文檔！

## 🌍 語言選擇

- **English** - [Documentation](${isEnglish ? '.' : '../'})
- **繁體中文** - [文檔](${isEnglish ? 'zh-TW/' : '.'})
- **简体中文** - [文档](${isEnglish ? 'zh-CN/' : '../zh-CN/'})

## 📁 文檔結構

### 🔧 [setup/](./setup/) - 設置與配置
### ⚡ [features/](./features/) - 功能說明
### 🚀 [deployment/](./deployment/) - 部署指南  
### 🧪 [testing/](./testing/) - 測試文檔

---

📝 **注意**：所有文檔都會持續更新，請確保查看最新版本。`,

    'zh-CN': `# 📚 LingUBible 文档

${badges}

欢迎来到 LingUBible 项目文档！

## 🌍 语言选择

- **English** - [Documentation](${isEnglish ? '.' : '../'})
- **繁體中文** - [文檔](${isEnglish ? 'zh-TW/' : '../zh-TW/'})
- **简体中文** - [文档](${isEnglish ? 'zh-CN/' : '.'})

## 📁 文档结构

### 🔧 [setup/](./setup/) - 设置与配置
### ⚡ [features/](./features/) - 功能说明
### 🚀 [deployment/](./deployment/) - 部署指南
### 🧪 [testing/](./testing/) - 测试文档

---

📝 **注意**：所有文档都会持续更新，请确保查看最新版本。`
  };
  
  return content[lang];
}

// 主函數
function main() {
  console.log('🌍 Creating multilingual documentation structure...');
  
  // 創建目錄結構
  createDocStructure();
  
  // 為每種語言創建文檔索引
  Object.keys(languages).forEach(lang => {
    const content = createDocIndex(lang);
    const filePath = lang === 'en' 
      ? path.join(__dirname, '../../../docs/README.md')
      : path.join(__dirname, `../../../docs/${lang}/README.md`);
    
    // 只有在文件不存在時才創建
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Created ${lang} documentation index`);
    } else {
      console.log(`⚠️  ${lang} documentation index already exists, skipping...`);
    }
  });
  
  console.log('🎉 Multilingual documentation structure created successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Translate existing documentation files');
  console.log('2. Update cross-references between language versions');
  console.log('3. Add language badges to all documentation files');
}

if (require.main === module) {
  main();
}

module.exports = {
  createDocStructure,
  createDocIndex,
  languages,
  docStructure
}; 