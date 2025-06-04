import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    // 添加自定義插件處理 manifest 請求
    {
      name: 'dynamic-manifest',
      configureServer(server: ViteDevServer) {
        server.middlewares.use('/manifest.json', (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          // 解析查詢參數
          const url = new URL(req.url || '', `http://${req.headers.host}`);
          const lang = url.searchParams.get('lang') || 'en';
          
          // 動態生成 manifest
          const manifestTranslations: Record<string, any> = {
            'en': {
              name: 'LingUBible - Course & Lecturer Reviews',
              short_name: 'LingUBible',
              description: 'Platform for college students to review courses and lecturers',
              lang: 'en',
              dir: 'ltr',
              screenshots: {
                desktop: 'Desktop view of LingUBible',
                mobile: 'Mobile view of LingUBible'
              },
              shortcuts: {
                search: {
                  name: 'Search Courses',
                  short_name: 'Search',
                  description: 'Search for courses and reviews'
                },
                reviews: {
                  name: 'My Reviews',
                  short_name: 'Reviews',
                  description: 'View my course reviews'
                }
              }
            },
            'zh-TW': {
              name: 'LingUBible - 課程與講師評價平台',
              short_name: 'LingUBible',
              description: '真實可靠的Reg科聖經，幫助同學們作出明智的選擇',
              lang: 'zh-TW',
              dir: 'ltr',
              screenshots: {
                desktop: 'LingUBible 桌面版視圖',
                mobile: 'LingUBible 手機版視圖'
              },
              shortcuts: {
                search: {
                  name: '搜尋課程',
                  short_name: '搜尋',
                  description: '搜尋課程和評價'
                },
                reviews: {
                  name: '我的評價',
                  short_name: '評價',
                  description: '查看我的課程評價'
                }
              }
            },
            'zh-CN': {
              name: 'LingUBible - 课程与讲师评价平台',
              short_name: 'LingUBible',
              description: '您诚实的课程和讲师评价平台，帮助同学们做出明智的决定',
              lang: 'zh-CN',
              dir: 'ltr',
              screenshots: {
                desktop: 'LingUBible 桌面版视图',
                mobile: 'LingUBible 手机版视图'
              },
              shortcuts: {
                search: {
                  name: '搜索课程',
                  short_name: '搜索',
                  description: '搜索课程和评价'
                },
                reviews: {
                  name: '我的评价',
                  short_name: '评价',
                  description: '查看我的课程评价'
                }
              }
            }
          };

          const translation = manifestTranslations[lang] || manifestTranslations['en'];
          
          const manifest = {
            name: translation.name,
            short_name: translation.short_name,
            description: translation.description,
            start_url: "/",
            scope: "/",
            display: "standalone",
            display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
            background_color: "#ffffff",
            theme_color: "#dc2626",
            orientation: "any",
            prefer_related_applications: false,
            icons: [
              {
                src: "/favicon.svg?v=2",
                sizes: "32x32",
                type: "image/svg+xml",
                purpose: "any"
              },
              {
                src: "/favicon-32.png?v=2",
                sizes: "32x32",
                type: "image/png",
                purpose: "any"
              },
              {
                src: "/apple-touch-icon.svg?v=2",
                sizes: "180x180",
                type: "image/svg+xml",
                purpose: "any"
              },
              {
                src: "/apple-touch-icon.png?v=2",
                sizes: "180x180",
                type: "image/png",
                purpose: "any"
              },
              {
                src: "/icon-192.png?v=2",
                sizes: "192x192",
                type: "image/png",
                purpose: "any"
              },
              {
                src: "/logo.svg?v=2",
                sizes: "192x192",
                type: "image/svg+xml",
                purpose: "any maskable"
              },
              {
                src: "/icon-512.png?v=2",
                sizes: "512x512",
                type: "image/png",
                purpose: "any"
              },
              {
                src: "/logo.svg?v=2",
                sizes: "512x512",
                type: "image/svg+xml",
                purpose: "any maskable"
              }
            ],
            screenshots: [
              {
                src: "/screenshot-desktop.png",
                sizes: "1280x720",
                type: "image/png",
                form_factor: "wide",
                label: translation.screenshots.desktop
              },
              {
                src: "/screenshot-mobile.png",
                sizes: "390x844",
                type: "image/png",
                form_factor: "narrow",
                label: translation.screenshots.mobile
              }
            ],
            shortcuts: [
              {
                name: translation.shortcuts.search.name,
                short_name: translation.shortcuts.search.short_name,
                description: translation.shortcuts.search.description,
                url: "/?action=search",
                icons: [
                  {
                    src: "/icon-search.png",
                    sizes: "96x96",
                    type: "image/png"
                  }
                ]
              },
              {
                name: translation.shortcuts.reviews.name,
                short_name: translation.shortcuts.reviews.short_name,
                description: translation.shortcuts.reviews.description,
                url: "/?action=reviews",
                icons: [
                  {
                    src: "/icon-reviews.png",
                    sizes: "96x96",
                    type: "image/png"
                  }
                ]
              }
            ],
            categories: ["education", "social", "productivity"],
            lang: translation.lang,
            dir: translation.dir,
            edge_side_panel: {
              preferred_width: 400
            },
            launch_handler: {
              client_mode: "navigate-existing"
            },
            handle_links: "preferred",
            protocol_handlers: [
              {
                protocol: "web+lingubible",
                url: "/?handler=%s"
              }
            ]
          };

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(JSON.stringify(manifest, null, 2));
        });
      }
    }
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
