---
title: Range Change Callback
description: Track visible item ranges in React Virtuoso lists using the rangeChanged callback for analytics or lazy loading.
sidebar:
  label: Range Change Callback
  order: 101
---

The `rangeChanged` callback property is called with the start/end indexes of the visible range.

Note: the `rangeChanged` reports the rendered items, which are affected by the `increaseViewportBy` and the `overscan` properties.
If you must track only the visible items, you can try the workaround from [this Github issue](https://github.com/petyosi/react-virtuoso/issues/118#issuecomment-642156138).

```tsx live
import { Virtuoso } from 'react-virtuoso'
import { useState } from 'react'

export default function App() {
  const [visibleRange, setVisibleRange] = useState({
    startIndex: 0,
    endIndex: 0,
  })
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <p>
        current visible range: {visibleRange.startIndex} - {visibleRange.endIndex}{' '}
      </p>
      <Virtuoso totalCount={1000} rangeChanged={setVisibleRange} style={{ flex: 1 }} itemContent={(index) => <div>Item {index}</div>} />
    </div>
  )
}
```
