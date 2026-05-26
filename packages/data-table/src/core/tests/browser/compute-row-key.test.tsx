import { expect, test, describe, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { Cell } from '../../..'
import { Column } from '../../../columns/Column'
import { ColumnHeader } from '../../../columns/ColumnHeader'
import { LocalDataTable as VirtuosoDataTable } from '../../../tests/LocalDataTable'

const HEADER_HEIGHT = 40
const ROW_HEIGHT = 30
const CONTAINER_HEIGHT = 300
const CONTAINER_WIDTH = 300
const COLUMN_WIDTH = 150
const ITEM_COUNT = 100

interface Item {
  id: number
  name: string
}

const ITEMS: Item[] = Array.from({ length: ITEM_COUNT }, (_, i) => ({
  id: i,
  name: `User ${i + 1}`,
}))

const readySelector = '[data-testid=virtuoso-table-root][data-ready]'

async function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
}

function visibleIndexRange() {
  const expectedVisibleRows = Math.ceil((CONTAINER_HEIGHT - HEADER_HEIGHT) / ROW_HEIGHT)
  return Array.from({ length: expectedVisibleRows }, (_, index) => index)
}

describe('computeRowKey', () => {
  test('computeRowKey is called with correct params (data, index, context)', async () => {
    const computeRowKey = vi.fn(({ index }: { data: unknown; index: number; context: string }) => `item-${index}`)
    const testContext = 'test-context-value'

    const screen = await render(
      <VirtuosoDataTable<Item, string>
        style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}
        source={ITEMS}
        context={testContext}
        computeRowKey={computeRowKey}
      >
        <Column field="name">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const expectedIndices = visibleIndexRange()

    await expect
      .poll(() => [...new Set(computeRowKey.mock.calls.map((call) => call[0].index))].toSorted((a, b) => a - b))
      .toEqual(expectedIndices)

    for (let i = 0; i < expectedIndices.length; i++) {
      const callForIndex = computeRowKey.mock.calls.find((call) => call[0].index === i)
      expect(callForIndex).toBeDefined()

      const [params] = callForIndex!
      expect(params.data).toEqual(ITEMS[i])
      expect(params.index).toBe(i)
      expect(params.context).toBe(testContext)
    }
  })

  test('computeRowKey is called for each visible row', async () => {
    const computeRowKey = vi.fn(({ index }: { data: unknown; index: number; context: undefined }) => `item-${index}`)

    const screen = await render(
      <VirtuosoDataTable<Item, undefined>
        style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}
        source={ITEMS}
        computeRowKey={computeRowKey}
      >
        <Column field="name">
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    await waitForReady(screen)

    const expectedIndices = visibleIndexRange()
    const actualIndices = [...new Set(computeRowKey.mock.calls.map((call) => call[0].index))].toSorted((a, b) => a - b)
    expect(actualIndices).toEqual(expectedIndices)
  })
})
