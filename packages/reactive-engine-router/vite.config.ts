import { resolve } from 'node:path'

import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  build: {
    target: 'es2022',
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'tiny-invariant', '@virtuoso.dev/reactive-engine-core'],
      output: { exports: 'named' },
    },
  },
  plugins: [
    react(),
    dts({
      compilerOptions: { skipLibCheck: true },
      exclude: ['**/test/**', '**/*.test.ts', '**/*.test.tsx', '**/*.test-d.ts', '**/vitest.config.ts'],
      rollupTypes: true,
      staticImport: true,
    }),
  ],
})
