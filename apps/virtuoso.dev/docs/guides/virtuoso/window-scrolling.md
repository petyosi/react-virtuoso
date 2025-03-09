---
id: window-scrolling
title: Window Scrolling
sidebar_label: Window Scrolling
slug: /window-scrolling/
sidebar_position: 250
---

The `Virtuoso` components can use the document scroller by setting the `useWindowScroll` property to `true`. 

```tsx live
import { Virtuoso } from 'react-virtuoso'

export default function App() {
  return (
    <Virtuoso
      useWindowScroll
      totalCount={200}
      itemContent={(index) => ( <div style={{ padding: '1rem 0.5rem' }}>Item {index}</div>)}
    />
  )
}
```
