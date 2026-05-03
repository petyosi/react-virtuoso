import { useEffect, useMemo, useState } from 'react'

import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'

import { ReorderDropZone } from '../../../../apps/virtuoso.dev/registry/new-york/data-table/column-reorder/reorder-drop-zone'
import { ReorderGrip } from '../../../../apps/virtuoso.dev/registry/new-york/data-table/column-reorder/reorder-grip'
import { ResizeHandle } from '../../../../apps/virtuoso.dev/registry/new-york/data-table/column-resize/resize-handle'
import {
  Cell,
  Column,
  ColumnHeader,
  columns$,
  HeaderEdge,
  HeaderOverlay,
  HeaderStart,
  useCellValue,
  useEngineRef,
  usePublisher,
  useRemoteCellValue,
  useRemotePublisher,
  VirtuosoDataTable,
} from '../../src'
import { columnOrderPersistenceAdapter, reorderColumns$ } from '../../src/features/column-reorder'
import { columnWidthPersistenceAdapter } from '../../src/features/column-resize'
import { columnVisibilityPersistenceAdapter, columnVisibilityState$, setColumnVisibility$ } from '../../src/features/column-visibility'
import { DataTableStatePersistence } from '../../src/features/state-persistence'

import type { ColumnInfo } from '../../src'
import type { DataTableStatePersistenceStorage } from '../../src/features/state-persistence'

const HEADER_HEIGHT = 40
const ROW_HEIGHT = 32
const COLUMN_WIDTH = 160
const PERSISTENCE_ADAPTERS = [columnWidthPersistenceAdapter()]
const COMBINED_PERSISTENCE_ADAPTERS = [columnOrderPersistenceAdapter(), columnWidthPersistenceAdapter()]
const FULL_PERSISTENCE_ADAPTERS = [columnVisibilityPersistenceAdapter(), columnOrderPersistenceAdapter(), columnWidthPersistenceAdapter()]
const VISIBILITY_PERSISTENCE_ADAPTERS = [columnVisibilityPersistenceAdapter()]

const ITEMS = Array.from({ length: 20 }, (_, index) => ({
  name: `Product ${index + 1}`,
  status: index % 2 === 0 ? 'Active' : 'Paused',
  region: ['US', 'EU', 'APAC'][index % 3]!,
}))

function findColumnKey(columns: Map<string, ColumnInfo> | undefined, field: string) {
  return columns ? [...columns].find(([, info]) => info.field === field)?.[0] : undefined
}

function readSavedColumnOrder(storage: Map<string, string>, key: string) {
  const parsed = JSON.parse(storage.get(key)!) as {
    features?: {
      columnOrder?: {
        fields?: string[]
      }
    }
  }

  return parsed.features?.columnOrder?.fields?.join(',') ?? ''
}

function readSavedColumnVisibility(storage: Map<string, string>, key: string) {
  const parsed = JSON.parse(storage.get(key)!) as {
    features?: {
      columnVisibility?: {
        visibility?: Record<string, boolean>
      }
    }
  }

  return parsed.features?.columnVisibility?.visibility ?? {}
}

function TestTable() {
  return (
    <VirtuosoDataTable style={{ height: 320, width: 520 }} data={{ data: ITEMS, groups: [] }}>
      {(['name', 'status', 'region'] as const).map((field) => (
        <Column key={field} field={field}>
          <ColumnHeader className="flex h-10 items-center px-3 text-sm font-medium whitespace-nowrap">
            <HeaderEdge component={ResizeHandle} />
            {({ column }) => (
              <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT, display: 'flex', alignItems: 'center' }}>{column.field}</div>
            )}
          </ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      ))}
    </VirtuosoDataTable>
  )
}

function PersistentTestTable({ storage }: { storage: DataTableStatePersistenceStorage }) {
  return (
    <VirtuosoDataTable style={{ height: 320, width: 520 }} data={{ data: ITEMS, groups: [] }}>
      <DataTableStatePersistence adapters={PERSISTENCE_ADAPTERS} debounceMs={0} storage={storage} storageKey="test-widths" />
      {(['name', 'status', 'region'] as const).map((field) => (
        <Column key={field} field={field}>
          <ColumnHeader className="flex h-10 items-center px-3 text-sm font-medium whitespace-nowrap">
            <HeaderEdge component={ResizeHandle} />
            {({ column }) => (
              <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT, display: 'flex', alignItems: 'center' }}>{column.field}</div>
            )}
          </ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      ))}
    </VirtuosoDataTable>
  )
}

function CombinedPersistentTestTable({ storage }: { storage: DataTableStatePersistenceStorage }) {
  return (
    <VirtuosoDataTable style={{ height: 320, width: 520 }} data={{ data: ITEMS, groups: [] }}>
      <DataTableStatePersistence adapters={COMBINED_PERSISTENCE_ADAPTERS} debounceMs={0} storage={storage} storageKey="test-state" />
      {(['name', 'status', 'region'] as const).map((field) => (
        <Column key={field} field={field}>
          <ColumnHeader className="flex h-10 items-center px-3 text-sm font-medium whitespace-nowrap">
            <HeaderEdge component={ResizeHandle} />
            {({ column }) => (
              <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT, display: 'flex', alignItems: 'center' }}>{column.field}</div>
            )}
          </ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      ))}
    </VirtuosoDataTable>
  )
}

function HiddenColumnTestTable() {
  return (
    <VirtuosoDataTable style={{ height: 320, width: 520 }} data={{ data: ITEMS, groups: [] }}>
      <Column field="name">
        <ColumnHeader className="flex h-10 items-center px-3 text-sm font-medium whitespace-nowrap">
          {({ column }) => (
            <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT, display: 'flex', alignItems: 'center' }}>{column.field}</div>
          )}
        </ColumnHeader>
        <Cell>{({ cellValue }) => <div style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
      </Column>
      <Column field="status" visible={false}>
        <ColumnHeader className="flex h-10 items-center px-3 text-sm font-medium whitespace-nowrap">
          {({ column }) => (
            <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT, display: 'flex', alignItems: 'center' }}>{column.field}</div>
          )}
        </ColumnHeader>
        <Cell>{({ cellValue }) => <div style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
      </Column>
      <Column field="region">
        <ColumnHeader className="flex h-10 items-center px-3 text-sm font-medium whitespace-nowrap">
          {({ column }) => (
            <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT, display: 'flex', alignItems: 'center' }}>{column.field}</div>
          )}
        </ColumnHeader>
        <Cell>{({ cellValue }) => <div style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
      </Column>
    </VirtuosoDataTable>
  )
}

function VisibilityPicker() {
  const columns = useCellValue(columns$)
  const visibility = useCellValue(columnVisibilityState$)
  const setColumnVisibility = usePublisher(setColumnVisibility$)

  return (
    <div>
      {[...columns].map(([key, column]) => {
        const visible = visibility.get(key) ?? column.visible !== false
        return (
          <button
            key={key}
            data-testid={`toggle-${column.field}`}
            type="button"
            onClick={() => setColumnVisibility({ key, visible: !visible })}
          >
            {column.field}:{visible ? 'visible' : 'hidden'}
          </button>
        )
      })}
    </div>
  )
}

function FullPersistentTestTable({ storage }: { storage: DataTableStatePersistenceStorage }) {
  const [resetKey, setResetKey] = useState(0)

  return (
    <div>
      <button data-testid="reset-state" type="button" onClick={() => setResetKey((key) => key + 1)}>
        reset
      </button>
      <VirtuosoDataTable style={{ height: 320, width: 520 }} data={{ data: ITEMS, groups: [] }}>
        <DataTableStatePersistence
          adapters={FULL_PERSISTENCE_ADAPTERS}
          debounceMs={0}
          resetKey={resetKey}
          storage={storage}
          storageKey="test-full-state"
        />
        <VisibilityPicker />
        {(['name', 'status', 'region'] as const).map((field) => (
          <Column key={field} field={field}>
            <ColumnHeader className="flex h-10 items-center px-3 text-sm font-medium whitespace-nowrap">
              <HeaderStart component={ReorderGrip} />
              <HeaderOverlay component={ReorderDropZone} />
              <HeaderEdge component={ResizeHandle} />
              {({ column }) => (
                <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT, display: 'flex', alignItems: 'center' }}>{column.field}</div>
              )}
            </ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        ))}
      </VirtuosoDataTable>
    </div>
  )
}

const PEOPLE_ITEMS = Array.from({ length: 12 }, (_, index) => ({
  name: `User ${index + 1}`,
  status: index % 2 === 0 ? 'Active' : 'Paused',
  city: ['Sofia', 'Berlin', 'Madrid'][index % 3]!,
}))

const ORDER_ITEMS = Array.from({ length: 12 }, (_, index) => ({
  name: `Order ${index + 1}`,
  status: index % 2 === 0 ? 'Open' : 'Paid',
  total: `$${100 + index * 10}`,
}))

function PartialSchemaVisibilityTestTable({ storage }: { storage: DataTableStatePersistenceStorage }) {
  const [dataset, setDataset] = useState<'orders' | 'people'>('people')
  const fields = dataset === 'people' ? (['name', 'status', 'city'] as const) : (['name', 'status', 'total'] as const)
  const data: Record<string, string>[] = dataset === 'people' ? PEOPLE_ITEMS : ORDER_ITEMS

  return (
    <div>
      <button data-testid="show-orders" type="button" onClick={() => setDataset('orders')}>
        orders
      </button>
      <button data-testid="show-people" type="button" onClick={() => setDataset('people')}>
        people
      </button>
      <VirtuosoDataTable style={{ height: 320, width: 520 }} data={{ data, groups: [] }}>
        <DataTableStatePersistence
          adapters={VISIBILITY_PERSISTENCE_ADAPTERS}
          debounceMs={0}
          storage={storage}
          storageKey="test-partial-visibility"
        />
        <VisibilityPicker />
        {fields.map((field) => (
          <Column key={field} field={field}>
            <ColumnHeader className="flex h-10 items-center px-3 text-sm font-medium whitespace-nowrap">
              {({ column }) => (
                <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT, display: 'flex', alignItems: 'center' }}>{column.field}</div>
              )}
            </ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        ))}
      </VirtuosoDataTable>
    </div>
  )
}

function DynamicCombinedPersistentTestTable({ storage }: { storage: DataTableStatePersistenceStorage }) {
  const engineRef = useEngineRef()
  const columns = useRemoteCellValue(columns$, engineRef)
  const reorderColumns = useRemotePublisher(reorderColumns$, engineRef)
  const [fields, setFields] = useState<('name' | 'status' | 'region')[]>([])
  const [resetKey, setResetKey] = useState(0)
  const adapters = useMemo(() => [columnOrderPersistenceAdapter(), columnWidthPersistenceAdapter()], [])

  useEffect(() => {
    setFields(['name', 'status', 'region'])
  }, [])

  const statusKey = findColumnKey(columns, 'status')
  const regionKey = findColumnKey(columns, 'region')

  return (
    <div>
      <button
        data-testid="move-status-before-region"
        type="button"
        onClick={() => {
          if (statusKey && regionKey) {
            reorderColumns({ sourceKey: statusKey, targetKey: regionKey, position: 'before' })
          }
        }}
      >
        move
      </button>
      <button data-testid="reset-state" type="button" onClick={() => setResetKey((key) => key + 1)}>
        reset
      </button>
      <VirtuosoDataTable style={{ height: 320, width: 520 }} data={{ data: ITEMS, groups: [] }} engineRef={engineRef}>
        <DataTableStatePersistence
          adapters={adapters}
          debounceMs={0}
          resetKey={resetKey}
          storage={storage}
          storageKey="test-dynamic-state"
        />
        {fields.map((field) => (
          <Column key={field} field={field}>
            <ColumnHeader className="flex h-10 items-center px-3 text-sm font-medium whitespace-nowrap">
              <HeaderEdge component={ResizeHandle} />
              {({ column }) => (
                <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT, display: 'flex', alignItems: 'center' }}>{column.field}</div>
              )}
            </ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        ))}
      </VirtuosoDataTable>
    </div>
  )
}

function InteractiveCombinedPersistentTestTable({ storage }: { storage: DataTableStatePersistenceStorage }) {
  const [resetKey, setResetKey] = useState(0)
  const adapters = useMemo(() => [columnOrderPersistenceAdapter(), columnWidthPersistenceAdapter()], [])

  return (
    <div>
      <button data-testid="reset-state" type="button" onClick={() => setResetKey((key) => key + 1)}>
        reset
      </button>
      <VirtuosoDataTable style={{ height: 320, width: 520 }} data={{ data: ITEMS, groups: [] }}>
        <DataTableStatePersistence
          adapters={adapters}
          debounceMs={0}
          resetKey={resetKey}
          storage={storage}
          storageKey="test-interactive-state"
        />
        {(['name', 'status', 'region'] as const).map((field) => (
          <Column key={field} field={field}>
            <ColumnHeader className="flex h-10 items-center px-3 text-sm font-medium whitespace-nowrap">
              <HeaderStart component={ReorderGrip} />
              <HeaderOverlay component={ReorderDropZone} />
              <HeaderEdge component={ResizeHandle} />
              {({ column }) => (
                <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT, display: 'flex', alignItems: 'center' }}>{column.field}</div>
              )}
            </ColumnHeader>
            <Cell>{({ cellValue }) => <div style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
          </Column>
        ))}
      </VirtuosoDataTable>
    </div>
  )
}

function headerOrder(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>('[data-table-element-role="column-header"]')]
    .map((header) => header.textContent?.replace('⠿', '') ?? '')
    .join(',')
}

test('resizes a column through the slot-mounted handle', async () => {
  const screen = await render(<TestTable />)
  const headers = screen.container.querySelectorAll<HTMLElement>('[data-table-element-role="column-header"]')
  const firstHeader = headers[0]
  const handle = firstHeader?.querySelector<HTMLElement>('[data-table-element-role="resize-handle"]')

  expect(firstHeader).not.toBeNull()
  expect(handle).not.toBeNull()

  const headerElements = [...headers]
  const firstHeaderRect = firstHeader!.getBoundingClientRect()
  const handleRect = handle!.getBoundingClientRect()
  expect(handleRect.left).toBeLessThan(firstHeaderRect.right)
  expect(handleRect.right).toBeGreaterThan(firstHeaderRect.right)
  await expect
    .poll(() => headerElements.reduce((sum, header) => sum + Math.round(header.getBoundingClientRect().width), 0), { timeout: 2000 })
    .toBeGreaterThan(COLUMN_WIDTH * headerElements.length)
  const initialWidths = headerElements.map((header) => Math.round(header.getBoundingClientRect().width))
  const initialTotalWidth = initialWidths.reduce((sum, width) => sum + width, 0)
  handle!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: handleRect.left + 1, pointerId: 1 }))
  await expect.poll(() => handle?.dataset.resizing).toBe('true')
  document.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: handleRect.left + 70, pointerId: 1 }))
  document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: handleRect.left + 70, pointerId: 1 }))
  await expect.poll(() => handle?.dataset.resizing).toBeUndefined()

  await expect.poll(() => Math.round(firstHeader!.getBoundingClientRect().width), { timeout: 2000 }).toBeGreaterThan(initialWidths[0]! + 20)
  await expect
    .poll(
      () =>
        headerElements
          .map((header) => Math.round(header.getBoundingClientRect().width))
          .slice(1)
          .every((width, index) => width === initialWidths[index + 1]),
      { timeout: 2000 }
    )
    .toBe(true)
  await expect
    .poll(() => headerElements.reduce((sum, header) => sum + Math.round(header.getBoundingClientRect().width), 0), { timeout: 2000 })
    .toBeGreaterThan(initialTotalWidth)
})

test('does not assign width styles to body cells while keeping them aligned after resize', async () => {
  const screen = await render(<TestTable />)
  const headers = screen.container.querySelectorAll<HTMLElement>('[data-table-element-role="column-header"]')
  const firstHeader = headers[0]
  const handle = firstHeader?.querySelector<HTMLElement>('[data-table-element-role="resize-handle"]')

  expect(firstHeader).not.toBeNull()
  expect(handle).not.toBeNull()

  const handleRect = handle!.getBoundingClientRect()
  handle!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: handleRect.left + 1, pointerId: 1 }))
  await expect.poll(() => handle?.dataset.resizing).toBe('true')
  document.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: handleRect.left - 200, pointerId: 1 }))
  document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: handleRect.left - 200, pointerId: 1 }))
  await expect.poll(() => handle?.dataset.resizing).toBeUndefined()

  await expect
    .poll(() => screen.container.querySelectorAll('[data-table-element-role="cell"]').length, { timeout: 2000 })
    .toBeGreaterThan(0)
  const firstBodyCell = screen.container.querySelector<HTMLElement>('[data-table-element-role="cell"]')

  await expect.poll(() => Math.round(firstHeader!.getBoundingClientRect().width), { timeout: 2000 }).toBe(50)
  await expect.poll(() => Math.round(firstBodyCell!.getBoundingClientRect().width), { timeout: 2000 }).toBe(50)
  expect(firstBodyCell!.hasAttribute('style')).toBeFalsy()
})

test('keeps body cells aligned when persisted widths are restored', async () => {
  const storage = new Map<string, string>([
    [
      'test-widths',
      JSON.stringify({
        version: 1,
        features: {
          columnWidths: {
            version: 1,
            widths: {
              name: 320,
            },
          },
        },
      }),
    ],
  ])

  const screen = await render(
    <PersistentTestTable
      storage={{
        getItem: (key) => storage.get(key) ?? null,
        removeItem: (key) => {
          storage.delete(key)
        },
        setItem: (key, value) => {
          storage.set(key, value)
        },
      }}
    />
  )
  const firstHeader = screen.container.querySelector<HTMLElement>('[data-table-element-role="column-header"]')

  await expect
    .poll(() => screen.container.querySelectorAll('[data-table-element-role="cell"]').length, { timeout: 2000 })
    .toBeGreaterThan(0)
  const firstBodyCell = screen.container.querySelector<HTMLElement>('[data-table-element-role="cell"]')

  expect(firstHeader).not.toBeNull()
  expect(firstBodyCell).not.toBeNull()

  await expect.poll(() => Math.round(firstHeader!.getBoundingClientRect().width), { timeout: 2000 }).toBe(320)
  await expect.poll(() => Math.round(firstBodyCell!.getBoundingClientRect().width), { timeout: 2000 }).toBe(320)
  expect(firstBodyCell!.hasAttribute('style')).toBeFalsy()
})

test('restores column order and width persistence together', async () => {
  const storage = new Map<string, string>([
    [
      'test-state',
      JSON.stringify({
        version: 1,
        features: {
          columnOrder: {
            version: 1,
            fields: ['status', 'name'],
          },
          columnWidths: {
            version: 1,
            widths: {
              status: 280,
            },
          },
        },
      }),
    ],
  ])

  const screen = await render(
    <CombinedPersistentTestTable
      storage={{
        getItem: (key) => storage.get(key) ?? null,
        removeItem: (key) => {
          storage.delete(key)
        },
        setItem: (key, value) => {
          storage.set(key, value)
        },
      }}
    />
  )

  await expect
    .poll(() => screen.container.querySelectorAll('[data-table-element-role="cell"]').length, { timeout: 2000 })
    .toBeGreaterThan(0)

  await expect
    .poll(
      () =>
        [...screen.container.querySelectorAll<HTMLElement>('[data-table-element-role="column-header"]')]
          .map((header) => header.textContent)
          .join(','),
      { timeout: 2000 }
    )
    .toBe('status,name,region')
  const headers = [...screen.container.querySelectorAll<HTMLElement>('[data-table-element-role="column-header"]')]
  const cells = [...screen.container.querySelectorAll<HTMLElement>('[data-table-element-role="cell"]')]
  expect(cells[0]!.textContent).toBe('Active')
  await expect.poll(() => Math.round(headers[0]!.getBoundingClientRect().width), { timeout: 2000 }).toBe(280)
  await expect.poll(() => Math.round(cells[0]!.getBoundingClientRect().width), { timeout: 2000 }).toBe(280)
  expect(cells[0]!.hasAttribute('style')).toBeFalsy()
})

test('does not render declaratively hidden columns', async () => {
  const screen = await render(<HiddenColumnTestTable />)

  await expect.poll(() => headerOrder(screen.container), { timeout: 2000 }).toBe('name,region')
  expect([...screen.container.querySelectorAll<HTMLElement>('[data-table-element-role="cell"]')].some((cell) => cell.textContent === 'Active')).toBeFalsy()
})

test('restores column visibility with order and width persistence', async () => {
  const storage = new Map<string, string>([
    [
      'test-full-state',
      JSON.stringify({
        version: 1,
        features: {
          columnVisibility: {
            version: 1,
            visibility: {
              status: false,
            },
          },
          columnOrder: {
            version: 1,
            fields: ['region', 'name', 'status'],
          },
          columnWidths: {
            version: 1,
            widths: {
              region: 260,
            },
          },
        },
      }),
    ],
  ])

  const screen = await render(
    <FullPersistentTestTable
      storage={{
        getItem: (key) => storage.get(key) ?? null,
        removeItem: (key) => {
          storage.delete(key)
        },
        setItem: (key, value) => {
          storage.set(key, value)
        },
      }}
    />
  )

  await expect.poll(() => headerOrder(screen.container), { timeout: 2000 }).toBe('region,name')
  const firstHeader = screen.container.querySelector<HTMLElement>('[data-table-element-role="column-header"]')
  await expect.poll(() => Math.round(firstHeader!.getBoundingClientRect().width), { timeout: 2000 }).toBe(260)

  await userEvent.click(screen.getByTestId('toggle-status'))

  await expect.poll(() => headerOrder(screen.container), { timeout: 2000 }).toBe('region,name,status')
})

test('reset state restores column visibility with order and width state', async () => {
  const storage = new Map<string, string>([
    [
      'test-full-state',
      JSON.stringify({
        version: 1,
        features: {
          columnVisibility: {
            version: 1,
            visibility: {
              status: false,
            },
          },
          columnOrder: {
            version: 1,
            fields: ['region', 'name', 'status'],
          },
          columnWidths: {
            version: 1,
            widths: {
              region: 260,
            },
          },
        },
      }),
    ],
  ])

  const screen = await render(
    <FullPersistentTestTable
      storage={{
        getItem: (key) => storage.get(key) ?? null,
        removeItem: (key) => {
          storage.delete(key)
        },
        setItem: (key, value) => {
          storage.set(key, value)
        },
      }}
    />
  )

  await expect.poll(() => headerOrder(screen.container), { timeout: 2000 }).toBe('region,name')

  await userEvent.click(screen.getByTestId('reset-state'))

  await expect.poll(() => headerOrder(screen.container), { timeout: 2000 }).toBe('name,status,region')
  expect(storage.has('test-full-state')).toBeFalsy()
})

test('hiding a resized column keeps remaining headers and cells aligned', async () => {
  const storage = new Map<string, string>()
  const screen = await render(
    <FullPersistentTestTable
      storage={{
        getItem: (key) => storage.get(key) ?? null,
        removeItem: (key) => {
          storage.delete(key)
        },
        setItem: (key, value) => {
          storage.set(key, value)
        },
      }}
    />
  )

  await expect.poll(() => headerOrder(screen.container), { timeout: 2000 }).toBe('name,status,region')

  const firstHeader = screen.container.querySelector<HTMLElement>('[data-table-element-role="column-header"]')
  const handle = firstHeader?.querySelector<HTMLElement>('[data-table-element-role="resize-handle"]')
  expect(firstHeader).not.toBeNull()
  expect(handle).not.toBeNull()

  const handleRect = handle!.getBoundingClientRect()
  handle!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: handleRect.left + 1, pointerId: 1 }))
  document.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: handleRect.left + 80, pointerId: 1 }))
  document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: handleRect.left + 80, pointerId: 1 }))
  await expect.poll(() => Math.round(firstHeader!.getBoundingClientRect().width), { timeout: 2000 }).toBeGreaterThan(COLUMN_WIDTH + 20)

  await userEvent.click(screen.getByTestId('toggle-name'))

  await expect.poll(() => headerOrder(screen.container), { timeout: 2000 }).toBe('status,region')
  const statusHeader = [...screen.container.querySelectorAll<HTMLElement>('[data-table-element-role="column-header"]')][0]
  const statusCell = [...screen.container.querySelectorAll<HTMLElement>('[data-table-element-role="cell"]')][0]
  expect(statusHeader).toBeDefined()
  expect(statusCell).toBeDefined()
  await expect
    .poll(() => Math.round(statusHeader!.getBoundingClientRect().width), { timeout: 2000 })
    .toBe(Math.round(statusCell!.getBoundingClientRect().width))
})

test('column visibility persistence survives partial schema switches', async () => {
  const storage = new Map<string, string>()
  const screen = await render(
    <PartialSchemaVisibilityTestTable
      storage={{
        getItem: (key) => storage.get(key) ?? null,
        removeItem: (key) => {
          storage.delete(key)
        },
        setItem: (key, value) => {
          storage.set(key, value)
        },
      }}
    />
  )

  await expect.poll(() => headerOrder(screen.container), { timeout: 2000 }).toBe('name,status,city')

  await userEvent.click(screen.getByTestId('toggle-city'))

  await expect.poll(() => headerOrder(screen.container), { timeout: 2000 }).toBe('name,status')
  await expect.poll(() => readSavedColumnVisibility(storage, 'test-partial-visibility').city, { timeout: 2000 }).toBe(false)

  await userEvent.click(screen.getByTestId('show-orders'))

  await expect.poll(() => headerOrder(screen.container), { timeout: 2000 }).toBe('name,status,total')
  await expect.poll(() => readSavedColumnVisibility(storage, 'test-partial-visibility').city, { timeout: 2000 }).toBe(false)

  await userEvent.click(screen.getByTestId('show-people'))

  await expect.poll(() => headerOrder(screen.container), { timeout: 2000 }).toBe('name,status')
})

test('saves the first reorder after persisted state is restored for dynamic columns', async () => {
  const storage = new Map<string, string>([
    [
      'test-dynamic-state',
      JSON.stringify({
        version: 1,
        features: {
          columnOrder: {
            version: 1,
            fields: ['region', 'name', 'status'],
          },
        },
      }),
    ],
  ])

  const screen = await render(
    <DynamicCombinedPersistentTestTable
      storage={{
        getItem: (key) => storage.get(key) ?? null,
        removeItem: (key) => {
          storage.delete(key)
        },
        setItem: (key, value) => {
          storage.set(key, value)
        },
      }}
    />
  )

  await expect
    .poll(
      () =>
        [...screen.container.querySelectorAll<HTMLElement>('[data-table-element-role="column-header"]')]
          .map((header) => header.textContent)
          .join(','),
      { timeout: 2000 }
    )
    .toBe('region,name,status')

  await userEvent.click(screen.getByTestId('move-status-before-region'))

  await expect
    .poll(
      () =>
        [...screen.container.querySelectorAll<HTMLElement>('[data-table-element-role="column-header"]')]
          .map((header) => header.textContent)
          .join(','),
      { timeout: 2000 }
    )
    .toBe('status,region,name')

  await expect.poll(() => readSavedColumnOrder(storage, 'test-dynamic-state'), { timeout: 2000 }).toBe('status,region,name')
})

test('reset state restores declaration order after persisted column order is restored', async () => {
  const storage = new Map<string, string>([
    [
      'test-dynamic-state',
      JSON.stringify({
        version: 1,
        features: {
          columnOrder: {
            version: 1,
            fields: ['region', 'name', 'status'],
          },
        },
      }),
    ],
  ])

  const screen = await render(
    <DynamicCombinedPersistentTestTable
      storage={{
        getItem: (key) => storage.get(key) ?? null,
        removeItem: (key) => {
          storage.delete(key)
        },
        setItem: (key, value) => {
          storage.set(key, value)
        },
      }}
    />
  )

  await expect
    .poll(
      () =>
        [...screen.container.querySelectorAll<HTMLElement>('[data-table-element-role="column-header"]')]
          .map((header) => header.textContent)
          .join(','),
      { timeout: 2000 }
    )
    .toBe('region,name,status')

  await userEvent.click(screen.getByTestId('reset-state'))

  await expect
    .poll(
      () =>
        [...screen.container.querySelectorAll<HTMLElement>('[data-table-element-role="column-header"]')]
          .map((header) => header.textContent)
          .join(','),
      { timeout: 2000 }
    )
    .toBe('name,status,region')
  expect(storage.has('test-dynamic-state')).toBeFalsy()
})

test('reset state restores declaration order after drag reorder persistence', async () => {
  const storage = new Map<string, string>()
  const screen = await render(
    <InteractiveCombinedPersistentTestTable
      storage={{
        getItem: (key) => storage.get(key) ?? null,
        removeItem: (key) => {
          storage.delete(key)
        },
        setItem: (key, value) => {
          storage.set(key, value)
        },
      }}
    />
  )

  await expect.poll(() => headerOrder(screen.container), { timeout: 2000 }).toBe('name,status,region')

  const headers = [...screen.container.querySelectorAll<HTMLElement>('[data-table-element-role="column-header"]')]
  const nameHeader = headers.find((header) => header.textContent?.includes('name'))
  const statusHeader = headers.find((header) => header.textContent?.includes('status'))
  const statusGrip = statusHeader?.querySelector<HTMLElement>('[draggable="true"]')
  expect(nameHeader).toBeDefined()
  expect(statusHeader).toBeDefined()
  expect(statusGrip).toBeDefined()

  const dataTransfer = new DataTransfer()
  const statusRect = statusHeader!.getBoundingClientRect()
  const nameRect = nameHeader!.getBoundingClientRect()
  statusGrip!.dispatchEvent(
    new DragEvent('dragstart', { bubbles: true, clientX: statusRect.left + 4, clientY: statusRect.top + 4, dataTransfer })
  )
  await new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
  nameHeader!.dispatchEvent(
    new DragEvent('dragover', { bubbles: true, cancelable: true, clientX: nameRect.left + 4, clientY: nameRect.top + 4, dataTransfer })
  )
  nameHeader!.dispatchEvent(
    new DragEvent('drop', { bubbles: true, cancelable: true, clientX: nameRect.left + 4, clientY: nameRect.top + 4, dataTransfer })
  )

  await expect.poll(() => headerOrder(screen.container), { timeout: 2000 }).toBe('status,name,region')
  await expect.poll(() => readSavedColumnOrder(storage, 'test-interactive-state'), { timeout: 2000 }).toBe('status,name,region')

  await userEvent.click(screen.getByTestId('reset-state'))

  await expect.poll(() => headerOrder(screen.container), { timeout: 2000 }).toBe('name,status,region')
  expect(storage.has('test-interactive-state')).toBeFalsy()
})

test('double clicking the resize handle clears the width override', async () => {
  const screen = await render(<TestTable />)
  const headers = screen.container.querySelectorAll<HTMLElement>('[data-table-element-role="column-header"]')
  const firstHeader = headers[0]
  const handle = firstHeader?.querySelector<HTMLElement>('[data-table-element-role="resize-handle"]')

  expect(firstHeader).not.toBeNull()
  expect(handle).not.toBeNull()

  await expect
    .poll(() => [...headers].reduce((sum, header) => sum + Math.round(header.getBoundingClientRect().width), 0), { timeout: 2000 })
    .toBeGreaterThan(COLUMN_WIDTH * headers.length)
  const initialWidth = Math.round(firstHeader!.getBoundingClientRect().width)
  const handleRect = handle!.getBoundingClientRect()
  handle!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: handleRect.left + 1, pointerId: 1 }))
  document.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: handleRect.left + 70, pointerId: 1 }))
  document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: handleRect.left + 70, pointerId: 1 }))

  await expect.poll(() => Math.round(firstHeader!.getBoundingClientRect().width), { timeout: 2000 }).toBeGreaterThan(initialWidth + 20)

  await userEvent.dblClick(handle!)

  await expect.poll(() => Math.round(firstHeader!.getBoundingClientRect().width), { timeout: 2000 }).toBe(initialWidth)
})
