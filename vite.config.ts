import { defineConfig, defaultClientConditions, defaultServerConditions } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
// Migrated to Vite 7 - see https://vite.dev/guide/migration
export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production';
  const isDevelopment = mode === 'development';

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false, // 減少開發時的性能損耗
      },
    },
    plugins: [
      react({
        // 移除 emotion 配置，使用默認的 React JSX
        // jsxImportSource: isProduction ? '@emotion/react' : undefined,
      }),
      isDevelopment && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      // Vite 6: Explicitly set resolve conditions for better compatibility
      conditions: [...defaultClientConditions],
    },
    build: {
      outDir: 'dist',
      sourcemap: isDevelopment,
      // Vite 7: Updated browser target to 'baseline-widely-available'
      target: 'baseline-widely-available',
      minify: isProduction ? 'esbuild' : false, // 使用 esbuild 而不是 terser，速度更快
      rollupOptions: {
        treeshake: isProduction,
        maxParallelFileOps: 5, // 限制並行文件操作以避免資源競爭
        output: {
          // 簡化代碼分割以提高構建速度
          manualChunks: isProduction ? (id) => {
            // 第三方庫簡單分離
            if (id.includes('node_modules')) {
              // React 相關
              if (id.includes('react')) {
                return 'react-vendor';
              }
              // UI 和工具庫
              if (id.includes('@radix-ui') || id.includes('lucide-react') || 
                  id.includes('clsx') || id.includes('tailwind-merge')) {
                return 'ui-vendor';
              }
              // 後端和查詢
              if (id.includes('@tanstack') || id.includes('appwrite')) {
                return 'backend-vendor';
              }
              // 其他第三方庫
              return 'vendor';
            }
            
            // 只分離國際化文件
            if (id.includes('/locales/')) {
              const match = id.match(/\/locales\/([^/]+)\./);
              if (match) {
                return match[1]; // en, zh-CN, zh-TW
              }
            }
            
            // 默認應用代碼
            return 'index';
          } : undefined,
          chunkFileNames: isProduction ? 'assets/[name]-[hash].js' : 'assets/[name].js',
          entryFileNames: isProduction ? 'assets/[name]-[hash].js' : 'assets/[name].js',
          assetFileNames: isProduction ? 'assets/[name]-[hash].[ext]' : 'assets/[name].[ext]',
        }
      },
      chunkSizeWarningLimit: 1500, // 增加到 1.5MB，減少不必要的警告
      reportCompressedSize: false, // 關閉壓縮大小報告以加快構建速度
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        'lucide-react',
        'clsx',
        'tailwind-merge',
        'date-fns',
      ],
      exclude: ['@vite/client', '@vite/env'],
    },
    esbuild: {
      // Vite 7: Updated to align with new browser targets
      target: 'es2022',
      legalComments: 'none',
      // 生產環境移除 console
      drop: isProduction ? ['console', 'debugger'] : [],
      // 添加更多 esbuild 優化
      treeShaking: true,
      minifyIdentifiers: isProduction,
      minifySyntax: isProduction,
      minifyWhitespace: isProduction,
    },
    worker: {
      format: 'es',
    },
    // 性能優化
    define: {
      __DEV__: isDevelopment,
      __PROD__: isProduction,
    },
    // CSS 優化
    css: {
      devSourcemap: isDevelopment,
      // Vite 6: Enable CSS minification for SSR builds by default
      minify: isDevelopment,
    },
    // Vite 6: Configure JSON handling
    json: {
      stringify: 'auto', // New default in Vite 6
      namedExports: true,
    },
    // 預加載優化
    experimental: {
      renderBuiltUrl(filename) {
        // 為靜態資源添加緩存策略
        if (filename.endsWith('.js') || filename.endsWith('.css')) {
          return `/${filename}`;
        }
        return filename;
      },
    },
  };
});
