---
id: endless-scrolling
title: Endless Scrolling
sidebar_label: Endless Scrolling
slug: /endless-scrolling/
description: The React Virtuoso component makes it trivial to implement infinite scrolling lists in both directions with variably sized items.
---

Use the `endReached` callback to automatically load more items when the user scrolls to the bottom of the list, creating endless scrolling.
If you want to load items more aggressively, set the `overscan` or the `increaseViewportBy` property.

For reverse endless scrolling implementation, check [the prepend items](/prepend-items/) example.

Scroll fast to the bottom of the list to load additional items.

```jsx live include-data
import { Virtuoso } from 'react-virtuoso'
import { generateUsers } from './data'
import { useState, useCallback, useEffect } from 'react'

export default function App() {
  const [users, setUsers] = useState(() => [])

  const loadMore = useCallback(() => {
    return setTimeout(() => {
      setUsers((users) => [...users, ...generateUsers(100, users.length)])
    }, 200)
  }, [setUsers])

  useEffect(() => {
    const timeout = loadMore()
    return () => clearTimeout(timeout)
  }, [])

  return (
    <Virtuoso
      style={{ height: 300 }}
      data={users}
      endReached={loadMore}
      overscan={200}
      itemContent={(index, user) => {
        return <div style={{ backgroundColor: user.bgColor }}>{user.name}</div>
      }}
      components={{ Footer }}
    />
  )
}


const Footer = () => {
  return (
    <div
      style={{
        padding: '2rem',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      Loading...
    </div>
  )
}

```
