import { useCallback, useEffect, useMemo, useState } from 'react'

import { columns$, remoteSource, useCellValue, usePublisher } from '@virtuoso.dev/data-table'
import { columnOrderPersistenceAdapter } from '@virtuoso.dev/data-table/column-reorder'
import { columnWidthPersistenceAdapter } from '@virtuoso.dev/data-table/column-resize'
import { columnVisibilityPersistenceAdapter, columnVisibilityState$, setColumnVisibility$ } from '@virtuoso.dev/data-table/column-visibility'
import { DataTableStatePersistence, modelStatePersistenceAdapter } from '@virtuoso.dev/data-table/state-persistence'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DataTable,
  DataTableCell,
  DataTableColumn,
  DataTableColumnHeader,
  DataTableGroupHeader,
  HeaderEdge,
  HeaderOverlay,
  HeaderStart,
} from '@/components/ui/data-table'
import { ReorderDropZone, ReorderGrip } from '@/components/ui/data-table/column-reorder'
import { ResizeHandle } from '@/components/ui/data-table/column-resize'

import type { DataModelHandle, DataResult, GroupHeaderRenderParams, MessageEnvelope, ModelPersistenceState } from '@virtuoso.dev/data-table'

type DatasetKey = 'people' | 'orders' | 'metrics'
type SortField = 'id' | 'name' | 'status' | ''
type StatusFilter = 'Active' | 'Pending' | 'Paid' | 'Open' | ''
type GroupField = 'status' | 'city' | ''
type RemoteDataRow = Record<string, number | string>
type RemoteRow = RemoteDataRow | RemoteGroupRow

interface RemoteGroupRow {
  groupLabel: string
}

interface Dataset {
  label: string
  rows: RemoteDataRow[]
}

interface DemoParams {
  dataset: DatasetKey
  filterStatus?: StatusFilter
  groupBy?: GroupField
  sortBy?: SortField
}

const QUERY_STORAGE_KEY = 'virtuoso:data-table:model-state-persistence'
const COMBINED_STORAGE_KEY = 'virtuoso:data-table:combined-model-state-persistence'

const DATASETS: Record<DatasetKey, Dataset> = {
  people: {
    label: 'People',
    rows: Array.from({ length: 36 }, (_, index) => ({
      id: `USR-${String(index + 1).padStart(3, '0')}`,
      name: `User ${index + 1}`,
      status: ['Active', 'Pending', 'Paused'][index % 3]!,
      city: ['Sofia', 'Berlin', 'Madrid', 'Oslo'][index % 4]!,
    })),
  },
  orders: {
    label: 'Orders',
    rows: Array.from({ length: 30 }, (_, index) => ({
      id: `ORD-${String(index + 1).padStart(3, '0')}`,
      customer: `Customer ${index + 1}`,
      status: ['Paid', 'Open', 'Overdue'][index % 3]!,
      total: `$${(160 + index * 19).toLocaleString()}`,
    })),
  },
  metrics: {
    label: 'Metrics',
    rows: Array.from({ length: 28 }, (_, index) => ({
      id: `MET-${String(index + 1).padStart(3, '0')}`,
      name: `Metric ${index + 1}`,
      score: 80 + (index % 17),
      trend: ['Up', 'Flat', 'Down'][index % 3]!,
    })),
  },
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function fieldsFromResult(result: DataResult<RemoteRow>) {
  const fields: string[] = []
  const seen = new Set<string>()

  for (const row of result.data) {
    if (!row || isGroupRow(row)) {
      continue
    }

    for (const field of Object.keys(row)) {
      if (!seen.has(field)) {
        seen.add(field)
        fields.push(field)
      }
    }
  }

  return fields
}

function compareRows(field: string) {
  return (left: RemoteDataRow, right: RemoteDataRow) => String(left[field] ?? '').localeCompare(String(right[field] ?? ''))
}

function isGroupRow(row: RemoteRow): row is RemoteGroupRow {
  return 'groupLabel' in row
}

function groupRows(rows: RemoteDataRow[], field: GroupField): { groups: { index: number; level: number }[]; rows: RemoteRow[] } {
  if (!field) {
    return { rows, groups: [] }
  }

  const buckets = new Map<string, RemoteDataRow[]>()
  for (const row of rows) {
    const key = String(row[field] ?? '(blank)')
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = []
      buckets.set(key, bucket)
    }
    bucket.push(row)
  }

  const groupedRows: RemoteRow[] = []
  const groups: { index: number; level: number }[] = []
  for (const key of [...buckets.keys()].toSorted((left, right) => left.localeCompare(right))) {
    const bucketRows = buckets.get(key)!
    groups.push({ index: groupedRows.length, level: 0 })
    groupedRows.push({ groupLabel: `${field}: ${key} (${bucketRows.length})` })
    groupedRows.push(...bucketRows)
  }

  return { rows: groupedRows, groups }
}

async function fetchRows({ limit, offset, params, signal }: { limit: number; offset: number; params: DemoParams; signal: AbortSignal }) {
  await wait(160)
  if (signal.aborted) {
    throw new Error('aborted')
  }

  let rows = [...DATASETS[params.dataset].rows]
  if (params.filterStatus) {
    rows = rows.filter((row) => row.status === params.filterStatus)
  }
  if (params.groupBy) {
    const sortedRows = params.sortBy ? rows.toSorted(compareRows(params.sortBy)) : rows
    const result = groupRows(sortedRows, params.groupBy)
    return {
      rows: result.rows.slice(offset, offset + limit),
      groups: result.groups,
      totalCount: result.rows.length,
    }
  } else if (params.sortBy) {
    rows.sort(compareRows(params.sortBy))
  }

  return {
    rows: rows.slice(offset, offset + limit),
    totalCount: rows.length,
  }
}

function createModel() {
  return remoteSource<RemoteRow, DemoParams>({
    fetch: fetchRows,
    initialParams: { dataset: 'people' },
    pageSize: 50,
    actions: {
      dataset: {
        handler: ({ payload, params }) => ({ ...params, dataset: payload as DatasetKey }),
      },
      filterStatus: {
        handler: ({ payload, params }) => ({ ...params, filterStatus: payload as StatusFilter }),
        persistence: {
          isEmpty: (value) => value === '',
          key: 'status',
        },
      },
      groupBy: {
        handler: ({ payload, params }) => ({ ...params, groupBy: payload as GroupField }),
        persistence: {
          isEmpty: (value) => value === '',
        },
      },
      sort: {
        handler: ({ payload, params }) => ({ ...params, sortBy: payload as SortField }),
        persistence: {
          isEmpty: (value) => value === '',
        },
      },
    },
  })
}

function useDiscoveredFields(model: DataModelHandle<RemoteRow>) {
  const [fields, setFields] = useState<string[]>([])

  useEffect(() => {
    return model.subscribe((message: MessageEnvelope) => {
      if (message.type !== 'result') {
        return
      }

      setFields(fieldsFromResult(message.payload as DataResult<RemoteRow>))
    })
  }, [model])

  return fields
}

function currentModelState(model: DataModelHandle<RemoteRow>): ModelPersistenceState {
  return model.persistence?.capture('default', null) ?? { version: 1, actions: {} }
}

function useModelState(model: DataModelHandle<RemoteRow>) {
  const [state, setState] = useState<ModelPersistenceState>(() => currentModelState(model))

  useEffect(() => {
    setState(currentModelState(model))
    return model.persistence?.subscribe('default', () => setState(currentModelState(model)))
  }, [model])

  return state
}

function actionValue<T extends string>(state: ModelPersistenceState, key: string, fallback: T): T {
  const value = state.actions[key]
  return typeof value === 'string' ? (value as T) : fallback
}

function QueryControls({
  dataset,
  model,
  onDatasetChange,
  onReset,
}: {
  dataset: DatasetKey
  model: DataModelHandle<RemoteRow>
  onDatasetChange: (dataset: DatasetKey) => void
  onReset: () => void
}) {
  const state = useModelState(model)
  const sort = actionValue<SortField>(state, 'sort', '')
  const status = actionValue<StatusFilter>(state, 'status', '')
  const groupBy = actionValue<GroupField>(state, 'groupBy', '')

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(DATASETS) as DatasetKey[]).map((key) => (
          <Button key={key} size="sm" type="button" variant={dataset === key ? 'default' : 'outline'} onClick={() => onDatasetChange(key)}>
            {DATASETS[key].label}
          </Button>
        ))}
        <Button size="sm" type="button" variant="outline" onClick={onReset}>
          Reset saved state
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['', 'id', 'name', 'status'] as SortField[]).map((field) => (
          <Button
            key={field || 'none'}
            size="sm"
            type="button"
            variant={sort === field ? 'default' : 'outline'}
            onClick={() => model.send({ action: 'sort', payload: field })}
          >
            {field ? `Sort ${field}` : 'No sort'}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(['', 'Active', 'Pending', 'Paid', 'Open'] as StatusFilter[]).map((value) => (
          <Button
            key={value || 'all'}
            size="sm"
            type="button"
            variant={status === value ? 'default' : 'outline'}
            onClick={() => model.send({ action: 'filterStatus', payload: value })}
          >
            {value ? `Status ${value}` : 'All statuses'}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(['', 'status', 'city'] as GroupField[]).map((field) => (
          <Button
            key={field || 'none'}
            size="sm"
            type="button"
            variant={groupBy === field ? 'default' : 'outline'}
            onClick={() => model.send({ action: 'groupBy', payload: field })}
          >
            {field ? `Group ${field}` : 'No grouping'}
          </Button>
        ))}
      </div>

      <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Persisted model actions:</span>{' '}
        {Object.keys(state.actions).length === 0 ? 'none' : JSON.stringify(state.actions)}
      </div>
    </div>
  )
}

function ColumnVisibilityPicker() {
  const columns = useCellValue(columns$)
  const visibility = useCellValue(columnVisibilityState$)
  const setColumnVisibility = usePublisher(setColumnVisibility$)

  return (
    <div className="flex flex-wrap gap-2 rounded-md border bg-muted/30 p-3">
      {[...columns].map(([key, column]) => {
        const visible = visibility.get(key) ?? column.visible !== false
        return (
          <Button
            key={key}
            aria-pressed={visible}
            size="sm"
            type="button"
            variant={visible ? 'default' : 'outline'}
            onClick={() => setColumnVisibility({ key, visible: !visible })}
          >
            {column.field}
          </Button>
        )
      })}
    </div>
  )
}

function RemoteColumns({ fields, interactive }: { fields: string[]; interactive?: boolean }) {
  return (
    <>
      {fields.map((field) => (
        <DataTableColumn key={field} field={field}>
          <DataTableColumnHeader className="min-w-32">
            {interactive && <HeaderStart component={ReorderGrip} />}
            {interactive && <HeaderOverlay component={ReorderDropZone} />}
            {interactive && <HeaderEdge component={ResizeHandle} />}
            {() => field}
          </DataTableColumnHeader>
          <DataTableCell>{({ cellValue }) => String(cellValue)}</DataTableCell>
        </DataTableColumn>
      ))}
    </>
  )
}

function RemoteGroupHeader() {
  return (
    <DataTableGroupHeader>
      {({ row }: GroupHeaderRenderParams) => (isGroupRow(row.data as RemoteRow) ? (row.data as RemoteGroupRow).groupLabel : '')}
    </DataTableGroupHeader>
  )
}

export function PersistentRemoteQueryState() {
  const [dataset, setDataset] = useState<DatasetKey>('people')
  const [persistenceResetKey, setPersistenceResetKey] = useState(0)
  const model = useMemo(createModel, [])
  const fields = useDiscoveredFields(model)
  const persistenceAdapters = useMemo(() => [modelStatePersistenceAdapter()], [])

  const switchDataset = useCallback(
    (nextDataset: DatasetKey) => {
      setDataset(nextDataset)
      model.send({ action: 'dataset', payload: nextDataset })
    },
    [model]
  )

  return (
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <CardTitle>Persistent Remote Query State</CardTitle>
        <CardDescription>
          Sort, filter, and grouping intent are persisted through the model. Dataset switching is intentionally not persisted.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <QueryControls
          dataset={dataset}
          model={model}
          onDatasetChange={switchDataset}
          onReset={() => setPersistenceResetKey((key) => key + 1)}
        />

        <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Discovered fields:</span> {fields.length === 0 ? 'loading' : fields.join(', ')}
        </div>

        <DataTable className="rounded-xl" model={model} style={{ height: 420 }}>
          <DataTableStatePersistence
            adapters={persistenceAdapters}
            resetKey={persistenceResetKey}
            storageKey={QUERY_STORAGE_KEY}
          />
          <RemoteGroupHeader />
          <RemoteColumns fields={fields} />
        </DataTable>
      </CardContent>
    </Card>
  )
}

export function PersistentTableAndQueryState() {
  const [dataset, setDataset] = useState<DatasetKey>('people')
  const [persistenceResetKey, setPersistenceResetKey] = useState(0)
  const model = useMemo(createModel, [])
  const fields = useDiscoveredFields(model)
  const persistenceAdapters = useMemo(
    () => [columnVisibilityPersistenceAdapter(), columnOrderPersistenceAdapter(), columnWidthPersistenceAdapter(), modelStatePersistenceAdapter()],
    []
  )

  const switchDataset = useCallback(
    (nextDataset: DatasetKey) => {
      setDataset(nextDataset)
      model.send({ action: 'dataset', payload: nextDataset })
    },
    [model]
  )

  return (
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <CardTitle>Persistent Table And Query State</CardTitle>
        <CardDescription>
          Combines model action persistence with column width, order, and visibility persistence across partially matching schemas.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <QueryControls
          dataset={dataset}
          model={model}
          onDatasetChange={switchDataset}
          onReset={() => setPersistenceResetKey((key) => key + 1)}
        />

        <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Discovered fields:</span> {fields.length === 0 ? 'loading' : fields.join(', ')}
        </div>

        <DataTable className="rounded-xl" model={model} style={{ height: 420 }}>
          <DataTableStatePersistence
            adapters={persistenceAdapters}
            resetKey={persistenceResetKey}
            storageKey={COMBINED_STORAGE_KEY}
          />
          <ColumnVisibilityPicker />
          <RemoteGroupHeader />
          <RemoteColumns fields={fields} interactive />
        </DataTable>
      </CardContent>
    </Card>
  )
}
