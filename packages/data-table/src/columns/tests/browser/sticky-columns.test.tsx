import { expect, test, describe } from 'vitest'
import { render } from 'vitest-browser-react'

import { Cell, VirtuosoDataTable } from '../../..'
import { Column } from '../../Column'
import { ColumnHeader } from '../../ColumnHeader'

const HEADER_HEIGHT = 40
const ROW_HEIGHT = 30
const CONTAINER_HEIGHT = 300
const CONTAINER_WIDTH = 300
const COLUMN_WIDTH = 100
const COLUMN_COUNT = 10
const ITEM_COUNT = 100

const MULTI_COLUMN_ITEMS = Array.from({ length: ITEM_COUNT }, (_, i) => {
  const row: Record<string, string> = {}
  for (let j = 0; j < COLUMN_COUNT; j++) {
    row[`col${j}`] = `R${i}C${j}`
  }
  return row
})

const rowSelector = '[data-testid=virtuoso-table-row]'
const scrollerSelector = '[data-testid=virtuoso-table-scroller]'
const readySelector = '[data-testid=virtuoso-table-root][data-ready]'
const leftStickySelector = '[data-sticky="left"]'
const rightStickySelector = '[data-sticky="right"]'
const scrollableCellsSelector = '[data-scrollable="true"]'
const headerCellSelector = '[data-table-element-role="column-header"]'
const stickyHeaderSelector = '[data-table-element-role="sticky-header"]'

async function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
}

describe('sticky columns', () => {
  test('left sticky column stays fixed at left edge', async () => {
    const screen = await render(
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} data={{ data: MULTI_COLUMN_ITEMS, groups: [] }}>
        <Column field="col0" sticky="left">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Sticky Left</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
        {Array.from({ length: COLUMN_COUNT - 1 }, (_, i) => (
          <Column key={`col${i + 1}`} field={`col${i + 1}`}>
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Header {i + 1}</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        ))}
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const firstRow = screen.container.querySelector(rowSelector) as HTMLElement
    const leftStickyContainer = firstRow.querySelector(leftStickySelector) as HTMLElement
    expect(leftStickyContainer).not.toBeNull()

    const stickyCells = leftStickyContainer.querySelectorAll(':scope > div')
    expect(stickyCells.length).toBe(1)
    expect(stickyCells[0]?.textContent).toBe('R0C0')

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    scroller.scrollLeft = 200

    await expect
      .poll(() => {
        const row = screen.container.querySelector(rowSelector) as HTMLElement
        const stickyContainer = row.querySelector(leftStickySelector) as HTMLElement
        return stickyContainer?.querySelector(':scope > div')?.textContent
      })
      .toBe('R0C0')
  })

  test('right sticky column stays fixed at right edge', async () => {
    const screen = await render(
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} data={{ data: MULTI_COLUMN_ITEMS, groups: [] }}>
        {Array.from({ length: COLUMN_COUNT - 1 }, (_, i) => (
          <Column key={`col${i}`} field={`col${i}`}>
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Header {i}</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        ))}
        <Column field={`col${COLUMN_COUNT - 1}`} sticky="right">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Sticky Right</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const firstRow = screen.container.querySelector(rowSelector) as HTMLElement
    const rightStickyContainer = firstRow.querySelector(rightStickySelector) as HTMLElement
    expect(rightStickyContainer).not.toBeNull()

    const stickyCells = rightStickyContainer.querySelectorAll(':scope > div')
    expect(stickyCells.length).toBe(1)
    expect(stickyCells[0]?.textContent).toBe(`R0C${COLUMN_COUNT - 1}`)

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    scroller.scrollLeft = 200

    await expect
      .poll(() => {
        const row = screen.container.querySelector(rowSelector) as HTMLElement
        const stickyContainer = row.querySelector(rightStickySelector) as HTMLElement
        return stickyContainer?.querySelector(':scope > div')?.textContent
      })
      .toBe(`R0C${COLUMN_COUNT - 1}`)
  })

  test('virtualization excludes sticky columns from scrollable area', async () => {
    const screen = await render(
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} data={{ data: MULTI_COLUMN_ITEMS, groups: [] }}>
        <Column field="col0" sticky="left">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Sticky Left</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
        {Array.from({ length: COLUMN_COUNT - 2 }, (_, i) => (
          <Column key={`col${i + 1}`} field={`col${i + 1}`}>
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Header {i + 1}</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        ))}
        <Column field={`col${COLUMN_COUNT - 1}`} sticky="right">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Sticky Right</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const firstRow = screen.container.querySelector(rowSelector) as HTMLElement
    const leftStickyContainer = firstRow.querySelector(leftStickySelector)
    const rightStickyContainer = firstRow.querySelector(rightStickySelector)
    const scrollableContainer = firstRow.querySelector(scrollableCellsSelector) as HTMLElement

    expect(leftStickyContainer).not.toBeNull()
    expect(rightStickyContainer).not.toBeNull()

    const scrollableCells = scrollableContainer.querySelectorAll(':scope > div')
    const scrollableCellTexts = [...scrollableCells].map((c) => c.textContent)
    expect(scrollableCellTexts).not.toContain('R0C0')
    expect(scrollableCellTexts).not.toContain(`R0C${COLUMN_COUNT - 1}`)
  })

  test('multiple sticky columns preserve declaration order', async () => {
    const screen = await render(
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} data={{ data: MULTI_COLUMN_ITEMS, groups: [] }}>
        <Column field="col0" sticky="left">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Left 1</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
        <Column field="col1" sticky="left">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Left 2</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
        {Array.from({ length: COLUMN_COUNT - 4 }, (_, i) => (
          <Column key={`col${i + 2}`} field={`col${i + 2}`}>
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Header {i + 2}</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        ))}
        <Column field={`col${COLUMN_COUNT - 2}`} sticky="right">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Right 1</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
        <Column field={`col${COLUMN_COUNT - 1}`} sticky="right">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Right 2</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const firstRow = screen.container.querySelector(rowSelector) as HTMLElement
    const leftStickyContainer = firstRow.querySelector(leftStickySelector) as HTMLElement
    const rightStickyContainer = firstRow.querySelector(rightStickySelector) as HTMLElement

    const leftCells = leftStickyContainer.querySelectorAll(':scope > div')
    expect(leftCells.length).toBe(2)
    expect(leftCells[0]?.textContent).toBe('R0C0')
    expect(leftCells[1]?.textContent).toBe('R0C1')

    const rightCells = rightStickyContainer.querySelectorAll(':scope > div')
    expect(rightCells.length).toBe(2)
    expect(rightCells[0]?.textContent).toBe(`R0C${COLUMN_COUNT - 2}`)
    expect(rightCells[1]?.textContent).toBe(`R0C${COLUMN_COUNT - 1}`)
  })

  test('cell content wider than header is clipped by overflow hidden', async () => {
    const NARROW_HEADER_WIDTH = 50
    const WIDE_CELL_WIDTH = 150

    const screen = await render(
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: 600 }} data={{ data: MULTI_COLUMN_ITEMS, groups: [] }}>
        <Column field="col0" sticky="left">
          <ColumnHeader>{() => <div style={{ width: NARROW_HEADER_WIDTH, height: HEADER_HEIGHT }}>ID</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ width: WIDE_CELL_WIDTH, height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
        {Array.from({ length: COLUMN_COUNT - 1 }, (_, i) => (
          <Column key={`col${i + 1}`} field={`col${i + 1}`}>
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Column {i + 1}</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        ))}
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const firstRow = screen.container.querySelector(rowSelector) as HTMLElement
    const leftStickyContainer = firstRow.querySelector(leftStickySelector) as HTMLElement
    const scrollableContainer = firstRow.querySelector(scrollableCellsSelector) as HTMLElement

    const stickyCellContainer = leftStickyContainer.querySelector(':scope > div') as HTMLElement
    expect(stickyCellContainer.style.width).toBe('')
    expect(stickyCellContainer.getBoundingClientRect().width).toBe(NARROW_HEADER_WIDTH)

    const scrollableCells = scrollableContainer.querySelectorAll(':scope > div')
    expect(scrollableCells[0]?.textContent).toBe('R0C1')
  })

  test('rows and header fill container when wider than total column width', async () => {
    const SMALL_COLUMN_WIDTH = 80
    const FEW_COLUMNS = 3
    const WIDE_CONTAINER = 600
    const TOTAL_COLUMN_WIDTH = FEW_COLUMNS * SMALL_COLUMN_WIDTH

    const items = Array.from({ length: 20 }, (_, i) => ({
      col0: `R${i}C0`,
      col1: `R${i}C1`,
      col2: `R${i}C2`,
    }))

    const screen = await render(
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: WIDE_CONTAINER }} data={{ data: items, groups: [] }}>
        <Column field="col0" sticky="left">
          <ColumnHeader>{() => <div style={{ width: SMALL_COLUMN_WIDTH, height: HEADER_HEIGHT }}>Col 0</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
        <Column field="col1">
          <ColumnHeader>{() => <div style={{ width: SMALL_COLUMN_WIDTH, height: HEADER_HEIGHT }}>Col 1</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
        <Column field="col2">
          <ColumnHeader>{() => <div style={{ width: SMALL_COLUMN_WIDTH, height: HEADER_HEIGHT }}>Col 2</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const firstRow = screen.container.querySelector(rowSelector) as HTMLElement
    const rowWidth = firstRow.getBoundingClientRect().width

    expect(rowWidth).toBe(WIDE_CONTAINER)
    expect(rowWidth).toBeGreaterThan(TOTAL_COLUMN_WIDTH)
  })

  test('sticky header paints above content rows when scrolled vertically', async () => {
    const screen = await render(
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} data={{ data: MULTI_COLUMN_ITEMS, groups: [] }}>
        <Column field="col0" sticky="left">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Sticky Left</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
        {Array.from({ length: COLUMN_COUNT - 2 }, (_, i) => (
          <Column key={`col${i + 1}`} field={`col${i + 1}`}>
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Header {i + 1}</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        ))}
        <Column field={`col${COLUMN_COUNT - 1}`} sticky="right">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Sticky Right</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    scroller.scrollTop = 200

    await expect.poll(() => scroller.scrollTop).toBe(200)

    const stickyHeader = screen.container.querySelector(stickyHeaderSelector) as HTMLElement
    const scrollerRect = scroller.getBoundingClientRect()
    const headerRect = stickyHeader.getBoundingClientRect()

    const probeX = scrollerRect.left + scrollerRect.width / 2
    const probeY = headerRect.top + headerRect.height / 2

    const elementAtPoint = document.elementFromPoint(probeX, probeY)
    expect(stickyHeader.contains(elementAtPoint)).toBe(true)
  })

  test('columns expand to fill available space when container is wider', async () => {
    const SMALL_COLUMN_WIDTH = 80
    const FEW_COLUMNS = 3
    const WIDE_CONTAINER = 600
    const EXPECTED_EXPANDED_WIDTH = WIDE_CONTAINER / FEW_COLUMNS

    const items = Array.from({ length: 20 }, (_, i) => ({
      col0: `R${i}C0`,
      col1: `R${i}C1`,
      col2: `R${i}C2`,
    }))

    const screen = await render(
      <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: WIDE_CONTAINER }} data={{ data: items, groups: [] }}>
        <Column field="col0">
          <ColumnHeader>{() => <div style={{ width: SMALL_COLUMN_WIDTH, height: HEADER_HEIGHT }}>Col 0</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
        <Column field="col1">
          <ColumnHeader>{() => <div style={{ width: SMALL_COLUMN_WIDTH, height: HEADER_HEIGHT }}>Col 1</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
        <Column field="col2">
          <ColumnHeader>{() => <div style={{ width: SMALL_COLUMN_WIDTH, height: HEADER_HEIGHT }}>Col 2</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const headerCells = screen.container.querySelectorAll(headerCellSelector)
    const headerWidths = [...headerCells].map((cell) => cell.getBoundingClientRect().width)

    expect(headerWidths.length).toBe(FEW_COLUMNS)
    for (const width of headerWidths) {
      expect(width).toBe(EXPECTED_EXPANDED_WIDTH)
    }
  })
})
