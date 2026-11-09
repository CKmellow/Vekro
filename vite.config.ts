import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { cspFor, renderNginxTemplate } from './src/app/csp'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    {
      // Strict CSP and referrer policy in the built app only: the dev server injects inline scripts.
      name: 'vekro-security-meta',
      apply: 'build',
      transformIndexHtml: (html) =>
        html.replace(
          '<meta charset="UTF-8" />',
          `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${cspFor(loadEnv(mode, process.cwd(), 'VITE_').VITE_ANCHOR_RPC_URL)}" />\n    <meta name="referrer" content="strict-origin-when-cross-origin" />`,
        ),
      // The web image's nginx header gets the same policy (#294): .deploy/ is git-ignored.
      closeBundle: () => {
        const template = readFileSync('deploy/nginx.conf.template', 'utf8')
        const rpcUrl = loadEnv(mode, process.cwd(), 'VITE_').VITE_ANCHOR_RPC_URL
        mkdirSync('.deploy', { recursive: true })
        writeFileSync('.deploy/default.conf.template', renderNginxTemplate(template, rpcUrl))
      },
    },
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Vekro',
        short_name: 'Vekro',
        description: "Escrow for social commerce. Your money stays safe until you've checked the item.",
        lang: 'en-KE',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#FBF9F4',
        theme_color: '#FBF9F4',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the app shell only (no fonts).
        globPatterns: ['**/*.{js,css,html,svg}', 'pwa-192.png'],
        navigateFallback: '/index.html',
        // API responses are never cached: they are personal and authenticated.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          { urlPattern: ({ url }) => url.pathname.startsWith('/api/'), handler: 'NetworkOnly' },
          {
            // Fonts are cached on first use instead of precached, to keep the first visit light on mobile data.
            urlPattern: ({ request }) => request.destination === 'font',
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  // The bundle budget (scripts/check-bundle-budget.mjs) reads the chunk graph from the manifest.
  build: { manifest: true },
  server: {
    // Same-origin API: the backend's session and CSRF cookies are host-only.
    proxy: {
      '/api': {
        target: process.env.VEKRO_API_TARGET ?? 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
}))
