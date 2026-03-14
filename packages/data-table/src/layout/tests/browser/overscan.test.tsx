import { expect, test, describe } from 'vitest'
import { render } from 'vitest-browser-react'

import { Cell, VirtuosoDataTable } from '../../..'
import { Column } from '../../../columns/Column'
import { ColumnHeader } from '../../../columns/ColumnHeader'

const HEADER_HEIGHT = 40
const ROW_HEIGHT = 30
const CONTAINER_HEIGHT = 300
const CONTAINER_WIDTH = 300
const COLUMN_WIDTH = 150
const COLUMN_COUNT = 6
const ITEM_COUNT = 100

const ITEMS = Array.from({ length: ITEM_COUNT }, (_, i) => ({
  id: i,
  name: `User ${i + 1}`,
}))

const MULTI_COLUMN_ITEMS = Array.from({ length: ITEM_COUNT }, (_, i) => ({
  id: i,
  col0: `R${i}C0`,
  col1: `R${i}C1`,
  col2: `R${i}C2`,
  col3: `R${i}C3`,
  col4: `R${i}C4`,
  col5: `R${i}C5`,
}))

const rowSelector = '[data-testid=virtuoso-table-row]'
const readySelector = '[data-testid=virtuoso-table-root][data-ready]'
const scrollableCellsSelector = '[data-scrollable="true"]'

async function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
}

describe('increaseViewportBy', () => {
  test('renders more rows with increaseViewportBy', async () => {
    const INCREASE_VIEWPORT_BY = 100

    const screen = await render(
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT }} data={{ data: ITEMS, groups: [] }} increaseViewportBy={INCREASE_VIEWPORT_BY}>
        <Column field="name">
          <ColumnHeader>{({ column }) => <div style={{ height: HEADER_HEIGHT }}>{column.field}</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const visibleHeight = CONTAINER_HEIGHT - HEADER_HEIGHT
    const overscanHeight = INCREASE_VIEWPORT_BY * 2
    const expectedRows = Math.ceil((visibleHeight + overscanHeight) / ROW_HEIGHT)
    expect(screen.container.querySelectorAll(rowSelector).length).toBe(expectedRows)
  })

  test('renders default rows without increaseViewportBy', async () => {
    const screen = await render(
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT }} data={{ data: ITEMS, groups: [] }}>
        <Column field="name">
          <ColumnHeader>{({ column }) => <div style={{ height: HEADER_HEIGHT }}>{column.field}</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const expectedRows = Math.ceil((CONTAINER_HEIGHT - HEADER_HEIGHT) / ROW_HEIGHT)
    expect(screen.container.querySelectorAll(rowSelector).length).toBe(expectedRows)
  })
})

describe('columnOverscanCount', () => {
  function MultiColumnTable({ columnOverscanCount }: { columnOverscanCount: number | null }) {
    return (
      <VirtuosoDataTable
        style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}
        data={{ data: MULTI_COLUMN_ITEMS, groups: [] }}
        {...(columnOverscanCount === null ? {} : { columnOverscanCount })}
      >
        {Array.from({ length: COLUMN_COUNT }, (_, i) => (
          <Column key={`col${i}`} field={`col${i}` as keyof (typeof MULTI_COLUMN_ITEMS)[0]}>
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Header {i}</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        ))}
      </VirtuosoDataTable>
    )
  }

  test('renders extra columns with columnOverscanCount', async () => {
    const COLUMN_OVERSCAN_COUNT = 1

    const screen = await render(<MultiColumnTable columnOverscanCount={COLUMN_OVERSCAN_COUNT} />)

    await waitForReady(screen)

    const firstRow = screen.container.querySelector(rowSelector) as HTMLElement
    const scrollableContainer = firstRow.querySelector(scrollableCellsSelector) as HTMLElement
    const cells = scrollableContainer.querySelectorAll(':scope > div')

    const visibleColumns = Math.ceil(CONTAINER_WIDTH / COLUMN_WIDTH)
    const expectedColumns = visibleColumns + COLUMN_OVERSCAN_COUNT
    expect(cells.length).toBe(expectedColumns)
  })

  test('renders default columns without columnOverscanCount', async () => {
    const screen = await render(<MultiColumnTable columnOverscanCount={null} />)

    await waitForReady(screen)

    const firstRow = screen.container.querySelector(rowSelector) as HTMLElement
    const scrollableContainer = firstRow.querySelector(scrollableCellsSelector) as HTMLElement
    const cells = scrollableContainer.querySelectorAll(':scope > div')

    const expectedColumns = Math.ceil(CONTAINER_WIDTH / COLUMN_WIDTH)
    expect(cells.length).toBe(expectedColumns)
  })
})
