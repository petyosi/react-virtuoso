---
title: Table Virtuoso Example with Fixed Headers
description: Add sticky table headers that remain visible while scrolling using TableVirtuoso's fixedHeaderContent prop.
sidebar:
  label: Fixed Headers
---

If set, the `fixedHeaderContent` property specifies the content of the `thead` element. The header element remains fixed while scrolling.
Ensure that the header elements are not transparent. Otherwise, the table cells will be visible.

## Table with `fixedHeaderContent`

```tsx live
import {TableVirtuoso} from 'react-virtuoso'
import {useMemo} from 'react'

export default function App() {
  const users = useMemo(() => {
    return Array.from({ length: 1000 }, (_, index) => ({
      name: `User ${index}`,
      description: `Description for user ${index}`
    }))
  }, [])

  return (
    <TableVirtuoso
      style={{ height: '100%' }}
      data={users}
      fixedHeaderContent={() => (
        <tr>
          <th style={{ width: 150, background: 'var(--background)' }}>Name</th>
          <th style={{ background: 'var(--background)' }}>Description</th>
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
