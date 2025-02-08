---
id: hello
title: Virtual List With 100,000 Items
sidebar_label: 100,000 Items
slug: /hello/
sidebar_position: 1
---

The Virtuoso component is designed to render huge lists with **unknown item sizes**.
You do not have to configure anything apart from the `data` or the `totalCount` and the `itemContent` renderer.

The `itemContent` render callback accepts `index`, and `item` parameter (if `data` is set), which specifies the index of the item rendered. 
It is up to you to build and return the respective content for it.

## List with `data`

```tsx live 
function App() {
  const users = useMemo(() => {
    return Array.from({ length: 100000 }, (_, index) => ({
      name: `User ${index}`,
      bgColor: `hsl(${Math.random() * 360}, 70%, 80%)`,
      size: Math.floor(Math.random() * 40) + 100,
      description: `Description for user ${index}`
    }))
  }, [])

  return (
    <Virtuoso
      style={{ height: 400 }}
      data={users}
      itemContent={(_, user) => (
        <div
          style={{
            backgroundColor: user.bgColor,
            padding: '0.5rem',
            height: `${user.size}px`
          }}
        >
          <p><strong>{user.name}</strong></p>
          <div>{user.description}</div>
        </div>
      )}
    />
  )
}
```

## List with `totalCount`

```jsx live include-data
function App() {
  const users = useMemo(() => {
    return Array.from({ length: 100000 }, (_, index) => ({
      name: `User ${index}`,
      bgColor: `hsl(${Math.random() * 360}, 70%, 80%)`,
      size: Math.floor(Math.random() * 40) + 100,
      description: `Description for user ${index}`
    }))
  }, [])

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
            padding: '0.5rem',
            height: `${user.size}px`
          }}
        >
          <p><strong>{user.name}</strong></p>
          <div>{user.description}</div>
        </div>
      )}}
    />
  )
}
```
