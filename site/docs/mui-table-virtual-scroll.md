---
id: mui-table-virtual-scroll
title: Table Virtuoso with Material UI table
sidebar_label: Material UI Table
slug: /mui-table-virtual-scroll/
---

The structure of `TableVirtuoso` is compatible with the markup of Material UI Table. Notice the adjustment of the `borderCollapse` styling.

## Material UI Table virtualized with Table Virtuoso

```jsx live include-data import=@mui/material
import { TableVirtuoso } from 'react-virtuoso'
import { generateUsers } from './data'
import React from 'react'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'

export default function App() {
  return (
    <TableVirtuoso
      style={{ height: 400 }}
      data={generateUsers(100)}
      components={{
        Scroller: React.forwardRef((props, ref) => <TableContainer component={Paper} {...props} ref={ref} />),
        Table: (props) => <Table {...props} style={{ borderCollapse: 'separate' }} />,
        TableHead: TableHead,
        TableRow: TableRow,
        TableBody: React.forwardRef((props, ref) => <TableBody {...props} ref={ref} />),
      }}
      fixedHeaderContent={() => (
        <TableRow>
          <TableCell style={{ width: 150, background: 'white' }}>
            Name
          </TableCell>
          <TableCell style={{ background: 'white' }}>
            Description
          </TableCell>
        </TableRow>
      )}
      itemContent={(index, user) => (
        <>
          <TableCell style={{ width: 150, background: 'white' }}>
            {user.name}
          </TableCell>
          <TableCell style={{ background: 'white'  }}>
            {user.description}
          </TableCell>
        </>
      )}
    />
  )
}
```
