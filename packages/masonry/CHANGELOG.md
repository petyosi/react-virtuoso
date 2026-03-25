# Change Log - @virtuoso.dev/masonry

## 1.4.3

### Patch Changes

- Updated dependencies [[`5b57a93`](https://github.com/petyosi/react-virtuoso/commit/5b57a93ea047dbb9351bfd5786be496bc6ee9b14)]:
  - @virtuoso.dev/gurx@1.2.3

## 1.4.2

### Patch Changes

- [`161db63`](https://github.com/petyosi/react-virtuoso/commit/161db63a12bd7419dc339da075f3a78e6473a9a9) Thanks [@petyosi](https://github.com/petyosi)! - Use changeset publish for proper git tagging and GitHub release creation

- Updated dependencies [[`161db63`](https://github.com/petyosi/react-virtuoso/commit/161db63a12bd7419dc339da075f3a78e6473a9a9)]:
  - @virtuoso.dev/gurx@1.2.2

## 1.4.1

### Patch Changes

- [#1361](https://github.com/petyosi/react-virtuoso/pull/1361) [`7b38166`](https://github.com/petyosi/react-virtuoso/commit/7b3816607c2b8fa3eb8818bea6e291c93a91112d) Thanks [@petyosi](https://github.com/petyosi)! - Replace ESLint and Prettier with oxlint and oxfmt for faster linting and formatting. Modernize TypeScript configuration with `verbatimModuleSyntax` and ES2022 build targets.

  Source code changes are non-behavioral: stricter equality checks (`===`/`!==` instead of truthiness), `??` instead of `||` for defaults, early returns instead of else blocks, self-closing JSX tags, and removal of unnecessary JSX fragments. `LogLevel` in react-virtuoso is changed from a TypeScript enum to a const object — the named exports (`LogLevel.DEBUG`, etc.) work identically, but enum reverse-mapping (`LogLevel[0]`) is no longer supported.

- Updated dependencies [[`7b38166`](https://github.com/petyosi/react-virtuoso/commit/7b3816607c2b8fa3eb8818bea6e291c93a91112d)]:
  - @virtuoso.dev/gurx@1.2.1

## 1.4.0

### Minor Changes

- [#1318](https://github.com/petyosi/react-virtuoso/pull/1318) [`8d47a4d`](https://github.com/petyosi/react-virtuoso/commit/8d47a4d8a7ecdd4caa36eb336b6921738d73f425) Thanks [@petyosi](https://github.com/petyosi)! - Updated API reference

### Patch Changes

- Updated dependencies [[`8d47a4d`](https://github.com/petyosi/react-virtuoso/commit/8d47a4d8a7ecdd4caa36eb336b6921738d73f425)]:
  - @virtuoso.dev/gurx@1.2.0

## 1.3.5

### Patch Changes

- c2c7dc7: Remove bogus engines field

## 1.3.4

### Patch Changes

- 57a05da: Fix edge case for initial empty data. Fixes #1262.

## 1.3.3

### Patch Changes

- 7e85d9e: Support react portal to an iframe rendering

This log was last generated on Fri, 10 Jan 2025 08:23:07 GMT and should not be manually modified.

## 1.3.2

Fri, 10 Jan 2025 08:23:07 GMT

### Patches

- Switch to @virtuoso.dev/gurx
