import { useMemo } from 'react'

import { expect, test, describe } from 'vitest'
import { render } from 'vitest-browser-react'

import { Cell, VirtuosoDataTable } from '../../..'
import { Column } from '../../../columns/Column'
import { ColumnHeader } from '../../../columns/ColumnHeader'
import { localSource } from '../../../model/local-source'

import type { PipelineHandler } from '../../../model/local-source'
import type { DataModelHandle } from '../../../model/types'

const HEADER_HEIGHT = 40
const ROW_HEIGHT = 30
const CONTAINER_HEIGHT = 300
const CONTAINER_WIDTH = 300
const COLUMN_WIDTH = 150
const ITEM_COUNT = 100

interface Item {
  id: number
  name: string
  value: number
}

const ITEMS: Item[] = Array.from({ length: ITEM_COUNT }, (_, i) => ({
  id: i,
  name: `Item ${i}`,
  value: ITEM_COUNT - i,
}))

const sortHandler: PipelineHandler<Item> = ({ data, payload }) => {
  const field = payload as keyof Item
  if (!field) {
    return data
  }
  return data.toSorted((a, b) => (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0))
}

const readySelector = '[data-testid=virtuoso-table-root][data-ready]'
const rowSelector = '[data-testid=virtuoso-table-row]'

async function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
}

const EXPECTED_VISIBLE_ROWS = Math.ceil((CONTAINER_HEIGHT - HEADER_HEIGHT) / ROW_HEIGHT)

describe('model-driven data change', () => {
  test('renders correct number of rows after sort change', async () => {
    let modelHandle: DataModelHandle<Item>

    function TestComponent() {
      const model = useMemo(() => {
        const m = localSource<Item>({
          data: ITEMS,
          pipeline: ['sort'],
          actions: {
            sort: { stage: 'sort', handler: sortHandler },
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
          <Column field="name">
            <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Name</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestComponent />)
    await waitForReady(screen)

    expect(screen.container.querySelectorAll(rowSelector).length).toBe(EXPECTED_VISIBLE_ROWS)

    modelHandle!.send({ action: 'sort', payload: 'value' })

    await expect.poll(() => screen.container.querySelectorAll(rowSelector).length).toBe(EXPECTED_VISIBLE_ROWS)
  })
})
