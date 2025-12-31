import { resolve } from 'node:path'
import dts from 'vite-plugin-dts'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['tiny-invariant', '@virtuoso.dev/reactive-engine-core'],
      output: { exports: 'named' },
    },
  },
  plugins: [
    dts({
      compilerOptions: { skipLibCheck: true },
      exclude: ['**/test/**', '**/*.test.ts', '**/*.test-d.ts', '**/vitest.config.ts'],
      rollupTypes: true,
      staticImport: true,
    }),
  ],
})
