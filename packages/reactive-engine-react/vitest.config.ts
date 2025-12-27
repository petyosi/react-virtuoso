import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          environment: 'jsdom',
          include: ['src/node/**/*.test.ts', 'src/node/**/*.test.tsx', 'src/node/**/*.test-d.ts'],
          name: 'node',
          setupFiles: ['./src/vitest-setup.ts'],
        },
      },
      {
        test: {
          browser: {
            enabled: true,
            instances: [{ browser: 'chromium' }],
            provider: playwright(),
          },
          include: ['src/test/browser/*.test.tsx'],
          name: 'browser',
        },
      },
    ],
  },
})
