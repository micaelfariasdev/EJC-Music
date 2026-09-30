import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo_encontro.png', 'favicon.svg'],
      manifest: {
        name: 'EJC Music — Encontro de Jovens com Cristo',
        short_name: 'EJC Music',
        description: 'A biblioteca musical do Encontro de Jovens com Cristo.',
        lang: 'pt-BR',
        theme_color: '#101010',
        background_color: '#101010',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: '/logo_encontro.png', sizes: '615x563', type: 'image/png', purpose: 'any' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        runtimeCaching: [{
          urlPattern: ({ url }) => url.pathname.startsWith('/api/covers/'),
          handler: 'CacheFirst',
          options: { cacheName: 'ejc-covers', expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 } },
        }],
      },
    }),
  ],
  server: { proxy: { '/api': { target: 'http://localhost:3001', rewrite: (path) => path.replace(/^\/api/, '') } } },
})
