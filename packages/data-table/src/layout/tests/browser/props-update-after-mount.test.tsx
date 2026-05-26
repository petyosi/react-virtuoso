import { expect, test, describe } from 'vitest'
import { render } from 'vitest-browser-react'

import { Cell } from '../../..'
import { Column } from '../../../columns/Column'
import { ColumnHeader } from '../../../columns/ColumnHeader'
import { LocalDataTable as VirtuosoDataTable } from '../../../tests/LocalDataTable'

const HEADER_HEIGHT = 40
const ROW_HEIGHT = 30
const CONTAINER_HEIGHT = 300

const ITEMS = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  name: `User ${i + 1}`,
}))

const DATA = { data: ITEMS, groups: [] as never[] }

const rowSelector = '[data-testid=virtuoso-table-row]'
const readySelector = '[data-testid=virtuoso-table-root][data-ready]'

async function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
}

function Table({ increaseViewportBy }: { increaseViewportBy: number }) {
  return (
    <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT }} source={DATA} increaseViewportBy={increaseViewportBy}>
      <Column field="name">
        <ColumnHeader>{({ column }) => <div style={{ height: HEADER_HEIGHT }}>{column.field}</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
      </Column>
    </VirtuosoDataTable>
  )
}

describe('props update after mount', () => {
  test('increaseViewportBy change takes effect after mount', async () => {
    const visibleHeight = CONTAINER_HEIGHT - HEADER_HEIGHT
    const baseRows = Math.ceil(visibleHeight / ROW_HEIGHT)

    const screen = await render(<Table increaseViewportBy={0} />)
    await waitForReady(screen)
    expect(screen.container.querySelectorAll(rowSelector).length).toBe(baseRows)

    const INCREASE_VIEWPORT_BY = 100
    const overscanHeight = INCREASE_VIEWPORT_BY * 2
    const expectedRowsAfterUpdate = Math.ceil((visibleHeight + overscanHeight) / ROW_HEIGHT)

    await screen.rerender(<Table increaseViewportBy={INCREASE_VIEWPORT_BY} />)

    await expect.poll(() => screen.container.querySelectorAll(rowSelector).length, { timeout: 2000 }).toBe(expectedRowsAfterUpdate)
  })
})
