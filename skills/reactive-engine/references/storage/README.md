# Reactive Engine Storage

`@virtuoso.dev/reactive-engine-storage` persists [`@virtuoso.dev/reactive-engine-core`](https://www.npmjs.com/package/@virtuoso.dev/reactive-engine-core) cells in `localStorage`, `sessionStorage`, or cookies. A storage link hydrates the cell on engine startup and writes changes back as the cell updates.

## Installation

```bash
npm install @virtuoso.dev/reactive-engine-core @virtuoso.dev/reactive-engine-storage
```

## Quick Example

```ts
import { Cell } from '@virtuoso.dev/reactive-engine-core'
import { linkCellToStorage } from '@virtuoso.dev/reactive-engine-storage'

const theme$ = Cell<'light' | 'dark'>('light')

linkCellToStorage(theme$, {
  key: 'app-theme',
  storageType: 'localStorage',
})
```

## License

MIT
