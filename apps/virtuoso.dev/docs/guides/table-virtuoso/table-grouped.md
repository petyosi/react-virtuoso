---
id: table-grouped
title: Table Virtuoso Example with Grouped Rows
sidebar_label: Grouped Rows
slug: /table-grouped/
---

If set, the `fixedHeaderContent` property specifies the content of the `thead` element. The header element remains fixed while scrolling.
Ensure that the header elements and the group elements are not transparent. Otherwise, the table cells will be visible.

## Table with grouped rows

```tsx live
import { TableVirtuoso } from 'react-virtuoso'
import { useMemo } from 'react'

export default function App() {
  const groupCounts = useMemo(() => {
    return Array(10).fill(10)
  }, [])

  const users = useMemo(() => {
    return groupCounts.flatMap((count, index) =>
      Array.from({ length: count }, (_, i) => ({
        name: `User ${index * count + i}`,
        description: `Description for user ${index * count + i}`,
        group: index,
      }))
    )
  }, [])

  return (
    <TableVirtuoso
      style={{ height: '100%', '--background': 'whitesmoke' }}
      groupCounts={groupCounts}
      fixedHeaderContent={() => (
        <tr style={{ background: 'var(--background)' }}>
          <th style={{ width: 150 }}>Name</th>
          <th>Description</th>
        </tr>
      )}
      groupContent={(index) => (
        <td colSpan={1000} style={{ background: 'var(--background)', fontWeight: 'bold' }}>
          Group {index}
        </td>
      )}
      itemContent={(index, groupIndex) => {
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
