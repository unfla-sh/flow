import { readFileSync } from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

// https://vite.dev/config/
export default defineConfig({
  // For GitHub Pages project sites the app is served from /<repo>/; the deploy
  // workflow passes BASE_PATH. Defaults to '/' for local dev and user/org pages.
  base: process.env.BASE_PATH || '/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        // Marketing landing page at `/`
        main: path.resolve(__dirname, 'index.html'),
        // The editor SPA at `/app/`
        app: path.resolve(__dirname, 'app/index.html'),
      },
    },
  },
  server: {
    // allow access through Cloudflare quick tunnels
    allowedHosts: ['.trycloudflare.com'],
  },
})
