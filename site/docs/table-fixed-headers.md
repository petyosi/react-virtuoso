---
id: table-fixed-columns
title: Table Virtuoso Example with Fixed Columns
sidebar_label: Fixed Columns
slug: /table-fixed-columns/
---

Setting sticky columns is done entirely through styling.

## Table with fixed first column

```jsx live
<TableVirtuoso
  data={generateUsers(1000)}
  components={{ Table: ({ style, ...props }) => <table {...props} style={{...style, width: 700}} /> }}
  fixedHeaderContent={() => ( 
    <tr>
      <th style={{ width: 150, background: 'blue', position: 'sticky', left: 0, zIndex: 1 }}>Name</th>
      <th style={{ background: 'blue' }}>Description</th>
      <th style={{ background: 'blue' }}>Description</th>
      <th style={{ background: 'blue' }}>Description</th>
      <th style={{ background: 'blue' }}>Description</th>
      <th style={{ background: 'blue' }}>Description</th>
    </tr>
  )}
  itemContent={(index, user) => (
    <>
      <td style={{ width: 150, background: 'var(--ifm-background-color)', position: 'sticky', left: 0 }}>{user.name}</td>
      <td>{user.description}</td>
      <td>{user.description}</td>
      <td>{user.description}</td>
      <td>{user.description}</td>
      <td>{user.description}</td>
    </>
  )}
/>
```
