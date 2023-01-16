---
id: grouped-table
title: Grouped Table
sidebar_label: Grouped Table
slug: /grouped-table/
---

The example below shows a simple table grouping mode.

```jsx live
import { GroupedTableVirtuoso } from 'react-virtuoso'
import { useMemo, useRef } from 'react'

export default function App() {
  const ref = useRef()

  const groupCounts = useMemo(() => {
    return Array(1000).fill(10)
  }, [])

  return (
    <GroupedTableVirtuoso
      groupCounts={groupCounts}
      style={{ height: 400 }}
      fixedHeaderContent={() => {
        return (
          <tr style={{ background: 'white', textAlign: 'left' }}>
            <th key={1} style={{ width: '140px' }}>
              Item index
            </th>
            <th key={2} style={{ width: '140px' }}>
              Greetings
            </th>
          </tr>
        )
      }}
      itemContent={(index) => {
        return (
          <>
            <td style={{ height: 21 }}>{index}</td>
            <td style={{ height: 21 }}>Hello</td>
          </>
        )
      }}
      groupContent={(index) => {
        return (
          <>
            <td style={{ height: 21, background: 'white' }}>Group {index}</td>
            <td style={{ height: 21, background: 'white' }} />
          </>
        )
      }}
    />
  )
}
```
