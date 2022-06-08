---
id: hello
title: Virtual List With 100,000 Items
sidebar_label: 100,000 Items
slug: /hello/
---

The Virtuoso component is designed to render huge lists with **unknown item sizes**.
You do not have to configure anything apart from the `data` or the `totalCount` and the `itemContent` renderer.

The `itemContent` render callback accepts `index`, and `item` parameter (if `data` is set),
which specifies the absolute index of the item rendered;
It is up to you to build and return the respective content for it.

**Note:** VirtuosoGrid does not support `data`.

## List with `data`

```jsx live include-data
import { Virtuoso } from 'react-virtuoso'
import { generateUsers } from './data'

export default function App() {
return <Virtuoso
  style={{ height: 400 }}
  data={generateUsers(100000)}
  itemContent={(index, user) => (
    <div
      style={{
        backgroundColor: user.bgColor,
        padding: '1rem 0.5rem',
      }}
    >
      <h4>{user.name}</h4>
      <div style={{ marginTop: '1rem' }}>{user.description}</div>
    </div>
  )}
/>
}
```

## List with `totalCount`

```jsx live include-data
import { Virtuoso } from 'react-virtuoso'
import { generateUsers } from './data'
import { useMemo } from 'react'

export default function App() {
  const users = useMemo(() => generateUsers(100000), [])

  return (
    <Virtuoso
      style={{ height: 400 }}
      totalCount={users.length}
      itemContent={(index) => {
        const user = users[index]
        return (
        <div
          style={{
            backgroundColor: user.bgColor,
            padding: '1rem 0.5rem',
          }}
        >
          <h4>{user.name}</h4>
          <div style={{ marginTop: '1rem' }}>{user.description}</div>
        </div>
      )}}
    />
  )
}
```
