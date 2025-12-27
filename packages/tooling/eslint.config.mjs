import pluginReact from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

import baseConfig from './eslint-base.config.mjs'

export default tseslint.config(...baseConfig, pluginReact.configs.flat.recommended, pluginReact.configs.flat['jsx-runtime'], {
  files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
  languageOptions: {
    ...pluginReact.configs.flat.recommended.languageOptions,
  },
  plugins: { 'react-hooks': reactHooks },
  rules: {
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react/display-name': 'off',
    'react/prop-types': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
})
