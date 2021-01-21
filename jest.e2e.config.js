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
}
