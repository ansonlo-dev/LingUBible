import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
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
    VitePWA({
      registerType: 'autoUpdate',
      // 確保 PWA 在生產環境中啟用
      disable: false,
      // 使用 generateSW 策略，針對生產環境優化
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        // 確保 index.html 被正確 precache
        additionalManifestEntries: [
          {
            url: '/',
            revision: null
          },
          {
            url: '/index.html',
            revision: null
          }
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
        runtimeCaching: [
          // Google Fonts
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst' as const,
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst' as const,
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          // 圖標和圖片
          {
            urlPattern: /\.(ico|png|svg)$/,
            handler: 'CacheFirst' as const,
            options: {
              cacheName: 'icons-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          // API 請求 - 網絡優先
          {
            urlPattern: /^https:\/\/fra\.cloud\.appwrite\.io\/v1\/.*/i,
            handler: 'NetworkOnly' as const
          },
          {
            urlPattern: /^https:\/\/api\.ipify\.org\/.*/i,
            handler: 'NetworkOnly' as const
          },
          {
            urlPattern: /^https:\/\/api\.openstatus\.dev\/.*/i,
            handler: 'NetworkOnly' as const
          },
          // GitHub API - 網絡優先，失敗時不緩存
          {
            urlPattern: /^https:\/\/api\.github\.com\/.*/i,
            handler: 'NetworkOnly' as const
          },
          // 開發環境：忽略 Vite 相關請求
          ...(mode === 'development' ? [
            {
              urlPattern: /\/@vite\/|\/src\/|\/node_modules\/|\?t=|\.tsx?$/,
              handler: 'NetworkOnly' as const
            }
          ] : [])
        ],
        // 忽略不需要的文件
        globIgnores: [
          '**/dev/**',
          'pwa-test.html',
          'pwa-debug.html',
          'pwa-language-test.html',
          'pwa-install-test.html',
          'manifest.js',
          // 開發環境特定文件
          '**/@vite/**',
          '**/src/**',
          '**/node_modules/**',
          '**/?*',
          '**/*.map',
          // 忽略 service worker 相關文件
          'sw.js',
          'workbox-*.js',
          // 忽略開發環境的動態文件
          '**/*.tsx?t=*',
          '**/main.tsx?t=*',
          '**/@react-refresh',
          '**/@vite-plugin-pwa/**',
          '**/registerSW.js',
          '**/ping-worker.js',
          // 忽略測試和調試文件
          '**/test-*.html',
          '**/debug-*.html',
          '**/*-test.html',
          '**/hide-*.js',
          '**/hide-*.css',
          '**/badge-*.js',
          '**/recaptcha-*.js',
          '**/recaptcha-*.css',
          // 忽略佔位符檔案
          '**/screenshot-*-placeholder.svg'
        ]
      },
      // 生產環境的 manifest 配置
      manifest: {
        name: 'LingUBible - Course & Lecturer Reviews',
        short_name: 'LingUBible',
        description: 'Platform for college students to review courses and lecturers',
        theme_color: '#dc2626',
        background_color: '#ffffff',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        orientation: 'any',
        scope: '/',
        start_url: '/',
        id: '/',
        // 確保包含所有必要的圖標尺寸，符合 PWA 安裝要求
        icons: [
          {
            src: 'favicon-32.png',
            sizes: '32x32',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'favicon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'android/android-launchericon-192-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'android/android-launchericon-512-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ],
        // 添加截圖以提高安裝提示的顯示機率
        screenshots: [
          {
            src: 'screenshot-desktop.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Desktop view of LingUBible'
          },
          {
            src: 'screenshot-mobile.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Mobile view of LingUBible'
          }
        ],
        // 添加快捷方式
        shortcuts: [
          {
            name: 'Search Courses',
            short_name: 'Search',
            description: 'Search for courses and reviews',
            url: '/?action=search',
            icons: [
              {
                src: 'icon-search.png',
                sizes: '96x96',
                type: 'image/png'
              }
            ]
          },
          {
            name: 'My Reviews',
            short_name: 'Reviews',
            description: 'View my course reviews',
            url: '/?action=reviews',
            icons: [
              {
                src: 'icon-reviews.png',
                sizes: '96x96',
                type: 'image/png'
              }
            ]
          }
        ],
        categories: ['education', 'social', 'productivity'],
        lang: 'en',
        dir: 'ltr',
        // 添加 PWA 安裝提示相關配置
        prefer_related_applications: false
      },
      devOptions: {
        enabled: true,
        suppressWarnings: true,
        navigateFallback: 'index.html',
        navigateFallbackAllowlist: [/^(?!\/@vite|\/@react-refresh|\/src|\/node_modules).*/],
        type: 'module'
      },
      // 確保不阻止瀏覽器原生安裝提示
      injectRegister: 'auto',
      // 生產環境使用自定義 SW 文件名
      filename: mode === 'production' ? 'sw.js' : 'dev-sw.js',
      // 確保 PWA 安裝提示正常工作
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'android/*.png'],
      // 確保 manifest 正確生成
      useCredentials: false
    }),
    // 簡化的 manifest 處理，避免與 VitePWA 衝突
    {
      name: 'simple-manifest',
      configureServer(server: ViteDevServer) {
        server.middlewares.use('/manifest-dynamic.json', (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          // 解析查詢參數
          const url = new URL(req.url || '', `http://${req.headers.host}`);
          const lang = url.searchParams.get('lang') || 'en';
          
          // 動態生成 manifest
          const manifestTranslations: Record<string, any> = {
            'en': {
              name: 'LingUBible - Course & Lecturer Reviews',
              short_name: 'LingUBible',
              description: 'Your trusted course and lecturer review platform. Access honest reviews, make informed decisions about your courses, and share your experiences with fellow students. Get faster loading, offline access, and a native app experience.',
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
              description: '真實可靠的Reg科聖經，幫助同學們作出明智的選擇。瀏覽誠實的評價，分享您的課程體驗，享受更快的載入速度、離線存取和原生應用體驗。',
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
              description: '您诚实的课程和讲师评价平台，帮助同学们做出明智的决定。浏览诚实的评价，分享您的课程体验，享受更快的加载速度、离线访问和原生应用体验。',
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
                src: "/favicon-32.png",
                sizes: "32x32",
                type: "image/png",
                purpose: "any"
              },
              {
                src: "/favicon-96x96.png",
                sizes: "96x96",
                type: "image/png",
                purpose: "any"
              },
              {
                src: "/apple-touch-icon.png",
                sizes: "180x180",
                type: "image/png",
                purpose: "any"
              },
              {
                src: "/icon-192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any"
              },
              {
                src: "/android/android-launchericon-192-192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "maskable"
              },
              {
                src: "/icon-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any"
              },
              {
                src: "/android/android-launchericon-512-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable"
              },
              {
                src: "/favicon.svg",
                sizes: "any",
                type: "image/svg+xml",
                purpose: "any"
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
