import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@virtuoso.dev/data-table/column-reorder': new URL('src/features/column-reorder/index.ts', import.meta.url).pathname,
      '@virtuoso.dev/data-table/column-resize': new URL('src/features/column-resize/index.ts', import.meta.url).pathname,
      '@virtuoso.dev/data-table/state-persistence': new URL('src/features/state-persistence/index.tsx', import.meta.url).pathname,
      '@virtuoso.dev/data-table': new URL('src/index.ts', import.meta.url).pathname,
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['**/tests/node/**/*.{test,spec}.{ts,tsx}'],
        },
      },
      {
        extends: true,
        optimizeDeps: {
          include: ['react', 'react-dom', 'react-dom/client', '@virtuoso.dev/reactive-engine-react', '@virtuoso.dev/reactive-engine-core'],
        },
        test: {
          name: 'browser',
          include: ['**/tests/browser/**/*.{test,spec}.{ts,tsx}'],
          setupFiles: ['./src/tests/browser/setup.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
