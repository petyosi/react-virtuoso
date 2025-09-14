import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          environment: 'node',
          include: ['src/test/node/*.test.ts'],
          name: 'node',
        },
      },
      {
        test: {
          browser: {
            enabled: true,
            instances: [{ browser: 'chromium' }],
            name: 'chromium',
            provider: 'playwright',
          },
          // setupFiles: ['vitest-browser-react'],
          include: ['src/test/browser/*.test.tsx'],
          name: 'browser',
        },
      },
    ],
  },
})
