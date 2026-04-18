import type { CSSProperties, ReactNode } from 'react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, DataTableCell, DataTableColumn, DataTableColumnHeader } from '@/components/ui/data-table'

import { defaultAppendViewportHandler, defaultOffsetViewportHandler, remoteSource } from '..'
import { delay } from '../tests/utils'

import type { AppendFetchParams, FetchParams } from '..'

interface Item {
  id: number
  name: string
  category: string
}

interface Params {
  sortBy?: string
  filterCategory?: string
}

const CATEGORY_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Electronics', value: 'Electronics' },
  { label: 'Books', value: 'Books' },
  { label: 'Clothing', value: 'Clothing' },
  { label: 'Food', value: 'Food' },
] as const

const SORT_OPTIONS = [
  { label: 'Default', value: '' },
  { label: 'ID', value: 'id' },
  { label: 'Name', value: 'name' },
  { label: 'Category', value: 'category' },
] as const

const ALL_ITEMS: Item[] = Array.from({ length: 500 }, (_, i) => ({
  id: i,
  name: `Item ${i}`,
  category: ['Electronics', 'Books', 'Clothing', 'Food'][i % 4]!,
}))

const PLACEHOLDER: Item = { id: -1, name: 'Loading...', category: '' }
const LIST_STYLE: CSSProperties = { height: 400 }
const TABLE_CLASS_NAME = 'rounded-xl'
const PAGE_SIZE = 20
const TOTAL_ITEMS = 100

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

  return { rows, hasMore: nextCursor < data.length, cursor: nextCursor }
}

function StoryFrame({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card className="w-full max-w-5xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  )
}

function FilterButtons({ filterCategory, setFilterCategory }: { filterCategory: string; setFilterCategory: (value: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_OPTIONS.map((option) => (
        <Button
          key={option.label}
          size="sm"
          variant={filterCategory === option.value ? 'default' : 'outline'}
          onClick={() => setFilterCategory(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}

function SortButtons({ sortBy, setSortBy }: { sortBy: string; setSortBy: (value: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SORT_OPTIONS.map((option) => (
        <Button
          key={option.label}
          size="sm"
          variant={sortBy === option.value ? 'default' : 'outline'}
          onClick={() => setSortBy(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}

function ItemsTable({
  model,
  emptyPlaceholder,
}: {
  model: ReturnType<typeof remoteSource<Item, Params>>
  emptyPlaceholder?: React.ComponentType<{ context: unknown }>
}) {
  const columns = (
    <>
      <DataTableColumn field="id">
        <DataTableColumnHeader className="w-20">ID</DataTableColumnHeader>
        <DataTableCell>{({ cellValue }) => <span className="text-muted-foreground tabular-nums">{String(cellValue)}</span>}</DataTableCell>
      </DataTableColumn>
      <DataTableColumn field="name">
        <DataTableColumnHeader>Name</DataTableColumnHeader>
        <DataTableCell>{({ cellValue }) => <span className="font-medium">{String(cellValue)}</span>}</DataTableCell>
      </DataTableColumn>
      <DataTableColumn field="category">
        <DataTableColumnHeader>Category</DataTableColumnHeader>
        <DataTableCell>
          {({ cellValue }) => (
            <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{String(cellValue)}</span>
          )}
        </DataTableCell>
      </DataTableColumn>
    </>
  )

  if (emptyPlaceholder) {
    return (
      <DataTable className={TABLE_CLASS_NAME} style={LIST_STYLE} model={model} EmptyPlaceholder={emptyPlaceholder}>
        {columns}
      </DataTable>
    )
  }

  return (
    <DataTable className={TABLE_CLASS_NAME} style={LIST_STYLE} model={model}>
      {columns}
    </DataTable>
  )
}

function EmptyPlaceholder() {
  return <div className="px-4 py-6 text-sm text-muted-foreground">No rows available.</div>
}

export function RemoteWithSortAndFilter() {
  const [filterCategory, setFilterCategoryState] = useState('')
  const [sortBy, setSortByState] = useState('')

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

  function setFilterCategory(value: string) {
    setFilterCategoryState(value)
    model.send({ action: 'filter', payload: value })
  }

  function setSortBy(value: string) {
    setSortByState(value)
    model.send({ action: 'sort', payload: value })
  }

  return (
    <StoryFrame
      title="Remote Offset Data"
      description="Offset mode with placeholder rows, filter actions, and sort actions rendered through the registry wrapper."
    >
      <FilterButtons filterCategory={filterCategory} setFilterCategory={setFilterCategory} />
      <SortButtons sortBy={sortBy} setSortBy={setSortBy} />
      <ItemsTable model={model} />
    </StoryFrame>
  )
}

export function AppendMode() {
  const [filterCategory, setFilterCategoryState] = useState('')

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

  function setFilterCategory(value: string) {
    setFilterCategoryState(value)
    model.send({ action: 'filter', payload: value })
  }

  return (
    <StoryFrame title="Append Mode" description="Cursor-style loading with automatic bottom loading indicators from the shadcn wrapper.">
      <FilterButtons filterCategory={filterCategory} setFilterCategory={setFilterCategory} />
      <ItemsTable model={model} />
    </StoryFrame>
  )
}

export function AppendModeManualLoadMore() {
  const [filterCategory, setFilterCategoryState] = useState('')

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

  function setFilterCategory(value: string) {
    setFilterCategoryState(value)
    model.send({ action: 'filter', payload: value })
  }

  return (
    <StoryFrame
      title="Append Mode Manual Load More"
      description="Manual append flow rendered with the same shadcn table surface and controls."
    >
      <FilterButtons filterCategory={filterCategory} setFilterCategory={setFilterCategory} />
      <div>
        <Button size="sm" onClick={() => model.send({ action: 'loadMore' })}>
          Load more
        </Button>
      </div>
      <ItemsTable model={model} />
    </StoryFrame>
  )
}

export function AppendModeLoadingStates() {
  const [filterCategory, setFilterCategoryState] = useState('')

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

  function setFilterCategory(value: string) {
    setFilterCategoryState(value)
    model.send({ action: 'filter', payload: value })
  }

  return (
    <StoryFrame
      title="Append Mode Loading States"
      description="Uses the built-in shadcn loading placeholder, refresh overlay, and append footer directly from the registry wrapper."
    >
      <FilterButtons filterCategory={filterCategory} setFilterCategory={setFilterCategory} />
      <ItemsTable model={model} />
    </StoryFrame>
  )
}

export function AppendModeLoadingError() {
  const [filterCategory, setFilterCategoryState] = useState('')

  const model = useMemo(() => {
    let loadMoreCount = 0
    return remoteSource<Item, Params>({
      mode: 'append',
      fetch: async (params: AppendFetchParams<Params>) => {
        await delay(300)
        if (params.signal.aborted) {
          throw new Error('aborted')
        }

        const startIndex = (params.cursor as number | undefined) ?? 0
        if (startIndex === 0) {
          loadMoreCount = 0
        } else {
          loadMoreCount += 1
        }
        if (loadMoreCount >= 1 && startIndex > 0) {
          throw new Error('Load more failed')
        }

        let data = [...ALL_ITEMS].slice(0, TOTAL_ITEMS)
        if (params.params.filterCategory) {
          data = data.filter((item) => item.category === params.params.filterCategory)
        }

        const rows = data.slice(startIndex, startIndex + params.limit)
        const nextCursor = startIndex + rows.length
        return { rows, hasMore: nextCursor < data.length, cursor: nextCursor }
      },
      initialParams: {},
      pageSize: PAGE_SIZE,
      onViewportChange: defaultAppendViewportHandler,
      actions: {
        filter: {
          handler: ({ payload, params }) => ({ ...params, filterCategory: payload as string }),
        },
      },
    })
  }, [])

  function setFilterCategory(value: string) {
    setFilterCategoryState(value)
    model.send({ action: 'filter', payload: value })
  }

  return (
    <StoryFrame
      title="Append Mode Loading Error"
      description="The second append fetch fails so the registry footer can render its error state without any story-specific loading UI."
    >
      <FilterButtons filterCategory={filterCategory} setFilterCategory={setFilterCategory} />
      <ItemsTable model={model} />
    </StoryFrame>
  )
}

export function RemoteWithSortAndFilterLoadingOverlay() {
  const [filterCategory, setFilterCategoryState] = useState('')
  const [sortBy, setSortByState] = useState('')

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

  function setFilterCategory(value: string) {
    setFilterCategoryState(value)
    model.send({ action: 'filter', payload: value })
  }

  function setSortBy(value: string) {
    setSortByState(value)
    model.send({ action: 'sort', payload: value })
  }

  return (
    <StoryFrame
      title="Remote Refresh Overlay"
      description="Changing query params keeps the current rows visible while the shadcn overlay reflects the refresh state."
    >
      <FilterButtons filterCategory={filterCategory} setFilterCategory={setFilterCategory} />
      <SortButtons sortBy={sortBy} setSortBy={setSortBy} />
      <ItemsTable model={model} />
    </StoryFrame>
  )
}

export function InitialRemoteLoading() {
  const model = useMemo(
    () =>
      remoteSource<Item, Params>({
        mode: 'append',
        fetch: async (params: AppendFetchParams<Params>) => {
          await delay(1000)
          if (params.signal.aborted) {
            throw new Error('aborted')
          }

          const startIndex = (params.cursor as number | undefined) ?? 0
          const rows = ALL_ITEMS.slice(startIndex, startIndex + params.limit)
          const nextCursor = startIndex + rows.length
          return { rows, hasMore: nextCursor < ALL_ITEMS.length, cursor: nextCursor }
        },
        initialParams: {},
        pageSize: PAGE_SIZE,
      }),
    []
  )

  return (
    <StoryFrame
      title="Initial Remote Loading"
      description="Slow first load using the built-in shadcn loading placeholder while the empty placeholder stays suppressed."
    >
      <ItemsTable model={model} emptyPlaceholder={EmptyPlaceholder} />
    </StoryFrame>
  )
}
