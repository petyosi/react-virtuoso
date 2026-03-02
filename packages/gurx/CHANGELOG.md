# Change Log - @virtuoso.dev/gurx

## 1.2.2

### Patch Changes

- [`161db63`](https://github.com/petyosi/react-virtuoso/commit/161db63a12bd7419dc339da075f3a78e6473a9a9) Thanks [@petyosi](https://github.com/petyosi)! - Use changeset publish for proper git tagging and GitHub release creation

## 1.2.1

### Patch Changes

- [#1361](https://github.com/petyosi/react-virtuoso/pull/1361) [`7b38166`](https://github.com/petyosi/react-virtuoso/commit/7b3816607c2b8fa3eb8818bea6e291c93a91112d) Thanks [@petyosi](https://github.com/petyosi)! - Replace ESLint and Prettier with oxlint and oxfmt for faster linting and formatting. Modernize TypeScript configuration with `verbatimModuleSyntax` and ES2022 build targets.

  Source code changes are non-behavioral: stricter equality checks (`===`/`!==` instead of truthiness), `??` instead of `||` for defaults, early returns instead of else blocks, self-closing JSX tags, and removal of unnecessary JSX fragments. `LogLevel` in react-virtuoso is changed from a TypeScript enum to a const object — the named exports (`LogLevel.DEBUG`, etc.) work identically, but enum reverse-mapping (`LogLevel[0]`) is no longer supported.

## 1.2.0

### Minor Changes

- [#1318](https://github.com/petyosi/react-virtuoso/pull/1318) [`8d47a4d`](https://github.com/petyosi/react-virtuoso/commit/8d47a4d8a7ecdd4caa36eb336b6921738d73f425) Thanks [@petyosi](https://github.com/petyosi)! - Updated API reference

## 1.1.1

### Patch Changes

- 986d01d: Perf fix for useCellValues

## 1.1.0

### Minor Changes

- 59ba51f: Support legacy react

This log was last generated on Sat, 04 Jan 2025 18:09:03 GMT and should not be manually modified.

## 1.0.0

Sat, 04 Jan 2025 18:09:03 GMT

### Breaking changes

- Initial version publish
