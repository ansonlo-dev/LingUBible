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
    server: {
      host: "::",
      port: 8080,
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
      // Disable esbuild to prevent SIGBUS in Cloudflare Workers
      rollupOptions: {
        // 激進的 tree shaking
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
        },
        // 排除大型資源
        external: id => {
          if (id.includes('fonts/LXGWWenKai') && id.includes('.ttf')) return true;
          return false;
        },
        // Cloudflare 環境下使用更保守的並行設定
        maxParallelFileOps: isCloudflare ? 8 : 16,
        output: {
          // 最小化分塊 - 減少檔案數量以加速
          manualChunks: isProduction ? (id) => {
            // 只保留最重要的分塊
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) return 'react';
              if (id.includes('echarts')) return 'charts';
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
          // 壓縮設定
          compact: true,
          minifyInternalExports: true,
        }
      },
      // 極致性能設定
      chunkSizeWarningLimit: 2000, // 增加限制以減少警告
      reportCompressedSize: false, // 關閉大小報告
      cssCodeSplit: false, // 單一 CSS 檔案更快
      assetsInlineLimit: 8192, // 更多小檔案內聯
      write: true,
      emptyOutDir: true,
      assetsDir: 'assets',
      copyPublicDir: true,
      // 關閉所有分析功能以加速
      manifest: false,
      ssrManifest: false,
    },
    optimizeDeps: {
      // Vite 5.1+ 相容設定
      noDiscovery: isBuild,
      include: isBuild ? undefined : [
        'react',
        'react-dom', 
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
        // 構建時排除所有語言文件
        'src/locales/en.ts',
        'src/locales/zh-CN.ts', 
        'src/locales/zh-TW.ts'
      ],
      force: false,
      // 只在開發時掃描依賴
      entries: isBuild ? [] : ['src/main.tsx'],
    },
    // 條件式 esbuild 設定
    esbuild: skipMinify ? false : {
      target: 'es2020',
      legalComments: 'none',
      // 激進的最佳化
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true,
      keepNames: false,
      // 移除所有除錯程式碼
      drop: ['console', 'debugger'],
      // 使用更快的轉換
      treeShaking: true,
      // JSX 最佳化 
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
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
    clearScreen: false, // 減少終端輸出
    logLevel: 'warn', // 只顯示警告以減少日誌
    // 關閉不必要的功能
    experimental: {
      renderBuiltUrl: false,
    },
  };
});
