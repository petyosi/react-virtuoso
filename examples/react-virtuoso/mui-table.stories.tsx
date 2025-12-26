import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import { forwardRef, useMemo } from 'react'
import { TableVirtuoso, TableVirtuosoProps } from 'react-virtuoso'

const TableComponents: TableVirtuosoProps<{ description: string; name: string }, unknown>['components'] = {
  Scroller: forwardRef((props, ref) => <TableContainer component={Paper} {...props} ref={ref} />),
  Table: (props) => <Table {...props} style={{ borderCollapse: 'separate' }} />,
  TableBody: forwardRef((props, ref) => <TableBody {...props} ref={ref} />),
  TableHead: TableHead,
  TableRow: TableRow,
}

export const MuiTableExample = () => {
  const users = useMemo(
    () =>
      Array.from({ length: 100 }, (_, index) => ({
        description: `${index} description`,
        name: `User ${index}`,
      })),
    []
  )

  return (
    <TableVirtuoso
      components={TableComponents}
      data={users}
      fixedHeaderContent={() => (
        <TableRow>
          <TableCell style={{ background: 'white', width: 150 }}>Name</TableCell>
          <TableCell style={{ background: 'white' }}>Description</TableCell>
        </TableRow>
      )}
      itemContent={(_index, user) => (
        <>
          <TableCell style={{ background: 'white', width: 150 }}>{user.name}</TableCell>
          <TableCell style={{ background: 'white' }}>{user.description}</TableCell>
        </>
      )}
      style={{ height: '100%' }}
    />
  )
}
