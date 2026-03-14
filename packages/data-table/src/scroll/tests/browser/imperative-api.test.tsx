import React from 'react'

import { expect, test, describe, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { Cell, VirtuosoDataTable } from '../../..'
import { Column } from '../../../columns/Column'
import { ColumnHeader } from '../../../columns/ColumnHeader'
import { delay } from '../../../tests/browser/setup'

import type { VirtuosoDataTableMethods } from '../../..'

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

function TestTable({ tableRef }: { tableRef: React.RefObject<VirtuosoDataTableMethods<(typeof ITEMS)[0]> | null> }) {
  return (
    <VirtuosoDataTable ref={tableRef} style={{ height: CONTAINER_HEIGHT }} data={{ data: ITEMS, groups: [] }}>
      <Column field="name">
        <ColumnHeader>{({ column }) => <div style={{ height: HEADER_HEIGHT }}>{column.field}</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
      </Column>
    </VirtuosoDataTable>
  )
}

describe('scrollToRow', () => {
  test('scrollToRow with number scrolls to exact pixel position', async () => {
    const tableRef = React.createRef<VirtuosoDataTableMethods<(typeof ITEMS)[0]>>()
    const screen = await render(<TestTable tableRef={tableRef} />)

    await waitForReady(screen)

    const targetIndex = 20
    const expectedScrollTop = targetIndex * ROW_HEIGHT

    tableRef.current!.scrollToRow(targetIndex)

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    await expect.poll(() => scroller.scrollTop).toBe(expectedScrollTop)
  })

  test('scrollToRow with align: start scrolls to exact pixel position', async () => {
    const tableRef = React.createRef<VirtuosoDataTableMethods<(typeof ITEMS)[0]>>()
    const screen = await render(<TestTable tableRef={tableRef} />)

    await waitForReady(screen)

    const targetIndex = 30
    const expectedScrollTop = targetIndex * ROW_HEIGHT

    tableRef.current!.scrollToRow({ index: targetIndex, align: 'start' })

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    await expect.poll(() => scroller.scrollTop).toBe(expectedScrollTop)
  })

  test('scrollToRow with align: center scrolls to exact pixel position', async () => {
    const tableRef = React.createRef<VirtuosoDataTableMethods<(typeof ITEMS)[0]>>()
    const screen = await render(<TestTable tableRef={tableRef} />)

    await waitForReady(screen)

    const targetIndex = 50
    const viewportHeight = CONTAINER_HEIGHT - HEADER_HEIGHT
    const expectedScrollTop = targetIndex * ROW_HEIGHT - viewportHeight / 2 + ROW_HEIGHT / 2

    tableRef.current!.scrollToRow({ index: targetIndex, align: 'center' })

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    await expect.poll(() => scroller.scrollTop).toBe(expectedScrollTop)
  })

  test('scrollToRow with align: end scrolls to exact pixel position', async () => {
    const tableRef = React.createRef<VirtuosoDataTableMethods<(typeof ITEMS)[0]>>()
    const screen = await render(<TestTable tableRef={tableRef} />)

    await waitForReady(screen)

    const targetIndex = 40
    const viewportHeight = CONTAINER_HEIGHT - HEADER_HEIGHT
    const expectedScrollTop = targetIndex * ROW_HEIGHT - viewportHeight + ROW_HEIGHT

    tableRef.current!.scrollToRow({ index: targetIndex, align: 'end' })

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    await expect.poll(() => scroller.scrollTop).toBe(expectedScrollTop)
  })

  test('scrollToRow with index: LAST scrolls to last row', async () => {
    const tableRef = React.createRef<VirtuosoDataTableMethods<(typeof ITEMS)[0]>>()
    const screen = await render(<TestTable tableRef={tableRef} />)

    await waitForReady(screen)

    const lastIndex = ITEM_COUNT - 1
    const viewportHeight = CONTAINER_HEIGHT - HEADER_HEIGHT
    const expectedScrollTop = lastIndex * ROW_HEIGHT - viewportHeight + ROW_HEIGHT

    tableRef.current!.scrollToRow({ index: 'LAST', align: 'end' })

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    await expect.poll(() => scroller.scrollTop).toBe(expectedScrollTop)
  })
})

describe('scrollIntoView', () => {
  test('scrollIntoView does not scroll when row is already visible', async () => {
    const tableRef = React.createRef<VirtuosoDataTableMethods<(typeof ITEMS)[0]>>()
    const screen = await render(<TestTable tableRef={tableRef} />)

    await waitForReady(screen)

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    const initialScrollTop = scroller.scrollTop

    tableRef.current!.scrollIntoView(3)

    await delay(100)

    expect(scroller.scrollTop).toBe(initialScrollTop)
  })

  test('scrollIntoView scrolls when row is not visible', async () => {
    const tableRef = React.createRef<VirtuosoDataTableMethods<(typeof ITEMS)[0]>>()
    const screen = await render(<TestTable tableRef={tableRef} />)

    await waitForReady(screen)

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    const targetIndex = 50

    tableRef.current!.scrollIntoView(targetIndex)

    await expect.poll(() => scroller.scrollTop).toBeGreaterThan(0)

    const viewportHeight = CONTAINER_HEIGHT - HEADER_HEIGHT
    const expectedScrollTop = targetIndex * ROW_HEIGHT - viewportHeight + ROW_HEIGHT
    expect(scroller.scrollTop).toBe(expectedScrollTop)
  })
})

describe('getScrollLocation', () => {
  test('getScrollLocation returns correct initial values', async () => {
    const tableRef = React.createRef<VirtuosoDataTableMethods<(typeof ITEMS)[0]>>()
    const screen = await render(<TestTable tableRef={tableRef} />)

    await waitForReady(screen)

    await expect.poll(() => tableRef.current!.getScrollLocation().scrollHeight).toBe(ITEM_COUNT * ROW_HEIGHT)

    const location = tableRef.current!.getScrollLocation()
    expect(location.listOffset).toBe(0)
  })

  test('getScrollLocation returns correct values after scroll', async () => {
    const tableRef = React.createRef<VirtuosoDataTableMethods<(typeof ITEMS)[0]>>()
    const screen = await render(<TestTable tableRef={tableRef} />)

    await waitForReady(screen)

    const scrollAmount = 200
    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    scroller.scrollTop = scrollAmount

    await expect.poll(() => tableRef.current!.getScrollLocation().listOffset).toBe(-scrollAmount)

    const location = tableRef.current!.getScrollLocation()
    expect(location.listOffset).toBe(-scrollAmount)
  })
})

describe('scrollerElement', () => {
  test('scrollerElement returns DOM element', async () => {
    const tableRef = React.createRef<VirtuosoDataTableMethods<(typeof ITEMS)[0]>>()
    const screen = await render(<TestTable tableRef={tableRef} />)

    await waitForReady(screen)

    const scrollerElement = tableRef.current!.scrollerElement()
    const expectedScroller = screen.container.querySelector(scrollerSelector)

    expect(scrollerElement).toBe(expectedScroller)
    expect(scrollerElement).toBeInstanceOf(HTMLDivElement)
  })
})

describe('cancelSmoothScroll', () => {
  test('cancelSmoothScroll cancels pending smooth scroll frame and keeps scroll position stable', async () => {
    const tableRef = React.createRef<VirtuosoDataTableMethods<(typeof ITEMS)[0]>>()
    const screen = await render(<TestTable tableRef={tableRef} />)

    await waitForReady(screen)

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    const targetIndex = 50
    const expectedTargetScrollTop = targetIndex * ROW_HEIGHT

    let nextAnimationFrameId = 1
    const queuedAnimationFrames = new Map<number, FrameRequestCallback>()

    const requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      const id = nextAnimationFrameId
      nextAnimationFrameId += 1
      queuedAnimationFrames.set(id, callback)
      return id
    })

    const cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      queuedAnimationFrames.delete(id)
    })

    try {
      tableRef.current!.scrollToRow({
        index: targetIndex,
        align: 'start',
        behavior: () => ({
          animationFrameCount: 300,
          easing: (x) => x,
        }),
      })

      expect(queuedAnimationFrames.size).toBe(1)
      expect(scroller.scrollTop).toBe(0)

      tableRef.current!.cancelSmoothScroll()

      expect(cancelAnimationFrameSpy).toHaveBeenCalledOnce()
      expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(1)
      expect(queuedAnimationFrames.size).toBe(0)

      await delay(50)

      expect(scroller.scrollTop).toBe(0)
      expect(scroller.scrollTop).not.toBe(expectedTargetScrollTop)
    } finally {
      requestAnimationFrameSpy.mockRestore()
      cancelAnimationFrameSpy.mockRestore()
    }
  })
})

describe('height', () => {
  test('height returns measured height for item', async () => {
    const tableRef = React.createRef<VirtuosoDataTableMethods<(typeof ITEMS)[0]>>()
    const screen = await render(<TestTable tableRef={tableRef} />)

    await waitForReady(screen)

    const [firstItem] = ITEMS
    const height = tableRef.current!.height(firstItem!)

    expect(height).toBe(ROW_HEIGHT)
  })
})
