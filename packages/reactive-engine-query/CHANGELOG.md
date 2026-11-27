# @virtuoso.dev/reactive-engine-query

## 3.0.0

### Major Changes

- [#1587](https://github.com/petyosi/react-virtuoso/pull/1587) [`9e0bdf8`](https://github.com/petyosi/react-virtuoso/commit/9e0bdf8efbc0b47c5842afc2feb344ddaae3160b) Thanks [@atrium-ladyx](https://github.com/apps/atrium-ladyx)! - `Mutation` now runs one call at a time per record, and the new `ConcurrentMutation` handles writes that overlap.

  **Migration, step 1: `key` is now required, so every existing `Mutation` fails to compile until you choose.**
  - `key: false` if the mutation serves one record at a time, such as a single form. A second call while the first runs is ignored, not run.
  - A key function for per-row actions shared across rows, with the key type as the third type argument: `Mutation<Params, Data, number>({ key: ({ id }) => id, … })`. With two type arguments, a key function fails with "No overload matches this call".
  - `ConcurrentMutation` when every call carries a new value that must reach the server, such as a toggle that saves per click: `concurrency: 'coalesce'` (latest value wins, optional `merge`), `'serial'` (every call, in order), or `'parallel'` (independent calls). The closest equivalent of 2.0.2 behavior is `ConcurrentMutation({ concurrency: 'parallel', key: false, … })`, but its `data$` has the `ConcurrentMutationState` shape.

  **Also changed:**
  - A keyed `Mutation` exposes `status$`, a `ReadonlyMap` of per-record results, instead of `data$`. Read records with `status.get(key)`.
  - `reset$` is replaced by `dismiss$` (and `dismissAll$` when keyed). Dismiss never returns a pending call to idle; its result still appears when it settles.
  - A call for a busy record is ignored: it is reported on the new `settled$` stream as `ignored`, calls `onIgnored` if given, and warns in development otherwise. Disable the control while the record is pending.
  - `settled$` emits one outcome per input (`success`, `error`, `ignored`; `dropped` for `ConcurrentMutation`). Results and outcomes carry `params`, keyed ones carry `key`, and settled results carry `settledAt`.
  - Repeated equal params each make a call; 2.0.2 suppressed equal consecutive params.
  - `mutationFn` receives an `AbortSignal`, aborted only when the engine is disposed; a call that started is never aborted otherwise. `onSuccess` and `onError` receive the params and the engine, and run directly after the outcome is delivered. Retry delays stop when a call or query is aborted.
  - With child engines, register shared mutations in the root engine at startup, for example `root.register(mutation.mutate$)`. Using one from a child engine before its parent is unsupported and warns in development.
  - Requires `@virtuoso.dev/reactive-engine-core` `^0.3.0`.

### Patch Changes

- Updated dependencies [[`9e0bdf8`](https://github.com/petyosi/react-virtuoso/commit/9e0bdf8efbc0b47c5842afc2feb344ddaae3160b)]:
  - @virtuoso.dev/reactive-engine-core@0.3.0

## 2.0.2

### Patch Changes

- [#1534](https://github.com/petyosi/react-virtuoso/pull/1534) [`4cb81bd`](https://github.com/petyosi/react-virtuoso/commit/4cb81bd6ac5d4b5e8adc9072dcb6316429aa649a) Thanks [@petyosi](https://github.com/petyosi)! - Stop a polling query from re-arming its `refetchInterval` after a `data$` subscriber disables it, changes its params, or starts another fetch while handling a successful result.

## 2.0.1

### Patch Changes

- [#1509](https://github.com/petyosi/react-virtuoso/pull/1509) [`3dbb0c4`](https://github.com/petyosi/react-virtuoso/commit/3dbb0c4857965f1e3db62fd72e7d16630323cb71) Thanks [@petyosi](https://github.com/petyosi)! - Fix a `Query` that stopped reacting to `enabled$` after its first toggle. Setting `enabled$` back to `true` now fetches with the current params every time, and setting it to `false` again aborts the in-flight request and stops `refetchInterval` polling. Both reactions previously ran through filtered streams, which are distinct, so only the first enable and the first disable took effect.

## 2.0.0

### Patch Changes

- Updated dependencies [[`22ac6c5`](https://github.com/petyosi/react-virtuoso/commit/22ac6c5e69314e4113046a7da4bcadde2a082b25)]:
  - @virtuoso.dev/reactive-engine-core@0.2.0

## 1.0.0

### Patch Changes

- Updated dependencies [[`6305890`](https://github.com/petyosi/react-virtuoso/commit/6305890d8b2432990d67d64635f938f22ff0f301)]:
  - @virtuoso.dev/reactive-engine-core@0.1.0

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
