# @virtuoso.dev/reactive-engine-core

## 0.1.1

### Patch Changes

- [`a563e58`](https://github.com/petyosi/react-virtuoso/commit/a563e581ce6df68b52da897bb4e46600436e8de1) Thanks [@petyosi](https://github.com/petyosi)! - Add synchronous after-settle continuations so graph work can wait for current propagation while retaining transaction diagnostics and
  event ordering.

- [`a563e58`](https://github.com/petyosi/react-virtuoso/commit/a563e581ce6df68b52da897bb4e46600436e8de1) Thanks [@petyosi](https://github.com/petyosi)! - Add seed-aware computed cells and readable state references so derived state initializes from current per-engine dependency values without
  manufacturing initial events.

- [`a563e58`](https://github.com/petyosi/react-virtuoso/commit/a563e581ce6df68b52da897bb4e46600436e8de1) Thanks [@petyosi](https://github.com/petyosi)! - Add diagnostic namespaces and bounded cycle collectors for targeted, application-owned propagation history.

- [`a563e58`](https://github.com/petyosi/react-virtuoso/commit/a563e581ce6df68b52da897bb4e46600436e8de1) Thanks [@petyosi](https://github.com/petyosi)! - Add explicit comparator, filter-map, and multi-resource graph primitives so consumers can declare observable identity, retained event
  semantics, and imperative resource dependencies without repeating lower-level wiring.

- [`a563e58`](https://github.com/petyosi/react-virtuoso/commit/a563e581ce6df68b52da897bb4e46600436e8de1) Thanks [@petyosi](https://github.com/petyosi)! - Add an activation-scoped `Pulsar` node for valueless scheduled emissions from readable cadence state. Disposing a child engine now also removes subscriptions that it delegated to a parent-owned node.

- [`a563e58`](https://github.com/petyosi/react-virtuoso/commit/a563e581ce6df68b52da897bb4e46600436e8de1) Thanks [@petyosi](https://github.com/petyosi)! - Add `switchMapPromise` for abortable latest-only Promise projections with input-correlated results.

## 0.1.0

### Minor Changes

- [`6305890`](https://github.com/petyosi/react-virtuoso/commit/6305890d8b2432990d67d64635f938f22ff0f301) Thanks [@petyosi](https://github.com/petyosi)! - Add opt-in structured propagation diagnostics with node metadata, deeply frozen bounded summaries, error isolation, synchronous causal links, and child-propagation failure evidence.

## 0.0.8

### Patch Changes

- [#1428](https://github.com/petyosi/react-virtuoso/pull/1428) [`5f90dfd`](https://github.com/petyosi/react-virtuoso/commit/5f90dfd83a4acb5b1f0d30ff19190c98d1591443) Thanks [@petyosi](https://github.com/petyosi)! - Add READMEs, docs guides, and package descriptions so the packages present themselves on npm and feed the reactive-engine agent skill. The core docs cover concepts, engine lifecycle, transaction semantics, the operator/combinator reference, and the architecture patterns used by data-table; the satellite packages document React integration, queries/mutations, routing, and storage links.

## 0.0.7

### Patch Changes

- [`de57c35`](https://github.com/petyosi/react-virtuoso/commit/de57c354a685e584ff21d267c7b9a9beed10cb13) Thanks [@petyosi](https://github.com/petyosi)! - Fix custom scroll parent height estimation when a table starts below the external viewport.

  Extend reactive engine `combine` typings for larger tuples used by data table internals.

## 0.0.6

### Patch Changes

- [#1412](https://github.com/petyosi/react-virtuoso/pull/1412) [`94338de`](https://github.com/petyosi/react-virtuoso/commit/94338dec93fba3f52532b8f7af3958856eee2bcc) Thanks [@petyosi](https://github.com/petyosi)! - Release `@virtuoso.dev/data-table` 0.1.0 as the first stable version. The package provides row and column virtualization, grouped rows, sticky columns, remote loading, column resize/reorder/visibility, dynamic columns, and state persistence.

  Bump `@virtuoso.dev/reactive-engine-core` and `@virtuoso.dev/reactive-engine-react` for SSR support required by the data table: synchronous engine creation in `EngineProvider` and an `isDisposed` flag on `Engine`.

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
