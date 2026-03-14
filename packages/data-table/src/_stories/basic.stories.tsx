import type { CSSProperties } from 'react'
import { useState } from 'react'

import { Cell, VirtuosoDataTable } from '..'
import { Column } from '../columns/Column'
import { ColumnHeader } from '../columns/ColumnHeader'

const HUNDRED_ITEMS = Array.from({ length: 100 }, (_, i) => ({
  name: `User ${i + 1}`,
  message: `Message content ${i + 1}`,
  date: new Date().toLocaleDateString(),
  status: i % 2 === 0 ? 'active' : 'inactive',
}))

const TWENTY_COLUMNS = Array.from({ length: 20 }, (_, i) => `column${i + 1}`)

const HUNDRED_ITEMS_TWENTY_COLUMNS = Array.from({ length: 100 }, (_, rowIndex) => {
  const row: Record<string, string> = {}
  for (let colIndex = 0; colIndex < 20; colIndex++) {
    row[`column${colIndex + 1}`] = `R${rowIndex + 1}C${colIndex + 1}`
  }
  return row
})

const LIST_STYLE: CSSProperties = { height: 400 }
const COLUMN_HEADER_STYLE: CSSProperties = { fontWeight: 'bold', borderBottom: '1px solid gray' }

export function HundredItems() {
  const [columns, setColumns] = useState(['name', 'message', 'date', 'status'])
  const [renderCount, setRenderCount] = useState(0)

  return (
    <div>
      <button
        onClick={() => {
          setColumns((cols) => [...cols, `newCol${cols.length + 1}`, `newCol${cols.length + 2}`])
        }}
      >
        Add two columns
      </button>

      <button
        onClick={() => {
          setRenderCount((count) => count + 1)
        }}
      >
        Increase render count: {renderCount}
      </button>
      <VirtuosoDataTable style={LIST_STYLE} data={{ data: HUNDRED_ITEMS, groups: [] }}>
        {columns.map((col) => (
          <Column field={col} key={col}>
            <ColumnHeader>
              {({ column }) => {
                return <div style={COLUMN_HEADER_STYLE}>Column: {column.field}</div>
              }}
            </ColumnHeader>
            <Cell>{({ cellValue }) => String(cellValue ?? '')}</Cell>
          </Column>
        ))}
      </VirtuosoDataTable>
    </div>
  )
}

const CELL_STYLE: CSSProperties = { width: 100, padding: '4px 8px' }

export function TwentyColumns() {
  return (
    <VirtuosoDataTable style={LIST_STYLE} data={{ data: HUNDRED_ITEMS_TWENTY_COLUMNS, groups: [] }}>
      {TWENTY_COLUMNS.map((col) => (
        <Column field={col} key={col}>
          <ColumnHeader>{({ column }) => <div style={{ ...COLUMN_HEADER_STYLE, ...CELL_STYLE }}>{column.field}</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue ?? '')}</Cell>
        </Column>
      ))}
    </VirtuosoDataTable>
  )
}
