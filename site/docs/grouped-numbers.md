---
id: grouped-numbers
title: Grouped 10,000 numbers
sidebar_label: Grouped Numbers
slug: /grouped-numbers/
---

The example below shows a simple grouping mode - 10,000 items in groups of 10.

```jsx live
() => {
  const groupCounts = useMemo(() => { 
    return Array(1000).fill(10)
  }, [])


  return (
    <GroupedVirtuoso
      groupCounts={groupCounts}
      groupContent={index => {
        return (
            <div style={{ backgroundColor: 'var(--ifm-background-color)' }}>Group {index * 10} &ndash; {index * 10 + 10}</div>
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
