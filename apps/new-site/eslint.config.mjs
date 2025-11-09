import baseConfig from '@virtuoso.dev/tooling/eslint.config'
import eslintPluginAstro from 'eslint-plugin-astro'
import tailwindcss from 'eslint-plugin-better-tailwindcss'
import tseslint from 'typescript-eslint'

export default [
  ...baseConfig,
  ...eslintPluginAstro.configs.recommended,
  {
    plugins: {
      'better-tailwindcss': tailwindcss,
    },
    rules: {
      ...tailwindcss.configs.recommended.rules,
      'better-tailwindcss/no-unregistered-classes': 'off',
    },
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/styles/global.css',
      },
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.astro'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
      'better-tailwindcss/no-unregistered-classes': 'off',
      'react/no-unknown-property': 'off',
    },
  },
  {
    ignores: ['node_modules/', 'dist/', '.astro/', 'src/content/docs/react-virtuoso/99.api-reference/'],
  },
]
