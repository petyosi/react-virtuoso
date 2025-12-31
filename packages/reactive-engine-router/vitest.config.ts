import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          environment: 'node',
          include: ['src/node/**/*.test.ts', 'src/node/**/*.test-d.ts'],
          name: 'node',
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
