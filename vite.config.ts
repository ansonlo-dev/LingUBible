import { defineConfig, defaultClientConditions } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
// Migrated to Vite 7 - see https://vite.dev/guide/migration
export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production';
  const isDevelopment = mode === 'development';
  const isBuild = command === 'build';
  const skipMinify = process.env.VITE_SKIP_MINIFY === 'true';
  const isCloudflare = process.env.CF_PAGES === '1' || process.env.CLOUDFLARE_ENV;

  return {
    publicDir: 'public',
    server: {
      host: "::",
      port: 8080,
      open: true,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      isDevelopment && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      conditions: [...defaultClientConditions],
    },
    build: {
      outDir: 'dist',
      sourcemap: isDevelopment,
      target: 'es2020',
      minify: skipMinify ? false : (isProduction ? 'esbuild' : false),
      rollupOptions: {
        input: './public/index.html',
        // 完全安全的 tree shaking - 保護所有關鍵模組
        treeshake: isProduction ? {
          moduleSideEffects: (id) => {
            // 保留所有 React 生態系統模組
            if (id.includes('react') || id.includes('scheduler') || 
                id.includes('react-dom') || id.includes('react/') ||
                id.includes('scheduler/')) return true;
            // 保留其他可能有副作用的模組
            if (id.includes('@radix-ui') || id.includes('lucide-react')) return true;
            return false;
          },
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
        } : false,
        // 排除大型資源
        external: id => {
          if (id.includes('fonts/LXGWWenKai') && id.includes('.ttf')) return true;
          return false;
        },
        // Cloudflare 環境下使用更保守的並行設定
        maxParallelFileOps: isCloudflare ? 8 : 16,
        output: {
          // 嚴格的分塊策略 - 確保 React 完整性
          manualChunks: isProduction ? (id) => {
            // 檢查完整路徑，確保 React 模組被正確識別
            if (id.includes('node_modules/react/') || 
                id.includes('node_modules/react-dom/') ||
                id.includes('node_modules/scheduler/') ||
                id.includes('/react/index') ||
                id.includes('/react-dom/index')) {
              return 'react-vendor';
            }
            if (id.includes('node_modules')) {
              if (id.includes('echarts')) return 'charts';
              if (id.includes('@radix-ui') || id.includes('lucide-react')) return 'ui';
              return 'vendor';
            }
            // 語言文件延遲載入
            if (id.includes('src/locales/')) return 'locale';
            return 'app';
          } : undefined,
          // 簡化檔名以加速
          chunkFileNames: '[name]-[hash:6].js',
          entryFileNames: '[name]-[hash:6].js', 
          assetFileNames: '[name]-[hash:6].[ext]',
          // 安全的壓縮設定 - 避免破壞模組結構
          compact: true,
          minifyInternalExports: false, // 禁用以避免破壞 React
        }
      },
      // 極致性能設定
      chunkSizeWarningLimit: 2000, // 增加限制以減少警告
      reportCompressedSize: isBuild, // 建置時顯示大小報告
      cssCodeSplit: false, // 單一 CSS 檔案更快
      assetsInlineLimit: 8192, // 更多小檔案內聯
      write: true,
      emptyOutDir: true,
      assetsDir: 'assets',
      copyPublicDir: true,
      // 建置時啟用清單以顯示詳細資訊
      manifest: isBuild,
      ssrManifest: false,
    },
    optimizeDeps: {
      // 建置時完全跳過，開發時保守處理
      noDiscovery: isBuild,
      include: isBuild ? undefined : [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-router-dom',
        '@tanstack/react-query',
        'lucide-react',
        'clsx',
        'tailwind-merge',
        'date-fns',
        'appwrite',
      ],
      exclude: [
        '@vite/client', 
        '@vite/env',
        // 排除語言文件
        'src/locales/en.ts',
        'src/locales/zh-CN.ts', 
        'src/locales/zh-TW.ts'
      ],
      force: false,
      entries: isBuild ? [] : ['src/main.tsx'],
      // 確保 React 預構建正確
      esbuildOptions: isBuild ? {} : {
        target: 'es2020',
        keepNames: true,
      },
    },
    // 安全的 esbuild 設定 - 避免破壞 React
    esbuild: skipMinify ? false : {
      target: 'es2020',
      legalComments: 'none',
      // 保守的最佳化設定
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true,
      keepNames: true, // 保留函數名稱以避免 React 問題
      // 只在生產環境移除 console
      drop: isProduction ? ['console'] : [],
      // 禁用可能有問題的最佳化
      treeShaking: false, // 讓 Rollup 處理
    },
    worker: {
      format: 'es',
    },
    define: {
      __DEV__: isDevelopment,
      __PROD__: isProduction,
    },
    css: {
      devSourcemap: isDevelopment,
      minify: isProduction,
    },
    json: {
      stringify: 'auto',
      namedExports: true,
    },
    // 極致快取和性能設定
    cacheDir: '.vite',
    clearScreen: !isBuild, // 建置時不清除螢幕以顯示進度
    logLevel: isBuild ? 'info' : 'warn', // 建置時顯示進度，開發時只顯示警告
    // 關閉不必要的功能
    experimental: {
      renderBuiltUrl: false,
    },
  };
});
