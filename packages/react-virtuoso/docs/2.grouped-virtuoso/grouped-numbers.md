---
title: Grouped 10,000 numbers
description: Display large datasets in groups with sticky headers using React Virtuoso GroupedVirtuoso component.
sidebar:
  label: Grouped Numbers
  order: 1
---

The example below shows a simple grouping mode - 10,000 items in groups of 10.

```tsx live
import { GroupedVirtuoso } from 'react-virtuoso'
import { useMemo } from 'react'

export default function App() {
  const groupCounts = useMemo(() => { 
    return Array(1000).fill(10)
  }, [])

  return (
    <GroupedVirtuoso
      style={{ height: '100%' }}
      groupCounts={groupCounts}
      groupContent={index => {
        return (
            <div style={{ backgroundColor: 'var(--background)' }}>Group {index * 10} - {index * 10 + 10}</div>
        )
      }}
      itemContent={(index, groupIndex) => (<div>{index} (group {groupIndex})</div>) }
    />
  )
}
```
