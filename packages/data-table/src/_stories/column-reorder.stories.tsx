import type { CSSProperties } from 'react'

import { DraggableGroupHeader, DraggableHeader } from '@/components/ui/data-table/column-reorder'

import { Cell, VirtuosoDataTable } from '..'
import { Column } from '../columns/Column'
import { ColumnGroup } from '../columns/ColumnGroup'
import { ColumnGroupHeader } from '../columns/ColumnGroupHeader'
import { ColumnHeader } from '../columns/ColumnHeader'

import type { ColumnGroupHeaderCustomComponent } from '../columns/ColumnGroupHeader'

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
