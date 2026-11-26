---
name: reactive-engine
description: >-
  Manage application state with the @virtuoso.dev/reactive-engine-* package family. Use this skill when (1) defining reactive state
  with Cell, Stream, Trigger, or Resource nodes, (2) wiring React components through EngineProvider, useCellValue, useCellValues, or
  usePublisher, (3) fetching data with Query, Mutation, and ConcurrentMutation from reactive-engine-query, (4) routing with Route, Layout, and Guard from
  reactive-engine-router, (5) persisting cells with linkCellToStorage, (6) architecting a component or library on top of the engine,
  (7) observing or troubleshooting propagation with describeNode, observeDiagnostics, useEngineDiagnostics, or
  useRemoteEngineDiagnostics, or (8) any task involving Engine, pub, sub, getValue, combine, pipe, link, changeWith, the e namespace,
  missing or duplicate emissions, unexpected distinct suppression, or the error "No active engine found".
---

# Reactive Engine

A reactive state system built on a graph of typed nodes. Five packages compose:

| Package                                 | Provides                                                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `@virtuoso.dev/reactive-engine-core`    | Nodes (`Cell`, `Stream`, `Trigger`, `Resource`, `DerivedCell`), `Engine`, operators, combinators, the `e` namespace |
| `@virtuoso.dev/reactive-engine-react`   | `EngineProvider`, state hooks, local and remote diagnostic hooks                                                    |
| `@virtuoso.dev/reactive-engine-query`   | `Query`, `Mutation`, and `ConcurrentMutation` data fetching on top of nodes                                         |
| `@virtuoso.dev/reactive-engine-router`  | `Route`, `Layout`, `Guard`, `Router` — routes are nodes                                                             |
| `@virtuoso.dev/reactive-engine-storage` | `linkCellToStorage` (localStorage / sessionStorage / cookie)                                                        |

It also powers `@virtuoso.dev/data-table` internally — the same concepts apply when remote-controlling the table, and data-table's architecture is the reference for building on the engine ([building-on-the-engine](references/core/05.building-on-the-engine.md)).

## Mental model: nodes are definitions, engines hold state

Node constructors return inert references (symbols at runtime), defined at module scope with a `$` suffix. They hold no state. An `Engine` instance activates nodes lazily on first use and owns their values — two engines using the same node have independent state. This is what makes engine-based libraries reusable: one module-scope graph, one engine per component instance.

```ts
import { Cell, Stream, Engine, e } from '@virtuoso.dev/reactive-engine-core'

const count$ = Cell(0)
const engine = new Engine()
engine.sub(count$, (value) => console.log('count:', value))
engine.pub(count$, 1) // logs 'count: 1'
```

Node types — pick by statefulness:

| Node                            | State                          | Use for                                       |
| ------------------------------- | ------------------------------ | --------------------------------------------- |
| `Cell(initial, distinct?)`      | Stateful, has a current value  | App state, settings                           |
| `DerivedCell(initial, source$)` | Stateful, tracks a source      | Read-only computed state                      |
| `Stream<T>(distinct?)`          | Stateless, emits values        | Events, commands                              |
| `Trigger()`                     | Stateless, valueless           | "Something happened" signals (refetch, reset) |
| `Resource(factory)`             | Factory-initialized per engine | Objects needing setup/disposal                |

Nodes are distinct by default using **reference equality** (`===`): publishing the same reference (or an equal primitive) does not re-emit. Always publish new references from updates (`new Map(old)`, spread). Pass `false` to always emit, or a comparator `(prev, next) => boolean` (true = equal = suppress); `prev` is `undefined` on first emission.

## The three API flavors (most important distinction)

The same verbs exist in three forms — using the wrong one is the main source of errors:

| Flavor                   | Examples                                               | Where                                             | Effect                                                           |
| ------------------------ | ------------------------------------------------------ | ------------------------------------------------- | ---------------------------------------------------------------- |
| Module-scope combinators | `link`, `pipe`, `sub`, `changeWith`, `combine` / `e.*` | Anywhere, incl. module top level                  | Deferred wiring, applied once per engine when the nodes activate |
| Engine instance methods  | `engine.pub`, `engine.sub`, `engine.getValue`          | Wherever you hold an engine                       | Immediate, on that engine                                        |
| Context-bound utilities  | standalone `pub`, `getValue`, `pubIn` / `e.pub`, ...   | Only inside subscription callbacks and node inits | Acts on the currently executing engine                           |

Calling a context-bound utility elsewhere throws `No active engine found. You can use getValue only in the context of node subscription callbacks.` — fix by using `engine.*` methods, React hooks, or moving the code into a subscription. Note the asymmetry: standalone `sub`/`link`/`changeWith` are safe at module scope (they defer); standalone `pub`/`getValue` are not.

The `e` export bundles all combinators, operators, and context utilities into one namespace — idiomatic for wiring blocks:

```ts
e.link(
  e.pipe(
    toggleTheme$,
    e.withLatestFrom(theme$),
    e.map(([, t]) => (t === 'light' ? 'dark' : 'light'))
  ),
  theme$
)
```

## Wiring the graph

- `link(source$, sink$)` — forward emissions; `pipe(source$, ...ops)` — derive a new node
- `combine(a$, b$, ...)` — emit `[a, b, ...]` when ANY source emits; `withLatestFrom(...)` (operator) — read other nodes passively, emit only when the source emits
- `changeWith(cell$, source$, (cell, value) => next)` — reducer-style cell update from a stream (return a new reference)
- `sub`, `subMultiple`, `singletonSub` (replaces the previous singleton subscription — use for callbacks driven by React renders)
- Operators: `map(fn, distinct?)`, `filter` (supports type guards), `mapTo`, `scan`, `once`, `throttleTime`, `debounceTime`, `delayWithMicrotask`, `onNext`, `handlePromise`
- Async operators, all emitting `{ status, input, value | error }` and accepting `{ key }` for per-record scheduling: `switchMapPromise` (latest-only, for reads), `concatMapPromise` (one at a time, in order), `coalescePromise` (one at a time, newest waiting input only, optional `merge`; for writes), `exhaustMapPromise` (one at a time, inputs that arrive while busy are ignored; for duplicate-prone writes)

Publishing is transactional: `engine.pubIn({ [a$]: 1, [b$]: 2 })` batches into one cycle; the graph executes in topological order, so diamond dependencies emit downstream exactly once with consistent inputs. Emissions are synchronous; there are no error/completion channels (exceptions abort the cycle — handle errors at the edges). Subscribing never replays a current value; read cells with `getValue` when needed. See [transactions](references/core/03.transactions.md).

## React integration

```tsx
import { EngineProvider, useCellValue, usePublisher } from '@virtuoso.dev/reactive-engine-react'

const Counter = () => {
  const count = useCellValue(count$)
  const setCount = usePublisher(count$)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

- `useCellValue(cell$)` subscribes and re-renders; `useCellValues(a$, b$, ...)` returns a tuple with a single combined subscription (prefer it for cells that change together); `useCell` is the `useState` shape; `usePublisher(node$)` returns a stable publish function
- `EngineProvider` props: `initFn(engine)` (one-time setup: register nodes, seed with `pubIn`, attach bridges), `initWith` (initial cell values), `updateFn`/`updateDeps` (re-publish changed props; use `singletonSub` for callback props so re-renders replace instead of stack), `engineId`, `engineRef`, and `diagnostics` (attach before `initFn`)
- Remote hooks (`useRemoteCellValue`, `useRemotePublisher`, `useRemoteCell`, `useRemoteCellValues`, `useRemoteEngineDiagnostics`) reach another provider's engine via `useEngineRef()` or a string `engineId` — value hooks return `undefined` until that engine mounts; diagnostic observation waits and attaches automatically
- Components stay projection-only: read cells, publish actions. Logic lives in module-scope wiring, testable with a bare `Engine` and no React

## Troubleshoot propagation with diagnostics

Use diagnostics when a value is missing, duplicated, unexpectedly suppressed, routed through the wrong engine, or throws during synchronous propagation:

1. Label the root, expected sink, and intermediate nodes with `describeNode`. Add narrow `summarize` functions only for application-specific values that the built-in bounded summary cannot explain.
2. Attach at the correct lifecycle: `EngineProvider.diagnostics` includes `initFn`; `useEngineDiagnostics` observes the nearest engine after commit; `useRemoteEngineDiagnostics` is for sibling tools and follows engine availability. Treat provider initialization records as at-least-once in development because React Strict Mode can evaluate initialization more than once.
3. Start with value capture disabled. Read roots and events in order. Inspect `distinct-suppressed`, `no-candidate`, prune events, and `error.phase` before enabling `captureValues: 'summary'`.
4. Compare `engineInstanceId` and `engineLabel` when state appears to come from the wrong instance. Use `transactionId`, `origin`, and `parentCycle` for synchronous nested or parent-child propagation. Async work starts a new transaction and needs application-level correlation.
5. Enable summaries only for the nodes needed to verify the hypothesis. Redact before exporting. Node summarizers receive live values and must not mutate them or cause side effects.
6. Remove the observer after reproduction. Core and React retain no history; build any diagnostic UI on a bounded external store, not `EngineProvider` state.

Read [propagation diagnostics](references/core/06.diagnostics.md) for the record model, safety rules, and evidence-to-cause table. Read [React integration](references/react/01.react-integration.md) for provider, local-hook, remote-hook, Strict Mode, and SSR timing.

## Data fetching (reactive-engine-query)

```ts
export const tasksQuery = Query<{ listId: string }, Task[]>({
  queryFn: async ({ listId }, signal) => {
    const res = await fetch(`/api/tasks?listId=${listId}`, { signal })
    if (!res.ok) throw new Error('Failed to fetch tasks')
    return res.json()
  },
  initialParams: { listId: '' },
})
```

`Query` returns nodes: `data$` (cell with `{ type: 'pending' | 'success' | 'error', data, error, isLoading, isFetching, ... }`), `params$` (publish to refetch with new params), `refetch$`, `invalidate$` (keep showing stale data, `isFetching: true`, re-execute), `unload$` (abort and clear), `enabled$`. Queries auto-execute on activation and param changes; each execution aborts the previous via the `signal`. Options: `retry` (default 3, exponential backoff), `refetchInterval`, `initialData`, `enabled`.

Writes use one of two primitives. Decide with one question: **if a second call for the same record arrives while the first is running, does it carry new information that must reach the server?** No (a duplicate: create, delete, submit, "charge card") → `Mutation`. Yes (a new value: a toggle per click, autosave) → `ConcurrentMutation` with `concurrency: 'coalesce'` (latest value wins), `'serial'` (every call, in order), or `'parallel'` (independent calls).

- **`key` is required.** A key function makes one record per key and the state is `status$` (a `Map`); `key: false` makes one record and the state is `data$`. Pass the key type as the third type argument: `Mutation<Params, Data, number>`. With two type arguments, a key function fails with "No overload matches this call". An options object declared separately needs `key: false as const`.
- **`Mutation` runs one call per record and ignores a call for a busy record** (`settled$` emits `ignored`; development warns unless `onIgnored` is set). Disable the control while `status.get(key)?.isPending` (or `data$.isPending`). `onIgnored` may record or notify; never republish to `mutate$` from it.
- **Results stay until dismissed.** After a successful delete, hide the row while its result is `success` and `dismiss$(key)` once refetched data no longer has it (dismissing in `onSuccess` brings the row back until the refetch lands); dismiss after a success message was shown, or when an off-screen record's outcome arrives (surface errors first). Never dismiss to switch records, and dismiss is not cancel: a sent request cannot be recalled; undo with a compensating write.
- **`ConcurrentMutation` state** is `{ isPending, running, waiting, failures, lastSuccess }`. Failures stay until dismissed; `dismiss$` clears failures and `lastSuccess` together, so dismiss only after surfacing failures and once the query data is at least as new as `lastSuccess`. `dropWaiting$` drops calls not yet sent (`dropped` on `settled$`). For an optimistic value, use the overlay recipe from the query reference (newest running/waiting params, else `lastSuccess` if at least as new as the query's `dataUpdatedAt`, else the query data); it needs full values per record and a refetch in `onSuccess`.
- **No call that started is ever aborted**; the `signal` passed to `mutationFn(params, signal)` aborts only on engine disposal. Callbacks receive `(data | error, params, engine)`.
- **Do reconciliation in `onSuccess`/`onError`**, not in components:

```ts
export const deleteTask = Mutation<{ id: number }, void, number>({
  mutationFn: ({ id }, signal) => api.deleteTask(id, signal),
  key: ({ id }) => id,
  onSuccess: (_data, _params, engine) => {
    engine.pub(tasksQuery.refetch$)
  },
})
```

## Routing (reactive-engine-router)

```tsx
export const user$ = Route('/users/{id:number}', UserPage) // params typed from the path
const root = Layout('/', ({ children }) => <main>{children}</main>)

<Router routes={[user$]} layouts={[root]} guards={[authGuard]} />
```

Route nodes emit typed params when matched, `null` otherwise. Navigate by publishing params to the route node (`usePublisher(user$)({ id: 42 })`). Pipe route params into query params to fetch on navigation. `Guard(pattern, fn)` runs on matching navigations — its context offers `continue()`, `navigate()`, `redirect()`; async guards render the route inside `Suspense`. Layouts match by URL prefix and nest by specificity; `LayoutSlotPortal`/`LayoutSlot`/`LayoutSlotFill` let pages fill layout regions. `Router` syncs with browser history by default.

## Persistence (reactive-engine-storage)

```ts
linkCellToStorage(theme$, { storageType: 'localStorage', key: 'app-theme', debounceMs: 300 })
```

`storageType: 'localStorage' | 'sessionStorage' | 'cookie'` (cookie adds `cookieOptions`). Reads happen lazily, once per engine, when the engine first activates the cell; writes are debounced; localStorage links sync across tabs. The engine's `id` namespaces keys (`my-app:app-theme`) so multiple instances persist independently. SSR-safe (no-op without `window`).

## Building a component or library on the engine

Follow the data-table architecture ([full patterns](references/core/05.building-on-the-engine.md)):

- Module-scope node graph + one engine per component instance (via `EngineProvider`)
- Public API = action streams in (`setX$`, `resetX$`), state cells out (`xState$`, often `DerivedCell`); wiring stays internal
- Props flow into cells via `pubIn` in `initFn`/`updateFn`; callback props via `singletonSub`
- Optional features as separate modules (subpath exports) that attach wiring to core nodes — unused features cost nothing because inits are lazy
- External control via `engineRef`/`engineId` + remote hooks against the exported nodes
- Bridge imperative subsystems with subscribe-both-ways functions whose cleanup reaches `engine.onDispose`

## Common mistakes

- Calling standalone `pub`/`getValue`/`pubIn` outside a subscription callback — use `engine.*` methods or React hooks.
- Mutating and republishing the same object — distinct is reference equality; nothing emits. Publish new references.
- Expecting a node to hold state by itself — values live in an engine; the same `Cell` in two engines has two values.
- Expecting `Stream` subscriptions to fire on subscribe with a current value — streams are stateless; only `Cell` has a value.
- Piping into a trigger through `map` without `distinct: false` — consecutive identical mapped values get filtered.
- Triggering a `Mutation` by changing params — mutations only run when params are published to `mutate$`.
- Using `switchMapPromise` for writes — aborting does not undo a request the server received; use `coalescePromise`/`concatMapPromise`/`exhaustMapPromise`, or `Mutation`/`ConcurrentMutation`.
- Using `Mutation` for a toggle or autosave without disabling the control — the second call is ignored; when each call carries a new value, use `ConcurrentMutation`.
- Sharing one `key: false` `Mutation` across rows — the whole mutation is one record, so a second row's action is ignored; key it per row.
- Using a child engine before its parent touches a query primitive — the parent gets a second instance; register shared primitives in the root engine at startup.
- Plain `sub` in code that re-runs with React renders — subscriptions accumulate; use `singletonSub`.
- Creating cycles in the graph — cycles hang or loop; break one direction with an action stream or `delayWithMicrotask`.

## References

Guides in [references/](references/), per package:

- `references/core/` — [core-concepts](references/core/01.core-concepts.md) (node types, distinct, the `e` namespace), [engine-and-lifecycle](references/core/02.engine-and-lifecycle.md) (activation, API flavors, child engines, disposal), [transactions](references/core/03.transactions.md) (cycles, topological execution, RxJS differences), [operators-and-combinators](references/core/04.operators-and-combinators.md) (full reference), [building-on-the-engine](references/core/05.building-on-the-engine.md) (architecture patterns from data-table), [propagation-diagnostics](references/core/06.diagnostics.md) (records, safety, troubleshooting), [README](references/core/README.md)
- `references/react/` — [react-integration](references/react/01.react-integration.md) (EngineProvider lifecycle, hooks, remote hooks, SSR), [README](references/react/README.md)
- `references/query/` — [queries-and-mutations](references/query/01.queries-and-mutations.md) (result states, lifecycle, wiring patterns), [README](references/query/README.md)
- `references/router/` — [routing](references/router/01.routing.md) (path syntax, navigation, layouts, guards), [README](references/router/README.md)
- `references/storage/` — [storage-links](references/storage/01.storage-links.md) (timing, namespacing, cross-tab sync), [README](references/storage/README.md)

The JSDoc on the exported symbols in `@virtuoso.dev/reactive-engine-core` is extensive — when in doubt about a signature, read the type definitions shipped with the package.
