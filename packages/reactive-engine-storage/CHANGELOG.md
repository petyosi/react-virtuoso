# @virtuoso.dev/reactive-engine-storage

## 2.0.1

### Patch Changes

- [#1361](https://github.com/petyosi/react-virtuoso/pull/1361) [`7b38166`](https://github.com/petyosi/react-virtuoso/commit/7b3816607c2b8fa3eb8818bea6e291c93a91112d) Thanks [@petyosi](https://github.com/petyosi)! - Replace ESLint and Prettier with oxlint and oxfmt for faster linting and formatting. Modernize TypeScript configuration with `verbatimModuleSyntax` and ES2022 build targets.

  Source code changes are non-behavioral: stricter equality checks (`===`/`!==` instead of truthiness), `??` instead of `||` for defaults, early returns instead of else blocks, self-closing JSX tags, and removal of unnecessary JSX fragments. `LogLevel` in react-virtuoso is changed from a TypeScript enum to a const object — the named exports (`LogLevel.DEBUG`, etc.) work identically, but enum reverse-mapping (`LogLevel[0]`) is no longer supported.

- Updated dependencies [[`7b38166`](https://github.com/petyosi/react-virtuoso/commit/7b3816607c2b8fa3eb8818bea6e291c93a91112d)]:
  - @virtuoso.dev/reactive-engine-core@0.0.5
  - @virtuoso.dev/reactive-engine-react@0.2.1

## 2.0.0

### Patch Changes

- Updated dependencies [[`b2bcc42`](https://github.com/petyosi/react-virtuoso/commit/b2bcc426b78cd7d824977649a7f884041ef559b7)]:
  - @virtuoso.dev/reactive-engine-react@0.2.0

## 1.0.0

### Patch Changes

- Updated dependencies [[`34097be`](https://github.com/petyosi/react-virtuoso/commit/34097bec6b2d69642ac6ff4c942ae457bbecce2d)]:
  - @virtuoso.dev/reactive-engine-react@0.1.0

## 0.0.2

### Patch Changes

- [#1330](https://github.com/petyosi/react-virtuoso/pull/1330) [`94d0dd5`](https://github.com/petyosi/react-virtuoso/commit/94d0dd5c12b49d01728bc9f24a5a9c578525ba35) Thanks [@petyosi](https://github.com/petyosi)! - Initial release

- Updated dependencies [[`94d0dd5`](https://github.com/petyosi/react-virtuoso/commit/94d0dd5c12b49d01728bc9f24a5a9c578525ba35)]:
  - @virtuoso.dev/reactive-engine-react@0.0.2
  - @virtuoso.dev/reactive-engine-core@0.0.2
