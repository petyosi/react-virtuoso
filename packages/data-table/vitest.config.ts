import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
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
