import { useState } from 'react'
import type { CSSProperties } from 'react'

import { usePublisher } from '@virtuoso.dev/reactive-engine-react'

import { Cell, reorderColumns$, VirtuosoDataTable } from '..'
import { Column } from '../columns/Column'
import { ColumnGroup } from '../columns/ColumnGroup'
import { ColumnGroupHeader } from '../columns/ColumnGroupHeader'
import { ColumnHeader } from '../columns/ColumnHeader'

import type { ColumnGroupHeaderCustomComponent } from '../columns/ColumnGroupHeader'
import type { ColumnHeaderCustomComponent } from '../columns/ColumnHeader'

const COLUMN_COUNT = 15
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

const LIST_STYLE: CSSProperties = { height: 400, width: 700 }
const HEADER_STYLE: CSSProperties = {
  fontWeight: 'bold',
  borderBottom: '1px solid #ccc',
  padding: '8px 12px',
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
}
const STICKY_HEADER_STYLE: CSSProperties = { ...HEADER_STYLE, background: '#f0f0f0' }

const GRIP_STYLE: CSSProperties = {
  cursor: 'grab',
  marginRight: 8,
  userSelect: 'none',
  opacity: 0.5,
  fontSize: '14px',
}

const DROP_INDICATOR_STYLE: CSSProperties = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  width: 3,
  background: '#2563eb',
  zIndex: 1,
}

// Module-level drag state (dataTransfer.getData() returns "" during dragover in Chrome/Safari)
let dragSourceKey: string | null = null
let dragSourceSticky: string | undefined

function moveGroupColumns(
  reorderColumns: (payload: { sourceKey: string; targetKey: string; position: 'before' | 'after' }) => void,
  sourceColumns: string[],
  targetKey: string,
  position: 'before' | 'after'
) {
  // When placing 'after', iterate in reverse so columns maintain their original order
  const ordered = position === 'after' ? sourceColumns.toReversed() : sourceColumns
  for (const sourceKey of ordered) {
    reorderColumns({ sourceKey, targetKey, position })
  }
}

const DraggableHeader: ColumnHeaderCustomComponent = ({ columnKey, column, columnState }) => {
  const reorderColumns = usePublisher(reorderColumns$)
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null)

  const isSticky = Boolean(columnState.sticky)
  const baseStyle = isSticky ? STICKY_HEADER_STYLE : HEADER_STYLE

  return (
    <div
      style={baseStyle}
      onDragOver={(ev) => {
        if (!dragSourceKey) {
          return
        }
        if (dragSourceGroupColumns?.includes(columnKey)) {
          return
        }
        if (dragSourceKey === columnKey) {
          return
        }
        if (dragSourceSticky !== columnState.sticky) {
          return
        }
        ev.preventDefault()
        ev.dataTransfer.dropEffect = 'move'
        const rect = ev.currentTarget.getBoundingClientRect()
        setDropPosition(ev.clientX < rect.left + rect.width / 2 ? 'before' : 'after')
      }}
      onDragLeave={() => setDropPosition(null)}
      onDrop={(ev) => {
        ev.preventDefault()
        if (!dragSourceKey || dragSourceKey === columnKey || dragSourceGroupColumns?.includes(columnKey)) {
          setDropPosition(null)
          return
        }
        const rect = ev.currentTarget.getBoundingClientRect()
        const position = ev.clientX < rect.left + rect.width / 2 ? 'before' : 'after'
        if (dragSourceGroupColumns) {
          moveGroupColumns(reorderColumns, dragSourceGroupColumns, columnKey, position)
        } else {
          reorderColumns({ sourceKey: dragSourceKey, targetKey: columnKey, position })
        }
        dragSourceKey = null
        dragSourceSticky = undefined
        dragSourceGroupColumns = null
        setDropPosition(null)
      }}
    >
      {dropPosition === 'before' && <div style={{ ...DROP_INDICATOR_STYLE, left: 0 }} />}
      {dropPosition === 'after' && <div style={{ ...DROP_INDICATOR_STYLE, right: 0 }} />}
      <span
        draggable
        onDragStart={(ev) => {
          dragSourceKey = columnKey
          dragSourceSticky = columnState.sticky
          ev.dataTransfer.effectAllowed = 'move'
          ev.dataTransfer.setData('text/plain', columnKey)
          const header = ev.currentTarget.parentElement!
          const rect = header.getBoundingClientRect()
          ev.dataTransfer.setDragImage(header, ev.clientX - rect.left, ev.clientY - rect.top)
        }}
        onDragEnd={() => {
          dragSourceKey = null
          dragSourceSticky = undefined
        }}
        style={GRIP_STYLE}
      >
        ⠿
      </span>
      {column.field}
    </div>
  )
}

export function BasicColumnReorder() {
  return (
    <VirtuosoDataTable style={LIST_STYLE} data={{ data: ITEMS, groups: [] }}>
      {Array.from({ length: COLUMN_COUNT }, (_, i) => (
        <Column key={`col${i}`} field={`col${i}`}>
          <ColumnHeader component={DraggableHeader} />
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      ))}
    </VirtuosoDataTable>
  )
}

export function ReorderWithStickyColumns() {
  return (
    <VirtuosoDataTable style={LIST_STYLE} data={{ data: ITEMS, groups: [] }}>
      <Column field="id" sticky="left">
        <ColumnHeader component={DraggableHeader} />
        <Cell>{({ cellValue }) => String(cellValue)}</Cell>
      </Column>
      <Column field="name" sticky="left">
        <ColumnHeader component={DraggableHeader} />
        <Cell>{({ cellValue }) => String(cellValue)}</Cell>
      </Column>

      {Array.from({ length: COLUMN_COUNT }, (_, i) => (
        <Column key={`col${i}`} field={`col${i}`}>
          <ColumnHeader component={DraggableHeader} />
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      ))}

      <Column field="price" sticky="right">
        <ColumnHeader component={DraggableHeader} />
        <Cell>{({ cellValue }) => String(cellValue)}</Cell>
      </Column>
      <Column field="actions" sticky="right">
        <ColumnHeader component={DraggableHeader} />
        <Cell>{({ cellValue }) => String(cellValue)}</Cell>
      </Column>
    </VirtuosoDataTable>
  )
}

const GROUP_HEADER_STYLE: CSSProperties = {
  padding: '4px 8px',
  background: '#ddd',
  fontWeight: 'bold',
  fontSize: '0.9em',
  borderBottom: '1px solid #bbb',
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
}

// Group-level drag state
let dragSourceGroupColumns: string[] | null = null

function DraggableGroupHeader({ label, columnKeys, stickyGroup }: { label: string; columnKeys: string[]; stickyGroup?: string }) {
  const reorderColumns = usePublisher(reorderColumns$)
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null)

  return (
    <div
      style={GROUP_HEADER_STYLE}
      onDragOver={(ev) => {
        if (!dragSourceGroupColumns) {
          return
        }
        if (dragSourceGroupColumns[0] === columnKeys[0]) {
          return
        }
        if (dragSourceSticky !== stickyGroup) {
          return
        }
        ev.preventDefault()
        ev.dataTransfer.dropEffect = 'move'
        const rect = ev.currentTarget.getBoundingClientRect()
        setDropPosition(ev.clientX < rect.left + rect.width / 2 ? 'before' : 'after')
      }}
      onDragLeave={() => setDropPosition(null)}
      onDrop={(ev) => {
        ev.preventDefault()
        if (!dragSourceGroupColumns || dragSourceGroupColumns[0] === columnKeys[0]) {
          setDropPosition(null)
          return
        }
        const position =
          ev.clientX < ev.currentTarget.getBoundingClientRect().left + ev.currentTarget.getBoundingClientRect().width / 2
            ? 'before'
            : 'after'
        const anchorKey = position === 'before' ? columnKeys[0]! : columnKeys.at(-1)!
        moveGroupColumns(reorderColumns, dragSourceGroupColumns, anchorKey, position)
        dragSourceGroupColumns = null
        dragSourceKey = null
        dragSourceSticky = undefined
        setDropPosition(null)
      }}
    >
      {dropPosition === 'before' && <div style={{ ...DROP_INDICATOR_STYLE, left: 0 }} />}
      {dropPosition === 'after' && <div style={{ ...DROP_INDICATOR_STYLE, right: 0 }} />}
      <span
        draggable
        onDragStart={(ev) => {
          dragSourceGroupColumns = columnKeys
          dragSourceKey = columnKeys[0] ?? null
          dragSourceSticky = stickyGroup
          ev.dataTransfer.effectAllowed = 'move'
          ev.dataTransfer.setData('text/plain', 'group')
          const header = ev.currentTarget.parentElement!
          const rect = header.getBoundingClientRect()
          ev.dataTransfer.setDragImage(header, ev.clientX - rect.left, ev.clientY - rect.top)
        }}
        onDragEnd={() => {
          dragSourceGroupColumns = null
          dragSourceKey = null
          dragSourceSticky = undefined
        }}
        style={GRIP_STYLE}
      >
        ⠿
      </span>
      {label}
    </div>
  )
}

const PersonalGroupHeader: ColumnGroupHeaderCustomComponent = ({ columnKeys }) => (
  <DraggableGroupHeader label="Personal Info" columnKeys={columnKeys} />
)

const AddressGroupHeader: ColumnGroupHeaderCustomComponent = ({ columnKeys }) => (
  <DraggableGroupHeader label="Address" columnKeys={columnKeys} />
)

export function ReorderWithColumnGroups() {
  const items = Array.from({ length: ITEM_COUNT }, (_, i) => ({
    id: `id-${i}`,
    firstName: `First ${i}`,
    lastName: `Last ${i}`,
    street: `${i} Main St`,
    city: `City ${i % 10}`,
    zip: `${10_000 + i}`,
    col0: `R${i + 1}C1`,
    col1: `R${i + 1}C2`,
    col2: `R${i + 1}C3`,
    col3: `R${i + 1}C4`,
    col4: `R${i + 1}C5`,
  }))

  return (
    <VirtuosoDataTable style={LIST_STYLE} data={{ data: items, groups: [] }}>
      <Column field="id">
        <ColumnHeader component={DraggableHeader} />
        <Cell>{({ cellValue }) => String(cellValue)}</Cell>
      </Column>

      <ColumnGroup>
        <ColumnGroupHeader component={PersonalGroupHeader} />
        <Column field="firstName">
          <ColumnHeader component={DraggableHeader} />
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="lastName">
          <ColumnHeader component={DraggableHeader} />
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      </ColumnGroup>

      <ColumnGroup>
        <ColumnGroupHeader component={AddressGroupHeader} />
        <Column field="street">
          <ColumnHeader component={DraggableHeader} />
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="city">
          <ColumnHeader component={DraggableHeader} />
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="zip">
          <ColumnHeader component={DraggableHeader} />
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      </ColumnGroup>

      {Array.from({ length: 5 }, (_, i) => (
        <Column key={`col${i}`} field={`col${i}`}>
          <ColumnHeader component={DraggableHeader} />
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      ))}
    </VirtuosoDataTable>
  )
}
