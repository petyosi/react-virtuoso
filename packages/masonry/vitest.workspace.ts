import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
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
        name: 'chromium',
        provider: 'playwright',
      },
      // an example of file based convention,
      // you don't have to follow it
      include: ['src/test/browser/**/*.test.{ts,tsx}'],
      name: 'browser',
    },
  },
])
