---
id: table-fixed-headers
title: Table Virtuoso Example with Fixed Headers
sidebar_label: Fixed Headers
slug: /table-fixed-headers/
---

If set, the `fixedHeaderContent` property specifies the content of the `thead` element. The header element remains fixed while scrolling. 
Ensure that the header elements are not transparent, otherwise the table cells will be visible.

## Table with `fixedHeaderContent`

```jsx live
<TableVirtuoso
  data={generateUsers(100000)}
  fixedHeaderContent={() => ( 
    <tr>
      <th style={{ width: 150, background: 'blue' }}>Name</th>
      <th style={{ background: 'blue' }}>Description</th>
    </tr>
  )}
  itemContent={(index, user) => (
    <>
      <td style={{ width: 150 }}>{user.name}</td>
      <td>{user.description}</td>
    </>
  )}
/>
```
