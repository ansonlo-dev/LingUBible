import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui-utils': ['clsx', 'tailwind-merge', 'class-variance-authority'],
          'radix-ui-1': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-select'
          ],
          'radix-ui-2': [
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-separator',
            '@radix-ui/react-switch',
            '@radix-ui/react-avatar'
          ],
          'radix-ui-3': [
            '@radix-ui/react-toast',
            '@radix-ui/react-slot'
          ],
          'icons': ['lucide-react'],
          'ui-misc': [
            'sonner',
            'next-themes',
            'react-hook-form',
            '@hookform/resolvers'
          ],
          'query': ['@tanstack/react-query'],
          'appwrite': ['appwrite'],
          'charts-date': ['date-fns', 'recharts'],
          'forms': ['zod']
        }
      }
    }
  },
}));
