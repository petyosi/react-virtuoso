import { useState } from 'react'

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
const ITEM_COUNT = 100

const ITEMS = Array.from({ length: ITEM_COUNT }, (_, i) => ({
  id: i,
  name: `User ${i + 1}`,
}))

const readySelector = '[data-testid=virtuoso-table-root][data-ready]'

async function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
}

async function waitForPlaceholder(screen: Awaited<ReturnType<typeof render>>, placeholderSelector: string) {
  await expect.poll(() => screen.container.querySelector(placeholderSelector)).not.toBeNull()
}

function visibleIndexRange() {
  const expectedVisibleRows = Math.ceil((CONTAINER_HEIGHT - HEADER_HEIGHT) / ROW_HEIGHT)
  return Array.from({ length: expectedVisibleRows }, (_, index) => index)
}

const EMPTY_DATA: typeof ITEMS = []

interface EmptyPlaceholderContext {
  message: string
}

function EmptyPlaceholder({ context }: { context: EmptyPlaceholderContext }) {
  return <div data-testid="empty-placeholder">{context.message}</div>
}

describe('context prop', () => {
  test('context is passed to EmptyPlaceholder on initial render', async () => {
    const screen = await render(
      <VirtuosoDataTable<(typeof ITEMS)[0], EmptyPlaceholderContext>
        style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}
        data={{ data: EMPTY_DATA, groups: [] }}
        context={{ message: 'No data available' }}
        EmptyPlaceholder={EmptyPlaceholder}
      >
        <Column field="name">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForPlaceholder(screen, '[data-testid="empty-placeholder"]')

    const placeholder = screen.container.querySelector('[data-testid="empty-placeholder"]')
    expect(placeholder).not.toBeNull()
    expect(placeholder?.textContent).toBe('No data available')
  })

  test('context is passed to computeRowKey on initial render', async () => {
    interface TestContext {
      keyPrefix: string
    }

    const capturedCalls: { contextValue: string; index: number }[] = []

    const screen = await render(
      <VirtuosoDataTable<(typeof ITEMS)[0], TestContext>
        style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}
        data={{ data: ITEMS, groups: [] }}
        context={{ keyPrefix: 'test-prefix' }}
        computeRowKey={({ data, context, index }) => {
          capturedCalls.push({ contextValue: context.keyPrefix, index })
          return `${context.keyPrefix}-${(data as (typeof ITEMS)[0]).id}`
        }}
      >
        <Column field="name">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const expectedIndices = visibleIndexRange()
    await expect.poll(() => [...new Set(capturedCalls.map((call) => call.index))].toSorted((a, b) => a - b)).toEqual(expectedIndices)

    const contextValues = [...new Set(capturedCalls.map((call) => call.contextValue))]
    expect(contextValues).toEqual(['test-prefix'])
  })

  test('context updates propagate to EmptyPlaceholder', async () => {
    function TestComponent() {
      const [context, setContext] = useState<EmptyPlaceholderContext>({ message: 'Initial message' })

      return (
        <>
          <button data-testid="update-context" onClick={() => setContext({ message: 'Updated message' })}>
            Update
          </button>
          <VirtuosoDataTable<(typeof ITEMS)[0], EmptyPlaceholderContext>
            style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}
            data={{ data: EMPTY_DATA, groups: [] }}
            context={context}
            EmptyPlaceholder={EmptyPlaceholder}
          >
            <Column field="name">
              <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
              <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
            </Column>
          </VirtuosoDataTable>
        </>
      )
    }

    const screen = await render(<TestComponent />)

    await waitForPlaceholder(screen, '[data-testid="empty-placeholder"]')

    const placeholder = () => screen.container.querySelector('[data-testid="empty-placeholder"]')
    expect(placeholder()?.textContent).toBe('Initial message')

    const button = screen.container.querySelector('[data-testid="update-context"]') as HTMLButtonElement
    button.click()

    await expect.poll(() => placeholder()?.textContent).toBe('Updated message')
  })

  test('context updates propagate to computeRowKey when data changes', async () => {
    interface TestContext {
      keyPrefix: string
    }

    const capturedContextValues: string[] = []

    function TestComponent() {
      const [localContext, setLocalContext] = useState<TestContext>({ keyPrefix: 'prefix-v1' })
      const [localData, setLocalData] = useState(ITEMS)

      return (
        <>
          <button
            data-testid="update-context"
            onClick={() => {
              setLocalContext({ keyPrefix: 'prefix-v2' })
              setLocalData([...ITEMS])
            }}
          >
            Update
          </button>
          <VirtuosoDataTable<(typeof ITEMS)[0], TestContext>
            style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}
            data={{ data: localData, groups: [] }}
            context={localContext}
            computeRowKey={({ data, context }) => {
              capturedContextValues.push(context.keyPrefix)
              return `${context.keyPrefix}-${(data as (typeof ITEMS)[0]).id}`
            }}
          >
            <Column field="name">
              <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
              <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
            </Column>
          </VirtuosoDataTable>
        </>
      )
    }

    const screen = await render(<TestComponent />)

    await waitForReady(screen)

    const initialValues = [...capturedContextValues]
    expect(initialValues.every((v) => v === 'prefix-v1')).toBe(true)

    const button = screen.container.querySelector('[data-testid="update-context"]') as HTMLButtonElement
    button.click()

    await expect.poll(() => capturedContextValues.some((v) => v === 'prefix-v2')).toBe(true)
  })

  test('component accepts context prop without error', async () => {
    interface TestContext {
      theme: string
      locale: string
    }

    const screen = await render(
      <VirtuosoDataTable<(typeof ITEMS)[0], TestContext>
        style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}
        data={{ data: ITEMS, groups: [] }}
        context={{ theme: 'dark', locale: 'en-US' }}
      >
        <Column field="name">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const visibleRows = Math.ceil((CONTAINER_HEIGHT - HEADER_HEIGHT) / ROW_HEIGHT)
    const rows = screen.container.querySelectorAll('[data-testid=virtuoso-table-row]')
    expect(rows.length).toBe(visibleRows)
  })
})
