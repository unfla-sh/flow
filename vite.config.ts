import { readFileSync } from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

// https://vite.dev/config/
export default defineConfig({
  // The editor is served under /app/ (flow.unfla.sh/app, via nginx on the VPS).
  // Override with BASE_PATH to host it elsewhere.
  base: process.env.BASE_PATH || '/app/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // allow access through Cloudflare quick tunnels
    allowedHosts: ['.trycloudflare.com'],
  },
})
