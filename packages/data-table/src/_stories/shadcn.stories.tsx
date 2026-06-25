import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'

import { localModel } from '@virtuoso.dev/data-table'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DataTable,
  DataTableCell,
  DataTableColumn,
  DataTableColumnHeader,
  HeaderEdge,
  HeaderEnd,
  HeaderOverlay,
  HeaderStart,
} from '@/components/ui/data-table'
import { ReorderDropZone, ReorderGrip } from '@/components/ui/data-table/column-reorder'
import { ResizeHandle } from '@/components/ui/data-table/column-resize'
import { SortHeaderButton } from '@/components/ui/data-table/column-sort'

import type { SortDirection } from '@/components/ui/data-table/column-sort'

interface User {
  id: number
  name: string
  email: string
  role: string
  status: string
}

interface PromptTemplate {
  id: string
  title: string
  summary: string
  owner: string
  status: 'Draft' | 'Published' | 'Review'
  updatedMinutes: number
}

const ALL_ITEMS: User[] = Array.from({ length: 200 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: ['Admin', 'Editor', 'Viewer'][i % 3]!,
  status: i % 5 === 0 ? 'inactive' : 'active',
}))

const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'prompt-001',
    title: 'Data Pipeline Risk Review',
    summary: 'Reviews pipeline incidents with customer context, recent evidence, and escalation notes.',
    owner: 'Platform',
    status: 'Published',
    updatedMinutes: 29,
  },
  {
    id: 'prompt-002',
    title: 'Support Refund Triage With Regional Exceptions',
    summary: 'Sorts refund cases by customer impact, plan tier, region, and policy exception state.',
    owner: 'Support',
    status: 'Review',
    updatedMinutes: 74,
  },
  {
    id: 'prompt-003',
    title: 'Billing Evidence Extractor',
    summary: 'Extracts invoices, subscription events, adjustments, and customer-visible explanations.',
    owner: 'Billing',
    status: 'Published',
    updatedMinutes: 180,
  },
  {
    id: 'prompt-004',
    title: 'Incident Account Renewal Guide',
    summary: 'Builds renewal guidance from incident timelines, account state, and commercial context.',
    owner: 'Success',
    status: 'Draft',
    updatedMinutes: 330,
  },
  {
    id: 'prompt-005',
    title: 'Feature Flag Signal Classifier',
    summary: 'Classifies rollout signals from flag events, support notes, telemetry, and account metadata.',
    owner: 'Product',
    status: 'Review',
    updatedMinutes: 520,
  },
  {
    id: 'prompt-006',
    title: 'Onboarding Follow Up Planner',
    summary: 'Plans follow-up messages by combining customer goals, setup tasks, and usage evidence.',
    owner: 'Success',
    status: 'Published',
    updatedMinutes: 960,
  },
]

const TABLE_STYLE: CSSProperties = { height: 400 }
const INTERACTIVE_TABLE_STYLE: CSSProperties = { height: 420 }
const SORTABLE_TABLE_STYLE: CSSProperties = { height: 360 }

type PromptSortField = Extract<keyof PromptTemplate, 'owner' | 'status' | 'summary' | 'title' | 'updatedMinutes'>

interface PromptSortPayload {
  field: PromptSortField
  direction: SortDirection
}

function isPromptSortPayload(payload: unknown): payload is PromptSortPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false
  }

  const sort = payload as Partial<PromptSortPayload>
  return (
    (sort.field === 'owner' ||
      sort.field === 'status' ||
      sort.field === 'summary' ||
      sort.field === 'title' ||
      sort.field === 'updatedMinutes') &&
    (sort.direction === 'asc' || sort.direction === 'desc')
  )
}

function comparePromptTemplates(sort: PromptSortPayload) {
  return (left: PromptTemplate, right: PromptTemplate) => {
    const leftValue = left[sort.field]
    const rightValue = right[sort.field]
    const result =
      typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue), undefined, { numeric: true })

    return sort.direction === 'asc' ? result : -result
  }
}

function promptTemplateSortHandler({ data, payload }: { data: PromptTemplate[]; payload: unknown }) {
  if (!isPromptSortPayload(payload)) {
    return data
  }

  return data.toSorted(comparePromptTemplates(payload))
}

function formatUpdated(minutes: number) {
  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.round(minutes / 60)
  return `${hours}h ago`
}

export function ShadcnDataTable() {
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const filteredItems = useMemo(() => {
    return filter === 'all' ? ALL_ITEMS : ALL_ITEMS.filter((item) => item.status === filter)
  }, [filter])
  const model = useMemo(() => localModel<User>({ data: ALL_ITEMS }), [])

  useEffect(() => {
    model.setData?.(filteredItems)
  }, [filteredItems, model])

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>{filteredItems.length} users total</CardDescription>
        <div className="flex gap-2 pt-2">
          <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>
            All
          </Button>
          <Button variant={filter === 'active' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('active')}>
            Active
          </Button>
          <Button variant={filter === 'inactive' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('inactive')}>
            Inactive
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable model={model} style={TABLE_STYLE}>
          <DataTableColumn field="id">
            <DataTableColumnHeader>ID</DataTableColumnHeader>
            <DataTableCell>
              {({ cellValue }) => <span className="text-muted-foreground tabular-nums">{String(cellValue)}</span>}
            </DataTableCell>
          </DataTableColumn>

          <DataTableColumn field="name">
            <DataTableColumnHeader>Name</DataTableColumnHeader>
            <DataTableCell>{({ cellValue }) => <span className="font-medium">{String(cellValue)}</span>}</DataTableCell>
          </DataTableColumn>

          <DataTableColumn field="email">
            <DataTableColumnHeader>Email</DataTableColumnHeader>
            <DataTableCell>{({ cellValue }) => <span className="text-muted-foreground">{String(cellValue)}</span>}</DataTableCell>
          </DataTableColumn>

          <DataTableColumn field="role">
            <DataTableColumnHeader>Role</DataTableColumnHeader>
            <DataTableCell>{({ cellValue }) => String(cellValue)}</DataTableCell>
          </DataTableColumn>

          <DataTableColumn field="status">
            <DataTableColumnHeader>Status</DataTableColumnHeader>
            <DataTableCell>
              {({ cellValue }) => {
                const active = cellValue === 'active'
                return (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {String(cellValue)}
                  </span>
                )
              }}
            </DataTableCell>
          </DataTableColumn>
        </DataTable>
      </CardContent>
    </Card>
  )
}

export function ShadcnInteractiveDataTable() {
  const model = useMemo(() => localModel<User>({ data: ALL_ITEMS }), [])

  return (
    <Card className="w-full max-w-5xl">
      <CardHeader>
        <CardTitle>Accounts</CardTitle>
        <CardDescription>Drag the grip to reorder columns. Drag the divider to resize. Double-click the divider to reset.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable className="rounded-xl" model={model} style={INTERACTIVE_TABLE_STYLE}>
          <DataTableColumn field="id">
            <DataTableColumnHeader>
              <HeaderStart component={ReorderGrip} />
              <HeaderOverlay component={ReorderDropZone} />
              <HeaderEdge component={ResizeHandle} />
              {() => 'ID'}
            </DataTableColumnHeader>
            <DataTableCell>
              {({ cellValue }) => <span className="text-muted-foreground tabular-nums">{String(cellValue)}</span>}
            </DataTableCell>
          </DataTableColumn>

          <DataTableColumn field="name">
            <DataTableColumnHeader>
              <HeaderStart component={ReorderGrip} />
              <HeaderOverlay component={ReorderDropZone} />
              <HeaderEdge component={ResizeHandle} />
              {() => 'Name'}
            </DataTableColumnHeader>
            <DataTableCell>{({ cellValue }) => <span className="font-medium">{String(cellValue)}</span>}</DataTableCell>
          </DataTableColumn>

          <DataTableColumn field="email">
            <DataTableColumnHeader>
              <HeaderStart component={ReorderGrip} />
              <HeaderOverlay component={ReorderDropZone} />
              <HeaderEdge component={ResizeHandle} />
              {() => 'Email'}
            </DataTableColumnHeader>
            <DataTableCell>{({ cellValue }) => <span className="text-muted-foreground">{String(cellValue)}</span>}</DataTableCell>
          </DataTableColumn>

          <DataTableColumn field="role">
            <DataTableColumnHeader>
              <HeaderStart component={ReorderGrip} />
              <HeaderOverlay component={ReorderDropZone} />
              <HeaderEdge component={ResizeHandle} />
              {() => 'Role'}
            </DataTableColumnHeader>
            <DataTableCell>{({ cellValue }) => String(cellValue)}</DataTableCell>
          </DataTableColumn>

          <DataTableColumn field="status">
            <DataTableColumnHeader>
              <HeaderStart component={ReorderGrip} />
              <HeaderOverlay component={ReorderDropZone} />
              <HeaderEdge component={ResizeHandle} />
              {() => 'Status'}
            </DataTableColumnHeader>
            <DataTableCell>
              {({ cellValue }) => {
                const active = cellValue === 'active'
                return (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {String(cellValue)}
                  </span>
                )
              }}
            </DataTableCell>
          </DataTableColumn>
        </DataTable>
      </CardContent>
    </Card>
  )
}

export function ShadcnSortableDataTable() {
  const model = useMemo(
    () =>
      localModel<PromptTemplate>({
        actions: {
          sort: {
            handler: promptTemplateSortHandler,
            stage: 'sort',
          },
        },
        data: PROMPT_TEMPLATES,
        initialActions: [{ action: 'sort', payload: { direction: 'desc', field: 'updatedMinutes' } satisfies PromptSortPayload }],
        pipeline: ['sort'],
      }),
    []
  )

  return (
    <Card className="w-full max-w-7xl">
      <CardHeader>
        <CardTitle>Prompts</CardTitle>
        <CardDescription>Header sort buttons use the shadcn registry component and stay aligned to grown column edges.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable className="rounded-xl" computeRowKey={({ data }) => data.id} model={model} style={SORTABLE_TABLE_STYLE}>
          <DataTableColumn field="title" grow={1}>
            <DataTableColumnHeader className="w-72">
              <HeaderEnd component={SortHeaderButton} />
              {() => 'Prompt'}
            </DataTableColumnHeader>
            <DataTableCell>
              {({ row }) => {
                const prompt = row.data as PromptTemplate

                return (
                  <div className="min-w-0">
                    <div className="truncate font-medium">{prompt.title}</div>
                    <div className="truncate font-mono text-xs text-muted-foreground">{prompt.id}</div>
                  </div>
                )
              }}
            </DataTableCell>
          </DataTableColumn>

          <DataTableColumn field="summary" grow={2}>
            <DataTableColumnHeader className="w-96">
              <HeaderEnd component={SortHeaderButton} />
              {() => 'Summary'}
            </DataTableColumnHeader>
            <DataTableCell>{({ cellValue }) => <span className="text-muted-foreground">{String(cellValue)}</span>}</DataTableCell>
          </DataTableColumn>

          <DataTableColumn field="owner">
            <DataTableColumnHeader className="w-32">
              <HeaderEnd component={SortHeaderButton} />
              {() => 'Owner'}
            </DataTableColumnHeader>
            <DataTableCell>{({ cellValue }) => String(cellValue)}</DataTableCell>
          </DataTableColumn>

          <DataTableColumn field="status">
            <DataTableColumnHeader className="w-36">
              <HeaderEnd component={SortHeaderButton} />
              {() => 'Status'}
            </DataTableColumnHeader>
            <DataTableCell>
              {({ cellValue }) => (
                <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {String(cellValue)}
                </span>
              )}
            </DataTableCell>
          </DataTableColumn>

          <DataTableColumn field="updatedMinutes">
            <DataTableColumnHeader className="w-36 justify-end">
              <HeaderEnd component={SortHeaderButton} />
              {() => 'Updated'}
            </DataTableColumnHeader>
            <DataTableCell className="text-right font-medium tabular-nums">
              {({ cellValue }) => formatUpdated(Number(cellValue))}
            </DataTableCell>
          </DataTableColumn>
        </DataTable>
      </CardContent>
    </Card>
  )
}
