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
          // Simplified chunking strategy to avoid React splitting issues
          manualChunks: isProduction ? {
            'react-vendor': ['react', 'react-dom'],
            'router': ['react-router-dom'],
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-toast', 'lucide-react'],
            'query-vendor': ['@tanstack/react-query', 'appwrite'],
            'chart-vendor': ['echarts', 'echarts-for-react'],
            'utils': ['clsx', 'tailwind-merge', 'date-fns']
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
      exclude: ['@vite/client', '@vite/env'],
      // 啟用快取以加速重建
      force: false,
    },
    esbuild: {
      target: 'es2020',
      legalComments: 'none',
      drop: isProduction ? ['console', 'debugger'] : [],
      treeShaking: true,
      minifyIdentifiers: isProduction,
      minifySyntax: isProduction,
      minifyWhitespace: isProduction,
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
