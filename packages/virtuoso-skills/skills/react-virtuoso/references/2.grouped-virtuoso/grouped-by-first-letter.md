---
title: Grouped by First Letter
description: Build alphabetically grouped lists with sticky headers using GroupedVirtuoso for contact lists and directories.
sidebar:
  label: Grouped by First Letter
  order: 2
---

Here is a more complex `GroupedVirtuoso` example displaying 200 users, grouped by the first letter of their name.
The `generateGroupedUsers` is a dummy implementation that builds grouped data. The `users` variable contains 500 user records,
The `groups` variable contains the first letter groups -> `['A', 'B', 'C']`.
The `groupCounts` specifies how many items each group has, for example `[ 20, 30, 15, 10 ]`.

```tsx live
import { GroupedVirtuoso } from 'react-virtuoso'
import { useMemo } from 'react'

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

  return (
    <GroupedVirtuoso
      groupCounts={groupCounts}
      style={{ height: '100%' }}
      groupContent={(index) => {
        return (
          <div
            style={{
              backgroundColor: 'var(--background)',
              paddingTop: '1rem',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {groups[index]}
          </div>
        )
      }}
      itemContent={(index) => {
        return <div>{users[index].name}</div>
      }}
    />
  )
}
```
