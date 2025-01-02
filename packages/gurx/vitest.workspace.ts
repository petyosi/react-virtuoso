import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  {
    test: {
      include: ['src/test/node/*.test.ts'],
      name: 'node',
      environment: 'node',
    },
  },
  {
    test: {
      // setupFiles: ['vitest-browser-react'],
      include: ['src/test/browser/*.test.tsx'],
      name: 'browser',
      browser: {
        enabled: true,
        name: 'chromium',
        provider: 'playwright',
        instances: [{ browser: 'chromium' }],
      },
    },
  },
])
