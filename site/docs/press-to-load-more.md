---
id: press-to-load-more
title: Press to Load More
sidebar_label: Press to Load More
slug: /press-to-load-more/
---

The `components.Footer` property can be used to place a "load more" button that appends more items to the list.

Scroll to the bottom of the list and press the button to load 100 more items. The `setTimeout` simulates a network request; in the real world, you can fetch data from a service.

```jsx live
() => {
  const [users, setUsers] = useState(() => [])
  const [loading, setLoading] = useState(false)

  const loadMore = useCallback(() => {
    setLoading(true)
    return setTimeout(() => {
      setUsers((users) =>  ([...users, ...generateUsers(100, users.length)]) )
      setLoading(() => false)
    }, 500)
  }, [setUsers, setLoading])

  useEffect(() => {
    const timeout = loadMore()
    return () => clearTimeout(timeout)
  }, [])

  return (
    <Virtuoso
      style={{height: 300}}
      data={users}
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
              <button disabled={loading} onClick={loadMore}>
                {loading ? 'Loading...' : 'Press to load more'}
              </button>
            </div>
          )
        }
      }}
    />
  )
}
```
