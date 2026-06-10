# Reactive Engine Router

`@virtuoso.dev/reactive-engine-router` is a router built on [`@virtuoso.dev/reactive-engine-core`](https://www.npmjs.com/package/@virtuoso.dev/reactive-engine-core). Routes are reactive nodes - navigation is publishing into a route node, and the current route flows through the graph like any other value.

## Installation

```bash
npm install @virtuoso.dev/reactive-engine-core @virtuoso.dev/reactive-engine-react @virtuoso.dev/reactive-engine-router
```

## Quick Example

```tsx
import { usePublisher } from '@virtuoso.dev/reactive-engine-react'
import { Layout, Router } from '@virtuoso.dev/reactive-engine-router'

import { about$, home$ } from './routes'

const rootLayout = Layout('/', ({ children }) => (
  <div>
    <Navigation />
    <main>{children}</main>
  </div>
))

function Navigation() {
  const goHome = usePublisher(home$)
  const goToAbout = usePublisher(about$)

  return (
    <nav>
      <button onClick={() => goHome({})}>Home</button>
      <button onClick={() => goToAbout({})}>About</button>
    </nav>
  )
}

export function App() {
  return <Router layouts={[rootLayout]} routes={[home$, about$]} />
}
```

## Features

- **Routes** - typed route definitions with parameters
- **Layouts** - nested layout components matched by path, with slot/fill composition (`LayoutSlot`, `LayoutSlotFill`)
- **Guards** - sync or async navigation guards that can continue, redirect, or navigate elsewhere

## License

MIT
