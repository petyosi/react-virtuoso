---
id: endless-scrolling
title: Endless Scrolling
sidebar_label: Endless Scrolling
slug: /endless-scrolling/
description: The React Virtuoso component makes it trivial to implement infinite scrolling lists in both directions with variably sized items.
sidebar_position: 100
---

Use the `endReached` callback to automatically load more items when the user scrolls to the bottom of the list, creating endless scrolling.
If you want to load items more aggressively, set the `increaseViewportBy` property.

Scroll to the bottom of the list to load additional items.

```tsx live noInline
function App() {
  const [users, setUsers] = useState(() => [])

  const loadMore = useCallback(() => {
    return setTimeout(() => {
      setUsers((users) => [...users, ...generateUsers(100, users.length)])
    }, 500)
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
      increaseViewportBy={200}
      itemContent={(index, user) => {
        return <div>{user.name}</div>
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

function generateUsers(count, start) {
  return Array.from({ length: count }, (_, i) => ({
    name: `User ${start + i}`,
  }))
}


render(<App />)
```
