---
id: endless-scrolling
title: Endless Scrolling
sidebar_label: Endless Scrolling
slug: /endless-scrolling/
description: The React Virtuoso component makes it trivial to implement infinite scrolling lists in both directions with variably sized items.
---

The `endReached` callback property can be used to automatically load more items when the user scrolls to the bottom of the list, creating endless scrolling. 
If you would like to load items more aggressively, you can increase the `overscan` value. 
For reverse endless scrolling implementation, check [/prepend-items/](the prepend items) example.

Scroll fast to the bottom of the list to load additional items.

```jsx live
() => {
  const [users, setUsers] = useState(() => [])

  const loadMore = useCallback(() => {
    return setTimeout(() => {
      setUsers((users) =>  ([...users, ...generateUsers(100, users.length)]) )
    }, 200)
  }, [setUsers])

  useEffect(() => {
    const timeout = loadMore()
    return () => clearTimeout(timeout)
  }, [])

  return (
    <Virtuoso
      style={{height: 300}}
      data={users}
      endReached={loadMore}
      overscan={200}
      itemContent={(index, user) => { return (<div style={{ backgroundColor: user.bgColor }}>{user.name}</div>) }}
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
              Loading...
            </div>
          )
        }
      }}
    />
  )
}
```
