import { expect, test, describe, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { Cell, VirtuosoDataTable } from '../../..'
import { Column } from '../../../columns/Column'
import { ColumnHeader } from '../../../columns/ColumnHeader'

import type { ListScrollLocation } from '../../../interfaces'

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

const rowSelector = '[data-testid=virtuoso-table-row]'
const scrollerSelector = '[data-testid=virtuoso-table-scroller]'
const readySelector = '[data-testid=virtuoso-table-root][data-ready]'

async function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
}

const TOTAL_ROWS_HEIGHT = ITEM_COUNT * ROW_HEIGHT
const VISIBLE_LIST_HEIGHT = CONTAINER_HEIGHT - HEADER_HEIGHT
const VISIBLE_ROWS = Math.ceil(VISIBLE_LIST_HEIGHT / ROW_HEIGHT)

function expectedVisibleDataSlice(startIndex: number) {
  return ITEMS.slice(startIndex, startIndex + VISIBLE_ROWS)
}

describe('onScroll callback', () => {
  test('fires callback on scroll with correct ListScrollLocation values', async () => {
    const onScroll = vi.fn<(location: ListScrollLocation) => void>()

    const screen = await render(
      <VirtuosoDataTable
        style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}
        data={{ data: ITEMS, groups: [] }}
        onScroll={onScroll}
      >
        <Column field="name">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    const SCROLL_AMOUNT = 150

    scroller.scrollTop = SCROLL_AMOUNT

    await expect.poll(() => onScroll.mock.calls.at(-1)?.[0].listOffset).toBe(-SCROLL_AMOUNT)

    const [lastCall] = onScroll.mock.calls.at(-1)!

    expect(lastCall.listOffset).toBe(-SCROLL_AMOUNT)
    expect(lastCall.visibleListHeight).toBe(VISIBLE_LIST_HEIGHT)
    expect(lastCall.scrollHeight).toBe(TOTAL_ROWS_HEIGHT)
    expect(lastCall.bottomOffset).toBe(TOTAL_ROWS_HEIGHT - SCROLL_AMOUNT - VISIBLE_LIST_HEIGHT)
    expect(lastCall.isAtBottom).toBeFalsy()
  })

  test('updates listOffset correctly after additional scroll', async () => {
    const onScroll = vi.fn<(location: ListScrollLocation) => void>()

    const screen = await render(
      <VirtuosoDataTable
        style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}
        data={{ data: ITEMS, groups: [] }}
        onScroll={onScroll}
      >
        <Column field="name">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement

    scroller.scrollTop = 100
    await expect.poll(() => onScroll.mock.calls.at(-1)?.[0].listOffset).toBe(-100)

    const SECOND_SCROLL = 300
    scroller.scrollTop = SECOND_SCROLL

    await expect.poll(() => onScroll.mock.calls.at(-1)?.[0].listOffset).toBe(-SECOND_SCROLL)

    const [lastCall] = onScroll.mock.calls.at(-1)!
    expect(lastCall.listOffset).toBe(-SECOND_SCROLL)
    expect(lastCall.bottomOffset).toBe(TOTAL_ROWS_HEIGHT - SECOND_SCROLL - VISIBLE_LIST_HEIGHT)
  })

  test('isAtBottom is true when scrolled to bottom', async () => {
    const onScroll = vi.fn<(location: ListScrollLocation) => void>()

    const screen = await render(
      <VirtuosoDataTable
        style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}
        data={{ data: ITEMS, groups: [] }}
        onScroll={onScroll}
      >
        <Column field="name">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    const maxScroll = TOTAL_ROWS_HEIGHT - VISIBLE_LIST_HEIGHT

    scroller.scrollTop = maxScroll

    await expect
      .poll(() => {
        const [lastCall] = onScroll.mock.calls.at(-1)!
        return lastCall.isAtBottom
      })
      .toBe(true)

    const [lastCall] = onScroll.mock.calls.at(-1)!
    expect(lastCall.bottomOffset).toBe(0)
  })
})

describe('onRenderedDataChange callback', () => {
  test('receives exact visible data items in order on initial render', async () => {
    const onRenderedDataChange = vi.fn<(range: (typeof ITEMS)[number][]) => void>()

    const screen = await render(
      <VirtuosoDataTable
        style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}
        data={{ data: ITEMS, groups: [] }}
        onRenderedDataChange={onRenderedDataChange}
      >
        <Column field="name">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    await expect
      .poll(() => onRenderedDataChange.mock.calls.at(-1)?.[0].map((item) => item.id))
      .toEqual(expectedVisibleDataSlice(0).map((item) => item.id))
  })

  test('receives updated data items after scroll', async () => {
    const onRenderedDataChange = vi.fn<(range: (typeof ITEMS)[number][]) => void>()

    const screen = await render(
      <VirtuosoDataTable
        style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}
        data={{ data: ITEMS, groups: [] }}
        onRenderedDataChange={onRenderedDataChange}
      >
        <Column field="name">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    const SCROLL_ROWS = 5
    const SCROLL_AMOUNT = SCROLL_ROWS * ROW_HEIGHT

    scroller.scrollTop = SCROLL_AMOUNT

    await expect
      .poll(() => onRenderedDataChange.mock.calls.at(-1)?.[0].map((item) => item.id))
      .toEqual(expectedVisibleDataSlice(SCROLL_ROWS).map((item) => item.id))
  })

  test('callback fires with updated items during scroll', async () => {
    const onRenderedDataChange = vi.fn<(range: (typeof ITEMS)[number][]) => void>()

    const screen = await render(
      <VirtuosoDataTable
        style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}
        data={{ data: ITEMS, groups: [] }}
        onRenderedDataChange={onRenderedDataChange}
      >
        <Column field="name">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    const rows = screen.container.querySelectorAll(rowSelector)

    expect(rows[0]?.textContent).toBe('User 1')

    scroller.scrollTop = 300

    const SCROLL_ROWS = Math.floor(300 / ROW_HEIGHT)
    await expect
      .poll(() => onRenderedDataChange.mock.calls.at(-1)?.[0].map((item) => item.id))
      .toEqual(expectedVisibleDataSlice(SCROLL_ROWS).map((item) => item.id))
  })
})
