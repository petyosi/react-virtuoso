import type { CSSProperties } from 'react'

import { usePublisher } from '@virtuoso.dev/reactive-engine-react'

import { Button } from '@/components/ui/button'
import { DataTable, DataTableCell, DataTableColumn, DataTableColumnHeader, setColumnSticky$ } from '@/components/ui/data-table'

import type { ColumnHeaderCustomComponent, ColumnState } from '@/components/ui/data-table'

const COLUMN_COUNT = 20
const ITEM_COUNT = 100

const ITEMS = Array.from({ length: ITEM_COUNT }, (_, rowIndex) => {
  const row: Record<string, string> = {
    id: `id-${rowIndex}`,
    name: `User ${rowIndex}`,
    status: rowIndex % 3 === 0 ? 'Active' : rowIndex % 3 === 1 ? 'Pending' : 'Inactive',
  }
  for (let colIndex = 0; colIndex < COLUMN_COUNT; colIndex++) {
    row[`col${colIndex}`] = `R${rowIndex + 1}C${colIndex + 1}`
  }
  row.price = `$${(rowIndex * 10 + 99).toFixed(2)}`
  row.actions = 'Edit | Delete'
  return row
})

const TABLE_STYLE: CSSProperties = { height: 400, width: 600 }

export function LeftStickyColumn() {
  return (
    <DataTable style={TABLE_STYLE} data={{ data: ITEMS, groups: [] }}>
      <DataTableColumn field="id" sticky="left">
        <DataTableColumnHeader>ID</DataTableColumnHeader>
        <DataTableCell>{({ cellValue }) => String(cellValue)}</DataTableCell>
      </DataTableColumn>
      {Array.from({ length: COLUMN_COUNT }, (_, i) => (
        <DataTableColumn key={`col${i}`} field={`col${i}`}>
          <DataTableColumnHeader>Column {i + 1}</DataTableColumnHeader>
          <DataTableCell>{({ cellValue }) => String(cellValue)}</DataTableCell>
        </DataTableColumn>
      ))}
    </DataTable>
  )
}

export function RightStickyColumn() {
  return (
    <DataTable style={TABLE_STYLE} data={{ data: ITEMS, groups: [] }}>
      {Array.from({ length: COLUMN_COUNT }, (_, i) => (
        <DataTableColumn key={`col${i}`} field={`col${i}`}>
          <DataTableColumnHeader>Column {i + 1}</DataTableColumnHeader>
          <DataTableCell>{({ cellValue }) => String(cellValue)}</DataTableCell>
        </DataTableColumn>
      ))}
      <DataTableColumn field="actions" sticky="right">
        <DataTableColumnHeader>Actions</DataTableColumnHeader>
        <DataTableCell>{({ cellValue }) => String(cellValue)}</DataTableCell>
      </DataTableColumn>
    </DataTable>
  )
}

export function BothStickyColumns() {
  return (
    <DataTable style={TABLE_STYLE} data={{ data: ITEMS, groups: [] }}>
      <DataTableColumn field="id" sticky="left">
        <DataTableColumnHeader className="w-10 text-red-500 grow-0">ID</DataTableColumnHeader>
        <DataTableCell>{({ cellValue }) => String(cellValue)}</DataTableCell>
      </DataTableColumn>
      {Array.from({ length: COLUMN_COUNT }, (_, i) => (
        <DataTableColumn key={`col${i}`} field={`col${i}`}>
          <DataTableColumnHeader>Column {i + 1}</DataTableColumnHeader>
          <DataTableCell>{({ cellValue }) => String(cellValue)}</DataTableCell>
        </DataTableColumn>
      ))}
      <DataTableColumn field="actions" sticky="right">
        <DataTableColumnHeader>Actions</DataTableColumnHeader>
        <DataTableCell>{({ cellValue }) => String(cellValue)}</DataTableCell>
      </DataTableColumn>
    </DataTable>
  )
}

export function MultipleStickyColumns() {
  return (
    <DataTable style={TABLE_STYLE} data={{ data: ITEMS, groups: [] }}>
      <DataTableColumn field="id" sticky="left">
        <DataTableColumnHeader>ID</DataTableColumnHeader>
        <DataTableCell>{({ cellValue }) => String(cellValue)}</DataTableCell>
      </DataTableColumn>
      <DataTableColumn field="name" sticky="left">
        <DataTableColumnHeader>Name</DataTableColumnHeader>
        <DataTableCell>{({ cellValue }) => String(cellValue)}</DataTableCell>
      </DataTableColumn>
      <DataTableColumn field="status" sticky="left">
        <DataTableColumnHeader>Status</DataTableColumnHeader>
        <DataTableCell>{({ cellValue }) => String(cellValue)}</DataTableCell>
      </DataTableColumn>
      {Array.from({ length: COLUMN_COUNT }, (_, i) => (
        <DataTableColumn key={`col${i}`} field={`col${i}`}>
          <DataTableColumnHeader>Column {i + 1}</DataTableColumnHeader>
          <DataTableCell>{({ cellValue }) => String(cellValue)}</DataTableCell>
        </DataTableColumn>
      ))}
      <DataTableColumn field="price" sticky="right">
        <DataTableColumnHeader>Price</DataTableColumnHeader>
        <DataTableCell>{({ cellValue }) => String(cellValue)}</DataTableCell>
      </DataTableColumn>
      <DataTableColumn field="actions" sticky="right">
        <DataTableColumnHeader>Actions</DataTableColumnHeader>
        <DataTableCell>{({ cellValue }) => String(cellValue)}</DataTableCell>
      </DataTableColumn>
    </DataTable>
  )
}

const InteractiveStickyHeader: ColumnHeaderCustomComponent = ({ columnKey, column, columnState }) => {
  const setColumnSticky = usePublisher(setColumnSticky$)

  const handleStickyChange = (sticky: 'left' | 'right' | undefined) => {
    setColumnSticky({ key: columnKey, sticky })
  }

  return (
    <div className="flex flex-col gap-1">
      <span>{column.field}</span>
      <StickyButtons columnState={columnState} onStickyChange={handleStickyChange} />
    </div>
  )
}

function StickyButtons({
  columnState,
  onStickyChange,
}: {
  columnState: ColumnState
  onStickyChange: (sticky: 'left' | 'right' | undefined) => void
}) {
  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant={columnState.sticky === 'left' ? 'default' : 'outline'}
        className="h-5 px-1.5 text-[10px]"
        onClick={() => onStickyChange(columnState.sticky === 'left' ? undefined : 'left')}
      >
        L
      </Button>
      <Button
        size="sm"
        variant={columnState.sticky === 'right' ? 'default' : 'outline'}
        className="h-5 px-1.5 text-[10px]"
        onClick={() => onStickyChange(columnState.sticky === 'right' ? undefined : 'right')}
      >
        R
      </Button>
    </div>
  )
}

export function WideContainerFewColumns() {
  const items = Array.from({ length: 20 }, (_, i) => ({
    col0: `R${i}C0`,
    col1: `R${i}C1`,
    col2: `R${i}C2`,
  }))

  return (
    <DataTable style={{ height: 300, width: 600 }} data={{ data: items, groups: [] }}>
      <DataTableColumn field="col0" sticky="left">
        <DataTableColumnHeader className="w-20">Col 0</DataTableColumnHeader>
        <DataTableCell>{({ cellValue }) => <div style={{ height: 30 }}>{String(cellValue)}</div>}</DataTableCell>
      </DataTableColumn>
      <DataTableColumn field="col1">
        <DataTableColumnHeader className="w-20">Col 1</DataTableColumnHeader>
        <DataTableCell>{({ cellValue }) => <div style={{ height: 30 }}>{String(cellValue)}</div>}</DataTableCell>
      </DataTableColumn>
      <DataTableColumn field="col2">
        <DataTableColumnHeader className="w-20">Col 2</DataTableColumnHeader>
        <DataTableCell>{({ cellValue }) => <div style={{ height: 30 }}>{String(cellValue)}</div>}</DataTableCell>
      </DataTableColumn>
    </DataTable>
  )
}

export function ColumnOverscan() {
  return (
    <DataTable style={TABLE_STYLE} data={{ data: ITEMS, groups: [] }} columnOverscanCount={2}>
      <DataTableColumn field="id" sticky="left">
        <DataTableColumnHeader>ID</DataTableColumnHeader>
        <DataTableCell>{({ cellValue }) => String(cellValue)}</DataTableCell>
      </DataTableColumn>
      {Array.from({ length: COLUMN_COUNT }, (_, i) => (
        <DataTableColumn key={`col${i}`} field={`col${i}`}>
          <DataTableColumnHeader>Column {i + 1}</DataTableColumnHeader>
          <DataTableCell>{({ cellValue }) => String(cellValue)}</DataTableCell>
        </DataTableColumn>
      ))}
      <DataTableColumn field="actions" sticky="right">
        <DataTableColumnHeader>Actions</DataTableColumnHeader>
        <DataTableCell>{({ cellValue }) => String(cellValue)}</DataTableCell>
      </DataTableColumn>
    </DataTable>
  )
}

export function InteractiveStickyColumn() {
  return (
    <DataTable style={TABLE_STYLE} data={{ data: ITEMS, groups: [] }}>
      <DataTableColumn field="id" sticky="left">
        <DataTableColumnHeader component={InteractiveStickyHeader} />
        <DataTableCell>{({ cellValue }) => String(cellValue)}</DataTableCell>
      </DataTableColumn>
      {Array.from({ length: COLUMN_COUNT }, (_, i) => (
        <DataTableColumn key={`col${i}`} field={`col${i}`}>
          <DataTableColumnHeader component={InteractiveStickyHeader} />
          <DataTableCell>{({ cellValue }) => String(cellValue)}</DataTableCell>
        </DataTableColumn>
      ))}
    </DataTable>
  )
}
