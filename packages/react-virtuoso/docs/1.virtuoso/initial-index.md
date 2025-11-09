---
title: Start from a certain item
sidebar:
  label: Initial Index
  order: 4
---

The `initialTopMostItemIndex` property changes the initial location of the list to display the item at the specified index. You can pass in an object to achieve additional effects similar to [scrollToIndex](/scroll-to-index/).

Note: The property applies to the list only when the component mounts.
If you want to change the position of the list afterward, use the [scrollToIndex](/scroll-to-index/) method.

```tsx live
import { Virtuoso } from 'react-virtuoso'

export default function App() {
  return (
    <Virtuoso
      style={{ height: '100%' }}
      totalCount={1000}
      initialTopMostItemIndex={800}
      itemContent={(index) => (<div style={{ height: 30 }}>Item {index}</div>)}
    />
  )
}
```
