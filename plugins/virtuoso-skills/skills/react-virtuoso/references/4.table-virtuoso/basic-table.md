---
title: Table Virtuoso Basic Example
description: Virtualize large HTML tables with unknown row heights using TableVirtuoso for efficient rendering.
position: 1
sidebar:
  label: Basic Example
---

The `TableVirtuoso` component can display large tables with **unknown** row sizes. It has most of the `Virtuoso` capabilities sans pinning top items. It also supports sticky table headers.
You do not have to configure anything apart from the `data` or the `totalCount` and the `itemContent` renderer.

The `itemContent` render callback accepts `index`, and `item` parameter (if `data` is set),
which specifies the absolute index of the item rendered;
It is up to you to build and return the respective content.

## Styling and markup

The component renders an HTML table structure. Few CSS settings can affect its look:

- A `border-collapse: collapse` setting on `table` causes the fixed header borders to scroll away. To fix, use `border-collapse: separate` and specify bottom/right borders.
- `table` should not have styling that changes its `display` and `overflow`.

## Table with `data`

```tsx live
import { TableVirtuoso } from 'react-virtuoso'

export default function App() {
  return (
    <TableVirtuoso
      style={{ height: '100%' }}
      data={Array.from({ length: 100 }, (_, index) => ({
        name: `User ${index}`,
        description: `${index} description`,
      }))}
      itemContent={(index, user) => (
        <>
          <td style={{ width: 150 }}>{user.name}</td>
          <td>{user.description}</td>
        </>
      )}
    />
  )
}
```

## Table with `totalCount`

```tsx live
import { TableVirtuoso } from 'react-virtuoso'
import { useMemo } from 'react'

export default function App() {
  const users = useMemo(
    () =>
      Array.from({ length: 100 }, (_, index) => ({
        name: `User ${index}`,
        description: `${index} description`,
      })),
    []
  )

  return (
    <TableVirtuoso
      style={{ height: '100%' }}
      totalCount={users.length}
      itemContent={(index) => {
        const user = users[index]
        return (
          <>
            <td style={{ width: 150 }}>{user.name}</td>
            <td>{user.description}</td>
          </>
        )
      }}
    />
  )
}
```

## Table with `useWindowScroll`

```tsx live
import { TableVirtuoso } from 'react-virtuoso'

export default function App() {
  return (
    <TableVirtuoso
      data={Array.from({ length: 100 }, (_, index) => ({ name: `User ${index}`, description: `${index} description` }))}
      useWindowScroll
      fixedHeaderContent={() => (
        <tr>
          <th style={{ width: 150, background: 'var(--background)', color: 'var(--foreground)' }}>Name</th>
          <th style={{ background: 'var(--background)', color: 'var(--foreground)' }}>Description</th>
        </tr>
      )}
      itemContent={(index, user) => (
        <>
          <td style={{ width: 150 }}>{user.name}</td>
          <td>{user.description}</td>
        </>
      )}
    />
  )
}
```
