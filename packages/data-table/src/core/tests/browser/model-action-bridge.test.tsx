import { useState } from 'react'

import { describe, expect, test, vi, afterEach } from 'vitest'
import { render } from 'vitest-browser-react'

import {
  Cell,
  Column,
  ColumnHeader,
  dispatchModelAction$,
  GroupHeaderCell,
  localModel,
  modelActionState$,
  useEngineRef,
  useRemoteCellValue,
  useRemotePublisher,
  VirtuosoDataTable,
} from '../../..'

import type { EngineRef } from '../../..'
import type { PipelineHandler, SourceMutator } from '../../../model/local-model'

const HEADER_HEIGHT = 40
const ROW_HEIGHT = 30
const CONTAINER_HEIGHT = 320
const CONTAINER_WIDTH = 360
const COLUMN_WIDTH = 160

interface Product {
  id: number
  name: string
  status: 'open' | 'done'
}

interface GroupRow {
  label: string
}

type GroupBy = 'none' | 'status'

const PRODUCTS: Product[] = [
  { id: 1, name: 'Desk', status: 'open' },
  { id: 2, name: 'Lamp', status: 'done' },
  { id: 3, name: 'Chair', status: 'open' },
]

const readySelector = '[data-testid=virtuoso-table-root][data-ready]'

function isProduct(row: Product | GroupRow): row is Product {
  return 'id' in row
}

function groupProducts(rows: Product[], groupBy: GroupBy) {
  if (groupBy === 'none') {
    return rows
  }

  const buckets = new Map<string, Product[]>()
  for (const row of rows) {
    const bucket = buckets.get(row.status)
    if (bucket) {
      bucket.push(row)
    } else {
      buckets.set(row.status, [row])
    }
  }

  const data: (Product | GroupRow)[] = []
  const groups: { index: number; level: number }[] = []
  for (const [status, items] of buckets) {
    groups.push({ index: data.length, level: 0 })
    data.push({ label: `${status} (${items.length})` })
    data.push(...items)
  }

  return { data, groups }
}

const appendProduct: SourceMutator<Product> = ({ source, payload }) => [...source, payload as Product]

const groupHandler: PipelineHandler<Product, GroupRow> = ({ data, payload }) => groupProducts(data.filter(isProduct), payload as GroupBy)

function GroupControls({ engineRef }: { engineRef: EngineRef }) {
  const dispatch = useRemotePublisher(dispatchModelAction$, engineRef)
  const actionState = useRemoteCellValue(modelActionState$, engineRef)
  const groupBy = (actionState?.group?.payload ?? 'none') as GroupBy

  return (
    <div>
      <button aria-pressed={groupBy === 'none'} data-testid="group-none" onClick={() => dispatch({ action: 'group', payload: 'none' })}>
        No groups
      </button>
      <button
        aria-pressed={groupBy === 'status'}
        data-testid="group-status"
        onClick={() => dispatch({ action: 'group', payload: 'status' })}
      >
        Group by status
      </button>
      <button data-testid="reserved" onClick={() => dispatch({ action: 'handshake' })}>
        Reserved
      </button>
      <button data-testid="append" onClick={() => dispatch({ action: 'append', payload: { id: 4, name: 'Mouse', status: 'done' } })}>
        Add
      </button>
      <output data-testid="append-tracked">{String(Boolean(actionState?.append))}</output>
    </div>
  )
}

function TestTable() {
  const engineRef = useEngineRef()
  const [model] = useState(() =>
    localModel<Product, GroupRow>({
      data: PRODUCTS,
      pipeline: ['group'],
      actions: {
        append: {
          handler: appendProduct,
        },
        group: {
          stage: 'group',
          handler: groupHandler,
        },
      },
    })
  )

  return (
    <>
      <GroupControls engineRef={engineRef} />
      <VirtuosoDataTable
        computeRowKey={({ data }) => ('id' in data ? data.id : data.label)}
        engineRef={engineRef}
        model={model}
        style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}
      >
        <GroupHeaderCell>{({ row }) => <div style={{ height: ROW_HEIGHT }}>{(row.data as GroupRow).label}</div>}</GroupHeaderCell>
        <Column field="name">
          <ColumnHeader>{() => <div style={{ height: HEADER_HEIGHT, width: COLUMN_WIDTH }}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue ?? '')}</div>}</Cell>
        </Column>
        <Column field="status">
          <ColumnHeader>{() => <div style={{ height: HEADER_HEIGHT, width: COLUMN_WIDTH }}>Status</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue ?? '')}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    </>
  )
}

async function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('model action bridge browser integration', () => {
  test('external toolbar dispatches a group action and derives highlight from action state', async () => {
    const screen = await render(<TestTable />)
    await waitForReady(screen)

    const groupStatus = screen.container.querySelector('[data-testid="group-status"]') as HTMLButtonElement
    const groupNone = screen.container.querySelector('[data-testid="group-none"]') as HTMLButtonElement
    expect(groupStatus.getAttribute('aria-pressed')).toBe('false')

    groupStatus.click()

    await expect.poll(() => screen.container.textContent?.includes('open (2)')).toBe(true)
    await expect.poll(() => groupStatus.getAttribute('aria-pressed')).toBe('true')

    groupNone.click()

    await expect.poll(() => screen.container.querySelectorAll('[data-group-row]').length).toBe(0)
    await expect.poll(() => screen.container.textContent?.includes('open (2)')).toBe(false)
    await expect.poll(() => groupNone.getAttribute('aria-pressed')).toBe('true')
  })

  test('reserved actions are blocked while command-like actions still dispatch without state highlights', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const screen = await render(<TestTable />)
    await waitForReady(screen)

    const reserved = screen.container.querySelector('[data-testid="reserved"]') as HTMLButtonElement
    const append = screen.container.querySelector('[data-testid="append"]') as HTMLButtonElement
    const appendTracked = screen.container.querySelector('[data-testid="append-tracked"]') as HTMLOutputElement

    reserved.click()
    expect(appendTracked.textContent).toBe('false')

    append.click()

    await expect.poll(() => screen.container.textContent?.includes('Mouse')).toBe(true)
    expect(appendTracked.textContent).toBe('false')
  })
})
