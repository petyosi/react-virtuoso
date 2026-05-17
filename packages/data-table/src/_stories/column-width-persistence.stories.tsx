import { useCallback, useEffect, useMemo, useState } from 'react'

import { remoteModel } from '@virtuoso.dev/data-table'
import { columnOrderPersistenceAdapter } from '@virtuoso.dev/data-table/column-reorder'
import { columnWidthPersistenceAdapter } from '@virtuoso.dev/data-table/column-resize'
import { DataTableStatePersistence } from '@virtuoso.dev/data-table/state-persistence'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DataTable,
  DataTableCell,
  DataTableColumn,
  DataTableColumnHeader,
  HeaderEdge,
  HeaderOverlay,
  HeaderStart,
} from '@/components/ui/data-table'
import { ReorderDropZone, ReorderGrip } from '@/components/ui/data-table/column-reorder'
import { ResizeHandle } from '@/components/ui/data-table/column-resize'

import type { DataModelHandle, DataResult, MessageEnvelope } from '@virtuoso.dev/data-table'

type DatasetKey = 'people' | 'orders' | 'metrics'
type RemoteRow = Record<string, number | string>

interface Dataset {
  label: string
  rows: RemoteRow[]
}

interface DemoParams {
  dataset: DatasetKey
}

const STORAGE_KEY = 'virtuoso:data-table:column-state-persistence'

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
      status: ['Paid', 'Open', 'Overdue'][index % 3]!,
      customer: `Customer ${index + 1}`,
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
    if (!row) {
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

async function fetchRows({ limit, offset, params, signal }: { limit: number; offset: number; params: DemoParams; signal: AbortSignal }) {
  await wait(160)
  if (signal.aborted) {
    throw new Error('aborted')
  }

  const rows = DATASETS[params.dataset].rows
  return {
    rows: rows.slice(offset, offset + limit),
    totalCount: rows.length,
  }
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

export function PersistentColumnWidthsWithRemoteSchema() {
  const [dataset, setDataset] = useState<DatasetKey>('people')
  const [persistenceResetKey, setPersistenceResetKey] = useState(0)
  const model = useMemo(
    () =>
      remoteModel<RemoteRow, DemoParams>({
        fetch: fetchRows,
        initialParams: { dataset: 'people' },
        pageSize: 50,
        actions: {
          dataset: {
            handler: ({ payload }) => ({ dataset: payload as DatasetKey }),
          },
        },
      }),
    []
  )
  const persistenceAdapters = useMemo(() => [columnOrderPersistenceAdapter(), columnWidthPersistenceAdapter()], [])
  const fields = useDiscoveredFields(model)

  const switchDataset = useCallback(
    (nextDataset: DatasetKey) => {
      setDataset(nextDataset)
      model.send({ action: 'dataset', payload: nextDataset })
    },
    [model]
  )

  const reset = useCallback(() => {
    setPersistenceResetKey((key) => key + 1)
  }, [])

  return (
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <CardTitle>Persistent Column State</CardTitle>
        <CardDescription>
          Reorder and resize columns, switch datasets, and reload the story. State is saved by field name and restored only when matching
          columns are present.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(DATASETS) as DatasetKey[]).map((key) => (
            <Button key={key} size="sm" type="button" variant={dataset === key ? 'default' : 'outline'} onClick={() => switchDataset(key)}>
              {DATASETS[key].label}
            </Button>
          ))}
          <Button size="sm" type="button" variant="outline" onClick={reset}>
            Reset saved state
          </Button>
        </div>

        <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Discovered fields:</span> {fields.length === 0 ? 'loading' : fields.join(', ')}
        </div>

        <DataTable className="rounded-xl" model={model} style={{ height: 420 }}>
          <DataTableStatePersistence adapters={persistenceAdapters} resetKey={persistenceResetKey} storageKey={STORAGE_KEY} />
          {fields.map((field) => (
            <DataTableColumn key={field} field={field}>
              <DataTableColumnHeader className="min-w-32">
                <HeaderStart component={ReorderGrip} />
                <HeaderOverlay component={ReorderDropZone} />
                <HeaderEdge component={ResizeHandle} />
                {() => field}
              </DataTableColumnHeader>
              <DataTableCell>{({ cellValue }) => String(cellValue)}</DataTableCell>
            </DataTableColumn>
          ))}
        </DataTable>
      </CardContent>
    </Card>
  )
}
