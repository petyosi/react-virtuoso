import { useMemo } from 'react'

import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { Cell, Column, ColumnHeader, DynamicColumns, VirtuosoDataTable, remoteModel } from '../../../..'

import type { DataModelHandle, FetchParams, FetchResult } from '../../../..'

const HEADER_HEIGHT = 32
const ROW_HEIGHT = 28
const COLUMN_WIDTH = 96
const CONTAINER_HEIGHT = 180
const CONTAINER_WIDTH = 520
const readySelector = '[data-testid=virtuoso-table-root][data-ready]'
const headerCellSelector = '[data-table-element-role="column-header"]'
const ID_ACTIONS_FIELDS = ['id', 'actions']
const ACTIONS_FIELD = ['actions']

interface Item {
  id: number
  name?: string
  status?: string
  actions?: string
  region?: string
}

interface SearchParams {
  shape?: string
}

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

function deferred<T>() {
  let resolvePromise!: (value: T) => void
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve
  })

  return { promise, resolve: resolvePromise }
}

function headerTexts(container: HTMLElement) {
  return [...container.querySelectorAll(headerCellSelector)].map((header) => header.textContent?.trim())
}

async function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
}

describe('DynamicColumns remote models', () => {
  test('keeps static columns adjacent while the first remote result is pending', async () => {
    const firstFetch = deferred<FetchResult<Item>>()
    const fetch = vi.fn(() => firstFetch.promise)

    function TestTable() {
      const model = useMemo(
        () =>
          remoteModel<Item>({
            fetch,
            initialParams: {},
            pageSize: 2,
          }),
        []
      )

      return (
        <VirtuosoDataTable model={model} style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}>
          <TestColumn field="id" label="ID" sticky="left" />
          <DynamicFieldColumns skip={ID_ACTIONS_FIELDS} />
          <TestColumn field="actions" label="Actions" sticky="right" />
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestTable />)

    await expect.poll(() => fetch.mock.calls.length).toBe(1)
    await expect.poll(() => headerTexts(screen.container)).toStrictEqual(['ID', 'Actions'])

    firstFetch.resolve({
      rows: [{ id: 1, name: 'Ada', status: 'Active', actions: 'Edit' }],
      totalCount: 1,
    })

    await waitForReady(screen)
    await expect.poll(() => headerTexts(screen.container)).toStrictEqual(['ID', 'name', 'status', 'Actions'])
  })

  test('keeps discovered columns stable after viewport data adds a field', async () => {
    let captured: readonly Item[] | null = null
    let modelHandle!: DataModelHandle<Item>
    const fetch = vi.fn(({ offset, limit }: FetchParams) =>
      Promise.resolve({
        rows:
          offset === 0
            ? [
                { id: 0, name: 'Item 0' },
                { id: 1, name: 'Item 1' },
              ]
            : Array.from({ length: limit }, (_, index) => ({
                id: offset + index,
                name: `Item ${offset + index}`,
                region: 'North',
              })),
        totalCount: 8,
      })
    )

    function CapturingDynamicFieldColumns() {
      return (
        <DynamicColumns<Item>>
          {({ data }) => {
            captured ??= data
            return fieldsFromRows(data).map((field) => <TestColumn key={field} field={field} label={field} />)
          }}
        </DynamicColumns>
      )
    }

    function TestTable() {
      const model = useMemo(() => {
        const nextModel = remoteModel<Item>({
          fetch,
          initialParams: {},
          pageSize: 2,
        })
        modelHandle = nextModel
        return nextModel
      }, [])

      return (
        <VirtuosoDataTable model={model} style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}>
          <CapturingDynamicFieldColumns />
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestTable />)
    await waitForReady(screen)
    await expect.poll(() => headerTexts(screen.container)).toStrictEqual(['id', 'name'])

    const firstCapture = captured
    modelHandle.send({ action: 'loadRange', payload: { offset: 4, limit: 2 }, viewId: 'default' })

    await expect.poll(() => fetch.mock.calls.length).toBe(2)
    await expect.poll(() => headerTexts(screen.container)).toStrictEqual(['id', 'name'])
    expect(captured).toBe(firstCapture)
  })

  test('keeps discovered columns stable after an action refresh changes row shape', async () => {
    let captured: readonly Item[] | null = null
    let modelHandle!: DataModelHandle<Item>
    const fetch = vi.fn(({ params }: FetchParams<SearchParams>) =>
      Promise.resolve({
        rows: params.shape === 'region' ? [{ id: 1, region: 'North' }] : [{ id: 1, name: 'Ada' }],
        totalCount: 1,
      })
    )

    function CapturingDynamicFieldColumns() {
      return (
        <DynamicColumns<Item>>
          {({ data }) => {
            captured ??= data
            return fieldsFromRows(data).map((field) => <TestColumn key={field} field={field} label={field} />)
          }}
        </DynamicColumns>
      )
    }

    function TestTable() {
      const model = useMemo(() => {
        const nextModel = remoteModel<Item, SearchParams>({
          fetch,
          initialParams: {},
          pageSize: 1,
          actions: {
            search: {
              handler: ({ payload, params }) => ({ ...params, shape: payload as string }),
            },
          },
        })
        modelHandle = nextModel
        return nextModel
      }, [])

      return (
        <VirtuosoDataTable model={model} style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}>
          <CapturingDynamicFieldColumns />
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestTable />)
    await waitForReady(screen)
    await expect.poll(() => headerTexts(screen.container)).toStrictEqual(['id', 'name'])

    const firstCapture = captured
    modelHandle.send({ action: 'search', payload: 'region', viewId: 'default' })

    await expect.poll(() => fetch.mock.calls.length).toBe(2)
    await expect.poll(() => headerTexts(screen.container)).toStrictEqual(['id', 'name'])
    expect(captured).toBe(firstCapture)
  })

  test('supports schema-compatible offset placeholders with explicit field filtering', async () => {
    const fetch = vi.fn(() =>
      Promise.resolve({
        rows: [{ id: 1, name: 'Ada' }],
        totalCount: 4,
      })
    )

    function TestTable() {
      const model = useMemo(
        () =>
          remoteModel<Item>({
            fetch,
            initialParams: {},
            pageSize: 1,
            placeholder: { id: 0, name: '', actions: '' },
          }),
        []
      )

      return (
        <VirtuosoDataTable model={model} style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }}>
          <DynamicFieldColumns skip={ACTIONS_FIELD} />
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestTable />)
    await waitForReady(screen)

    await expect.poll(() => headerTexts(screen.container)).toStrictEqual(['id', 'name'])
  })
})
