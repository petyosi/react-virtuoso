# @virtuoso.dev/reactive-engine-query

## 0.0.4

### Patch Changes

- [#1428](https://github.com/petyosi/react-virtuoso/pull/1428) [`5f90dfd`](https://github.com/petyosi/react-virtuoso/commit/5f90dfd83a4acb5b1f0d30ff19190c98d1591443) Thanks [@petyosi](https://github.com/petyosi)! - Add READMEs, docs guides, and package descriptions so the packages present themselves on npm and feed the reactive-engine agent skill. The core docs cover concepts, engine lifecycle, transaction semantics, the operator/combinator reference, and the architecture patterns used by data-table; the satellite packages document React integration, queries/mutations, routing, and storage links.

- Updated dependencies [[`5f90dfd`](https://github.com/petyosi/react-virtuoso/commit/5f90dfd83a4acb5b1f0d30ff19190c98d1591443)]:
  - @virtuoso.dev/reactive-engine-core@0.0.8

## 0.0.3

### Patch Changes

- [#1361](https://github.com/petyosi/react-virtuoso/pull/1361) [`7b38166`](https://github.com/petyosi/react-virtuoso/commit/7b3816607c2b8fa3eb8818bea6e291c93a91112d) Thanks [@petyosi](https://github.com/petyosi)! - Replace ESLint and Prettier with oxlint and oxfmt for faster linting and formatting. Modernize TypeScript configuration with `verbatimModuleSyntax` and ES2022 build targets.

  Source code changes are non-behavioral: stricter equality checks (`===`/`!==` instead of truthiness), `??` instead of `||` for defaults, early returns instead of else blocks, self-closing JSX tags, and removal of unnecessary JSX fragments. `LogLevel` in react-virtuoso is changed from a TypeScript enum to a const object — the named exports (`LogLevel.DEBUG`, etc.) work identically, but enum reverse-mapping (`LogLevel[0]`) is no longer supported.

- Updated dependencies [[`7b38166`](https://github.com/petyosi/react-virtuoso/commit/7b3816607c2b8fa3eb8818bea6e291c93a91112d)]:
  - @virtuoso.dev/reactive-engine-core@0.0.5

## 0.0.2

### Patch Changes

- [#1330](https://github.com/petyosi/react-virtuoso/pull/1330) [`94d0dd5`](https://github.com/petyosi/react-virtuoso/commit/94d0dd5c12b49d01728bc9f24a5a9c578525ba35) Thanks [@petyosi](https://github.com/petyosi)! - Initial release

- Updated dependencies [[`94d0dd5`](https://github.com/petyosi/react-virtuoso/commit/94d0dd5c12b49d01728bc9f24a5a9c578525ba35)]:
  - @virtuoso.dev/reactive-engine-core@0.0.2
