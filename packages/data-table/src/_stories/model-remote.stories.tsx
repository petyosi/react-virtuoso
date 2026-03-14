import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'

import { Cell, VirtuosoDataTable } from '..'
import { Column } from '../columns/Column'
import { ColumnHeader } from '../columns/ColumnHeader'
import { defaultAppendViewportHandler, defaultOffsetViewportHandler, remoteSource } from '../model/remote-source'
import { delay } from '../tests/utils'

import type { AppendFetchParams, FetchParams } from '../model/remote-source'

interface Item {
  id: number
  name: string
  category: string
}

interface Params {
  sortBy?: string
  filterCategory?: string
}

const ALL_ITEMS: Item[] = Array.from({ length: 500 }, (_, i) => ({
  id: i,
  name: `Item ${i}`,
  category: ['Electronics', 'Books', 'Clothing', 'Food'][i % 4]!,
}))

async function mockFetch(params: FetchParams<Params>) {
  await delay(200)
  if (params.signal.aborted) {
    throw new Error('aborted')
  }

  let data = [...ALL_ITEMS]

  if (params.params.filterCategory) {
    data = data.filter((item) => item.category === params.params.filterCategory)
  }
  if (params.params.sortBy) {
    const field = params.params.sortBy as keyof Item
    data = data.toSorted((a, b) => (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0))
  }

  const rows = data.slice(params.offset, params.offset + params.limit)
  return { rows, totalCount: data.length }
}

const PLACEHOLDER: Item = { id: -1, name: 'Loading...', category: '' }
const LIST_STYLE: CSSProperties = { height: 400 }
const HEADER_STYLE: CSSProperties = { fontWeight: 'bold', borderBottom: '1px solid gray', padding: '4px 8px' }

export function RemoteWithSortAndFilter() {
  const [filterCategory, setFilterCategory] = useState('')
  const [sortBy, setSortBy] = useState('')

  const model = useMemo(
    () =>
      remoteSource<Item, Params>({
        fetch: mockFetch,
        initialParams: {},
        pageSize: 50,
        placeholder: PLACEHOLDER,
        onViewportChange: defaultOffsetViewportHandler,
        actions: {
          sort: {
            handler: ({ payload, params }) => ({ ...params, sortBy: payload as string }),
          },
          filter: {
            handler: ({ payload, params }) => ({ ...params, filterCategory: payload as string }),
          },
        },
      }),
    []
  )

  return (
    <div>
      <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value)
            model.send({ action: 'filter', payload: e.target.value })
          }}
        >
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Books">Books</option>
          <option value="Clothing">Clothing</option>
          <option value="Food">Food</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value)
            model.send({ action: 'sort', payload: e.target.value })
          }}
        >
          <option value="">No Sort</option>
          <option value="id">Sort by ID</option>
          <option value="name">Sort by Name</option>
          <option value="category">Sort by Category</option>
        </select>
      </div>

      <VirtuosoDataTable style={LIST_STYLE} model={model}>
        <Column field="id">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>ID</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="name">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="category">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Category</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      </VirtuosoDataTable>
    </div>
  )
}

// --- Append Mode Story ---

const PAGE_SIZE = 20
const TOTAL_ITEMS = 100

async function mockAppendFetch(params: AppendFetchParams<Params>) {
  await delay(300)
  if (params.signal.aborted) {
    throw new Error('aborted')
  }

  const startIndex = (params.cursor as number | undefined) ?? 0

  let data = [...ALL_ITEMS].slice(0, TOTAL_ITEMS)
  if (params.params.filterCategory) {
    data = data.filter((item) => item.category === params.params.filterCategory)
  }

  const rows = data.slice(startIndex, startIndex + params.limit)
  const nextCursor = startIndex + rows.length
  const hasMore = nextCursor < data.length

  return { rows, hasMore, cursor: nextCursor }
}

export function AppendMode() {
  const [filterCategory, setFilterCategory] = useState('')

  const model = useMemo(
    () =>
      remoteSource<Item, Params>({
        mode: 'append',
        fetch: mockAppendFetch,
        initialParams: {},
        pageSize: PAGE_SIZE,
        onViewportChange: defaultAppendViewportHandler,
        actions: {
          filter: {
            handler: ({ payload, params }) => ({ ...params, filterCategory: payload as string }),
          },
        },
      }),
    []
  )

  return (
    <div>
      <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value)
            model.send({ action: 'filter', payload: e.target.value })
          }}
        >
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Books">Books</option>
          <option value="Clothing">Clothing</option>
          <option value="Food">Food</option>
        </select>
      </div>

      <VirtuosoDataTable style={LIST_STYLE} model={model}>
        <Column field="id">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>ID</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="name">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="category">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Category</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      </VirtuosoDataTable>
    </div>
  )
}

export function AppendModeManualLoadMore() {
  const [filterCategory, setFilterCategory] = useState('')

  const model = useMemo(
    () =>
      remoteSource<Item, Params>({
        mode: 'append',
        fetch: mockAppendFetch,
        initialParams: {},
        pageSize: PAGE_SIZE,
        actions: {
          filter: {
            handler: ({ payload, params }) => ({ ...params, filterCategory: payload as string }),
          },
        },
      }),
    []
  )

  return (
    <div>
      <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value)
            model.send({ action: 'filter', payload: e.target.value })
          }}
        >
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Books">Books</option>
          <option value="Clothing">Clothing</option>
          <option value="Food">Food</option>
        </select>

        <button onClick={() => model.send({ action: 'loadMore' })}>Load More</button>
      </div>

      <VirtuosoDataTable style={LIST_STYLE} model={model}>
        <Column field="id">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>ID</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="name">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="category">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Category</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      </VirtuosoDataTable>
    </div>
  )
}
