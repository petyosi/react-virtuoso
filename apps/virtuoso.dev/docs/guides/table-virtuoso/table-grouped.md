---
id: table-grouped
title: Table Virtuoso Example with Grouped Rows
sidebar_label: Grouped Rows
slug: /table-grouped/
---

The `GroupedTableVirtuoso` component supports grouping of rows, similar to `GroupedVirtuoso`.

## Table with grouped rows

```tsx live
import { GroupedTableVirtuoso } from 'react-virtuoso'
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
  }, [groupCounts])

  return (
    <GroupedTableVirtuoso
      style={{ height: '100%', background: 'whitesmoke' }}
      groupCounts={groupCounts}
      fixedHeaderContent={() => (
        <tr style={{ background: 'var(--background)' }}>
          <th style={{ width: 150 }}>Name</th>
          <th>Description</th>
        </tr>
      )}
      groupContent={(index) => (
        <td colSpan={2} style={{ backgroundColor: 'var(--background)' }}>
          Group {index}
        </td>
      )}
      itemContent={(index, groupIndex) => {
        const user = users[index]
        return (
          <>
            <td style={{ width: 150 }}>
              {user.name} - group {groupIndex}
            </td>
            <td>{user.description}</td>
          </>
        )
      }}
    />
  )
}
```
