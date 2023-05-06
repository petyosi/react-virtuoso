---
id: grouped-by-first-letter
title: Grouped by First Letter
sidebar_label: Grouped by First Letter
slug: /grouped-by-first-letter/
---

Here is a more complex `GroupedVirtuoso` example displaying 500 users, grouped by the first letter of their name.
The `generateGroupedUsers` is a dummy implementation that builds grouped data. The `users` variable contains 500 user records, sorted by name.
The `groups` variable contains the first letter groups -> `['A', 'B', 'C']`.
The `groupCounts` specifies how many items each group has -> `[ 20, 30, 15, 10 ]`.

```jsx live include-data
import { GroupedVirtuoso } from 'react-virtuoso'
import { useMemo } from 'react'
import { generateGroupedUsers, toggleBg } from './data'

export default function App() {
  const { users, groups, groupCounts } = generateGroupedUsers(500)

  return (
    <GroupedVirtuoso
      groupCounts={groupCounts}
      style={{ height: 400 }}
      groupContent={index => {
        return <div 
        style={{ 
          backgroundColor: 'white', 
          paddingTop: '1rem',
          borderBottom: '1px solid #ccc' 
        }}>{groups[index]}</div>
      }}

      itemContent={index => {
        return <div style={{ backgroundColor: toggleBg(index) }}>{users[index].name}</div>
      }}
    />
  )
}
```
