---
id: table-fixed-headers
title: Table Virtuoso Example with Fixed Headers
sidebar_label: Fixed Headers
slug: /table-fixed-headers/
---

If set, the `fixedHeaderContent` property specifies the content of the `thead` element. The header element remains fixed while scrolling.
Ensure that the header elements are not transparent. Otherwise, the table cells will be visible.

## Table with `fixedHeaderContent`

```jsx live include-data
import { TableVirtuoso } from 'react-virtuoso'
import { generateUsers } from './data'
import { useMemo } from 'react'

export default function App() {
  return (
    <TableVirtuoso
      style={{ height: 400 }}
      data={generateUsers(100000)}
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
