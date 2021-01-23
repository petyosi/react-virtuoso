const { defaults: tsjPreset } = require('ts-jest/presets')

module.exports = {
  verbose: true,
  extraGlobals: [],
  preset: 'jest-playwright-preset',
  testMatch: ['**/e2e/**/*.test.[jt]s?(x)'],
  testTimeout: 10000,
  transform: {
    ...tsjPreset.transform,
  },
  globalSetup: './e2e/__setup',
  globalTeardown: './e2e/__teardown',
}
