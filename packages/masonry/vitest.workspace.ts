import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          environment: 'node',
          include: ['src/test/node/**/*.test.{ts,tsx}'],
          name: 'node env',
        },
      },
      {
        test: {
          browser: {
            enabled: true,
            instances: [{ browser: 'chromium' }],
            provider: playwright(),
          },
          include: ['src/test/browser/**/*.test.{ts,tsx}'],
          name: 'browser',
        },
      },
    ],
  },
})
