---
id: grouped-numbers
title: Grouped 10,000 numbers
sidebar_label: Grouped Numbers
slug: /grouped-numbers/
---

The example below shows a simple grouping mode - 10,000 items in groups of 10.

```jsx live
import { GroupedVirtuoso } from 'react-virtuoso'
import { useMemo } from 'react'

export default function App() {
  const groupCounts = useMemo(() => { 
    return Array(1000).fill(10)
  }, [])


  return (
    <GroupedVirtuoso
      style={{ height: 400 }}
      groupCounts={groupCounts}
      groupContent={index => {
        return (
            <div style={{ backgroundColor: 'white' }}>Group {index * 10} &ndash; {index * 10 + 10}</div>
        )
      }}
      itemContent={(index, groupIndex) => {
        return (
              <div>{index} (group {groupIndex})</div>
        )
      }}
    />
  )
}
```
