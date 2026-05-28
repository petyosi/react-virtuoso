import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { Cell } from '../../..'
import { Column } from '../../../columns/Column'
import { ColumnHeader } from '../../../columns/ColumnHeader'
import { LocalDataTable as VirtuosoDataTable } from '../../../tests/LocalDataTable'

const HEADER_HEIGHT = 40
const ROW_HEIGHT = 30
const COLUMN_WIDTH = 150
const ITEM_COUNT = 100

const ITEMS = Array.from({ length: ITEM_COUNT }, (_, i) => ({
  id: i,
  name: `User ${i + 1}`,
}))

const rowSelector = '[data-testid=virtuoso-table-row]'
const readySelector = '[data-testid=virtuoso-table-root][data-ready]'

async function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
}

describe('useWindowScroll render window', () => {
  test('renders rows from the window viewport instead of the full table height', async () => {
    const screen = await render(
      <VirtuosoDataTable source={ITEMS} useWindowScroll>
        <Column field="name">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const renderedRows = screen.container.querySelectorAll(rowSelector).length
    const expectedMaxRows = Math.ceil(window.innerHeight / ROW_HEIGHT) + 2

    expect(renderedRows).toBeLessThanOrEqual(expectedMaxRows)
    expect(renderedRows).toBeLessThan(ITEM_COUNT)
  })
})
