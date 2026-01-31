import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      instances: [{ browser: 'chromium' }],
      provider: playwright(),
    },
    include: ['src/test/browser/*.test.tsx'],
  },
})
