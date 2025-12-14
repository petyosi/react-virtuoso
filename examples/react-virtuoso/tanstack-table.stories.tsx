import { flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table'
import { useMemo, useReducer, useState } from 'react'
import { TableVirtuoso } from 'react-virtuoso'

function makeData(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const firstName = `User ${index}`
    const lastName = 'Doe'
    return {
      age: Math.floor(Math.random() * 100),
      firstName,
      id: index,
      lastName,
      progress: Math.floor(Math.random() * 100),
      status: ['relationship', 'complicated', 'single'][Math.floor(Math.random() * 3)],
      visits: Math.floor(Math.random() * 100),
    }
  })
}

export const TanstackTableExample = () => {
  const rerender = useReducer(() => ({}), {})[1]

  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'firstName',
        cell: (info: { getValue: () => unknown }) => info.getValue(),
      },
      {
        accessorFn: (row: { lastName: string }) => row.lastName,
        cell: (info: { getValue: () => unknown }) => info.getValue(),
        header: () => <span>Last Name</span>,
        id: 'lastName',
      },
      {
        accessorKey: 'age',
        header: () => 'Age',
        size: 50,
      },
      {
        accessorKey: 'visits',
        header: () => <span>Visits</span>,
        size: 50,
      },
      {
        accessorKey: 'status',
        header: 'Status',
      },
      {
        accessorKey: 'progress',
        header: 'Profile Progress',
        size: 80,
      },
    ],
    []
  )

  const [data, setData] = useState(() => makeData(500))
  const refreshData = () => {
    setData(() => makeData(500))
  }

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  const { rows } = table.getRowModel()

  return (
    <div style={{ padding: '0.5rem' }}>
      <div style={{ height: '0.5rem' }} />

      <TableVirtuoso
        components={{
          Table: ({ style, ...props }) => {
            return (
              <table
                {...props}
                style={{
                  ...style,
                  borderCollapse: 'collapse',
                  borderSpacing: 0,
                  tableLayout: 'fixed',
                  width: '100%',
                }}
              />
            )
          },
          TableRow: (props) => {
            const index = props['data-index']
            const row = rows[index]

            return (
              <tr {...props}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} style={{ padding: '6px' }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            )
          },
        }}
        fixedHeaderContent={() => {
          return table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} style={{ background: 'lightgray', margin: 0 }}>
              {headerGroup.headers.map((header) => {
                return (
                  <th
                    colSpan={header.colSpan}
                    key={header.id}
                    style={{
                      borderBottom: '1px solid lightgray',
                      padding: '2px 4px',
                      textAlign: 'left',
                      width: header.getSize(),
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        onClick={header.column.getToggleSortingHandler()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            header.column.getToggleSortingHandler()?.(e)
                          }
                        }}
                        role="button"
                        style={header.column.getCanSort() ? { cursor: 'pointer', userSelect: 'none' } : {}}
                        tabIndex={header.column.getCanSort() ? 0 : undefined}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                )
              })}
            </tr>
          ))
        }}
        style={{ border: '1px solid lightgray', height: '500px' }}
        totalCount={rows.length}
      />

      <div>{table.getRowModel().rows.length} Rows</div>
      <div>
        <button
          onClick={() => {
            rerender()
          }}
        >
          Force Rerender
        </button>
      </div>
      <div>
        <button
          onClick={() => {
            refreshData()
          }}
        >
          Refresh Data
        </button>
      </div>
    </div>
  )
}
