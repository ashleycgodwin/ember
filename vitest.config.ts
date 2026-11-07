import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Simulate a browser-like environment so React components can render
    environment: 'jsdom',
    // Make test helpers (describe, it, expect) available globally — no imports needed
    globals: true,
    // Look for test files anywhere under src/ or in a top-level __tests__ folder
    include: ['src/**/*.{test,spec}.{ts,tsx}', '__tests__/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      // Match the @/* import alias configured in tsconfig
      '@': path.resolve(__dirname, './src'),
    },
  },
})
