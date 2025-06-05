#!/usr/bin/env node

/**
 * README 資產生成腳本
 * 生成 README.md 所需的基本視覺元素和佔位圖片
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 項目信息
const projectInfo = {
  name: 'Campus Comment Verse',
  tagline: '讓每一個評價，成為學習路上的明燈',
  description: '一個專為大學生打造的課程與講師評價平台',
  version: '1.0.0',
  author: 'ansonlo.dev'
};

// 顏色主題
const colors = {
  light: {
    background: 'f8fafc',
    text: '1e293b',
    primary: '3b82f6',
    secondary: '64748b'
  },
  dark: {
    background: '0f172a',
    text: 'e2e8f0',
    primary: '60a5fa',
    secondary: '94a3b8'
  }
};

// 生成佔位圖片 URL
function generatePlaceholderUrl(width, height, bgColor, textColor, text) {
  const encodedText = encodeURIComponent(text);
  return `https://via.placeholder.com/${width}x${height}/${bgColor}/${textColor}?text=${encodedText}`;
}

// 生成 README 資產配置
function generateReadmeAssets() {
  const assets = {
    // 主要預覽圖片
    previews: {
      lightTheme: generatePlaceholderUrl(
        800, 500, 
        colors.light.background, 
        colors.light.text,
        'Campus Comment Verse - Light Theme'
      ),
      darkTheme: generatePlaceholderUrl(
        800, 500, 
        colors.dark.background, 
        colors.dark.text,
        'Campus Comment Verse - Dark Theme'
      ),
      responsive: generatePlaceholderUrl(
        1200, 300, 
        colors.light.primary, 
        'ffffff',
        'Responsive Design | Desktop | Tablet | Mobile'
      )
    },

    // 功能展示圖片
    features: {
      courseReview: generatePlaceholderUrl(
        600, 400, 
        colors.light.background, 
        colors.light.text,
        'Course Review System'
      ),
      lecturerRating: generatePlaceholderUrl(
        600, 400, 
        colors.light.background, 
        colors.light.text,
        'Lecturer Rating System'
      ),
      smartSearch: generatePlaceholderUrl(
        600, 400, 
        colors.light.background, 
        colors.light.text,
        'Smart Search Function'
      ),
      multilingual: generatePlaceholderUrl(
        600, 400, 
        colors.light.background, 
        colors.light.text,
        'Multilingual Support'
      )
    },

    // 技術架構圖
    architecture: {
      techStack: generatePlaceholderUrl(
        800, 600, 
        'ffffff', 
        colors.light.text,
        'Technology Stack Architecture'
      ),
      projectStructure: generatePlaceholderUrl(
        800, 600, 
        'ffffff', 
        colors.light.text,
        'Project Structure Diagram'
      )
    },

    // 手機版截圖
    mobile: {
      homepage: generatePlaceholderUrl(
        300, 600, 
        colors.light.background, 
        colors.light.text,
        'Mobile Homepage'
      ),
      menu: generatePlaceholderUrl(
        300, 600, 
        colors.light.background, 
        colors.light.text,
        'Mobile Menu'
      ),
      review: generatePlaceholderUrl(
        300, 600, 
        colors.light.background, 
        colors.light.text,
        'Mobile Review'
      )
    }
  };

  return assets;
}

// 生成 SVG Logo
function generateSvgLogo() {
  return `<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 背景圓形 -->
  <circle cx="60" cy="60" r="55" fill="url(#logoGradient)" stroke="#ffffff" stroke-width="2"/>
  
  <!-- 書本圖標 -->
  <rect x="35" y="40" width="50" height="35" rx="3" fill="#ffffff" opacity="0.9"/>
  <rect x="38" y="43" width="44" height="29" rx="2" fill="#3b82f6"/>
  
  <!-- 評分星星 -->
  <polygon points="60,25 62,31 68,31 63,35 65,41 60,37 55,41 57,35 52,31 58,31" fill="#fbbf24"/>
  
  <!-- 對話氣泡 -->
  <circle cx="85" cy="45" r="12" fill="#ffffff" opacity="0.9"/>
  <polygon points="78,50 85,55 85,50" fill="#ffffff" opacity="0.9"/>
  <circle cx="85" cy="45" r="2" fill="#3b82f6"/>
  
  <!-- 文字 -->
  <text x="60" y="95" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#ffffff">CCV</text>
</svg>`;
}

// 生成 README 模板片段
function generateReadmeSnippets() {
  const assets = generateReadmeAssets();
  
  return {
    header: `<div align="center">

# 🎓 ${projectInfo.name}

### *${projectInfo.tagline}*

![Logo](public/assets/logo-banner.svg)

</div>`,

    badges: `[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.1-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Appwrite](https://img.shields.io/badge/Appwrite-18.1.1-FD366E?style=flat-square&logo=appwrite&logoColor=white)](https://appwrite.io/)`,

    preview: `## 📸 項目預覽

<div align="center">

### 🎨 現代化界面設計
*響應式設計，支援深色/淺色主題*

| 🌅 淺色主題 | 🌙 深色主題 |
|:---:|:---:|
| ![Light Theme](${assets.previews.lightTheme}) | ![Dark Theme](${assets.previews.darkTheme}) |

### 📱 多設備支援
*桌面、平板、手機完美適配*

![Responsive Design](${assets.previews.responsive})

</div>`
  };
}

// 創建目錄結構
function createDirectories() {
  const dirs = [
    'public/assets/screenshots/light-theme',
    'public/assets/screenshots/dark-theme',
    'public/assets/screenshots/mobile',
    'public/assets/screenshots/features',
    'public/assets/screenshots/architecture'
  ];

  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, '../../../', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
}

// 生成 Logo 文件
function generateLogoFiles() {
  const logoSvg = generateSvgLogo();
  const logoPath = path.join(__dirname, '../../../public/assets/logo-banner.svg');
  
  fs.writeFileSync(logoPath, logoSvg, 'utf8');
  console.log('✅ Generated logo file: public/assets/logo-banner.svg');
}

// 生成資產配置文件
function generateAssetsConfig() {
  const assets = generateReadmeAssets();
  const configPath = path.join(__dirname, '../../../tools/configs/readme-assets.json');
  
  // 確保配置目錄存在
  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  fs.writeFileSync(configPath, JSON.stringify(assets, null, 2), 'utf8');
  console.log('✅ Generated assets config: tools/configs/readme-assets.json');
}

// 生成 README 片段文件
function generateReadmeSnippetsFile() {
  const snippets = generateReadmeSnippets();
  const snippetsPath = path.join(__dirname, '../../../tools/configs/readme-snippets.md');
  
  const content = `# README 片段模板

## 標題區域
${snippets.header}

## 技術徽章
${snippets.badges}

## 項目預覽
${snippets.preview}

---

*此文件由 generate-readme-assets.js 自動生成*
*最後更新: ${new Date().toISOString()}*
`;

  fs.writeFileSync(snippetsPath, content, 'utf8');
  console.log('✅ Generated README snippets: tools/configs/readme-snippets.md');
}

// 主函數
function main() {
  console.log('🎨 Generating README assets...\n');
  
  try {
    // 創建目錄結構
    createDirectories();
    
    // 生成 Logo
    generateLogoFiles();
    
    // 生成配置文件
    generateAssetsConfig();
    
    // 生成 README 片段
    generateReadmeSnippetsFile();
    
    console.log('\n🎉 README assets generated successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Take actual screenshots of your application');
    console.log('2. Replace placeholder images with real screenshots');
    console.log('3. Update README.md with the generated snippets');
    console.log('4. Optimize images for web (compress, resize)');
    
  } catch (error) {
    console.error('❌ Error generating README assets:', error);
    process.exit(1);
  }
}

// 如果直接運行此腳本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  generateReadmeAssets,
  generateSvgLogo,
  generateReadmeSnippets,
  projectInfo,
  colors
}; 