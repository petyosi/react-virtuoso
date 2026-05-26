import { useMemo } from 'react'

import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import {
  Cell,
  Column,
  ColumnGroup,
  ColumnGroupHeader,
  ColumnHeader,
  DynamicColumns,
  VirtuosoDataTable,
  columns$,
  useCellValue,
  usePublisher,
} from '../../../..'
import { localModel } from '../../../../model/local-model'
import { reorderColumns$ } from '../../../column-reorder'
import { setColumnVisibility$ } from '../../../column-visibility'

import type { DataModelHandle } from '../../../../model/types'

const HEADER_HEIGHT = 32
const ROW_HEIGHT = 28
const COLUMN_WIDTH = 96
const CONTAINER_HEIGHT = 180
const CONTAINER_WIDTH = 520
const readySelector = '[data-testid=virtuoso-table-root][data-ready]'
const headerCellSelector = '[data-table-element-role="column-header"]'
const columnGroupSelector = '[data-column-group]'
const groupHeaderSelector = '[role="columnheader"][data-scope="colgroup"]'

type Item = Record<string, unknown>

const ID_ACTIONS_FIELDS = ['id', 'actions']
const ID_FIELD = ['id']
const FIRST_REDISCOVERY_ROWS: Item[] = [{ id: 1, name: 'Ada' }]
const SECOND_REDISCOVERY_ROWS: Item[] = [{ id: 2, region: 'North' }]

function TestColumn({ field, label, sticky }: { field: string; label: string; sticky?: 'left' | 'right' }) {
  return (
    <Column field={field} {...(sticky === undefined ? {} : { sticky })}>
      <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>{label}</div>}</ColumnHeader>
      <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue ?? '')}</div>}</Cell>
    </Column>
  )
}

function fieldsFromRows(data: readonly Item[], includeField: (field: string) => boolean = () => true) {
  const fields: string[] = []
  const seen = new Set<string>()

  for (const row of data) {
    if (row === null || typeof row !== 'object' || Array.isArray(row)) {
      continue
    }

    for (const field of Object.keys(row)) {
      if (includeField(field) && !seen.has(field)) {
        seen.add(field)
        fields.push(field)
      }
    }
  }

  return fields
}

function DynamicFieldColumns({ skip = [] }: { skip?: readonly string[] }) {
  return (
    <DynamicColumns<Item>>
      {({ data }) =>
        fieldsFromRows(data, (field) => !skip.includes(field)).map((field) => <TestColumn key={field} field={field} label={field} />)
      }
    </DynamicColumns>
  )
}

function columnKeyForField(columns: Map<string, { field: string }>, field: string) {
  return [...columns].find(([, column]) => column.field === field)?.[0] ?? null
}

function ColumnVisibilityButton({ field }: { field: string }) {
  const columns = useCellValue(columns$)
  const setColumnVisibility = usePublisher(setColumnVisibility$)
  const columnKey = columnKeyForField(columns, field)

  return (
    <button
      data-testid={`hide-${field}`}
      disabled={columnKey === null}
      onClick={() => {
        if (columnKey !== null) {
          setColumnVisibility({ key: columnKey, visible: false })
        }
      }}
    >
      Hide {field}
    </button>
  )
}

function ColumnReorderButton({ sourceField, targetField }: { sourceField: string; targetField: string }) {
  const columns = useCellValue(columns$)
  const reorderColumns = usePublisher(reorderColumns$)
  const sourceKey = columnKeyForField(columns, sourceField)
  const targetKey = columnKeyForField(columns, targetField)

  return (
    <button
      data-testid={`move-${sourceField}`}
      disabled={sourceKey === null || targetKey === null}
      onClick={() => {
        if (sourceKey !== null && targetKey !== null) {
          reorderColumns({ sourceKey, targetKey, position: 'before' })
        }
      }}
    >
      Move {sourceField}
    </button>
  )
}

function headerTexts(container: HTMLElement) {
  return [...container.querySelectorAll(headerCellSelector)].map((header) => header.textContent?.trim())
}

async function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
}

describe(DynamicColumns, () => {
  test('renders discovered columns from local model data', async () => {
    const rows: Item[] = [
      { id: 1, name: 'Ada', status: 'Active' },
      { id: 2, total: 42, status: 'Pending' },
    ]

    function TestTable() {
      const model = useMemo(() => localModel<Item>({ data: rows }), [])

      return (
        <VirtuosoDataTable model={model} style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}>
          <DynamicFieldColumns />
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestTable />)
    await waitForReady(screen)

    await expect.poll(() => headerTexts(screen.container)).toStrictEqual(['id', 'name', 'status', 'total'])
  })

  test('keeps dynamic columns between static columns declared around it', async () => {
    const rows: Item[] = [{ id: 1, name: 'Ada', status: 'Active', actions: 'Edit' }]

    function TestTable() {
      const model = useMemo(() => localModel<Item>({ data: rows }), [])

      return (
        <VirtuosoDataTable model={model} style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}>
          <TestColumn field="id" label="ID" sticky="left" />
          <DynamicFieldColumns skip={ID_ACTIONS_FIELDS} />
          <TestColumn field="actions" label="Actions" sticky="right" />
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestTable />)
    await waitForReady(screen)

    await expect.poll(() => headerTexts(screen.container)).toStrictEqual(['ID', 'name', 'status', 'Actions'])
  })

  test('does not expose a visible slot before the first non-empty data result', async () => {
    function TestTable() {
      const model = useMemo(() => localModel<Item>({ data: [] }), [])

      return (
        <VirtuosoDataTable model={model} style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}>
          <TestColumn field="id" label="ID" />
          <DynamicFieldColumns skip={ID_ACTIONS_FIELDS} />
          <TestColumn field="actions" label="Actions" />
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestTable />)

    await expect.poll(() => headerTexts(screen.container)).toStrictEqual(['ID', 'Actions'])
  })

  test('keeps the captured data stable after local model data changes', async () => {
    let captured: readonly Item[] | null = null
    let capturedModel: DataModelHandle<Item> | null = null
    let modelHandle!: DataModelHandle<Item>
    const initialRows: Item[] = [{ id: 1, name: 'Ada', status: 'Active' }]

    function CapturingDynamicColumns() {
      return (
        <DynamicColumns<Item>>
          {({ data, model }) => {
            captured ??= data
            capturedModel ??= model
            return fieldsFromRows(data, (field) => field !== 'actions').map((field) => (
              <TestColumn key={field} field={field} label={field} />
            ))
          }}
        </DynamicColumns>
      )
    }

    function TestTable() {
      const model = useMemo(() => {
        const nextModel = localModel<Item>({ data: initialRows })
        modelHandle = nextModel
        return nextModel
      }, [])

      return (
        <VirtuosoDataTable model={model} style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}>
          <CapturingDynamicColumns />
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestTable />)
    await waitForReady(screen)
    await expect.poll(() => headerTexts(screen.container)).toStrictEqual(['id', 'name', 'status'])
    expect(captured).toStrictEqual(initialRows)
    expect(capturedModel).toBe(modelHandle)

    const firstCapture = captured
    modelHandle.setData!([{ id: 2, region: 'North', actions: 'Edit' }])

    await expect.poll(() => headerTexts(screen.container)).toStrictEqual(['id', 'name', 'status'])
    expect(captured).toBe(firstCapture)
  })

  test('captures new data after the table is remounted with a new key', async () => {
    function TestTable({ rows, tableKey }: { rows: Item[]; tableKey: string }) {
      const model = useMemo(() => localModel<Item>({ data: rows }), [rows])

      return (
        <VirtuosoDataTable key={tableKey} model={model} style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}>
          <DynamicFieldColumns />
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestTable rows={FIRST_REDISCOVERY_ROWS} tableKey="first" />)
    await waitForReady(screen)
    await expect.poll(() => headerTexts(screen.container)).toStrictEqual(['id', 'name'])

    await screen.rerender(<TestTable rows={SECOND_REDISCOVERY_ROWS} tableKey="second" />)
    await waitForReady(screen)
    await expect.poll(() => headerTexts(screen.container)).toStrictEqual(['id', 'region'])
  })

  test('registers dynamic columns inside a column group', async () => {
    const rows: Item[] = [{ id: 1, name: 'Ada', status: 'Active' }]

    function TestTable() {
      const model = useMemo(() => localModel<Item>({ data: rows }), [])

      return (
        <VirtuosoDataTable model={model} style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}>
          <ColumnGroup>
            <ColumnGroupHeader>{() => <div style={{ height: 20 }}>Runtime</div>}</ColumnGroupHeader>
            <DynamicFieldColumns skip={ID_FIELD} />
          </ColumnGroup>
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestTable />)
    await waitForReady(screen)

    await expect.poll(() => headerTexts(screen.container)).toStrictEqual(['name', 'status'])
    expect(screen.container.querySelector(groupHeaderSelector)?.textContent).toBe('Runtime')
    expect(screen.container.querySelector(columnGroupSelector)?.querySelectorAll(headerCellSelector).length).toBe(2)
  })

  test('hides a dynamically generated column through column visibility controls', async () => {
    const rows: Item[] = [{ id: 1, name: 'Ada', status: 'Active' }]

    function TestTable() {
      const model = useMemo(() => localModel<Item>({ data: rows }), [])

      return (
        <VirtuosoDataTable model={model} style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}>
          <DynamicFieldColumns />
          <ColumnVisibilityButton field="name" />
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestTable />)
    await waitForReady(screen)
    await expect.poll(() => headerTexts(screen.container)).toStrictEqual(['id', 'name', 'status'])

    const button = screen.container.querySelector('[data-testid="hide-name"]') as HTMLButtonElement
    await expect.poll(() => button.disabled).toBe(false)
    button.click()

    await expect.poll(() => headerTexts(screen.container)).toStrictEqual(['id', 'status'])
  })

  test('reorders a dynamically generated column through column reorder controls', async () => {
    const rows: Item[] = [{ id: 1, name: 'Ada', status: 'Active' }]

    function TestTable() {
      const model = useMemo(() => localModel<Item>({ data: rows }), [])

      return (
        <VirtuosoDataTable model={model} style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}>
          <DynamicFieldColumns />
          <ColumnReorderButton sourceField="status" targetField="name" />
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestTable />)
    await waitForReady(screen)
    await expect.poll(() => headerTexts(screen.container)).toStrictEqual(['id', 'name', 'status'])

    const button = screen.container.querySelector('[data-testid="move-status"]') as HTMLButtonElement
    await expect.poll(() => button.disabled).toBe(false)
    button.click()

    await expect.poll(() => headerTexts(screen.container)).toStrictEqual(['id', 'status', 'name'])
  })
})
