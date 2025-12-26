import baseConfig from '@virtuoso.dev/tooling/eslint.config'

export default [
  ...baseConfig,
  {
    ignores: ['example/**', 'example-todo-app/**'],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]
