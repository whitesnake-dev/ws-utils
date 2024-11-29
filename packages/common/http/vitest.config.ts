import { defineConfig } from 'vitest/config'
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  },
  test: {
    dir: resolve(__dirname, 'test'),
    setupFiles: [resolve(__dirname, 'test/setup.ts')],
    coverage: {
      extension: ['.ts'],
    },
  },
})