import { useMemo } from 'react'

import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { Cell, VirtuosoDataTable } from '../../..'
import { Column } from '../../../columns/Column'
import { ColumnHeader } from '../../../columns/ColumnHeader'
import { defaultAppendViewportHandler, remoteSource } from '../../../model/remote-source'
import { delay } from '../../../tests/utils'

import type { LoadingComponentProps } from '../../../interfaces'
import type { AppendFetchParams } from '../../../model/remote-source'
import type { DataModelHandle } from '../../../model/types'

const CONTAINER_HEIGHT = 300
const CONTAINER_WIDTH = 300
const HEADER_HEIGHT = 40
const ROW_HEIGHT = 30
const COLUMN_WIDTH = 160
const readySelector = '[data-testid=virtuoso-table-root][data-ready]'
const scrollerSelector = '[data-testid=virtuoso-table-scroller]'

interface Item {
  id: number
  name: string
}

interface FilterParams {
  filter?: string
}

function LoadingOverlay({ loadingState }: LoadingComponentProps) {
  return <div data-testid="loading-overlay">{loadingState.refresh.status}</div>
}

function LoadingPlaceholder({ loadingState }: LoadingComponentProps) {
  return <div data-testid="loading-placeholder">{loadingState.initial.status}</div>
}

function LoadingFooter({ loadingState }: LoadingComponentProps) {
  return <div data-testid="loading-footer">{loadingState.end.status}</div>
}

function EmptyPlaceholder() {
  return <div data-testid="empty-placeholder">empty</div>
}

async function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
}

describe('loading slots', () => {
  test('initial loading placeholder renders before the first dataset resolves and suppresses the empty placeholder', async () => {
    const fetch = vi.fn(async (params: AppendFetchParams) => {
      await delay(80)
      return {
        rows: Array.from({ length: params.limit }, (_, index) => ({
          id: index,
          name: `item-${index}`,
        })),
        hasMore: false,
        cursor: null,
      }
    })

    function TestComponent() {
      const model = useMemo(
        () =>
          remoteSource<Item>({
            mode: 'append',
            fetch,
            initialParams: {},
            pageSize: 20,
          }),
        []
      )

      return (
        <VirtuosoDataTable
          style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}
          model={model}
          EmptyPlaceholder={EmptyPlaceholder}
          components={{ LoadingPlaceholder }}
        >
          <Column field="name">
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestComponent />)

    await expect.poll(() => screen.container.querySelector('[data-testid=loading-placeholder]')?.textContent ?? null).toBe('loading')
    expect(screen.container.querySelector('[data-testid=empty-placeholder]')).toBeNull()

    await waitForReady(screen)
    await expect.poll(() => screen.container.querySelector('[data-testid=loading-placeholder]')).toBeNull()
  })

  test('refresh overlay appears during action-driven re-fetch and clears on success', async () => {
    let modelHandle: DataModelHandle<Item>
    const fetch = vi.fn(async (params: AppendFetchParams) => {
      await delay(25)
      const filterParams = params.params as FilterParams
      const base = Array.from({ length: 20 }, (_, index) => ({
        id: index,
        name: filterParams.filter ? `${filterParams.filter}-${index}` : `item-${index}`,
      }))
      return {
        rows: base.slice((params.cursor as number | undefined) ?? 0, ((params.cursor as number | undefined) ?? 0) + params.limit),
        hasMore: false,
        cursor: null,
      }
    })

    function TestComponent() {
      const model = useMemo(() => {
        const nextModel = remoteSource<Item>({
          mode: 'append',
          fetch,
          initialParams: {},
          pageSize: 20,
          actions: {
            filter: {
              handler: ({ payload, params }) => ({ ...params, filter: payload as string }),
            },
          },
        })
        modelHandle = nextModel
        return nextModel
      }, [])

      return (
        <VirtuosoDataTable
          style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}
          model={model}
          components={{ LoadingOverlay, LoadingFooter }}
        >
          <Column field="name">
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestComponent />)
    await waitForReady(screen)

    await expect.poll(() => fetch.mock.calls.length).toBe(1)
    await expect.poll(() => screen.container.textContent?.includes('item-0') ?? false).toBe(true)

    modelHandle!.send({ action: 'filter', payload: 'books', viewId: 'default' })

    await expect.poll(() => screen.container.querySelector('[data-testid=loading-overlay]')?.textContent ?? null).toBe('loading')
    expect(screen.container.textContent).toContain('item-0')

    await expect.poll(() => screen.container.querySelector('[data-testid=loading-overlay]')).toBeNull()
    await expect.poll(() => screen.container.textContent?.includes('books-0') ?? false).toBe(true)
  })

  test('measured loading footer appears for append fetches and exposes error state', async () => {
    const fetch = vi.fn(async (params: AppendFetchParams) => {
      await delay(80)
      const startIndex = (params.cursor as number | undefined) ?? 0
      if (startIndex >= 20) {
        throw new Error('load more failed')
      }

      const rows = Array.from({ length: params.limit }, (_, index) => ({
        id: startIndex + index,
        name: `item-${startIndex + index}`,
      }))

      return {
        rows,
        hasMore: true,
        cursor: startIndex + rows.length,
      }
    })

    function TestComponent() {
      const model = useMemo(
        () =>
          remoteSource<Item>({
            mode: 'append',
            fetch,
            initialParams: {},
            pageSize: 20,
            onViewportChange: defaultAppendViewportHandler,
          }),
        []
      )

      return (
        <VirtuosoDataTable
          style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}
          model={model}
          components={{ LoadingPlaceholder, LoadingOverlay, LoadingFooter }}
        >
          <Column field="name">
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestComponent />)
    await waitForReady(screen)

    await expect.poll(() => fetch.mock.calls.length).toBe(1)

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    scroller.scrollTop = 15 * ROW_HEIGHT

    await expect.poll(() => screen.container.querySelector('[data-testid=loading-footer]')?.textContent ?? null).toBe('loading')

    await expect.poll(() => fetch.mock.calls.length).toBe(2)

    await expect.poll(() => screen.container.querySelector('[data-testid=loading-footer]')?.textContent ?? null).toBe('error')

    await delay(150)
    expect(fetch.mock.calls.length).toBe(2)
  })
})
