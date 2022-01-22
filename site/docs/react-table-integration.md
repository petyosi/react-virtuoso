---
id: react-table-integration
title: Table Virtuoso integrated with React Table
sidebar_label: React Table
slug: /react-table-integration/
---

The following example virtualizes the [basic example of React Table](https://react-table.tanstack.com/docs/examples/basic). `makeData` comes [from the React Table samples](https://raw.githubusercontent.com/tannerlinsley/react-table/master/examples/basic/src/makeData.js).

## Virtualized React Table with Table Virtuoso

```jsx live
() => {
  const data = useMemo(() => makeData(200), [])
  const columns = useMemo(
    () => [
      {
        Header: 'Name',
        columns: [
          {
            Header: 'First Name',
            accessor: 'firstName',
          },
          {
            Header: 'Last Name',
            accessor: 'lastName',
          },
        ],
      },
      {
        Header: 'Info',
        columns: [
          {
            Header: 'Age',
            accessor: 'age',
          },
          {
            Header: 'Visits',
            accessor: 'visits',
          },
          {
            Header: 'Status',
            accessor: 'status',
          },
          {
            Header: 'Profile Progress',
            accessor: 'progress',
          },
        ],
      },
    ],
    []
  )
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({
    columns,
    data,
  })

  return (
    <TableVirtuoso
      totalCount={rows.length}
      components={{
        Table: ({ style, ...props }) => <table {...getTableProps()} {...props} style={{ ...style, width: 800 }} />,
        TableBody: React.forwardRef(({ style, ...props }, ref) => <tbody {...getTableBodyProps()} {...props} ref={ref} />),
        TableRow: (props) => {
          const index = props['data-index']
          const row = rows[index]
          return <tr {...props} {...row.getRowProps()} />
        },
      }}
      fixedHeaderContent={() => {
        return headerGroups.map((headerGroup) => (
          <tr {...headerGroup.getHeaderGroupProps()} style={{ background: 'var(--ifm-color-emphasis-100)' }}>
            {headerGroup.headers.map((column) => (
              <th {...column.getHeaderProps()}>{column.render('Header')}</th>
            ))}
          </tr>
        ))
      }}
      itemContent={(index, user) => {
        const row = rows[index]
        prepareRow(row)
        return row.cells.map((cell) => {
          return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
        })
      }}
    />
  )
}
```
