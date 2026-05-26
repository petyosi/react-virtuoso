import type { CSSProperties, ReactNode } from 'react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ColumnGroup,
  ColumnGroupHeader,
  DataTable,
  DataTableCell,
  DataTableColumn,
  DataTableColumnHeader,
} from '@/components/ui/data-table'

import { DynamicColumns, defaultOffsetViewportHandler, localModel, remoteModel } from '..'
import { delay } from '../tests/utils'

import type { DataModelHandle, FetchParams } from '..'

type RuntimeRow = Record<string, string | number | boolean | null>

interface RuntimeFieldDescriptor {
  field: string
  sampleValue: unknown
}

const TABLE_STYLE: CSSProperties = { height: 360 }
const TABLE_CLASS_NAME = 'rounded-xl'
const DEFAULT_SKIP_FIELDS = ['id', 'actions']
const ACTIONS_SKIP_FIELDS = ['actions']

const USER_ROWS: RuntimeRow[] = [
  { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', plan: 'Enterprise', active: true, actions: 'Open' },
  { id: 2, name: 'Grace Hopper', email: 'grace@example.com', plan: 'Team', active: true, actions: 'Open' },
  { id: 3, name: 'Katherine Johnson', email: 'katherine@example.com', plan: 'Starter', active: false, actions: 'Open' },
]

const ORDER_ROWS: RuntimeRow[] = [
  { id: 10_041, customer: 'Acme Labs', total: 2040, status: 'Paid', region: 'North', actions: 'Open' },
  { id: 10_042, customer: 'Globex', total: 880, status: 'Pending', region: 'West', actions: 'Open' },
  { id: 10_043, customer: 'Initech', total: 1320, status: 'Paid', region: 'East', actions: 'Open' },
]

const REMOTE_ROWS: RuntimeRow[] = Array.from({ length: 80 }, (_, index) => ({
  id: index + 1,
  customer: ['Acme Labs', 'Globex', 'Initech', 'Umbrella'][index % 4]!,
  total: 420 + index * 17,
  status: index % 3 === 0 ? 'Review' : 'Ready',
  region: ['North', 'West', 'East', 'South'][index % 4]!,
  actions: 'Open',
}))

const METRIC_ROWS: RuntimeRow[] = [
  { id: 1, market: 'North', owner: 'Ada', revenue: 124_000, margin: 0.32, units: 412, actions: 'Open' },
  { id: 2, market: 'West', owner: 'Grace', revenue: 98_500, margin: 0.27, units: 318, actions: 'Open' },
  { id: 3, market: 'East', owner: 'Katherine', revenue: 142_300, margin: 0.36, units: 461, actions: 'Open' },
]

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

function fieldLabel(field: string) {
  return field
    .replaceAll('_', ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatValue(value: unknown) {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  return value === null || value === undefined ? '' : String(value)
}

function discoverRuntimeFields(data: readonly RuntimeRow[], includeField: (field: string) => boolean = () => true) {
  const fields: RuntimeFieldDescriptor[] = []
  const fieldByName = new Map<string, RuntimeFieldDescriptor>()
  const hasSample = new Set<string>()

  for (const row of data) {
    for (const [field, value] of Object.entries(row)) {
      if (!includeField(field)) {
        continue
      }

      let descriptor = fieldByName.get(field)
      if (!descriptor) {
        descriptor = { field, sampleValue: value ?? null }
        fieldByName.set(field, descriptor)
        fields.push(descriptor)
      }

      if (!hasSample.has(field) && value !== null && value !== undefined) {
        descriptor.sampleValue = value
        hasSample.add(field)
      }
    }
  }

  return fields
}

function RuntimeColumn({ descriptor }: { descriptor: RuntimeFieldDescriptor }) {
  const numeric = typeof descriptor.sampleValue === 'number'

  return (
    <DataTableColumn key={descriptor.field} field={descriptor.field}>
      <DataTableColumnHeader className={numeric ? 'min-w-32 justify-end' : 'min-w-32'}>
        {fieldLabel(descriptor.field)}
      </DataTableColumnHeader>
      <DataTableCell {...(numeric ? { className: 'text-right tabular-nums' } : {})}>
        {({ cellValue }) => formatValue(cellValue)}
      </DataTableCell>
    </DataTableColumn>
  )
}

function RuntimeFieldColumns({ skip = DEFAULT_SKIP_FIELDS }: { skip?: readonly string[] }) {
  return (
    <DynamicColumns<RuntimeRow>>
      {({ data }) =>
        discoverRuntimeFields(data, (field) => !skip.includes(field)).map((descriptor) => (
          <RuntimeColumn descriptor={descriptor} key={descriptor.field} />
        ))
      }
    </DynamicColumns>
  )
}

function RuntimeTable({ model, tableKey }: { model: DataModelHandle<RuntimeRow>; tableKey?: string }) {
  return (
    <DataTable key={tableKey} className={TABLE_CLASS_NAME} model={model} style={TABLE_STYLE}>
      <DataTableColumn field="id" sticky="left">
        <DataTableColumnHeader className="w-20">ID</DataTableColumnHeader>
        <DataTableCell>
          {({ cellValue }) => <span className="text-muted-foreground tabular-nums">{formatValue(cellValue)}</span>}
        </DataTableCell>
      </DataTableColumn>
      <RuntimeFieldColumns />
      <DataTableColumn field="actions" sticky="right">
        <DataTableColumnHeader className="w-24">Actions</DataTableColumnHeader>
        <DataTableCell>{({ cellValue }) => <Button size="sm">{formatValue(cellValue)}</Button>}</DataTableCell>
      </DataTableColumn>
    </DataTable>
  )
}

async function fetchRows(params: FetchParams) {
  await delay(250)
  if (params.signal.aborted) {
    throw new Error('aborted')
  }

  return {
    rows: REMOTE_ROWS.slice(params.offset, params.offset + params.limit),
    totalCount: REMOTE_ROWS.length,
  }
}

export function LocalRuntimeColumns() {
  const [shape, setShape] = useState<'users' | 'orders'>('users')
  const rows = shape === 'users' ? USER_ROWS : ORDER_ROWS
  const model = useMemo(() => localModel<RuntimeRow>({ data: rows }), [rows])

  return (
    <StoryFrame
      title="Local Runtime Columns"
      description="The table derives the middle columns from the first non-empty local data result and keeps static ID/actions columns in place."
    >
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={shape === 'users' ? 'default' : 'outline'} onClick={() => setShape('users')}>
          Users
        </Button>
        <Button size="sm" variant={shape === 'orders' ? 'default' : 'outline'} onClick={() => setShape('orders')}>
          Orders
        </Button>
      </div>
      <RuntimeTable model={model} tableKey={shape} />
    </StoryFrame>
  )
}

export function RuntimeOnlyColumns() {
  const model = useMemo(() => localModel<RuntimeRow>({ data: ORDER_ROWS }), [])

  return (
    <StoryFrame title="Runtime Only Columns" description="Every visible column is generated from the first local data result.">
      <DataTable className={TABLE_CLASS_NAME} model={model} style={TABLE_STYLE}>
        <RuntimeFieldColumns skip={ACTIONS_SKIP_FIELDS} />
      </DataTable>
    </StoryFrame>
  )
}

export function RemoteRuntimeColumns() {
  const model = useMemo(
    () =>
      remoteModel<RuntimeRow>({
        fetch: fetchRows,
        initialParams: {},
        pageSize: 20,
        placeholder: { id: 0, customer: '', total: 0, status: '', region: '', actions: '' },
        onViewportChange: defaultOffsetViewportHandler,
      }),
    []
  )

  return (
    <StoryFrame
      title="Remote Runtime Columns"
      description="The runtime columns wait for the initial remote result, then stay fixed while offset placeholders and later data fill in."
    >
      <DataTable className={TABLE_CLASS_NAME} model={model} style={TABLE_STYLE}>
        <DataTableColumn field="id" sticky="left">
          <DataTableColumnHeader className="w-20">ID</DataTableColumnHeader>
          <DataTableCell>
            {({ cellValue }) => <span className="text-muted-foreground tabular-nums">{formatValue(cellValue)}</span>}
          </DataTableCell>
        </DataTableColumn>
        <RuntimeFieldColumns />
        <DataTableColumn field="actions" sticky="right">
          <DataTableColumnHeader className="w-24">Actions</DataTableColumnHeader>
          <DataTableCell>{({ cellValue }) => <Button size="sm">{formatValue(cellValue)}</Button>}</DataTableCell>
        </DataTableColumn>
      </DataTable>
    </StoryFrame>
  )
}

export function GroupedRuntimeColumns() {
  const model = useMemo(() => localModel<RuntimeRow>({ data: METRIC_ROWS }), [])

  return (
    <StoryFrame
      title="Grouped Runtime Columns"
      description="The render prop can partition discovered fields and declare column groups from the captured data shape."
    >
      <DataTable className={TABLE_CLASS_NAME} model={model} style={TABLE_STYLE}>
        <DataTableColumn field="id" sticky="left">
          <DataTableColumnHeader className="w-20">ID</DataTableColumnHeader>
          <DataTableCell>
            {({ cellValue }) => <span className="text-muted-foreground tabular-nums">{formatValue(cellValue)}</span>}
          </DataTableCell>
        </DataTableColumn>
        <DynamicColumns<RuntimeRow>>
          {({ data }) => {
            const fields = discoverRuntimeFields(data, (field) => !DEFAULT_SKIP_FIELDS.includes(field))
            const metrics = fields.filter(({ sampleValue }) => typeof sampleValue === 'number')
            const attributes = fields.filter(({ sampleValue }) => typeof sampleValue !== 'number')

            return (
              <>
                <ColumnGroup>
                  <ColumnGroupHeader>
                    {() => <div className="flex h-8 items-center px-2 text-sm font-medium">Attributes</div>}
                  </ColumnGroupHeader>
                  {attributes.map((descriptor) => (
                    <RuntimeColumn descriptor={descriptor} key={descriptor.field} />
                  ))}
                </ColumnGroup>
                <ColumnGroup>
                  <ColumnGroupHeader>
                    {() => <div className="flex h-8 items-center justify-end px-2 text-sm font-medium">Metrics</div>}
                  </ColumnGroupHeader>
                  {metrics.map((descriptor) => (
                    <RuntimeColumn descriptor={descriptor} key={descriptor.field} />
                  ))}
                </ColumnGroup>
              </>
            )
          }}
        </DynamicColumns>
        <DataTableColumn field="actions" sticky="right">
          <DataTableColumnHeader className="w-24">Actions</DataTableColumnHeader>
          <DataTableCell>{({ cellValue }) => <Button size="sm">{formatValue(cellValue)}</Button>}</DataTableCell>
        </DataTableColumn>
      </DataTable>
    </StoryFrame>
  )
}
