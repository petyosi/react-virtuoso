import { useState } from 'react'

import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { Cell } from '../../..'
import { Column } from '../../../columns/Column'
import { ColumnHeader } from '../../../columns/ColumnHeader'
import { LocalDataTable as VirtuosoDataTable } from '../../../tests/LocalDataTable'

const HEADER_HEIGHT = 40
const ROW_HEIGHT = 30
const CONTAINER_HEIGHT = 300
const TABLE_WIDTH = 300
const COLUMN_WIDTH = 150
const COLUMN_COUNT = 6
const ITEM_COUNT = 100
const SCROLLED_COLUMNS = 2
const SCROLL_TOP = 600

const ITEMS = Array.from({ length: ITEM_COUNT }, (_, i) => ({
  id: i,
  col0: `R${i}C0`,
  col1: `R${i}C1`,
  col2: `R${i}C2`,
  col3: `R${i}C3`,
  col4: `R${i}C4`,
  col5: `R${i}C5`,
}))

type Item = (typeof ITEMS)[number]

const rowSelector = '[data-testid=virtuoso-table-row]'
const readySelector = '[data-testid=virtuoso-table-root][data-ready]'
const rootSelector = '[data-testid=virtuoso-table-root]'
const scrollableCellsSelector = '[data-scrollable="true"]'
const scrollParentSelector = '[data-testid=custom-scroll-parent]'

// The consumer opts in: a root that scrolls sideways keeps the rows on the outer scroller.
const ROOT_STYLE = { width: TABLE_WIDTH, overflowX: 'auto' } as const

const VISIBLE_COLUMN_COUNT = TABLE_WIDTH / COLUMN_WIDTH
const EXPECTED_COLUMNS = Array.from({ length: VISIBLE_COLUMN_COUNT }, (_, i) => SCROLLED_COLUMNS + i)

function TableColumns() {
  return Array.from({ length: COLUMN_COUNT }, (_, i) => (
    <Column key={`col${i}`} field={`col${i}` as keyof Item}>
      <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Header {i}</div>}</ColumnHeader>
      <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
    </Column>
  ))
}

function renderedCellsOf(row: Element) {
  const scrollable = row.querySelector(scrollableCellsSelector) as HTMLElement
  return [...scrollable.querySelectorAll(':scope > div')].map((cell) => cell.textContent)
}

function rowIndexOf(row: Element) {
  return Number(/^R(\d+)C/.exec(renderedCellsOf(row)[0] ?? '')?.[1])
}

function expectedCellsFor(row: Element) {
  return EXPECTED_COLUMNS.map((column) => `R${rowIndexOf(row)}C${column}`)
}

// The rows render again only after the scroll event. Until then the old cells would pass the column check.
async function waitForRowsBelowTheFirst(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => [...screen.container.querySelectorAll(rowSelector)].some((row) => rowIndexOf(row) === 0)).toBe(false)
}

async function expectScrolledColumns(screen: Awaited<ReturnType<typeof render>>) {
  await expect
    .poll(() => {
      const rows = [...screen.container.querySelectorAll(rowSelector)]
      return rows.length > 0 && rows.every((row) => JSON.stringify(renderedCellsOf(row)) === JSON.stringify(expectedCellsFor(row)))
    })
    .toBe(true)
}

async function scrollRootSideways(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
  const root = screen.container.querySelector(rootSelector) as HTMLElement
  await expect.poll(() => root.scrollWidth).toBe(COLUMN_COUNT * COLUMN_WIDTH)
  root.scrollLeft = SCROLLED_COLUMNS * COLUMN_WIDTH
  await expectScrolledColumns(screen)
}

describe('outer scroller with a horizontally scrolling table root', () => {
  test('useWindowScroll renders the columns under the root scroll offset', async () => {
    const screen = await render(
      <VirtuosoDataTable useWindowScroll source={ITEMS} style={ROOT_STYLE}>
        <TableColumns />
      </VirtuosoDataTable>
    )

    await scrollRootSideways(screen)

    // A vertical window scroll reads the window offset again. It must keep the root offset.
    window.scrollTo(0, SCROLL_TOP)
    await expect.poll(() => window.scrollY).toBe(SCROLL_TOP)
    await waitForRowsBelowTheFirst(screen)
    await expectScrolledColumns(screen)
    window.scrollTo(0, 0)
  })

  test('customScrollParent renders the columns under the root scroll offset', async () => {
    function TestComponent() {
      const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(null)
      return (
        <div data-testid="custom-scroll-parent" ref={setScrollParent} style={{ height: CONTAINER_HEIGHT, overflowY: 'auto' }}>
          <VirtuosoDataTable customScrollParent={scrollParent} source={ITEMS} style={ROOT_STYLE}>
            <TableColumns />
          </VirtuosoDataTable>
        </div>
      )
    }

    const screen = await render(<TestComponent />)
    await scrollRootSideways(screen)

    const scrollParent = screen.container.querySelector(scrollParentSelector) as HTMLElement
    scrollParent.scrollTop = SCROLL_TOP
    await expect.poll(() => scrollParent.scrollTop).toBe(SCROLL_TOP)
    await waitForRowsBelowTheFirst(screen)
    await expectScrolledColumns(screen)
  })
})
