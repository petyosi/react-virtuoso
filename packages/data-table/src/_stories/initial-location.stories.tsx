import { Cell, VirtuosoDataTable } from '../'
import { Column } from '../columns/Column'
import { ColumnHeader } from '../columns/ColumnHeader'

const HEADER_HEIGHT = 40
const ROW_HEIGHT = 30
const CONTAINER_HEIGHT = 300
const ITEM_COUNT = 100

const ITEMS = Array.from({ length: ITEM_COUNT }, (_, i) => ({
  id: i,
  name: `User ${i + 1}`,
}))

export function Example() {
  return (
    <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT }} data={{ data: ITEMS, groups: [] }} initialLocation={50}>
      <Column field="name">
        <ColumnHeader>{({ column }) => <div style={{ height: HEADER_HEIGHT }}>{column.field}</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
      </Column>
    </VirtuosoDataTable>
  )
}
