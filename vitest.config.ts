import path from 'node:path'
import { defineConfig } from 'vitest/config'

// Standalone Vitest config: unit tests are pure logic, so we skip the React /
// Tailwind plugins and run in a Node environment for speed.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
