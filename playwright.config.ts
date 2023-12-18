import { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  testDir: './e2e',
  webServer: {
    command: 'yarn browse-examples',
    port: 1234,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },

  use: {
    locale: process.env['REACT18'] ? 'de-DE' : 'en-GB',
    launchOptions: {},
  },
}
export default config
