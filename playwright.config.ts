import { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  testDir: './e2e',
  webServer: {
    command: 'pnpm run browse-examples',
    port: 61000,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },

  use: {
    launchOptions: {},
  },
}
export default config
