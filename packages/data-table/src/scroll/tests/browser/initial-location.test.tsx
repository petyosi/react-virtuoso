import { expect, test, describe } from 'vitest'
import { render } from 'vitest-browser-react'

import { Cell, VirtuosoDataTable } from '../../..'
import { Column } from '../../../columns/Column'
import { ColumnHeader } from '../../../columns/ColumnHeader'
import { delay } from '../../../tests/browser/setup'

import type { RowLocation } from '../../../interfaces'

const HEADER_HEIGHT = 40
const ROW_HEIGHT = 30
const CONTAINER_HEIGHT = 300
const ITEM_COUNT = 100

const ITEMS = Array.from({ length: ITEM_COUNT }, (_, i) => ({
  id: i,
  name: `User ${i + 1}`,
}))

const scrollerSelector = '[data-testid=virtuoso-table-scroller]'
const readySelector = '[data-testid=virtuoso-table-root][data-ready]'

async function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
}

function Table({ initialLocation }: { initialLocation: RowLocation }) {
  return (
    <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT }} data={{ data: ITEMS, groups: [] }} initialLocation={initialLocation}>
      <Column field="name">
        <ColumnHeader>{({ column }) => <div style={{ height: HEADER_HEIGHT }}>{column.field}</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
      </Column>
    </VirtuosoDataTable>
  )
}

describe('initialLocation', () => {
  test('scrolls to row 50 on mount with number', async () => {
    const screen = await render(<Table initialLocation={50} />)

    await waitForReady(screen)

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    const expectedScrollTop = 50 * ROW_HEIGHT

    await expect.poll(() => scroller.scrollTop).toBe(expectedScrollTop)
  })

  test('scrolls to row with align start', async () => {
    const screen = await render(<Table initialLocation={{ index: 50, align: 'start' }} />)

    await waitForReady(screen)

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    const expectedScrollTop = 50 * ROW_HEIGHT

    await expect.poll(() => scroller.scrollTop).toBe(expectedScrollTop)
  })

  test('scrolls to row with align center', async () => {
    const screen = await render(<Table initialLocation={{ index: 50, align: 'center' }} />)

    await waitForReady(screen)

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    const viewportHeight = CONTAINER_HEIGHT - HEADER_HEIGHT
    const expectedScrollTop = 50 * ROW_HEIGHT - viewportHeight / 2 + ROW_HEIGHT / 2

    await expect.poll(() => scroller.scrollTop).toBe(expectedScrollTop)
  })

  test('scrolls to row with align end', async () => {
    const screen = await render(<Table initialLocation={{ index: 50, align: 'end' }} />)

    await waitForReady(screen)

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    const viewportHeight = CONTAINER_HEIGHT - HEADER_HEIGHT
    const expectedScrollTop = 50 * ROW_HEIGHT - viewportHeight + ROW_HEIGHT

    await expect.poll(() => scroller.scrollTop).toBe(expectedScrollTop)
  })

  test('scrolls to row with offset', async () => {
    const offset = 20
    const screen = await render(<Table initialLocation={{ index: 50, offset }} />)

    await waitForReady(screen)

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    const expectedScrollTop = 50 * ROW_HEIGHT + offset

    await expect.poll(() => scroller.scrollTop).toBe(expectedScrollTop)
  })

  test('only applies on first render', async () => {
    const screen = await render(<Table initialLocation={50} />)

    await waitForReady(screen)

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    const initialExpectedScrollTop = 50 * ROW_HEIGHT

    await expect.poll(() => scroller.scrollTop).toBe(initialExpectedScrollTop)

    scroller.scrollTop = 0

    await expect.poll(() => scroller.scrollTop).toBe(0)

    screen.rerender(<Table initialLocation={50} />)

    await delay(100)

    expect(scroller.scrollTop).toBe(0)
  })
})
