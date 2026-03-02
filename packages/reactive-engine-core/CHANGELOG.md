# @virtuoso.dev/reactive-engine-core

## 0.0.5

### Patch Changes

- [#1361](https://github.com/petyosi/react-virtuoso/pull/1361) [`7b38166`](https://github.com/petyosi/react-virtuoso/commit/7b3816607c2b8fa3eb8818bea6e291c93a91112d) Thanks [@petyosi](https://github.com/petyosi)! - Replace ESLint and Prettier with oxlint and oxfmt for faster linting and formatting. Modernize TypeScript configuration with `verbatimModuleSyntax` and ES2022 build targets.

  Source code changes are non-behavioral: stricter equality checks (`===`/`!==` instead of truthiness), `??` instead of `||` for defaults, early returns instead of else blocks, self-closing JSX tags, and removal of unnecessary JSX fragments. `LogLevel` in react-virtuoso is changed from a TypeScript enum to a const object — the named exports (`LogLevel.DEBUG`, etc.) work identically, but enum reverse-mapping (`LogLevel[0]`) is no longer supported.

## 0.0.4

### Patch Changes

- [#1343](https://github.com/petyosi/react-virtuoso/pull/1343) [`5bf8c45`](https://github.com/petyosi/react-virtuoso/commit/5bf8c456a87446ce4cfa131faacec6e476ef13c9) Thanks [@petyosi](https://github.com/petyosi)! - Make operators run in engine context

## 0.0.3

### Patch Changes

- [#1337](https://github.com/petyosi/react-virtuoso/pull/1337) [`259eaf6`](https://github.com/petyosi/react-virtuoso/commit/259eaf6c057863c12c457ea6de2a16b91ab6ffbe) Thanks [@petyosi](https://github.com/petyosi)! - Introduce Resource

## 0.0.2

### Patch Changes

- [#1330](https://github.com/petyosi/react-virtuoso/pull/1330) [`94d0dd5`](https://github.com/petyosi/react-virtuoso/commit/94d0dd5c12b49d01728bc9f24a5a9c578525ba35) Thanks [@petyosi](https://github.com/petyosi)! - Initial release
