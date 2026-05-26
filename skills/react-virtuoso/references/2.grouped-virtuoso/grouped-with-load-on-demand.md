---
title: Grouped Load on Demand
description: Implement infinite scrolling with grouped data in React Virtuoso by dynamically loading and appending groups.
sidebar:
  label: Load on Demand
  order: 4
---

The `GroupedVirtuoso` component can have a `Footer`, that has a "load more" button that appends more items to the existing ones.

To add additional items to the groups, you should re-calculate the `groupCounts` property value with the group values of the newly loaded items.
Check the source code of this example for an example implementation.

The `calculateGroupsSoFar` Slices the total groups into the groups which contain the items so far.
For example, if you have `[10, 10, 10, 10]` groups in total, slicing them to 23 will result in `[10, 10, 3]`.

The `setTimeout` delay is just for illustrative purposes - in reality, the data will be fetched from a remote source.

```tsx live
import { GroupedVirtuoso } from 'react-virtuoso'
import { useMemo, useState, useCallback, useEffect, useRef } from 'react'

export default function App() {
  const { users, groups, groupCounts } = useMemo(() => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

    const users = letters.flatMap((letter) => {
      return Array.from({ length: 20 }, (_, index) => ({
        name: `${letter} User ${index}`,
        initials: `${letter}${index}`,
        description: `Description for user ${index}`,
      }))
    })

    const groups = Array.from({ length: 10 }, (_, index) => {
      return letters[index]
    })

    const groupCounts = groups.map((letter, index) => {
      return users.filter((user, userIndex) => user.name.startsWith(letter)).length
    })
    return { users, groups, groupCounts }
  }, [])

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
      setCurrentGroupCounts(calculateGroupsSoFar(groupCounts, loadedItems.current))
    }, 500)
  }, [])

  useEffect(() => {
    const timeoutRef = loadMore()
    return () => clearTimeout(timeoutRef)
  }, [])

  return (
    <GroupedVirtuoso
      style={{ height: '100%' }}
      groupCounts={currentGroupCounts}
      groupContent={(index) => <div style={{ backgroundColor: 'var(--background)', paddingTop: '1rem' }}>Group {groups[index]}</div>}
      itemContent={(index) => <div>{users[index].name}</div>}
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
