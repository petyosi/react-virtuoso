import { useMemo } from 'react'

import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { Cell, VirtuosoDataTable } from '../../..'
import { Column } from '../../../columns/Column'
import { ColumnHeader } from '../../../columns/ColumnHeader'
import { defaultAppendViewportHandler, defaultOffsetViewportHandler, remoteModel } from '../../../model/remote-model'
import { delay } from '../../../tests/utils'

import type { AppendFetchParams, FetchParams } from '../../../model/remote-model'
import type { DataModelHandle } from '../../../model/types'

const HEADER_HEIGHT = 40
const ROW_HEIGHT = 30
const CONTAINER_HEIGHT = 300
const CONTAINER_WIDTH = 300
const COLUMN_WIDTH = 150
const TOTAL_ITEMS = 500
const PAGE_SIZE = 50

interface Item {
  id: number
  name: string
}

const PLACEHOLDER: Item = { id: -1, name: 'Loading...' }

const readySelector = '[data-testid=virtuoso-table-root][data-ready]'
const rowSelector = '[data-testid=virtuoso-table-row]'
const scrollerSelector = '[data-testid=virtuoso-table-scroller]'

async function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
}

async function waitForScrollable(scroller: HTMLElement) {
  await expect.poll(() => scroller.scrollHeight - scroller.clientHeight).toBeGreaterThan(0)
}

function makeItems(offset: number, count: number): Item[] {
  return Array.from({ length: count }, (_, i) => ({ id: offset + i, name: `Item ${offset + i}` }))
}

function createMockFetch(totalCount = TOTAL_ITEMS) {
  const calls: FetchParams[] = []
  const fetch = vi.fn(async (params: FetchParams) => {
    calls.push(params)
    await delay(10)
    if (params.signal.aborted) {
      throw new Error('aborted')
    }
    const rows = makeItems(params.offset, Math.min(params.limit, totalCount - params.offset))
    return { rows, totalCount }
  })
  return { fetch, calls }
}

describe('offset mode auto-fetch on scroll', () => {
  test('initial render fetches first page', async () => {
    const { fetch } = createMockFetch()

    function TestComponent() {
      const model = useMemo(
        () =>
          remoteModel<Item>({
            fetch,
            initialParams: {},
            pageSize: PAGE_SIZE,
            placeholder: PLACEHOLDER,
            onViewportChange: defaultOffsetViewportHandler,
          }),
        []
      )

      return (
        <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} model={model}>
          <Column field="id">
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>ID</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestComponent />)
    await waitForReady(screen)

    await expect
      .poll(() => {
        const rows = screen.container.querySelectorAll(rowSelector)
        return rows[0]?.textContent
      })
      .toBe('0')

    expect(fetch).toHaveBeenCalledWith(expect.objectContaining({ offset: 0, limit: PAGE_SIZE }))
  })

  test('scroll to unfetched region triggers fetch', async () => {
    const { fetch, calls } = createMockFetch()

    function TestComponent() {
      const model = useMemo(
        () =>
          remoteModel<Item>({
            fetch,
            initialParams: {},
            pageSize: PAGE_SIZE,
            placeholder: PLACEHOLDER,
            onViewportChange: defaultOffsetViewportHandler,
          }),
        []
      )

      return (
        <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} model={model}>
          <Column field="id">
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>ID</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestComponent />)
    await waitForReady(screen)

    await expect.poll(() => fetch.mock.calls.length).toBe(1)

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    await waitForScrollable(scroller)
    scroller.scrollTop = 100 * ROW_HEIGHT

    await expect
      .poll(() => {
        return calls.some((c) => c.offset === 2 * PAGE_SIZE)
      })
      .toBe(true)
  })

  test('scroll back to loaded region does not re-fetch', async () => {
    const { fetch } = createMockFetch()

    function TestComponent() {
      const model = useMemo(
        () =>
          remoteModel<Item>({
            fetch,
            initialParams: {},
            pageSize: PAGE_SIZE,
            placeholder: PLACEHOLDER,
            onViewportChange: defaultOffsetViewportHandler,
          }),
        []
      )

      return (
        <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} model={model}>
          <Column field="id">
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>ID</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestComponent />)
    await waitForReady(screen)

    await expect.poll(() => fetch.mock.calls.length).toBe(1)
    const fetchCountAfterInit = fetch.mock.calls.length

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    scroller.scrollTop = 10 * ROW_HEIGHT

    await delay(100)
    scroller.scrollTop = 0

    await delay(100)

    expect(fetch.mock.calls.length).toBe(fetchCountAfterInit)
  })

  test('sort action invalidates and re-fetches', async () => {
    const { fetch } = createMockFetch()
    let modelHandle: DataModelHandle<Item>

    function TestComponent() {
      const model = useMemo(() => {
        const m = remoteModel<Item>({
          fetch,
          initialParams: {},
          pageSize: PAGE_SIZE,
          placeholder: PLACEHOLDER,
          onViewportChange: defaultOffsetViewportHandler,
          actions: {
            sort: { handler: ({ payload, params }) => ({ ...params, sort: payload as string }) },
          },
        })
        modelHandle = m
        return m
      }, [])

      return (
        <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} model={model}>
          <Column field="id">
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>ID</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestComponent />)
    await waitForReady(screen)

    await expect.poll(() => fetch.mock.calls.length).toBe(1)

    modelHandle!.send({ action: 'sort', payload: 'name' })

    await expect
      .poll(() => {
        return fetch.mock.calls.some((c) => c[0].params.sort === 'name')
      })
      .toBe(true)
  })

  test('no viewport signal during measurement phase', async () => {
    const viewportChanges: unknown[] = []
    const { fetch } = createMockFetch()

    function TestComponent() {
      const model = useMemo(() => {
        const m = remoteModel<Item>({
          fetch,
          initialParams: {},
          pageSize: PAGE_SIZE,
          placeholder: PLACEHOLDER,
          onViewportChange: (ctx) => {
            viewportChanges.push(ctx)
            return defaultOffsetViewportHandler(ctx)
          },
        })
        return m
      }, [])

      return (
        <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} model={model}>
          <Column field="id">
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>ID</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestComponent />)
    await waitForReady(screen)

    await expect.poll(() => viewportChanges.length).toBe(1)
  })
})

describe('append mode auto-fetch on scroll', () => {
  const APPEND_TOTAL = 100
  const APPEND_PAGE = 20

  function createMockAppendFetch() {
    const calls: AppendFetchParams[] = []
    const fetch = vi.fn(async (params: AppendFetchParams) => {
      calls.push(params)
      await delay(10)
      if (params.signal.aborted) {
        throw new Error('aborted')
      }
      const startIndex = (params.cursor as number | undefined) ?? 0
      const rows = makeItems(startIndex, Math.min(params.limit, APPEND_TOTAL - startIndex))
      const nextCursor = startIndex + rows.length
      const hasMore = nextCursor < APPEND_TOTAL
      return { rows, hasMore, cursor: nextCursor }
    })
    return { fetch, calls }
  }

  test('initial render fetches first page', async () => {
    const { fetch } = createMockAppendFetch()

    function TestComponent() {
      const model = useMemo(
        () =>
          remoteModel<Item>({
            mode: 'append',
            fetch,
            initialParams: {},
            pageSize: APPEND_PAGE,
            onViewportChange: defaultAppendViewportHandler,
          }),
        []
      )

      return (
        <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} model={model}>
          <Column field="id">
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>ID</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestComponent />)
    await waitForReady(screen)

    await expect
      .poll(() => {
        const rows = screen.container.querySelectorAll(rowSelector)
        return rows[0]?.textContent
      })
      .toBe('0')

    expect(fetch).toHaveBeenCalledOnce()
  })

  test('scroll near end triggers auto-load', async () => {
    const { fetch } = createMockAppendFetch()

    function TestComponent() {
      const model = useMemo(
        () =>
          remoteModel<Item>({
            mode: 'append',
            fetch,
            initialParams: {},
            pageSize: APPEND_PAGE,
            onViewportChange: defaultAppendViewportHandler,
          }),
        []
      )

      return (
        <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} model={model}>
          <Column field="id">
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>ID</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestComponent />)
    await waitForReady(screen)

    await expect.poll(() => fetch.mock.calls.length).toBe(1)

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    await waitForScrollable(scroller)
    scroller.scrollTop = (APPEND_PAGE - 5) * ROW_HEIGHT

    await expect.poll(() => fetch.mock.calls.length).toBe(2)
  })

  test('exhausted data stops fetching', async () => {
    const smallTotal = 15
    const calls: AppendFetchParams[] = []
    const fetch = vi.fn(async (params: AppendFetchParams) => {
      calls.push(params)
      await delay(10)
      if (params.signal.aborted) {
        throw new Error('aborted')
      }
      const startIndex = (params.cursor as number | undefined) ?? 0
      const rows = makeItems(startIndex, Math.min(params.limit, smallTotal - startIndex))
      const nextCursor = startIndex + rows.length
      return { rows, hasMore: false, cursor: nextCursor }
    })

    function TestComponent() {
      const model = useMemo(
        () =>
          remoteModel<Item>({
            mode: 'append',
            fetch,
            initialParams: {},
            pageSize: APPEND_PAGE,
            onViewportChange: defaultAppendViewportHandler,
          }),
        []
      )

      return (
        <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} model={model}>
          <Column field="id">
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>ID</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestComponent />)
    await waitForReady(screen)

    await expect.poll(() => fetch.mock.calls.length).toBe(1)

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    scroller.scrollTop = 10 * ROW_HEIGHT

    await delay(200)
    expect(fetch).toHaveBeenCalledOnce()
  })
})

describe('opt-out: no onViewportChange', () => {
  test('offset mode without handler does not auto-fetch', async () => {
    const { fetch } = createMockFetch()

    function TestComponent() {
      const model = useMemo(
        () =>
          remoteModel<Item>({
            fetch,
            initialParams: {},
            pageSize: PAGE_SIZE,
            placeholder: PLACEHOLDER,
          }),
        []
      )

      return (
        <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} model={model}>
          <Column field="id">
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>ID</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestComponent />)
    await waitForReady(screen)

    await expect.poll(() => fetch.mock.calls.length).toBe(1)
    const callsAfterInit = fetch.mock.calls.length

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    scroller.scrollTop = 200 * ROW_HEIGHT

    await delay(200)
    expect(fetch.mock.calls.length).toBe(callsAfterInit)
  })
})

describe('reactive loop termination', () => {
  test('fetch -> data -> viewport re-emit -> no redundant fetch', async () => {
    const { fetch } = createMockFetch()

    function TestComponent() {
      const model = useMemo(
        () =>
          remoteModel<Item>({
            fetch,
            initialParams: {},
            pageSize: PAGE_SIZE,
            placeholder: PLACEHOLDER,
            onViewportChange: defaultOffsetViewportHandler,
          }),
        []
      )

      return (
        <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} model={model}>
          <Column field="id">
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>ID</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestComponent />)
    await waitForReady(screen)

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    await waitForScrollable(scroller)
    scroller.scrollTop = 60 * ROW_HEIGHT

    await expect
      .poll(() => {
        return fetch.mock.calls.some((c) => c[0].offset >= PAGE_SIZE)
      })
      .toBe(true)

    const fetchCountAfterViewportFetch = fetch.mock.calls.length

    await delay(300)
    expect(fetch.mock.calls.length).toBe(fetchCountAfterViewportFetch)
  })
})
