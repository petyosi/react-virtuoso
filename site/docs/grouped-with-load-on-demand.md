---
id: grouped-with-load-on-demand
title: Grouped Load on Demand
sidebar_label: Load on Demand
slug: /grouped-with-load-on-demand/
---

The `GroupedVirtuoso` component can have a `Footer`, that has a "load more" button that appends more items to the existing ones.

To add additional items to the groups, you should re-calculate the `groupCounts` property value with the group values of the newly loaded items. 
Check the source code of this example for an example implementation.

The `calculateGroupsSoFar` Slices the total groups into the groups which contain the items so far. 
For example, if you have `[10, 10, 10, 10]` groups in total, slicing them to 23 will result in `[10, 10, 3]`.

The `setTimeout` delay is just for illustrative purposes - in reality, the data is fetched from a remote source.

```jsx live include-data
import { GroupedVirtuoso } from 'react-virtuoso'
import { useCallback, useState, useRef, useEffect, useMemo } from 'react'
import { generateGroupedUsers, toggleBg } from './data'

export default function App() {
  const { users, groups, groupCounts } = useMemo(
    () => generateGroupedUsers(500),
    []
  )

  const calculateGroupsSoFar = useCallback((totalGroups, count) => {
    const groups = []
    let i = 0
    do {
      const group = totalGroups[i]
      groups.push(Math.min(group, count))
      count -= group
      i++
    } while (count > 0 && i <= totalGroups.length)
    return groups
  }, [])

  const [currentGroupCounts, setCurrentGroupCounts] = useState([])
  const loadedItems = useRef(0)
  const [loading, setLoading] = useState(false)

  const loadMore = useCallback(() => {
    setLoading(true)
    return setTimeout(() => {
      loadedItems.current += 50
      setLoading(false)
      setCurrentGroupCounts(
        calculateGroupsSoFar(groupCounts, loadedItems.current)
      )
    }, 500)
  }, [])

  useEffect(() => {
    const timeoutRef = loadMore()
    return () => clearTimeout(timeoutRef)
  }, [])

  return (
    <GroupedVirtuoso
      style={{ height: 400 }}
      groupCounts={currentGroupCounts}
      groupContent={index => (
        <div style={{ backgroundColor: 'var(--ifm-background-color)', paddingTop: '1rem' }}>Group {groups[index]}</div>
      )}
      itemContent={index => (
        <div style={{ backgroundColor: toggleBg(index) }}>{users[index].name}</div>
      )}
      components={{
        Footer: () => {
          return (
            <div
              style={{
                padding: '2rem',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <button disabled={loading} onClick={loadMore}>
                {loading ? 'Loading...' : 'Press to load more'}
              </button>
            </div>
          )
        },
      }}
    />
  )
}
```
