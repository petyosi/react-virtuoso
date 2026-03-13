---
title: Press to Load More
description: Add a load more button to React Virtuoso lists for user-triggered pagination instead of automatic infinite scrolling.
sidebar:
  label: Press to Load More
  order: 101
---

The `components.Footer` property can be used to place a "load more" button that appends more items to the list.

Scroll to the bottom of the list and press the button to load 100 more items. The `setTimeout` simulates a network request; in the real world, you can fetch data from a service.

```tsx live wide file=App.tsx
import { Virtuoso } from 'react-virtuoso'
import { useState, useCallback, useEffect } from 'react'
import { Footer } from './Footer'
import { generateUsers } from './utils'

export default function App() {
  const [users, setUsers] = useState(() => [])
  const [loading, setLoading] = useState(false)

  const loadMore = useCallback(() => {
    setLoading(true)
    return setTimeout(() => {
      setUsers((users) => [...users, ...generateUsers(100, users.length)])
      setLoading(() => false)
    }, 500)
  }, [setUsers, setLoading])

  useEffect(() => {
    const timeout = loadMore()
    return () => clearTimeout(timeout)
  }, [])

  return (
    <Virtuoso
      style={{ height: '100%' }}
      data={users}
      context={{ loading, loadMore }}
      increaseViewportBy={200}
      itemContent={(index, user) => {
        return <div className="border-b border-gray-200 px-4 py-2 text-sm">{user.name}</div>
      }}
      components={{ Footer }}
    />
  )
}
```

```tsx live file=Footer.tsx
export const Footer = ({ context: { loadMore, loading } }) => {
  return (
    <div className="flex justify-center p-6">
      <button
        className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
        disabled={loading}
        onClick={loadMore}
      >
        {loading ? 'Loading...' : 'Press to load more'}
      </button>
    </div>
  )
}
```

```tsx live file=utils.ts
export function generateUsers(count: number, start: number) {
  return Array.from({ length: count }, (_, i) => ({
    name: `User ${start + i}`,
  }))
}
```
