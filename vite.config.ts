import path from 'node:path'
//import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifestFilename: 'site.webmanifest',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'android-chrome-192x192.png',
        'android-chrome-512x512.png',
        'android-chrome-192x192-maskable.png',
        'android-chrome-512x512-maskable.png',
      ],
      manifest: {
        name: 'BruxoControll',
        short_name: 'BruxoControll',
        description: 'Gestao de artes com clientes, pagamentos e prazos em um painel simples e rapido.',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/android-chrome-192x192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/android-chrome-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      },
    })
  ],
  resolve: {
    alias: {
       '@': path.resolve(__dirname, './src'),
      //'@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
