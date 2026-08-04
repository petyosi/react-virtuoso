# @virtuoso.dev/reactive-engine-react

## 0.3.2

### Patch Changes

- [`e6cef21`](https://github.com/petyosi/react-virtuoso/commit/e6cef21e45bbe37d2cc83f69fe0c0f8c6ae4cdf8) Thanks [@petyosi](https://github.com/petyosi)! - Allow external-state bridges to observe one value type while forwarding a different write-request type.

- Updated dependencies [[`744eb1e`](https://github.com/petyosi/react-virtuoso/commit/744eb1e1015bc8dcb9da6c5a71bb6abdf4d86147)]:
  - @virtuoso.dev/reactive-engine-core@0.1.2

## 0.3.1

### Patch Changes

- [`a563e58`](https://github.com/petyosi/react-virtuoso/commit/a563e581ce6df68b52da897bb4e46600436e8de1) Thanks [@petyosi](https://github.com/petyosi)! - Add an asymmetric external-state bridge that synchronizes observed values into cells and forwards only explicit write requests outward.

- [`a563e58`](https://github.com/petyosi/react-virtuoso/commit/a563e581ce6df68b52da897bb4e46600436e8de1) Thanks [@petyosi](https://github.com/petyosi)! - Add stable passive and layout engine subscription hooks that invoke the latest committed callback without resubscribing for callback-only renders.

- Updated dependencies [[`a563e58`](https://github.com/petyosi/react-virtuoso/commit/a563e581ce6df68b52da897bb4e46600436e8de1), [`a563e58`](https://github.com/petyosi/react-virtuoso/commit/a563e581ce6df68b52da897bb4e46600436e8de1), [`a563e58`](https://github.com/petyosi/react-virtuoso/commit/a563e581ce6df68b52da897bb4e46600436e8de1), [`a563e58`](https://github.com/petyosi/react-virtuoso/commit/a563e581ce6df68b52da897bb4e46600436e8de1), [`a563e58`](https://github.com/petyosi/react-virtuoso/commit/a563e581ce6df68b52da897bb4e46600436e8de1), [`a563e58`](https://github.com/petyosi/react-virtuoso/commit/a563e581ce6df68b52da897bb4e46600436e8de1)]:
  - @virtuoso.dev/reactive-engine-core@0.1.1

## 0.3.0

### Minor Changes

- [`6305890`](https://github.com/petyosi/react-virtuoso/commit/6305890d8b2432990d67d64635f938f22ff0f301) Thanks [@petyosi](https://github.com/petyosi)! - Add provider, local-hook, and remote-hook bindings for structured engine diagnostics, including initialization capture, option updates, and lifecycle guidance for React consumers and coding agents.

### Patch Changes

- Updated dependencies [[`6305890`](https://github.com/petyosi/react-virtuoso/commit/6305890d8b2432990d67d64635f938f22ff0f301)]:
  - @virtuoso.dev/reactive-engine-core@0.1.0

## 0.2.4

### Patch Changes

- [#1440](https://github.com/petyosi/react-virtuoso/pull/1440) [`ad7f2b0`](https://github.com/petyosi/react-virtuoso/commit/ad7f2b0d03567d7dd98433a67223bc36b8c7443c) Thanks [@petyosi](https://github.com/petyosi)! - Add id-based data table columns for display-only and computed values, keep
  table-only props off DOM elements, and avoid disposing reactive engines during
  React 18 StrictMode's development-only effect replay.

## 0.2.3

### Patch Changes

- [#1428](https://github.com/petyosi/react-virtuoso/pull/1428) [`5f90dfd`](https://github.com/petyosi/react-virtuoso/commit/5f90dfd83a4acb5b1f0d30ff19190c98d1591443) Thanks [@petyosi](https://github.com/petyosi)! - Add READMEs, docs guides, and package descriptions so the packages present themselves on npm and feed the reactive-engine agent skill. The core docs cover concepts, engine lifecycle, transaction semantics, the operator/combinator reference, and the architecture patterns used by data-table; the satellite packages document React integration, queries/mutations, routing, and storage links.

- Updated dependencies [[`5f90dfd`](https://github.com/petyosi/react-virtuoso/commit/5f90dfd83a4acb5b1f0d30ff19190c98d1591443)]:
  - @virtuoso.dev/reactive-engine-core@0.0.8

## 0.2.2

### Patch Changes

- [#1412](https://github.com/petyosi/react-virtuoso/pull/1412) [`94338de`](https://github.com/petyosi/react-virtuoso/commit/94338dec93fba3f52532b8f7af3958856eee2bcc) Thanks [@petyosi](https://github.com/petyosi)! - Release `@virtuoso.dev/data-table` 0.1.0 as the first stable version. The package provides row and column virtualization, grouped rows, sticky columns, remote loading, column resize/reorder/visibility, dynamic columns, and state persistence.

  Bump `@virtuoso.dev/reactive-engine-core` and `@virtuoso.dev/reactive-engine-react` for SSR support required by the data table: synchronous engine creation in `EngineProvider` and an `isDisposed` flag on `Engine`.

- Updated dependencies [[`94338de`](https://github.com/petyosi/react-virtuoso/commit/94338dec93fba3f52532b8f7af3958856eee2bcc)]:
  - @virtuoso.dev/reactive-engine-core@0.0.6

## 0.2.1

### Patch Changes

- [#1361](https://github.com/petyosi/react-virtuoso/pull/1361) [`7b38166`](https://github.com/petyosi/react-virtuoso/commit/7b3816607c2b8fa3eb8818bea6e291c93a91112d) Thanks [@petyosi](https://github.com/petyosi)! - Replace ESLint and Prettier with oxlint and oxfmt for faster linting and formatting. Modernize TypeScript configuration with `verbatimModuleSyntax` and ES2022 build targets.

  Source code changes are non-behavioral: stricter equality checks (`===`/`!==` instead of truthiness), `??` instead of `||` for defaults, early returns instead of else blocks, self-closing JSX tags, and removal of unnecessary JSX fragments. `LogLevel` in react-virtuoso is changed from a TypeScript enum to a const object — the named exports (`LogLevel.DEBUG`, etc.) work identically, but enum reverse-mapping (`LogLevel[0]`) is no longer supported.

- Updated dependencies [[`7b38166`](https://github.com/petyosi/react-virtuoso/commit/7b3816607c2b8fa3eb8818bea6e291c93a91112d)]:
  - @virtuoso.dev/reactive-engine-core@0.0.5

## 0.2.0

### Minor Changes

- [`b2bcc42`](https://github.com/petyosi/react-virtuoso/commit/b2bcc426b78cd7d824977649a7f884041ef559b7) Thanks [@petyosi](https://github.com/petyosi)! - Add ref-based remote engine access via useEngineRef and EngineRef
  - Add `useEngineRef()` hook that returns a reactive `EngineRef` object
  - Add `engineRef` prop to `EngineProvider` for populating the ref
  - Extend all `useRemote*` hooks to accept `string | EngineRef` as the engine source
  - Rename `RemoteCellValuesOptions.engineId` to `engineSource` (breaking for `useRemoteCellValues` consumers)

## 0.1.0

### Minor Changes

- [`34097be`](https://github.com/petyosi/react-virtuoso/commit/34097bec6b2d69642ac6ff4c942ae457bbecce2d) Thanks [@petyosi](https://github.com/petyosi)! - Add remote hooks for accessing engine state from anywhere in the app
  - Add `engineId` prop to `EngineProvider` to register engine in global registry
  - Add `useRemoteCellValue(cell$, engineId)` - returns cell value or `undefined` if engine not available
  - Add `useRemotePublisher(node$, engineId)` - returns publisher function (noop if no engine)
  - Add `useRemoteCell(cell$, engineId)` - combines value and publisher
  - Add `useRemoteCellValues({ cells, engineId })` - multi-cell variant with options object form

  These hooks enable components anywhere in the app to access engine state without being inside an `EngineProvider`, useful for sibling components or components in different parts of the tree.

## 0.0.4

### Patch Changes

- [#1341](https://github.com/petyosi/react-virtuoso/pull/1341) [`93f476c`](https://github.com/petyosi/react-virtuoso/commit/93f476ccd43381d314f9d19035f69633f5eec013) Thanks [@petyosi](https://github.com/petyosi)! - Fix typing for useCellValues

## 0.0.3

### Patch Changes

- [#1337](https://github.com/petyosi/react-virtuoso/pull/1337) [`259eaf6`](https://github.com/petyosi/react-virtuoso/commit/259eaf6c057863c12c457ea6de2a16b91ab6ffbe) Thanks [@petyosi](https://github.com/petyosi)! - Re-write the props of the EngineProvider

- Updated dependencies [[`259eaf6`](https://github.com/petyosi/react-virtuoso/commit/259eaf6c057863c12c457ea6de2a16b91ab6ffbe)]:
  - @virtuoso.dev/reactive-engine-core@0.0.3

## 0.0.2

### Patch Changes

- [#1330](https://github.com/petyosi/react-virtuoso/pull/1330) [`94d0dd5`](https://github.com/petyosi/react-virtuoso/commit/94d0dd5c12b49d01728bc9f24a5a9c578525ba35) Thanks [@petyosi](https://github.com/petyosi)! - Initial release

- Updated dependencies [[`94d0dd5`](https://github.com/petyosi/react-virtuoso/commit/94d0dd5c12b49d01728bc9f24a5a9c578525ba35)]:
  - @virtuoso.dev/reactive-engine-core@0.0.2
