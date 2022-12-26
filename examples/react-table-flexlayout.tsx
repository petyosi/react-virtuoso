import * as React from 'react'
import { Column, TableBodyProps, useFlexLayout, useTable } from 'react-table'
import { FillerRowProps, TableVirtuoso } from '../src/'
import { ItemProps, ScrollSeekPlaceholderProps } from '../dist'

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
  const [data, columns] = React.useMemo(() => {
    const columns: readonly Column<{ id: number; content: string }>[] = [
      {
        Header: 'Id',
        accessor: 'id',
      },
      {
        Header: 'Table item',
        accessor: 'content',
        Footer: 'Footer element',
      },
    ]
    return [generateData(500), columns]
  }, [])

  const { getTableBodyProps, getTableProps, prepareRow, headerGroups, footerGroups, rows } = useTable(
    {
      data,
      columns,
    },
    useFlexLayout
  )

  const TableRow = (props: ItemProps): React.ReactElement => {
    const index: number = props['data-index']
    const row = rows[index]
    return <div {...props} {...row.getRowProps()} />
  }
  const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>((props, ref) => (
    <div {...getTableBodyProps()} {...props} ref={ref} />
  ))
  TableBody.displayName = 'TableBody'

  const TableHead = React.forwardRef<HTMLTableSectionElement>((props, ref) => <div {...props} ref={ref} />) as any // typings from lib component not working properly
  TableHead.displayName = 'TableHead'

  const TableFoot = React.forwardRef<HTMLTableSectionElement>((props, ref) => <div {...props} ref={ref} />)
  TableFoot.displayName = 'TableFoot'

  const TableItem = React.useCallback(
    (index: number, style: object) => {
      const row = rows[index]
      prepareRow(row)
      return row.cells.map((cell) => (
        <div {...cell.getCellProps({ style })} key={cell.getCellProps().key}>
          {cell.render('Cell')}
        </div>
      ))
    },
    [rows]
  )

  return (
    <>
      <TableVirtuoso
        totalCount={500}
        components={{
          Table: ({ style, ...props }) => <div {...getTableProps({ style })} {...props} />,
          TableHead,
          TableFoot,
          TableBody,
          TableRow,
          ScrollSeekPlaceholder: ({ height }: ScrollSeekPlaceholderProps) => <div style={{ height, padding: 0, border: 0 }} />,
          FillerRow: ({ height }: FillerRowProps) => <div style={{ height }} />,
          EmptyPlaceholder: () => <div>Empty</div>,
        }}
        style={{ height: 700 }}
        fixedHeaderContent={() => {
          return headerGroups.map((headerGroup) => (
            <div {...headerGroup.getHeaderGroupProps()} key={headerGroup.getHeaderGroupProps().key}>
              {headerGroup.headers.map((column) => (
                <div {...column.getHeaderProps()} key={column.getHeaderProps().key}>
                  {column.render('Header')}
                </div>
              ))}
            </div>
          ))
        }}
        fixedFooterContent={() => {
          return footerGroups.map((footerGroup) => (
            <div {...footerGroup.getFooterGroupProps()} key={footerGroup.getFooterGroupProps().key}>
              {footerGroup.headers.map((column) => (
                <div {...column.getFooterProps()} key={column.getFooterProps().key}>
                  {column.render('Footer')}
                </div>
              ))}
            </div>
          ))
        }}
        itemContent={TableItem}
      />
    </>
  )
}
