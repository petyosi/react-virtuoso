import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'
import * as React from 'react'

import { ScrollSeekPlaceholderProps } from '../'
import { FillerRowProps, TableVirtuoso } from '../src'

const items: ReturnType<typeof item>[] = []
function item(index: number) {
  return {
    content: `Table ${index}`,
    id: index + 1,
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
  const columns = React.useMemo<ColumnDef<{ content: string; id: number }>[]>(
    () => [
      {
        accessorKey: 'id',
        cell: (info) => info.getValue(),
        header: () => 'Id',
      },
      {
        accessorKey: 'content',
        cell: (info) => info.getValue(),
        footer: () => 'Footer element',
        header: () => 'Table item',
      },
    ],
    []
  )

  const [data] = React.useState(() => generateData(500))

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
  })

  const { rows } = table.getRowModel()

  return (
    <>
      <TableVirtuoso
        components={{
          EmptyPlaceholder: () => <tr>Empty</tr>,
          FillerRow: ({ height }: FillerRowProps) => <tr style={{ height }} />,
          ScrollSeekPlaceholder: ({ height }: ScrollSeekPlaceholderProps) => <tr style={{ border: 0, height, padding: 0 }} />,
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
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            )
          },
        }}
        fixedFooterContent={() => {
          return table.getFooterGroups().map((footerGroup) => (
            <tr key={footerGroup.id}>
              {footerGroup.headers.map((footer) => (
                <td
                  colSpan={footer.colSpan}
                  key={footer.id}
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
        fixedHeaderContent={() => {
          return table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th
                    colSpan={header.colSpan}
                    key={header.id}
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
        style={{ height: 700 }}
        totalCount={500}
      />
    </>
  )
}
