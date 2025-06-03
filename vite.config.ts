import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // 調整 chunk 大小警告限制
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // React 核心
          'react-vendor': ['react', 'react-dom'],
          
          // React Router
          'router': ['react-router-dom'],
          
          // Radix UI 組件 - 第一組
          'radix-ui-1': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-toast',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
            '@radix-ui/react-separator'
          ],
          
          // Radix UI 組件 - 第二組
          'radix-ui-2': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-popover',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-select'
          ],
          
          // Radix UI 組件 - 第三組
          'radix-ui-3': [
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-menubar',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-collapsible'
          ],
          
          // 圖標庫
          'icons': ['lucide-react'],
          
          // Appwrite SDK
          'appwrite': ['appwrite'],
          
          // React Query
          'query': ['@tanstack/react-query'],
          
          // 表單處理
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          
          // UI 工具庫
          'ui-utils': [
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
            'tailwindcss-animate'
          ],
          
          // 日期和圖表
          'charts-date': ['date-fns', 'recharts', 'react-day-picker'],
          
          // 其他 UI 組件
          'ui-misc': [
            'cmdk',
            'embla-carousel-react',
            'next-themes',
            'sonner',
            'vaul',
            'input-otp',
            'react-resizable-panels'
          ]
        }
      }
    }
  }
}));
