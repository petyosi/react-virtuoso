---
id: table-fixed-columns
title: Table Virtuoso Example with Fixed Columns
sidebar_label: Fixed Columns
slug: /table-fixed-columns/
---

Setting sticky columns is done entirely through styling.

## Table with fixed first column

```jsx live
function App() {
  const users = useMemo(() => {
    return Array.from({ length: 1000 }, (_, index) => ({
      name: `User ${index}`,
      description: `Description for user ${index}`
    }))
  }, [])

  return (
    <TableVirtuoso
      style={{ height: 400 }}
      data={users}
      components={{ Table: ({ style, ...props }) => <table {...props} style={{ ...style, width: 700 }} /> }}
      fixedHeaderContent={() => (
        <tr>
          <th style={{ width: 150, background: 'white', position: 'sticky', left: 0, zIndex: 1 }}>Name</th>
          <th style={{ background: 'white' }}>Description</th>
          <th style={{ background: 'white' }}>Description</th>
          <th style={{ background: 'white' }}>Description</th>
          <th style={{ background: 'white' }}>Description</th>
          <th style={{ background: 'white' }}>Description</th>
        </tr>
      )}
      itemContent={(index, user) => (
        <>
          <td style={{ width: 150, background: 'white', position: 'sticky', left: 0 }}>{user.name}</td>
          <td>{user.description}</td>
          <td>{user.description}</td>
          <td>{user.description}</td>
          <td>{user.description}</td>
          <td>{user.description}</td>
        </>
      )}
    />
  )
}
```
