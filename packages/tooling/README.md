# Virtuoso Tooling

This package contains shared tooling configuration for Virtuoso projects:

- ESLint configuration 
- TypeScript configuration

## Usage

Add the package as a dev dependency:

```bash
npm install --save-dev @virtuoso.dev/tooling
```

### ESLint

In your project's `eslint.config.mjs`:

```js
import virtuosoEslintConfig from '@virtuoso.dev/tooling/eslint.config.mjs'

export default [...virtuosoEslintConfig]
```

### TypeScript

Extend the shared TypeScript configuration in your project's `tsconfig.json`:

```json
{
  "extends": "@virtuoso.dev/tooling/tsconfig.json",
  "compilerOptions": {
    // Additional project-specific options
  },
  "include": ["src/**/*"]
}
```
