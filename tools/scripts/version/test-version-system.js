#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 顏色輸出函數
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

// 測試函數
async function testVersionSystem() {
  console.log(colors.bold(colors.blue('🧪 版本管理系統測試\n')));

  const tests = [
    {
      name: '檢查 package.json 版本格式',
      test: () => {
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const version = packageJson.version;
        const versionRegex = /^\d+\.\d+\.\d+$/;
        return {
          success: versionRegex.test(version),
          message: `當前版本: ${version}`,
          details: versionRegex.test(version) ? '版本格式正確' : '版本格式不正確'
        };
      }
    },
    {
      name: '檢查版本更新腳本',
      test: async () => {
        try {
          const scriptPath = path.join(__dirname, 'update-version.js');
          const scriptExists = fs.existsSync(scriptPath);
          const scriptContent = fs.readFileSync(scriptPath, 'utf8');
          const hasESModules = scriptContent.includes('import') && !scriptContent.includes('require(');
          
          return {
            success: scriptExists && hasESModules,
            message: '版本更新腳本檢查',
            details: scriptExists ? (hasESModules ? '使用 ES 模組語法' : '仍使用 CommonJS 語法') : '腳本不存在'
          };
        } catch (error) {
          return {
            success: false,
            message: '版本更新腳本檢查',
            details: `錯誤: ${error.message}`
          };
        }
      }
    },
    {
      name: '檢查手動發布腳本',
      test: async () => {
        try {
          const scriptPath = path.join(__dirname, 'manual-release.js');
          const scriptExists = fs.existsSync(scriptPath);
          const scriptContent = fs.readFileSync(scriptPath, 'utf8');
          const hasESModules = scriptContent.includes('import') && !scriptContent.includes('require(');
          
          return {
            success: scriptExists && hasESModules,
            message: '手動發布腳本檢查',
            details: scriptExists ? (hasESModules ? '使用 ES 模組語法' : '仍使用 CommonJS 語法') : '腳本不存在'
          };
        } catch (error) {
          return {
            success: false,
            message: '手動發布腳本檢查',
            details: `錯誤: ${error.message}`
          };
        }
      }
    },
    {
      name: '檢查 GitHub Actions 工作流程',
      test: () => {
        const autoVersionPath = path.join(process.cwd(), '.github/workflows/auto-version.yml');
        const releasePath = path.join(process.cwd(), '.github/workflows/release.yml');
        
        const autoVersionExists = fs.existsSync(autoVersionPath);
        const releaseExists = fs.existsSync(releasePath);
        
        return {
          success: autoVersionExists && releaseExists,
          message: 'GitHub Actions 工作流程',
          details: `自動版本: ${autoVersionExists ? '✓' : '✗'}, 發布流程: ${releaseExists ? '✓' : '✗'}`
        };
      }
    },
    {
      name: '檢查 GitHub API 服務',
      test: () => {
        const githubServicePath = path.join(process.cwd(), 'src/services/api/github.ts');
        const serviceExists = fs.existsSync(githubServicePath);
        
        if (serviceExists) {
          const serviceContent = fs.readFileSync(githubServicePath, 'utf8');
          const hasCorrectRepo = serviceContent.includes('ansonlo') && serviceContent.includes('LingUBible');
          
          return {
            success: hasCorrectRepo,
            message: 'GitHub API 服務',
            details: hasCorrectRepo ? '倉庫設定正確' : '倉庫設定需要檢查'
          };
        }
        
        return {
          success: false,
          message: 'GitHub API 服務',
          details: '服務檔案不存在'
        };
      }
    },
    {
      name: '檢查版本 Hook',
      test: () => {
        const hookPath = path.join(process.cwd(), 'src/hooks/useVersion.ts');
        const hookExists = fs.existsSync(hookPath);
        
        return {
          success: hookExists,
          message: '版本管理 Hook',
          details: hookExists ? 'Hook 檔案存在' : 'Hook 檔案不存在'
        };
      }
    },
    {
      name: '檢查 NPM 腳本',
      test: () => {
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const scripts = packageJson.scripts;
        
        const requiredScripts = [
          'version:patch',
          'version:minor', 
          'version:major',
          'release:patch',
          'release:minor',
          'release:major'
        ];
        
        const missingScripts = requiredScripts.filter(script => !scripts[script]);
        
        return {
          success: missingScripts.length === 0,
          message: 'NPM 腳本設定',
          details: missingScripts.length === 0 ? '所有腳本都已設定' : `缺少腳本: ${missingScripts.join(', ')}`
        };
      }
    }
  ];

  let passedTests = 0;
  const totalTests = tests.length;

  for (const test of tests) {
    try {
      const result = await test.test();
      const status = result.success ? colors.green('✓ PASS') : colors.red('✗ FAIL');
      console.log(`${status} ${test.name}`);
      console.log(`   ${colors.cyan(result.message)}: ${result.details}`);
      
      if (result.success) {
        passedTests++;
      }
      
      console.log('');
    } catch (error) {
      console.log(`${colors.red('✗ ERROR')} ${test.name}`);
      console.log(`   ${colors.red('錯誤:')} ${error.message}`);
      console.log('');
    }
  }

  // 顯示測試結果摘要
  console.log(colors.bold('📊 測試結果摘要:'));
  console.log(`   通過: ${colors.green(passedTests)}/${totalTests}`);
  console.log(`   失敗: ${colors.red(totalTests - passedTests)}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log(colors.green('\n🎉 所有測試通過！版本管理系統已準備就緒。'));
  } else {
    console.log(colors.yellow('\n⚠️  部分測試失敗，請檢查上述問題。'));
  }

  // 顯示使用建議
  console.log(colors.bold('\n💡 使用建議:'));
  console.log('   1. 推送代碼到 main 分支將自動更新版本');
  console.log('   2. 使用 npm run release:patch 手動發布');
  console.log('   3. 在 commit 訊息中添加 [skip version] 跳過自動更新');
  console.log('   4. 查看頁腳的版本號，應該會從 GitHub 獲取最新版本');
}

// 執行測試
testVersionSystem().catch(error => {
  console.error(colors.red('測試執行失敗:'), error);
  process.exit(1);
}); 