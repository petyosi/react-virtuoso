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
const tableBodySelector = '[data-testid=virtuoso-table-body]'
const scrollerSelector = '[data-testid=virtuoso-table-scroller]'
const headerCellSelector = '[data-column-key]'
const readySelector = '[data-testid=virtuoso-table-root][data-ready]'
const scrollableCellsSelector = '[data-scrollable="true"]'

async function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
}

function MultiColumnTable() {
  return (
    <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} data={{ data: MULTI_COLUMN_ITEMS, groups: [] }}>
      {Array.from({ length: COLUMN_COUNT }, (_, i) => (
        <Column key={`col${i}`} field={`col${i}` as keyof (typeof MULTI_COLUMN_ITEMS)[0]}>
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Header {i}</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      ))}
    </VirtuosoDataTable>
  )
}

describe('row virtualization', () => {
  test('renders only visible rows', async () => {
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

  test('table body height matches total content size', async () => {
    const screen = await render(
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT }} data={{ data: ITEMS, groups: [] }}>
        <Column field="name">
          <ColumnHeader>{({ column }) => <div style={{ height: HEADER_HEIGHT }}>{column.field}</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const expectedTotalHeight = ITEM_COUNT * ROW_HEIGHT
    const tableBody = screen.container.querySelector(tableBodySelector) as HTMLElement
    expect(tableBody.style.height).toBe(`${expectedTotalHeight}px`)
  })
})

describe('column virtualization', () => {
  const TOTAL_WIDTH = COLUMN_COUNT * COLUMN_WIDTH
  const VISIBLE_COLUMNS = Math.ceil(CONTAINER_WIDTH / COLUMN_WIDTH)

  test('renders only visible columns with correct padding', async () => {
    const screen = await render(<MultiColumnTable />)

    await waitForReady(screen)

    const firstRow = screen.container.querySelector(rowSelector) as HTMLElement
    const scrollableContainer = firstRow.querySelector(scrollableCellsSelector) as HTMLElement
    const cells = scrollableContainer.querySelectorAll(':scope > div')

    const computedStyle = getComputedStyle(scrollableContainer)
    const marginLeft = parseFloat(computedStyle.marginLeft)
    const marginRight = parseFloat(computedStyle.marginRight)

    expect(cells.length).toBe(VISIBLE_COLUMNS)
    expect(marginLeft).toBe(0)
    expect(marginRight).toBe(TOTAL_WIDTH - VISIBLE_COLUMNS * COLUMN_WIDTH)
    expect(marginLeft + marginRight + cells.length * COLUMN_WIDTH).toBe(TOTAL_WIDTH)
  })

  test('updates visible columns after horizontal scroll', async () => {
    const screen = await render(<MultiColumnTable />)

    await waitForReady(screen)

    const SCROLL_AMOUNT = 300
    const FIRST_VISIBLE_COLUMN_AFTER_SCROLL = Math.floor(SCROLL_AMOUNT / COLUMN_WIDTH)
    const EXPECTED_MARGIN_LEFT = FIRST_VISIBLE_COLUMN_AFTER_SCROLL * COLUMN_WIDTH

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    const firstRow = () => screen.container.querySelector(rowSelector) as HTMLElement
    const getScrollableContainer = () => firstRow().querySelector(scrollableCellsSelector) as HTMLElement
    const getCells = () => getScrollableContainer().querySelectorAll(':scope > div')

    const cellsBefore = getCells()
    expect(cellsBefore[0]?.textContent).toBe('R0C0')

    scroller.scrollLeft = SCROLL_AMOUNT

    await expect.poll(() => getCells()[0]?.textContent).toBe(`R0C${FIRST_VISIBLE_COLUMN_AFTER_SCROLL}`)
    const cellsAfter = getCells()

    const computedStyle = getComputedStyle(getScrollableContainer())
    const marginLeft = parseFloat(computedStyle.marginLeft)
    expect(marginLeft).toBe(EXPECTED_MARGIN_LEFT)

    const marginRight = parseFloat(computedStyle.marginRight)
    expect(marginLeft + marginRight + cellsAfter.length * COLUMN_WIDTH).toBe(TOTAL_WIDTH)
  })
})

describe('header and row alignment', () => {
  const TOTAL_WIDTH = COLUMN_COUNT * COLUMN_WIDTH
  const VISIBLE_COLUMNS = Math.ceil(CONTAINER_WIDTH / COLUMN_WIDTH)

  test('row width matches header width', async () => {
    const screen = await render(<MultiColumnTable />)

    await waitForReady(screen)

    const headerCells = screen.container.querySelectorAll(headerCellSelector)
    expect(headerCells.length).toBe(COLUMN_COUNT)

    const headerTotalWidth = [...headerCells].reduce((sum, cell) => sum + cell.getBoundingClientRect().width, 0)
    expect(headerTotalWidth).toBe(TOTAL_WIDTH)

    const firstRow = screen.container.querySelector(rowSelector) as HTMLElement
    const rowStyle = getComputedStyle(firstRow)
    const rowWidth = parseFloat(rowStyle.width)

    expect(rowWidth).toBe(TOTAL_WIDTH)
  })

  test('cell widths match header cell widths', async () => {
    const screen = await render(<MultiColumnTable />)

    await waitForReady(screen)

    const headerCells = screen.container.querySelectorAll(headerCellSelector)
    const firstRow = screen.container.querySelector(rowSelector) as HTMLElement
    const scrollableContainer = firstRow.querySelector(scrollableCellsSelector) as HTMLElement
    const rowCells = scrollableContainer.querySelectorAll(':scope > div')

    expect(rowCells.length).toBe(VISIBLE_COLUMNS)

    const headerWidths = [...headerCells].map((cell) => cell.getBoundingClientRect().width)
    const rowCellWidths = [...rowCells].map((cell) => cell.getBoundingClientRect().width)

    for (let i = 0; i < VISIBLE_COLUMNS; i++) {
      expect(rowCellWidths[i]).toBe(headerWidths[i])
      expect(rowCellWidths[i]).toBe(COLUMN_WIDTH)
    }
  })
})
