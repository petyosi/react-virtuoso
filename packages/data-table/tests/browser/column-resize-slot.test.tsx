import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'

import { ResizeHandle } from '../../../../apps/virtuoso.dev/registry/new-york/data-table/column-resize/resize-handle'
import { Cell, Column, ColumnHeader, HeaderEdge, VirtuosoDataTable } from '../../src'
import { columnWidthPersistenceAdapter } from '../../src/features/column-resize'
import { DataTableStatePersistence } from '../../src/features/state-persistence'

import type { DataTableStatePersistenceStorage } from '../../src/features/state-persistence'

const HEADER_HEIGHT = 40
const ROW_HEIGHT = 32
const COLUMN_WIDTH = 160
const PERSISTENCE_ADAPTERS = [columnWidthPersistenceAdapter()]

const ITEMS = Array.from({ length: 20 }, (_, index) => ({
  name: `Product ${index + 1}`,
  status: index % 2 === 0 ? 'Active' : 'Paused',
  region: ['US', 'EU', 'APAC'][index % 3]!,
}))

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
