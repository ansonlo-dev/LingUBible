#!/usr/bin/env node

/**
 * 自動更新導入路徑腳本
 * 用於重構後更新所有文件的導入路徑
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 導入路徑映射
const importMappings = {
  // 組件映射
  '@/components/AuthModal': '@/components/auth/AuthModal',
  '@/components/StudentVerificationInput': '@/components/auth/StudentVerificationInput',
  '@/components/PasswordStrengthChecker': '@/components/auth/PasswordStrengthChecker',
  
  '@/components/Header': '@/components/layout/Header',
  '@/components/Footer': '@/components/layout/Footer',
  '@/components/AppSidebar': '@/components/layout/AppSidebar',
  '@/components/Sidebar': '@/components/layout/Sidebar',
  
  '@/components/UserMenu': '@/components/user/UserMenu',
  '@/components/AvatarCustomizer': '@/components/user/AvatarCustomizer',
  '@/components/AvatarSettings': '@/components/user/AvatarSettings',
  '@/components/UserStatsDisplay': '@/components/user/UserStatsDisplay',
  
  '@/components/ThemeToggle': '@/components/common/ThemeToggle',
  '@/components/LanguageSwitcher': '@/components/common/LanguageSwitcher',
  '@/components/SearchDialog': '@/components/common/SearchDialog',
  '@/components/DocumentHead': '@/components/common/DocumentHead',
  '@/components/ThemeProvider': '@/components/common/ThemeProvider',
  '@/components/CookieConsent': '@/components/common/CookieConsent',
  '@/components/OpenStatusWidget': '@/components/common/OpenStatusWidget',
  
  '@/components/ReviewCard': '@/components/features/reviews/ReviewCard',
  '@/components/CourseCard': '@/components/features/reviews/CourseCard',
  '@/components/LecturerCard': '@/components/features/reviews/LecturerCard',
  '@/components/StatsCard': '@/components/features/reviews/StatsCard',
  
  '@/components/PWAInstallBanner': '@/components/features/pwa/PWAInstallBanner',
  '@/components/PWAStatusIndicator': '@/components/features/pwa/PWAStatusIndicator',
  
  '@/components/FloatingCircles': '@/components/features/animations/FloatingCircles',
  '@/components/FloatingGlare': '@/components/features/animations/FloatingGlare',
  '@/components/RollingText': '@/components/features/animations/RollingText',
  
  '@/components/DevModeIndicator': '@/components/dev/DevModeIndicator',
  '@/components/PasswordDemo': '@/components/dev/PasswordDemo',
  
  // 頁面映射
  './pages/Login': './pages/auth/Login',
  './pages/Register': './pages/auth/Register',
  './pages/ForgotPassword': './pages/auth/ForgotPassword',
  
  './pages/UserSettings': './pages/user/UserSettings',
  './pages/AvatarDemo': './pages/user/AvatarDemo',
  
  './pages/LecturerDemo': './pages/demo/LecturerDemo',
  
  './pages/Terms': './pages/legal/Terms',
  './pages/Privacy': './pages/legal/Privacy',
  './pages/Contact': './pages/legal/Contact',
  
  // 服務映射
  '@/services/auth': '@/services/api/auth',
  '@/services/avatarService': '@/services/api/avatar',
  '@/services/UserStatsService': '@/services/api/userStats',
  '@/services/studentVerificationService': '@/services/external/studentVerification',
  
  // 工具映射
  '@/utils/usernameValidator': '@/utils/auth/usernameValidator',
  '@/utils/avatarUtils': '@/utils/ui/avatarUtils',
  
  // Hooks 映射
  '@/hooks/use-swipe-gesture': '@/hooks/ui/use-swipe-gesture',
};

/**
 * 更新文件中的導入路徑
 */
function updateImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // 更新導入路徑
    for (const [oldPath, newPath] of Object.entries(importMappings)) {
      const oldImportRegex = new RegExp(`from ['"]${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
      const newImport = `from "${newPath}"`;
      
      if (oldImportRegex.test(content)) {
        content = content.replace(oldImportRegex, newImport);
        hasChanges = true;
        console.log(`  ✅ ${oldPath} → ${newPath}`);
      }
    }
    
    // 如果有變更，寫回文件
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ 處理文件失敗: ${filePath}`, error.message);
    return false;
  }
}

/**
 * 遞歸處理目錄
 */
function processDirectory(dirPath, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  const items = fs.readdirSync(dirPath);
  let totalUpdated = 0;
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // 跳過 node_modules 和其他不需要的目錄
      if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
        totalUpdated += processDirectory(fullPath, extensions);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(fullPath);
      if (extensions.includes(ext)) {
        console.log(`🔍 檢查文件: ${path.relative(process.cwd(), fullPath)}`);
        if (updateImportsInFile(fullPath)) {
          totalUpdated++;
        }
      }
    }
  }
  
  return totalUpdated;
}

/**
 * 主函數
 */
function main() {
  console.log('🚀 開始更新導入路徑...\n');
  
  const srcPath = path.join(__dirname, '../../../src');
  const totalUpdated = processDirectory(srcPath);
  
  console.log(`\n🎉 完成！共更新了 ${totalUpdated} 個文件的導入路徑。`);
  
  if (totalUpdated > 0) {
    console.log('\n📝 建議執行以下命令檢查是否有錯誤：');
    console.log('npm run type-check');
    console.log('npm run build');
  }
}

main(); 