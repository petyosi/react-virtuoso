import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          environment: 'node',
          include: ['src/test/node/**/*.test.ts', 'src/test/node/**/*.test-d.ts'],
          name: 'node',
          typecheck: {
            checker: 'tsc',
            enabled: true,
          },
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
