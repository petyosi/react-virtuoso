---
id: hello
title: Virtual List With 100,000 Items
sidebar_label: 100,000 Items
slug: /hello/
---

The Virtuoso component is built for the display of huge lists with **unknown item sizes**.
You do not have to configure anything apart from the `data` or the `totalCount` and the `itemContent` renderer.

The `itemContent` render callback accepts `index`, and `item` parameter (if `data` is set), 
which specifies the absolute index of the item being rendered;
It is up to you to build and return the respective content for it.

## List with `data`

```jsx live
() => {
  const randomHeight = () => 
    Math.floor(Math.random() * 30 + 24);

  const items = React.useMemo(() => {
    return Array
    .from({ length: 100000 })
    .map((_, i) => ({
      text: `Item ${i}`,
      height: randomHeight(),
    }))
  }, [])

  return (
    <Virtuoso
      data={items}
      itemContent={(index, item) => (
        <div style={{ height: item.height, borderBottom: "1px solid #ccc" }}>
          {item.text}
        </div>
      )}
    />
  )
}
```

## List with `itemCount`

```jsx live
() => {
  const randomHeight = () => 
    Math.floor(Math.random() * 30 + 24);

  const items = React.useMemo(() => {
    return Array
    .from({ length: 100000 })
    .map((_, i) => ({
      text: `Item ${i}`,
      height: randomHeight(),
    }))
  }, [])

  return (
    <Virtuoso
      totalCount={items.length}
      itemContent={(index) => (
        <div style={{ height: items[index].height, borderBottom: "1px solid #ccc" }}>
          {items[index].text}
        </div>
      )}
    />
  )
}
```
