import { defineConfig, defaultClientConditions } from "vite";
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
      minify: isProduction ? 'esbuild' : false,
      // Disable esbuild to prevent SIGBUS in Cloudflare Workers
      rollupOptions: {
        treeshake: isProduction,
        // 排除大型字型檔案以加速建置
        external: id => {
          // 排除大型字型檔案，讓它們直接複製而不處理
          if (id.includes('fonts/LXGWWenKai') && id.includes('.ttf')) {
            return true;
          }
          return false;
        },
        output: {
          // Enhanced chunking strategy for better build performance
          manualChunks: isProduction ? (id) => {
            // 語言文件單獨分塊以加速構建
            if (id.includes('src/locales/en.ts')) return 'en';
            if (id.includes('src/locales/zh-CN.ts')) return 'zh-CN';
            if (id.includes('src/locales/zh-TW.ts')) return 'zh-TW';
            
            // 其他 vendor 分塊
            if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
            if (id.includes('react-router-dom')) return 'router';
            if (id.includes('@radix-ui') || id.includes('lucide-react')) return 'ui-vendor';
            if (id.includes('@tanstack/react-query') || id.includes('appwrite')) return 'query-vendor';
            if (id.includes('echarts')) return 'chart-vendor';
            if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('date-fns')) return 'utils';
          } : undefined,
          chunkFileNames: isProduction ? 'assets/[name]-[hash].js' : 'assets/[name].js',
          entryFileNames: isProduction ? 'assets/[name]-[hash].js' : 'assets/[name].js',
          assetFileNames: isProduction ? 'assets/[name]-[hash].[ext]' : 'assets/[name].[ext]',
        }
      },
      chunkSizeWarningLimit: 1500,
      reportCompressedSize: false, // 關閉壓縮大小報告以加速建置
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
      // 優化建置性能
      write: true,
      emptyOutDir: true,
      // 排除字型資料夾以加速建置
      assetsDir: 'assets',
      copyPublicDir: true,
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
        'appwrite',
      ],
      exclude: [
        '@vite/client', 
        '@vite/env',
        // 排除語言文件以加速構建
        'src/locales/en.ts',
        'src/locales/zh-CN.ts', 
        'src/locales/zh-TW.ts'
      ],
      // 啟用快取以加速重建
      force: false,
      // Disable esbuild options completely to prevent SIGBUS
      // esbuildOptions disabled for Cloudflare Workers compatibility
    },
    // Optimized esbuild settings for speed and Cloudflare Workers compatibility
    esbuild: {
      target: 'es2020',
      legalComments: 'none',
      // Enable safe minification options
      minifyIdentifiers: isProduction,
      minifySyntax: isProduction,
      minifyWhitespace: isProduction,
      // Avoid problematic options that can cause SIGBUS
      keepNames: false,
      drop: isProduction ? ['console', 'debugger'] : [],
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
    // 啟用快取以加速重建
    cacheDir: '.vite',
  };
});
