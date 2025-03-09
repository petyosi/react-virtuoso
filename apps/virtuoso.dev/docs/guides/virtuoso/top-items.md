---
id: top-items
title: Top Items List Example
sidebar_label: Top Items
slug: /top-items/
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
      itemContent={(index) => (<div style={{ height: 30, backgroundColor: 'var(--ifm-color-content-inverse)' }}>Item {index + 1}</div>)}
    />
  )
}
```
