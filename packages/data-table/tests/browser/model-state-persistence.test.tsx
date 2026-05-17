import { useMemo, useState } from 'react'

import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'

import { Cell, Column, ColumnHeader, GroupHeaderCell, remoteModel, VirtuosoDataTable } from '../../src'
import { DataTableStatePersistence, modelStatePersistenceAdapter } from '../../src/features/state-persistence'
import { localModel } from '../../src/model/local-model'

import type { DataTableStatePersistenceStorage } from '../../src/features/state-persistence'
import type { PipelineHandler } from '../../src/model/local-model'

interface Item {
  id: number
  name: string
  value: number
}

const ITEMS: Item[] = [
  { id: 1, name: 'Beta', value: 2 },
  { id: 2, name: 'Alpha', value: 1 },
  { id: 3, name: 'Gamma', value: 3 },
]

interface GroupItem {
  groupLabel: string
}

type RemoteItem = Item | GroupItem

const MODEL_PERSISTENCE_ADAPTERS = [modelStatePersistenceAdapter()]

const sortHandler: PipelineHandler<Item> = ({ data, payload }) => {
  const field = payload as keyof Item | undefined
  if (!field) {
    return data
  }
  return data.toSorted((a, b) => (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0))
}

function groupedItems(): { groups: { index: number; level: number }[]; rows: RemoteItem[] } {
  return {
    groups: [{ index: 0, level: 0 }],
    rows: [{ groupLabel: 'status: open (3)' }, ...ITEMS],
  }
}

class MemoryStorage implements DataTableStatePersistenceStorage {
  readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

const readySelector = '[data-testid=virtuoso-table-root][data-ready]'
const rowSelector = '[data-testid=virtuoso-table-row]'

async function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
}

function firstRowText(screen: Awaited<ReturnType<typeof render>>) {
  return screen.container.querySelector(rowSelector)?.textContent ?? ''
}

test('model state persistence restores and resets local model output without user-owned query state', async () => {
  const storage = new MemoryStorage()
  storage.setItem(
    'table:model-state',
    JSON.stringify({
      version: 1,
      features: {
        model: {
          version: 1,
          actions: {
            sort: 'name',
          },
        },
      },
    })
  )

  function TestTable() {
    const [resetKey, setResetKey] = useState(0)
    const model = useMemo(
      () =>
        localModel<Item>({
          data: ITEMS,
          pipeline: ['sort'],
          actions: {
            sort: { stage: 'sort', handler: sortHandler, persistence: true },
          },
        }),
      []
    )

    return (
      <div>
        <button type="button" onClick={() => setResetKey((key) => key + 1)}>
          Reset
        </button>
        <VirtuosoDataTable style={{ height: 220, width: 320 }} model={model}>
          <DataTableStatePersistence
            adapters={MODEL_PERSISTENCE_ADAPTERS}
            debounceMs={0}
            resetKey={resetKey}
            storage={storage}
            storageKey="table:model-state"
          />
          <Column field="id">
            <ColumnHeader>{() => <div style={{ height: 40, width: 80 }}>ID</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: 32 }}>{String(cellValue)}</div>}</Cell>
          </Column>
          <Column field="name">
            <ColumnHeader>{() => <div style={{ height: 40, width: 160 }}>Name</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ height: 32 }}>{String(cellValue)}</div>}</Cell>
          </Column>
        </VirtuosoDataTable>
      </div>
    )
  }

  const screen = await render(<TestTable />)
  await waitForReady(screen)

  await expect.poll(() => firstRowText(screen)).toContain('Alpha')

  await userEvent.click(screen.getByText('Reset'))

  await expect.poll(() => firstRowText(screen)).toContain('Beta')
  expect(storage.getItem('table:model-state')).toBeNull()
})

test('remote model state persistence can render restored group rows', async () => {
  const storage = new MemoryStorage()
  storage.setItem(
    'table:remote-groups',
    JSON.stringify({
      version: 1,
      features: {
        model: {
          version: 1,
          actions: {
            group: 'status',
          },
        },
      },
    })
  )

  function TestTable() {
    const model = useMemo(
      () =>
        remoteModel<RemoteItem>({
          initialParams: {},
          fetch: ({ params }) => {
            if (params.groupBy) {
              const result = groupedItems()
              return Promise.resolve({
                rows: result.rows,
                groups: result.groups,
                totalCount: result.rows.length,
              })
            }

            return Promise.resolve({
              rows: ITEMS,
              totalCount: ITEMS.length,
            })
          },
          actions: {
            group: {
              handler: ({ payload, params }) => ({ ...params, groupBy: payload as string }),
              persistence: true,
            },
          },
        }),
      []
    )

    return (
      <VirtuosoDataTable style={{ height: 220, width: 320 }} model={model}>
        <DataTableStatePersistence
          adapters={MODEL_PERSISTENCE_ADAPTERS}
          debounceMs={0}
          storage={storage}
          storageKey="table:remote-groups"
        />
        <GroupHeaderCell>{({ row }) => <div style={{ height: 32 }}>{(row.data as GroupItem).groupLabel}</div>}</GroupHeaderCell>
        <Column field="id">
          <ColumnHeader>{() => <div style={{ height: 40, width: 80 }}>ID</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: 32 }}>{String(cellValue)}</div>}</Cell>
        </Column>
        <Column field="name">
          <ColumnHeader>{() => <div style={{ height: 40, width: 160 }}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ height: 32 }}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    )
  }

  const screen = await render(<TestTable />)
  await waitForReady(screen)

  await expect.poll(() => screen.container.textContent).toContain('status: open (3)')
})
