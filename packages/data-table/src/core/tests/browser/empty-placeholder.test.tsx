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

const EMPTY_DATA: { name: string }[] = []

const rowSelector = '[data-testid=virtuoso-table-row]'
const readySelector = '[data-testid=virtuoso-table-root][data-ready]'

async function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
}

async function waitForPlaceholder(screen: Awaited<ReturnType<typeof render>>, placeholderSelector: string) {
  await expect.poll(() => screen.container.querySelector(placeholderSelector)).not.toBeNull()
}

describe('EmptyPlaceholder', () => {
  test('renders EmptyPlaceholder when data is empty array', async () => {
    const placeholderTestId = 'empty-placeholder'

    function EmptyPlaceholder() {
      return <div data-testid={placeholderTestId}>No data available</div>
    }

    const screen = await render(
      <VirtuosoDataTable
        style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}
        data={{ data: EMPTY_DATA, groups: [] }}
        EmptyPlaceholder={EmptyPlaceholder}
      >
        <Column field="name">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForPlaceholder(screen, `[data-testid="${placeholderTestId}"]`)

    const placeholder = screen.container.querySelector(`[data-testid="${placeholderTestId}"]`)
    expect(placeholder).not.toBeNull()
    expect(placeholder?.textContent).toBe('No data available')

    const rows = screen.container.querySelectorAll(rowSelector)
    expect(rows.length).toBe(0)
  })

  test('EmptyPlaceholder receives context prop', async () => {
    const placeholderTestId = 'empty-placeholder-with-context'
    const testContext = { message: 'Custom empty message', count: 42 }

    function EmptyPlaceholder({ context }: { context: typeof testContext }) {
      return (
        <div data-testid={placeholderTestId}>
          <span data-testid="context-message">{context.message}</span>
          <span data-testid="context-count">{context.count}</span>
        </div>
      )
    }

    const screen = await render(
      <VirtuosoDataTable
        style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}
        data={{ data: EMPTY_DATA, groups: [] }}
        context={testContext}
        EmptyPlaceholder={EmptyPlaceholder}
      >
        <Column field="name">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForPlaceholder(screen, `[data-testid="${placeholderTestId}"]`)

    const placeholder = screen.container.querySelector(`[data-testid="${placeholderTestId}"]`)
    expect(placeholder).not.toBeNull()

    const messageElement = screen.container.querySelector('[data-testid="context-message"]')
    const countElement = screen.container.querySelector('[data-testid="context-count"]')

    expect(messageElement?.textContent).toBe('Custom empty message')
    expect(countElement?.textContent).toBe('42')

    const rows = screen.container.querySelectorAll(rowSelector)
    expect(rows.length).toBe(0)
  })

  test('does not render EmptyPlaceholder when data has items', async () => {
    const placeholderTestId = 'empty-placeholder'
    const ITEM_COUNT = 5

    const items = Array.from({ length: ITEM_COUNT }, (_, i) => ({
      id: i,
      name: `User ${i + 1}`,
    }))

    function EmptyPlaceholder() {
      return <div data-testid={placeholderTestId}>No data available</div>
    }

    const screen = await render(
      <VirtuosoDataTable
        style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}
        data={{ data: items, groups: [] }}
        EmptyPlaceholder={EmptyPlaceholder}
      >
        <Column field="name">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const placeholder = screen.container.querySelector(`[data-testid="${placeholderTestId}"]`)
    expect(placeholder).toBeNull()

    const rows = screen.container.querySelectorAll(rowSelector)
    expect(rows.length).toBe(ITEM_COUNT)
  })
})
