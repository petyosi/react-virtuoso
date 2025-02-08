---
id: table-fixed-headers
title: Table Virtuoso Example with Fixed Headers
sidebar_label: Fixed Headers
slug: /table-fixed-headers/
---

If set, the `fixedHeaderContent` property specifies the content of the `thead` element. The header element remains fixed while scrolling.
Ensure that the header elements are not transparent. Otherwise, the table cells will be visible.

## Table with `fixedHeaderContent`

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
      fixedHeaderContent={() => (
        <tr>
          <th style={{ width: 150, background: 'white' }}>Name</th>
          <th style={{ background: 'white' }}>Description</th>
        </tr>
      )}
      itemContent={(index, user) => (
        <>
          <td style={{ width: 150 }}>{user.name}</td>
          <td>{user.description}</td>
        </>
      )}
    />
  )
}
```
