---
id: grouped-by-first-letter
title: Grouped by First Letter
sidebar_label: Grouped by First Letter
slug: /grouped-by-first-letter/
---

A slightly more complex `GroupedVirtuoso` example displaying 500 user records, grouped by the first letter of their name.
The `generateGroupedUsers` is a dummy implementation that builds grouped data. The `users` variable contains 500 user records, sorted by name.
The `groups` variable contains the first letter groups -> `['A', 'B', 'C']`.
The `groupCounts` specifies how many items each group has -> `[ 20, 30, 15, 10 ]`.

```jsx live
 () => {
  const { users, groups, groupCounts } = generateGroupedUsers(500)

  return (
    <GroupedVirtuoso
      groupCounts={groupCounts}

      groupContent={index => {
        return <div 
        style={{ 
          backgroundColor: 'var(--ifm-background-color)', 
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
