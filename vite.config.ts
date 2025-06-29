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
      minify: isProduction ? 'terser' : false,
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info'],
        },
        mangle: {
          safari10: true,
        },
        // Vite 6: Ensure compatibility with terser 5.16.0+
        format: {
          comments: false,
        },
      } : undefined,
      rollupOptions: {
        treeshake: isProduction,
        output: {
          // 代碼分割優化
          manualChunks: isProduction ? {
            // 核心 React 庫
            'react-vendor': ['react', 'react-dom'],
            // 路由相關
            'router': ['react-router-dom'],
            // UI 組件庫
            'ui-vendor': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
              '@radix-ui/react-tooltip',
            ],
            // 數據查詢
            'query-vendor': ['@tanstack/react-query'],
            // 後端服務
            'backend-vendor': ['appwrite'],
            // 圖標庫
            'icons': ['lucide-react'],
            // 工具庫
            'utils': ['clsx', 'tailwind-merge', 'date-fns'],
          } : undefined,
          chunkFileNames: isProduction ? 'assets/[name]-[hash].js' : 'assets/[name].js',
          entryFileNames: isProduction ? 'assets/[name]-[hash].js' : 'assets/[name].js',
          assetFileNames: isProduction ? 'assets/[name]-[hash].[ext]' : 'assets/[name].[ext]',
        }
      },
      chunkSizeWarningLimit: 1000,
      reportCompressedSize: isProduction,
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
