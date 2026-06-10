---
name: reactive-engine
description: >-
  Manage application state with the @virtuoso.dev/reactive-engine-* package family. Use this skill when (1) defining reactive state
  with Cell, Stream, Trigger, or Resource nodes, (2) wiring React components through EngineProvider, useCellValue, useCellValues, or
  usePublisher, (3) fetching data with Query and Mutation from reactive-engine-query, (4) routing with Route, Layout, and Guard from
  reactive-engine-router, (5) persisting cells with linkCellToStorage, (6) architecting a component or library on top of the engine,
  or (7) any task involving Engine, pub, sub, getValue, combine, pipe, link, changeWith, the e namespace, or the error
  "No active engine found".
---

# Reactive Engine

A reactive state system built on a graph of typed nodes. Five packages compose:

| Package                                 | Provides                                                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `@virtuoso.dev/reactive-engine-core`    | Nodes (`Cell`, `Stream`, `Trigger`, `Resource`, `DerivedCell`), `Engine`, operators, combinators, the `e` namespace |
| `@virtuoso.dev/reactive-engine-react`   | `EngineProvider`, hooks (`useCellValue`, `usePublisher`, remote hooks)                                              |
| `@virtuoso.dev/reactive-engine-query`   | `Query` and `Mutation` data fetching on top of nodes                                                                |
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
- `EngineProvider` props: `initFn(engine)` (one-time setup: register nodes, seed with `pubIn`, attach bridges), `initWith` (initial cell values), `updateFn`/`updateDeps` (re-publish changed props; use `singletonSub` for callback props so re-renders replace instead of stack), `engineId`, `engineRef`
- Remote hooks (`useRemoteCellValue`, `useRemotePublisher`, `useRemoteCell`, `useRemoteCellValues`) reach another provider's engine via `useEngineRef()` or a string `engineId` — they return `undefined` until that engine mounts; guard for it
- Components stay projection-only: read cells, publish actions. Logic lives in module-scope wiring, testable with a bare `Engine` and no React

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

`Mutation({ mutationFn, onSuccess?, onError? })` returns `data$`, `mutate$`, `reset$`. Mutations never auto-execute — publish params to `mutate$`. Wire mutations to refetch queries in the graph, not in components:

```ts
e.link(
  e.pipe(
    e.merge(createTask.data$, deleteTask.data$),
    e.filter((r) => r.type === 'success'),
    e.map(() => undefined, false) // distinct=false so consecutive successes each fire
  ),
  tasksQuery.refetch$
)
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
- Plain `sub` in code that re-runs with React renders — subscriptions accumulate; use `singletonSub`.
- Creating cycles in the graph — cycles hang or loop; break one direction with an action stream or `delayWithMicrotask`.

## References

Guides in [references/](references/), per package:

- `references/core/` — [core-concepts](references/core/01.core-concepts.md) (node types, distinct, the `e` namespace), [engine-and-lifecycle](references/core/02.engine-and-lifecycle.md) (activation, API flavors, child engines, disposal), [transactions](references/core/03.transactions.md) (cycles, topological execution, RxJS differences), [operators-and-combinators](references/core/04.operators-and-combinators.md) (full reference), [building-on-the-engine](references/core/05.building-on-the-engine.md) (architecture patterns from data-table), [README](references/core/README.md)
- `references/react/` — [react-integration](references/react/01.react-integration.md) (EngineProvider lifecycle, hooks, remote hooks, SSR), [README](references/react/README.md)
- `references/query/` — [queries-and-mutations](references/query/01.queries-and-mutations.md) (result states, lifecycle, wiring patterns), [README](references/query/README.md)
- `references/router/` — [routing](references/router/01.routing.md) (path syntax, navigation, layouts, guards), [README](references/router/README.md)
- `references/storage/` — [storage-links](references/storage/01.storage-links.md) (timing, namespacing, cross-tab sync), [README](references/storage/README.md)

The JSDoc on the exported symbols in `@virtuoso.dev/reactive-engine-core` is extensive — when in doubt about a signature, read the type definitions shipped with the package.
