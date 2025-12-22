---
title: Top Items List Example
description: Pin the first N items at the top of React Virtuoso lists with the topItemCount property for sticky headers.
sidebar:
  label: Top Items
---

The Virtuoso component accepts an optional `topItemCount` number property that allows you to pin the first `N` items of the list.

Scroll the list below - the first two items remain fixed and always visible.
`backgroundColor` is set to hide the scrollable items behind the top ones.

```tsx live
import { Virtuoso } from 'react-virtuoso'

export default function App() {
  return (
    <Virtuoso
      style={{ height: '100%' }}
      totalCount={1000}
      topItemCount={2}
      itemContent={(index) => (<div style={{ height: 30, backgroundColor: 'var(--background)' }}>Item {index + 1}</div>)}
    />
  )
}
```
