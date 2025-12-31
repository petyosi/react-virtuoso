import react from '@vitejs/plugin-react'
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
      external: [
        'react',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom',
        'tiny-invariant',
        '@virtuoso.dev/reactive-engine-core',
      ],
      output: { exports: 'named' },
    },
  },
  plugins: [
    react(),
    dts({
      compilerOptions: { skipLibCheck: true },
      exclude: ['**/test/**', '**/*.test.ts', '**/*.test-d.ts', '**/vitest.config.ts'],
      rollupTypes: true,
      staticImport: true,
    }),
  ],
})
