import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  {
    test: {
      include: ['src/test/node/**/*.test.{ts,tsx}'],
      name: 'node env',
      environment: 'node',
    },
  },
  {
    test: {
      // an example of file based convention,
      // you don't have to follow it
      include: ['src/test/browser/**/*.test.{ts,tsx}'],
      name: 'browser',
      browser: {
        enabled: true,
        provider: 'playwright',
        name: 'chromium',
      },
    },
  },
])
