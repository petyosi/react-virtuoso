import { Cell, VirtuosoDataTable } from '../'
import { Column } from '../columns/Column'
import { ColumnHeader } from '../columns/ColumnHeader'

const HEADER_HEIGHT = 40
const ROW_HEIGHT = 30
const CONTAINER_HEIGHT = 300
const CONTAINER_WIDTH = 300
const COLUMN_WIDTH = 150
const ITEM_COUNT = 100

const ITEMS = Array.from({ length: ITEM_COUNT }, (_, i) => ({
  id: i,
  name: `User ${i + 1}`,
}))

interface TestContext {
  theme: string
  locale: string
}

export function Example() {
  return (
    <VirtuosoDataTable<(typeof ITEMS)[0], TestContext>
      style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}
      data={{ data: ITEMS, groups: [] }}
      context={{ theme: 'dark', locale: 'en-US' }}
    >
      <Column field="name">
        <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
      </Column>
    </VirtuosoDataTable>
  )
}
