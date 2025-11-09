---
title: Table Virtuoso with MUI table
sidebar:
  label: MUI Table
  order: 1
---

The structure of `TableVirtuoso` is compatible with the markup of MUI Table. Notice the adjustment of the `borderCollapse` styling.

Notice that you should keep table components outside of the component defniition to avoid re-renders.
If you need to interact with a state within the component, you can pass the state through the table's `context` prop;
its value will be propagated in the below component `context` prop.
See the [press to load more example](../press-to-load-more/) for an example usage of the context.

## MUI Table virtualized with Table Virtuoso

```tsx live noSandbox
import { TableVirtuoso, TableVirtuosoProps } from 'react-virtuoso'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import { useMemo, forwardRef } from 'react'

const TableComponents: TableVirtuosoProps<{ name: string; description: string }, unknown>['components'] = {
  Scroller: forwardRef((props, ref) => <TableContainer component={Paper} {...props} ref={ref} />),
  Table: (props) => <Table {...props} style={{ borderCollapse: 'separate' }} />,
  TableHead: TableHead,
  TableRow: TableRow,
  TableBody: forwardRef((props, ref) => <TableBody {...props} ref={ref} />),
}

export default function App() {
  const users = useMemo(
    () =>
      Array.from({ length: 100 }, (_, index) => ({
        name: `User ${index}`,
        description: `${index} description`,
      })),
    []
  )

  return (
    <TableVirtuoso
      style={{ height: '100%' }}
      data={users}
      components={TableComponents}
      fixedHeaderContent={() => (
        <TableRow>
          <TableCell style={{ width: 150, background: 'white' }}>Name</TableCell>
          <TableCell style={{ background: 'white' }}>Description</TableCell>
        </TableRow>
      )}
      itemContent={(index, user) => (
        <>
          <TableCell style={{ width: 150, background: 'white' }}>{user.name}</TableCell>
          <TableCell style={{ background: 'white' }}>{user.description}</TableCell>
        </>
      )}
    />
  )
}
```
