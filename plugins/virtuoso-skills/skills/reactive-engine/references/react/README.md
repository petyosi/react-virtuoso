# Reactive Engine React

`@virtuoso.dev/reactive-engine-react` provides React bindings for [`@virtuoso.dev/reactive-engine-core`](https://www.npmjs.com/package/@virtuoso.dev/reactive-engine-core): an `EngineProvider` component and hooks for reading cell values and publishing into nodes from components.

## Installation

```bash
npm install @virtuoso.dev/reactive-engine-core @virtuoso.dev/reactive-engine-react
```

## Quick Example

```tsx
import { Cell } from '@virtuoso.dev/reactive-engine-core'
import { EngineProvider, useCellValue, usePublisher } from '@virtuoso.dev/reactive-engine-react'

const count$ = Cell(0)

function Counter() {
  const count = useCellValue(count$)
  const setCount = usePublisher(count$)

  return <button onClick={() => setCount(count + 1)}>{count}</button>
}

export function App() {
  return (
    <EngineProvider>
      <Counter />
    </EngineProvider>
  )
}
```

## Hooks

- `useCellValue` / `useCellValues` - subscribe to one or several cells
- `useCell` - read a cell value and get a publisher for it
- `usePublisher` - get a publisher function for a node
- `useEngineDiagnostics` - observe propagation cycles from the nearest engine
- `useEngine` / `useEngineRef` - access the engine instance from context
- `useRemoteCell`, `useRemoteCellValue`, `useRemoteCellValues`, `useRemotePublisher`, `useRemoteEngineDiagnostics` - work with another engine instance

## Diagnostics

Use the provider configuration when initialization publications must be included:

```tsx
<EngineProvider
  diagnostics={{
    observer: (cycle) => sendToTelemetry(cycle),
    options: { captureValues: 'summary', redact },
  }}
>
  <App />
</EngineProvider>
```

Use `useEngineDiagnostics(observer, options)` inside a provider, or `useRemoteEngineDiagnostics(engineSource, observer, options)` from a sibling or external tool. Hook subscriptions start after commit. They do not observe `initFn` publications.

Diagnostics do not retain cycles or update React state. Store records explicitly in a bounded external store if a diagnostic interface needs history.

## License

MIT
