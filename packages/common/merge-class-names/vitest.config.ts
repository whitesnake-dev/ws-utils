import { defineConfig } from "vitest/config"
import { resolve as resolvePath } from "path";


export default defineConfig({
  resolve: {
    alias: {
      "@": resolvePath(__dirname, "src")
    }
  },
  test: {
    dir: resolvePath(__dirname, 'test'),
    setupFiles: [resolvePath(__dirname, 'test/setup.ts')],
    coverage: {
      extension: ['.ts', '.tsx'],
    },
  },
})