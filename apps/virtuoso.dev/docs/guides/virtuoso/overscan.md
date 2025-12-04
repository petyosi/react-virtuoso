---
id: overscan
title: Overscan and Pre-rendering
sidebar_label: Overscan
slug: /overscan/
sidebar_position: 150
---

React Virtuoso provides three props to control how many items are rendered outside the visible viewport. Each serves a different purpose:

| Prop                   | Unit       | Best For                                              |
| ---------------------- | ---------- | ----------------------------------------------------- |
| `increaseViewportBy`   | Pixels     | General pre-rendering, slow-loading content           |
| `overscan`             | Pixels     | Reducing re-renders during scroll (chunked rendering) |
| `minOverscanItemCount` | Item count | Tall/dynamic items that may collapse or resize        |

## increaseViewportBy

Artificially increases the viewport size by the specified pixels, causing items to be rendered before they enter the visible area. This is equivalent to `overscan` in react-window.

```tsx live
import { Virtuoso } from 'react-virtuoso'

export default function App() {
  return (
    <Virtuoso
      style={{ height: '100%' }}
      totalCount={1000}
      increaseViewportBy={200}
      itemContent={(index) => <div style={{ padding: '10px 5px', borderBottom: '1px solid #eee' }}>Item {index}</div>}
    />
  )
}
```

Use `{ top: number, bottom: number }` to set different values for each direction:

```tsx
<Virtuoso
  increaseViewportBy={{ top: 100, bottom: 400 }}
  // ...
/>
```

## overscan

Controls how the component "chunks" rendering on scroll. Instead of rendering one item at a time as they come into view, the component renders items in batches, reducing the number of re-renders.

```tsx live
import { Virtuoso } from 'react-virtuoso'

export default function App() {
  return (
    <Virtuoso
      style={{ height: '100%' }}
      totalCount={1000}
      overscan={150}
      itemContent={(index) => <div style={{ padding: '10px 5px', borderBottom: '1px solid #eee' }}>Item {index}</div>}
    />
  )
}
```

Use `{ main: number, reverse: number }` to set different values for the main scroll direction and reverse:

```tsx
<Virtuoso
  overscan={{ main: 200, reverse: 100 }}
  // ...
/>
```

## minOverscanItemCount

Ensures a minimum number of items are always rendered before and after the visible viewport, regardless of their pixel size. This is particularly useful when:

- Items are very tall (taller than the viewport)
- Items can dynamically resize (e.g., collapsible content)
- You need to guarantee N items are pre-rendered

Unlike the pixel-based props, `minOverscanItemCount` guarantees item count rather than pixel distance.

```tsx live
import { Virtuoso } from 'react-virtuoso'
import { useState } from 'react'

export default function App() {
  const [expanded, setExpanded] = useState(false)

  return (
    <Virtuoso
      style={{ height: '100%' }}
      totalCount={100}
      minOverscanItemCount={5}
      itemContent={(index) => (
        <div
          style={{
            padding: '10px 5px',
            borderBottom: '1px solid #eee',
            height: index === 0 && !expanded ? 400 : 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>Item {index}</span>
          {index === 0 && <button onClick={() => setExpanded(!expanded)}>{expanded ? 'Expand' : 'Collapse'}</button>}
        </div>
      )}
    />
  )
}
```

Use `{ top: number, bottom: number }` to set different values for each direction:

```tsx
<Virtuoso
  minOverscanItemCount={{ top: 2, bottom: 5 }}
  // ...
/>
```

## When to Use Each

**Use `increaseViewportBy` when:**

- Content loads asynchronously and you want to start loading before items are visible
- You want a simple pixel-based buffer around the viewport

**Use `overscan` when:**

- You want to reduce the frequency of re-renders during scrolling
- Performance is critical and you want chunked/batched rendering

**Use `minOverscanItemCount` when:**

- Items are taller than the viewport
- Items can collapse or expand dramatically
- You need to guarantee a specific number of items are pre-rendered regardless of size

You can combine these props. For example, use `increaseViewportBy` for general pre-rendering and add `minOverscanItemCount` to handle edge cases with very tall items.
