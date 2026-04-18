import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { ResizeHandle } from '../../../../apps/virtuoso.dev/registry/new-york/data-table/column-resize/resize-handle'
import { Cell, Column, ColumnHeader, HeaderEdge, VirtuosoDataTable } from '../../src'

const HEADER_HEIGHT = 40
const ROW_HEIGHT = 32
const COLUMN_WIDTH = 160

const ITEMS = Array.from({ length: 20 }, (_, index) => ({
  name: `Product ${index + 1}`,
  status: index % 2 === 0 ? 'Active' : 'Paused',
  region: ['US', 'EU', 'APAC'][index % 3]!,
}))

function TestTable() {
  return (
    <VirtuosoDataTable style={{ height: 320, width: 520 }} data={{ data: ITEMS, groups: [] }}>
      {(['name', 'status', 'region'] as const).map((field) => (
        <Column key={field} field={field}>
          <ColumnHeader className="flex h-10 items-center px-3 text-sm font-medium whitespace-nowrap">
            <HeaderEdge component={ResizeHandle} />
            {({ column }) => (
              <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT, display: 'flex', alignItems: 'center' }}>{column.field}</div>
            )}
          </ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      ))}
    </VirtuosoDataTable>
  )
}

test('resizes a column through the slot-mounted handle', async () => {
  const screen = await render(<TestTable />)
  const headers = screen.container.querySelectorAll<HTMLElement>('[data-table-element-role="column-header"]')
  const firstHeader = headers[0]
  const handle = firstHeader?.querySelector<HTMLElement>('[data-table-element-role="resize-handle"]')

  expect(firstHeader).toBeTruthy()
  expect(handle).toBeTruthy()

  const initialWidth = Math.round(firstHeader!.getBoundingClientRect().width)
  const handleRect = handle!.getBoundingClientRect()
  handle!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: handleRect.left + 1, pointerId: 1 }))
  document.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: handleRect.left + 70, pointerId: 1 }))
  document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: handleRect.left + 70, pointerId: 1 }))

  await expect.poll(() => Math.round(firstHeader!.getBoundingClientRect().width), { timeout: 2000 }).toBeGreaterThan(initialWidth + 20)
})
