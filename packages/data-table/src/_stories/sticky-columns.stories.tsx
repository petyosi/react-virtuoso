import type { CSSProperties } from 'react'

import { usePublisher } from '@virtuoso.dev/reactive-engine-react'

import { Cell, setColumnSticky$, VirtuosoDataTable } from '..'
import { Column } from '../columns/Column'
import { ColumnHeader } from '../columns/ColumnHeader'

import type { ColumnState } from '../columns/column-state'
import type { ColumnHeaderCustomComponent } from '../columns/ColumnHeader'

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

const LIST_STYLE: CSSProperties = { height: 400, width: 600 }
const HEADER_STYLE: CSSProperties = { fontWeight: 'bold', borderBottom: '1px solid #ccc', padding: '8px 12px' }
const STICKY_HEADER_STYLE: CSSProperties = { ...HEADER_STYLE, background: '#f0f0f0' }

const IdHeader: ColumnHeaderCustomComponent = ({ column }) => {
  return <div style={STICKY_HEADER_STYLE}>ID {column.field}</div>
}

export function LeftStickyColumn() {
  return (
    <VirtuosoDataTable style={LIST_STYLE} data={{ data: ITEMS, groups: [] }}>
      <Column field="id" sticky="left">
        <ColumnHeader component={IdHeader} />
        <Cell>{({ cellValue }) => String(cellValue)}</Cell>
      </Column>
      {Array.from({ length: COLUMN_COUNT }, (_, i) => (
        <Column key={`col${i}`} field={`col${i}`}>
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Column {i + 1}</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      ))}
    </VirtuosoDataTable>
  )
}

export function RightStickyColumn() {
  return (
    <VirtuosoDataTable style={LIST_STYLE} data={{ data: ITEMS, groups: [] }}>
      {Array.from({ length: COLUMN_COUNT }, (_, i) => (
        <Column key={`col${i}`} field={`col${i}`}>
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Column {i + 1}</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      ))}
      <Column field="actions" sticky="right">
        <ColumnHeader>{() => <div style={STICKY_HEADER_STYLE}>Actions</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => String(cellValue)}</Cell>
      </Column>
    </VirtuosoDataTable>
  )
}

export function BothStickyColumns() {
  return (
    <VirtuosoDataTable style={LIST_STYLE} data={{ data: ITEMS, groups: [] }}>
      <Column field="id" sticky="left">
        <ColumnHeader>{() => <div style={STICKY_HEADER_STYLE}>ID</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => String(cellValue)}</Cell>
      </Column>
      {Array.from({ length: COLUMN_COUNT }, (_, i) => (
        <Column key={`col${i}`} field={`col${i}`}>
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Column {i + 1}</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      ))}
      <Column field="actions" sticky="right">
        <ColumnHeader>{() => <div style={STICKY_HEADER_STYLE}>Actions</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => String(cellValue)}</Cell>
      </Column>
    </VirtuosoDataTable>
  )
}

export function MultipleStickyColumns() {
  return (
    <VirtuosoDataTable style={LIST_STYLE} data={{ data: ITEMS, groups: [] }}>
      <Column field="id" sticky="left">
        <ColumnHeader>{() => <div style={STICKY_HEADER_STYLE}>ID</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => String(cellValue)}</Cell>
      </Column>
      <Column field="name" sticky="left">
        <ColumnHeader>{() => <div style={STICKY_HEADER_STYLE}>Name</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => String(cellValue)}</Cell>
      </Column>
      <Column field="status" sticky="left">
        <ColumnHeader>{() => <div style={STICKY_HEADER_STYLE}>Status</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => String(cellValue)}</Cell>
      </Column>
      {Array.from({ length: COLUMN_COUNT }, (_, i) => (
        <Column key={`col${i}`} field={`col${i}`}>
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Column {i + 1}</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      ))}
      <Column field="price" sticky="right">
        <ColumnHeader>{() => <div style={STICKY_HEADER_STYLE}>Price</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => String(cellValue)}</Cell>
      </Column>
      <Column field="actions" sticky="right">
        <ColumnHeader>{() => <div style={STICKY_HEADER_STYLE}>Actions</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => String(cellValue)}</Cell>
      </Column>
    </VirtuosoDataTable>
  )
}

const INTERACTIVE_HEADER_STYLE: CSSProperties = {
  ...HEADER_STYLE,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const STICKY_BUTTON_CONTAINER_STYLE: CSSProperties = {
  display: 'flex',
  gap: 4,
}

const BUTTON_STYLE: CSSProperties = {
  fontSize: 10,
  padding: '2px 6px',
  cursor: 'pointer',
}

const ACTIVE_BUTTON_STYLE: CSSProperties = {
  ...BUTTON_STYLE,
  background: '#007bff',
  color: 'white',
  border: '1px solid #007bff',
}

const INACTIVE_BUTTON_STYLE: CSSProperties = {
  ...BUTTON_STYLE,
  background: 'white',
  border: '1px solid #ccc',
}

const InteractiveStickyHeader: ColumnHeaderCustomComponent = ({ columnKey, column, columnState }) => {
  const setColumnSticky = usePublisher(setColumnSticky$)

  const handleStickyChange = (sticky: 'left' | 'right' | undefined) => {
    setColumnSticky({ key: columnKey, sticky })
  }

  return (
    <div style={INTERACTIVE_HEADER_STYLE}>
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
    <div style={STICKY_BUTTON_CONTAINER_STYLE}>
      <button
        type="button"
        style={columnState.sticky === 'left' ? ACTIVE_BUTTON_STYLE : INACTIVE_BUTTON_STYLE}
        onClick={() => onStickyChange(columnState.sticky === 'left' ? undefined : 'left')}
      >
        L
      </button>
      <button
        type="button"
        style={columnState.sticky === 'right' ? ACTIVE_BUTTON_STYLE : INACTIVE_BUTTON_STYLE}
        onClick={() => onStickyChange(columnState.sticky === 'right' ? undefined : 'right')}
      >
        R
      </button>
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
    <VirtuosoDataTable style={{ height: 300, width: 600 }} data={{ data: items, groups: [] }}>
      <Column field="col0" sticky="left">
        <ColumnHeader>{() => <div style={{ ...HEADER_STYLE, width: 80 }}>Col 0</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => <div style={{ height: 30 }}>{String(cellValue)}</div>}</Cell>
      </Column>
      <Column field="col1">
        <ColumnHeader>{() => <div style={{ ...HEADER_STYLE, width: 80 }}>Col 1</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => <div style={{ height: 30 }}>{String(cellValue)}</div>}</Cell>
      </Column>
      <Column field="col2">
        <ColumnHeader>{() => <div style={{ ...HEADER_STYLE, width: 80 }}>Col 2</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => <div style={{ height: 30 }}>{String(cellValue)}</div>}</Cell>
      </Column>
    </VirtuosoDataTable>
  )
}

export function ColumnOverscan() {
  return (
    <VirtuosoDataTable style={LIST_STYLE} data={{ data: ITEMS, groups: [] }} columnOverscanCount={2}>
      <Column field="id" sticky="left">
        <ColumnHeader>{() => <div style={STICKY_HEADER_STYLE}>ID</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => String(cellValue)}</Cell>
      </Column>
      {Array.from({ length: COLUMN_COUNT }, (_, i) => (
        <Column key={`col${i}`} field={`col${i}`}>
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Column {i + 1}</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      ))}
      <Column field="actions" sticky="right">
        <ColumnHeader>{() => <div style={STICKY_HEADER_STYLE}>Actions</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => String(cellValue)}</Cell>
      </Column>
    </VirtuosoDataTable>
  )
}

export function InteractiveStickyColumn() {
  return (
    <VirtuosoDataTable style={LIST_STYLE} data={{ data: ITEMS, groups: [] }}>
      <Column field="id" sticky="left">
        <ColumnHeader component={InteractiveStickyHeader} />
        <Cell>{({ cellValue }) => String(cellValue)}</Cell>
      </Column>
      {Array.from({ length: COLUMN_COUNT }, (_, i) => (
        <Column key={`col${i}`} field={`col${i}`}>
          <ColumnHeader component={InteractiveStickyHeader} />
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      ))}
    </VirtuosoDataTable>
  )
}
