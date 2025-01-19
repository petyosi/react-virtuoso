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
      name: 'standard',
      environment: 'jsdom',
      // setupFiles: ['vitest-browser-react'],
      include: ['test/**/*.test.tsx', 'test/**/*.test.ts'],
    },
  },
])
