import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // Proxy target: sempre usa VITE_API_URL (ex: https://app.reidooculos.online/api -> https://app.reidooculos.online)
    const apiUrl = env.VITE_API_URL ?? '';
    const proxyTarget = apiUrl ? apiUrl.replace(/\/api\/?$/, '') : '';
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        historyApiFallback: true,
        proxy: {
          '/api': {
            target: proxyTarget,
            changeOrigin: true,
          },
          '/storage': {
            target: proxyTarget,
            changeOrigin: true,
          },
        },
      },
      preview: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
          manifest: {
            name: 'Rei do Óculos - Sistema de Gestão',
            short_name: 'Rei do Óculos',
            description: 'Sistema completo de gestão para óticas - PDV, Estoque, Financeiro, Ordens de Serviço e muito mais',
            theme_color: '#dc2626',
            background_color: '#ffffff',
            display: 'standalone',
            orientation: 'portrait-primary',
            scope: '/',
            start_url: '/',
            icons: [
              {
                src: '/icons/icon-72x72.png',
                sizes: '72x72',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/icons/icon-96x96.png',
                sizes: '96x96',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/icons/icon-128x128.png',
                sizes: '128x128',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/icons/icon-144x144.png',
                sizes: '144x144',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/icons/icon-152x152.png',
                sizes: '152x152',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/icons/icon-384x384.png',
                sizes: '384x384',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ],
            shortcuts: [
              {
                name: 'PDV',
                short_name: 'PDV',
                description: 'Abrir Ponto de Venda',
                url: '/pdv',
                icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }]
              },
              {
                name: 'Dashboard',
                short_name: 'Dashboard',
                description: 'Ver Dashboard',
                url: '/',
                icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }]
              }
            ],
            categories: ['business', 'productivity', 'finance']
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB (aumentado de 2 MB padrão)
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/cdn\.tailwindcss\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'tailwind-cache',
                  expiration: {
                    maxEntries: 1,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
                  }
                }
              },
              {
                urlPattern: /^https:\/\/esm\.sh\/.*/i,
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'esm-cache',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 * 7 // 7 dias
                  }
                }
              },
              {
                urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'images-cache',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
                  }
                }
              }
            ]
          },
          devOptions: {
            enabled: true,
            type: 'module'
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              // Separar vendor chunks grandes
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              'chart-vendor': ['chart.js', 'react-chartjs-2'],
              'ui-vendor': ['lucide-react'],
              'utils-vendor': ['axios', 'zod', 'clsx', 'tailwind-merge'],
            },
            // Aumentar limite de aviso de chunk size
            chunkSizeWarningLimit: 1000, // 1 MB
          },
        },
        // Otimizações adicionais
        chunkSizeWarningLimit: 1000,
      }
    };
});
