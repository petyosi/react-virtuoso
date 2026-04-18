import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import {
  Cell,
  Column,
  ColumnHeader,
  columnWidthOverrides$,
  columnWidths$,
  columns$,
  columnsState$,
  scrollToRow$,
  setColumnSticky$,
  useEngineRef,
  useRemoteCellValue,
  useRemotePublisher,
  viewportRange$,
  VirtuosoDataTable,
} from '../../src'
import { reorderColumns$ } from '../../src/features/column-reorder'
import { resizeColumn$ } from '../../src/features/column-resize'

import type { ColumnInfo, EngineRef, EngineSource } from '../../src'

const ENGINE_ID = 'remote-control-test'
const READY_SELECTOR = '[data-testid=virtuoso-table-root][data-ready]'
const FIELDS = ['id', 'name', 'status', 'city', 'score'] as const
const HEADER_HEIGHT = 40
const ROW_HEIGHT = 32
const COLUMN_WIDTH = 140

interface DemoRow {
  id: string
  name: string
  status: string
  city: string
  score: string
}

const ITEMS: DemoRow[] = Array.from({ length: 120 }, (_, index) => ({
  id: `USR-${String(index + 1).padStart(3, '0')}`,
  name: `User ${index + 1}`,
  status: ['Active', 'Pending', 'Paused'][index % 3]!,
  city: ['Sofia', 'Berlin', 'Madrid', 'Oslo'][index % 4]!,
  score: String(1000 + index),
}))

function findColumnKey(columns: Map<string, ColumnInfo> | undefined, field: (typeof FIELDS)[number]) {
  return columns ? [...columns].find(([, info]) => info.field === field)?.[0] : undefined
}

function readText(container: HTMLElement, testId: string) {
  return container.querySelector(`[data-testid="${testId}"]`)?.textContent ?? ''
}

function readWidth(container: HTMLElement, testId: string) {
  return Number(readText(container, testId))
}

function readRange(container: HTMLElement, testId: string) {
  const [start = '0', end = '0'] = readText(container, testId).split('-')
  return {
    start: Number(start),
    end: Number(end),
  }
}

function headerWidths(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[data-table-element-role="column-header"]'), (cell) =>
    Math.round((cell as HTMLElement).getBoundingClientRect().width)
  )
}

function firstRowCellWidths(container: HTMLElement) {
  const firstRow = container.querySelector('[data-testid="virtuoso-table-row"]')
  const scrollableCells = firstRow?.querySelector('[data-scrollable="true"]')
  return Array.from(scrollableCells?.querySelectorAll(':scope > div') ?? [], (cell) =>
    Math.round((cell as HTMLElement).getBoundingClientRect().width)
  )
}

async function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(READY_SELECTOR)).not.toBeNull()
}

function TestTable({ engineRef, engineId }: { engineRef?: EngineRef; engineId?: string }) {
  const remoteProps = {
    ...(engineRef === undefined ? {} : { engineRef }),
    ...(engineId === undefined ? {} : { engineId }),
  }

  return (
    <VirtuosoDataTable style={{ height: 320, width: 420 }} data={{ data: ITEMS, groups: [] }} {...remoteProps}>
      {FIELDS.map((field) => (
        <Column key={field} field={field}>
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>{field}</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      ))}
    </VirtuosoDataTable>
  )
}

function OrderControls({ engineSource }: { engineSource: EngineSource }) {
  const columns = useRemoteCellValue(columns$, engineSource)
  const reorderColumns = useRemotePublisher(reorderColumns$, engineSource)
  const statusKey = findColumnKey(columns, 'status')
  const idKey = findColumnKey(columns, 'id')

  return (
    <div>
      <div data-testid="field-order">{columns ? Array.from(columns.values(), (info) => info.field).join(',') : 'loading'}</div>
      <button
        data-testid="move-status-first"
        onClick={() => {
          if (statusKey && idKey) {
            reorderColumns({ sourceKey: statusKey, targetKey: idKey, position: 'before' })
          }
        }}
      >
        move
      </button>
    </div>
  )
}

function StickyControls({ engineSource }: { engineSource: EngineSource }) {
  const columns = useRemoteCellValue(columns$, engineSource)
  const columnsState = useRemoteCellValue(columnsState$, engineSource)
  const setColumnSticky = useRemotePublisher(setColumnSticky$, engineSource)
  const statusKey = findColumnKey(columns, 'status')
  const sticky = statusKey ? (columnsState?.get(statusKey)?.sticky ?? 'none') : 'loading'

  return (
    <div>
      <div data-testid="status-sticky">{sticky}</div>
      <button
        data-testid="pin-status-left"
        onClick={() => {
          if (statusKey) {
            setColumnSticky({ key: statusKey, sticky: 'left' })
          }
        }}
      >
        left
      </button>
      <button
        data-testid="clear-status-sticky"
        onClick={() => {
          if (statusKey) {
            setColumnSticky({ key: statusKey, sticky: undefined })
          }
        }}
      >
        clear
      </button>
    </div>
  )
}

function ResizeControls({ engineSource }: { engineSource: EngineSource }) {
  const columns = useRemoteCellValue(columns$, engineSource)
  const widths = useRemoteCellValue(columnWidths$, engineSource)
  const overrides = useRemoteCellValue(columnWidthOverrides$, engineSource)
  const resizeColumn = useRemotePublisher(resizeColumn$, engineSource)
  const nameKey = findColumnKey(columns, 'name')

  return (
    <div>
      <div data-testid="name-width">{nameKey && widths ? Math.round(widths.get(nameKey) ?? 0) : 0}</div>
      <div data-testid="name-override">{nameKey && overrides ? (overrides.get(nameKey) ?? 0) : 0}</div>
      <button
        data-testid="resize-name"
        onClick={() => {
          if (nameKey) {
            resizeColumn({ key: nameKey, width: 240 })
          }
        }}
      >
        resize
      </button>
    </div>
  )
}

function ReadControls({ engineSource }: { engineSource: EngineSource }) {
  const columns = useRemoteCellValue(columns$, engineSource)
  const widths = useRemoteCellValue(columnWidths$, engineSource)
  const range = useRemoteCellValue(viewportRange$, engineSource)
  const nameKey = findColumnKey(columns, 'name')

  return (
    <div>
      <div data-testid="field-order">{columns ? Array.from(columns.values(), (info) => info.field).join(',') : 'loading'}</div>
      <div data-testid="name-width">{nameKey && widths ? Math.round(widths.get(nameKey) ?? 0) : 0}</div>
      <div data-testid="viewport-range">{range ? `${range.startIndex}-${range.endIndex}` : 'loading'}</div>
    </div>
  )
}

function ScrollControls({ engineSource }: { engineSource: EngineSource }) {
  const range = useRemoteCellValue(viewportRange$, engineSource)
  const scrollToRow = useRemotePublisher(scrollToRow$, engineSource)

  return (
    <div>
      <div data-testid="viewport-range">{range ? `${range.startIndex}-${range.endIndex}` : 'loading'}</div>
      <button
        data-testid="scroll-to-40"
        onClick={() => {
          scrollToRow(40)
        }}
      >
        scroll
      </button>
    </div>
  )
}

function EngineRefHarness({ children }: { children: (engineRef: EngineRef) => React.ReactNode }) {
  const engineRef = useEngineRef()

  return (
    <>
      {children(engineRef)}
      <TestTable engineRef={engineRef} />
    </>
  )
}

function EngineIdHarness({ children }: { children: (engineSource: EngineSource) => React.ReactNode }) {
  return (
    <>
      {children(ENGINE_ID)}
      <TestTable engineId={ENGINE_ID} />
    </>
  )
}

test('remote column reorder via engineRef reads columns$ and updates order', async () => {
  const screen = await render(<EngineRefHarness>{(engineRef) => <OrderControls engineSource={engineRef} />}</EngineRefHarness>)

  await waitForReady(screen)
  await expect.poll(() => readText(screen.container, 'field-order')).toBe('id,name,status,city,score')

  await screen.getByTestId('move-status-first').click()

  await expect.poll(() => readText(screen.container, 'field-order')).toBe('status,id,name,city,score')
})

test('remote sticky toggle via engineRef updates columnsState$', async () => {
  const screen = await render(<EngineRefHarness>{(engineRef) => <StickyControls engineSource={engineRef} />}</EngineRefHarness>)

  await waitForReady(screen)
  await expect.poll(() => readText(screen.container, 'status-sticky')).toBe('none')

  await screen.getByTestId('pin-status-left').click()
  await expect.poll(() => readText(screen.container, 'status-sticky')).toBe('left')

  await screen.getByTestId('clear-status-sticky').click()
  await expect.poll(() => readText(screen.container, 'status-sticky')).toBe('none')
})

test('remote column resize via engineRef updates overrides and measured widths', async () => {
  const screen = await render(<EngineRefHarness>{(engineRef) => <ResizeControls engineSource={engineRef} />}</EngineRefHarness>)

  await waitForReady(screen)
  await expect.poll(() => readWidth(screen.container, 'name-width')).toBeGreaterThan(0)

  await screen.getByTestId('resize-name').click()

  await expect.poll(() => readWidth(screen.container, 'name-override')).toBe(240)
  await expect.poll(() => readWidth(screen.container, 'name-width')).toBe(240)
  await expect.poll(() => headerWidths(screen.container)[1]).toBe(240)
  await expect.poll(() => firstRowCellWidths(screen.container)[1]).toBe(240)
})

test('remote readers expose column widths and viewport range via engineRef', async () => {
  const screen = await render(<EngineRefHarness>{(engineRef) => <ReadControls engineSource={engineRef} />}</EngineRefHarness>)

  await waitForReady(screen)
  await expect.poll(() => readText(screen.container, 'field-order')).toBe('id,name,status,city,score')
  await expect.poll(() => readWidth(screen.container, 'name-width')).toBeGreaterThan(0)
  await expect.poll(() => readRange(screen.container, 'viewport-range').start).toBe(0)
  await expect.poll(() => readRange(screen.container, 'viewport-range').end).toBeGreaterThan(0)
})

test('remote scroll to row via engineRef updates the viewport range', async () => {
  const screen = await render(<EngineRefHarness>{(engineRef) => <ScrollControls engineSource={engineRef} />}</EngineRefHarness>)

  await waitForReady(screen)
  await expect.poll(() => readRange(screen.container, 'viewport-range').start).toBe(0)

  await screen.getByTestId('scroll-to-40').click()

  await expect.poll(() => readRange(screen.container, 'viewport-range').start).toBeGreaterThanOrEqual(40)
})

test('engineId-based remote access works for sibling controls', async () => {
  const screen = await render(<EngineIdHarness>{(engineSource) => <OrderControls engineSource={engineSource} />}</EngineIdHarness>)

  await waitForReady(screen)
  await expect.poll(() => readText(screen.container, 'field-order')).toBe('id,name,status,city,score')

  await screen.getByTestId('move-status-first').click()

  await expect.poll(() => readText(screen.container, 'field-order')).toBe('status,id,name,city,score')
})
