# Reactive Engine Core

`@virtuoso.dev/reactive-engine-core` is a framework-agnostic reactive state engine. State is modeled as a graph of typed nodes — stateful cells, stateless streams, and valueless triggers — connected through operators and combinators. An `Engine` instance activates the graph, propagates values, and manages subscriptions.

The package is part of the Reactive Engine family:

- [`@virtuoso.dev/reactive-engine-react`](https://www.npmjs.com/package/@virtuoso.dev/reactive-engine-react) - React bindings (provider and hooks)
- [`@virtuoso.dev/reactive-engine-query`](https://www.npmjs.com/package/@virtuoso.dev/reactive-engine-query) - data fetching with queries and mutations
- [`@virtuoso.dev/reactive-engine-router`](https://www.npmjs.com/package/@virtuoso.dev/reactive-engine-router) - routing with routes, layouts, and guards
- [`@virtuoso.dev/reactive-engine-storage`](https://www.npmjs.com/package/@virtuoso.dev/reactive-engine-storage) - cell persistence in local/session storage or cookies

## Installation

```bash
npm install @virtuoso.dev/reactive-engine-core
```

## Quick Example

```ts
import { Cell, Engine } from '@virtuoso.dev/reactive-engine-core'

const count$ = Cell(0)
const engine = new Engine()

engine.sub(count$, (value) => {
  console.log('count is now', value)
})

engine.pub(count$, 1)
engine.getValue(count$) // 1
```

## Concepts

- **Cells** are stateful nodes that always hold a current value.
- **Streams** are stateless nodes that emit values to their subscribers.
- **Triggers** are valueless streams used to signal events.
- **Resources** are cells with factory initialization and automatic disposal.
- **Operators** (`map`, `filter`, `scan`, `debounceTime`, `throttleTime`, `withLatestFrom`, and more) transform values as they flow between nodes.
- **Combinators** (`link`, `pipe`, `combine`, `merge`) wire nodes into a graph.
- **Engine** instances activate node definitions, propagate published values, and manage subscriptions.

## License

MIT
