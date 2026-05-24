---
title: Virtual List With 100,000 Items
description: Get started with React Virtuoso by rendering a virtual list with 100,000 items of unknown sizes.
sidebar:
  label: 100,000 Items
  order: 1
---

The Virtuoso component is designed to render huge lists with **unknown item sizes**.
You do not have to configure anything apart from the `data` or the `totalCount` and the `itemContent` renderer.

The `itemContent` render callback accepts `index`, and `item` parameter (if `data` is set), which specifies the index of the item rendered.
It is up to you to build and return the respective content for it.

## List with `data`

```tsx live
import { Virtuoso } from 'react-virtuoso'
import { useMemo } from 'react'

export default function App() {
  const users = useMemo(() => {
    return Array.from({ length: 100000 }, (_, index) => ({
      name: `User ${index}`,
      // random-sized items
      size: Math.floor(Math.random() * 40) + 70,
      description: `Description for user ${index}`,
    }))
  }, [])

  return (
    <Virtuoso
      style={{ height: '100%' }}
      data={users}
      itemContent={(_, user) => (
        <div
          style={{
            padding: '0.5rem',
            height: `${user.size}px`,
            borderBottom: `1px solid var(--border)`,
          }}
        >
          <p>
            <strong>{user.name}</strong>
          </p>
          <div>{user.description}</div>
        </div>
      )}
    />
  )
}
```

## List with `totalCount`

```tsx live
import { Virtuoso } from 'react-virtuoso'
import { useMemo } from 'react'

export default function App() {
  const users = useMemo(() => {
    return Array.from({ length: 100000 }, (_, index) => ({
      name: `User ${index}`,
      size: Math.floor(Math.random() * 40) + 70,
      description: `Description for user ${index}`,
    }))
  }, [])

  return (
    <Virtuoso
      style={{ height: '100%' }}
      totalCount={users.length}
      itemContent={(index) => {
        const user = users[index]
        return (
          <div
            style={{
              padding: '0.5rem',
              height: `${user.size}px`,
              borderBottom: `1px solid var(--border)`,
            }}
          >
            <p>
              <strong>{user.name}</strong>
            </p>
            <div>{user.description}</div>
          </div>
        )
      }}
    />
  )
}
```
