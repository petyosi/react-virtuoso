import * as React from 'react'
import { getCoreRowModel, ColumnDef, useReactTable } from '@tanstack/react-table'
import { FillerRowProps, TableVirtuoso } from '../src'
import { ScrollSeekPlaceholderProps } from '../dist'
import { flexRender } from '@tanstack/react-table'

const items: Array<ReturnType<typeof item>> = []
function item(index: number) {
  return {
    id: index + 1,
    content: `Table ${index}`,
  }
}

export const getItem = (index: number) => {
  if (!items[index]) {
    items[index] = item(index)
  }

  return items[index]
}

const generateData = (length: number, startIndex = 0) => {
  return Array.from({ length }).map((_, i) => getItem(i + startIndex))
}

export function Example() {
  const columns = React.useMemo<ColumnDef<{ id: number; content: string }>[]>(
    () => [
      {
        header: () => 'Id',
        accessorKey: 'id',
        cell: (info) => info.getValue(),
      },
      {
        header: () => 'Table item',
        accessorKey: 'content',
        cell: (info) => info.getValue(),
        footer: () => 'Footer element',
      },
    ],
    []
  )

  const [data] = React.useState(() => generateData(500))

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const { rows } = table.getRowModel()

  return (
    <>
      <TableVirtuoso
        totalCount={500}
        components={{
          Table: ({ style, ...props }) => {
            return (
              <table
                {...props}
                style={{
                  ...style,
                  width: '100%',
                  tableLayout: 'fixed',
                  borderCollapse: 'collapse',
                  borderSpacing: 0,
                }}
              />
            )
          },
          TableRow: (props) => {
            const index = props['data-index']
            const row = rows[index]!

            return (
              <tr {...props}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            )
          },
          ScrollSeekPlaceholder: ({ height }: ScrollSeekPlaceholderProps) => <tr style={{ height, padding: 0, border: 0 }} />,
          FillerRow: ({ height }: FillerRowProps) => <tr style={{ height }} />,
          EmptyPlaceholder: () => <tr>Empty</tr>,
        }}
        style={{ height: 700 }}
        fixedHeaderContent={() => {
          return table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{
                      width: header.getSize(),
                    }}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                )
              })}
            </tr>
          ))
        }}
        fixedFooterContent={() => {
          return table.getFooterGroups().map((footerGroup) => (
            <tr key={footerGroup.id}>
              {footerGroup.headers.map((footer) => (
                <td
                  key={footer.id}
                  colSpan={footer.colSpan}
                  style={{
                    width: footer.getSize(),
                  }}
                >
                  {footer.isPlaceholder ? null : flexRender(footer.column.columnDef.header, footer.getContext())}
                </td>
              ))}
            </tr>
          ))
        }}
      />
    </>
  )
}
