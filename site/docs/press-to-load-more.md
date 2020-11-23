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
  const [items, setItems] = useState(() => [])
  const [loading, setLoading] = useState(false)

  const loadMore = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      setItems((items) =>  ([...items, ...Array(100).fill(true).map((_, i) => getUser(i))]) )
      setLoading(() => false)
    }, 500)
  }, [setItems, setLoading])

  useEffect(() => {
    loadMore()
  }, [])

  return (
    <Virtuoso
      style={{height: 300}}
      data={items}
      itemContent={(index, item) => (<div>{item.name}</div>)}
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
