// oxlint-disable jsx-no-new-function-as-prop jsx-no-new-object-as-prop
import { useEffect } from 'react'
import type { CSSProperties, PointerEvent, ReactNode } from 'react'

import { usePublisher } from '@virtuoso.dev/reactive-engine-react'

import { Cell, Column, ColumnHeader, HeaderEdge, HeaderEnd, HeaderOverlay } from '..'
import { resizeColumn$, clearColumnWidthOverride$ } from '../features/column-resize'
import { LocalDataTable as VirtuosoDataTable } from '../tests/LocalDataTable'

import type { HeaderSlotCustomComponent } from '..'

interface PromptRow {
  id: string
  name: string
  slug: string
  description: string
  versions: string[]
  labels: string[]
  updated: string
  status: 'draft' | 'published' | 'review'
}

export const PROMPT_COLUMN_BASE_WIDTHS = {
  name: 280,
  description: 340,
  versions: 128,
  labels: 144,
  updated: 152,
  actions: 64,
} as const

export const PROMPT_TABLE_WIDTHS = {
  narrow: 760,
  wide: 1_400,
} as const

const PROMPTS: PromptRow[] = [
  {
    id: 'prompt-001',
    name: 'Data Pipeline Risk Review',
    slug: 'scroll-repro-data-pipeline-risk-review',
    description: 'Helps teams handle pipeline risk review using customer context, recent evidence, and clear escalation notes.',
    versions: ['v2', 'stable'],
    labels: ['risk', 'pipeline'],
    updated: 'about 5 hours ago',
    status: 'published',
  },
  {
    id: 'prompt-002',
    name: 'Support Refund Triage With Regional Escalation Handling',
    slug: 'scroll-repro-support-refund-triage',
    description: 'Sorts refund cases by customer impact, plan tier, region, and policy exceptions, then drafts the next support action.',
    versions: ['v4', 'beta'],
    labels: ['support', 'refund', 'priority'],
    updated: 'yesterday',
    status: 'review',
  },
  {
    id: 'prompt-003',
    name: 'Billing Evidence Extractor',
    slug: 'scroll-repro-billing-evidence-extractor',
    description: 'Extracts invoices, subscription events, adjustment notes, and user-visible explanations from long billing conversations.',
    versions: ['v1'],
    labels: ['billing'],
    updated: '2 days ago',
    status: 'published',
  },
  {
    id: 'prompt-004',
    name: 'Incident Account Renewal Guide',
    slug: 'scroll-repro-incident-account-renewal-guide',
    description: '',
    versions: ['v3', 'hotfix'],
    labels: ['incident', 'renewal'],
    updated: 'Jun 18',
    status: 'draft',
  },
  {
    id: 'prompt-005',
    name: 'Very Long Customer Reply Draft Name That Should Still Stay Readable When The Name Column Grows',
    slug: 'scroll-repro-billing-customer-reply-draft',
    description:
      'Creates a grounded customer reply from billing context, recent evidence, internal policy, and the latest escalation summary.',
    versions: ['v7', 'stable', 'exp'],
    labels: ['billing', 'customer', 'reply'],
    updated: 'Jun 14',
    status: 'review',
  },
  {
    id: 'prompt-006',
    name: 'Feature Flag Signal Classifier',
    slug: 'scroll-repro-feature-flag-signal-classifier',
    description:
      'Classifies signals from feature flag events, support notes, error telemetry, and account metadata into rollout decisions.',
    versions: ['v2'],
    labels: ['flags', 'signals'],
    updated: 'Jun 11',
    status: 'published',
  },
  {
    id: 'prompt-007',
    name: 'Support Runbook Composer',
    slug: 'scroll-repro-support-runbook-composer',
    description: 'Turns scattered operational notes into concise runbook steps with owner, trigger, rollback, and escalation fields.',
    versions: ['v5', 'draft'],
    labels: ['support', 'runbook'],
    updated: 'Jun 08',
    status: 'draft',
  },
  {
    id: 'prompt-008',
    name: 'Onboarding Follow Up Planner',
    slug: 'scroll-repro-onboarding-follow-up-planner',
    description: 'Plans follow-up messages after onboarding by combining customer goals, unresolved setup tasks, and usage evidence.',
    versions: ['v2', 'stable'],
    labels: ['onboarding'],
    updated: 'May 30',
    status: 'published',
  },
]

const TABLE_STYLE: CSSProperties = { height: 420 }
const HEADER_STYLE: CSSProperties = {
  boxSizing: 'border-box',
  display: 'flex',
  minWidth: 0,
  alignItems: 'center',
  gap: 6,
  height: 40,
  padding: '0 10px',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
}
const COLUMN_TRACK_OVERLAY_STYLE: CSSProperties = {
  position: 'absolute',
  inset: 0,
  borderRight: '2px solid rgba(37, 99, 235, 0.65)',
  background: 'linear-gradient(90deg, rgba(37, 99, 235, 0.08), rgba(37, 99, 235, 0.02))',
  pointerEvents: 'none',
}
const SORT_ICON_BOUNDARY_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 40,
  flexShrink: 0,
}
const SORT_ICON_STYLE: CSSProperties = {
  display: 'inline-flex',
  width: 28,
  height: 28,
  alignItems: 'center',
  justifyContent: 'center',
  marginLeft: 4,
  border: '1px solid #93c5fd',
  borderRadius: 4,
  background: '#eff6ff',
  color: '#1d4ed8',
}
const ACTIVE_SORT_ICON_STYLE: CSSProperties = {
  ...SORT_ICON_STYLE,
  borderColor: '#60a5fa',
  background: '#dbeafe',
  color: '#1e40af',
}
const SORT_ICON_END_MARKER_STYLE: CSSProperties = {
  width: 2,
  height: 40,
  flexShrink: 0,
  marginLeft: 4,
  background: '#2563eb',
}
const CELL_STACK_STYLE: CSSProperties = { display: 'flex', minWidth: 0, flexDirection: 'column', gap: 2 }
const CELL_PRIMARY_STYLE: CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }
const CELL_SECONDARY_STYLE: CSSProperties = {
  overflow: 'hidden',
  color: '#64748b',
  fontFamily: 'monospace',
  fontSize: 12,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const BADGE_ROW_STYLE: CSSProperties = { display: 'flex', minWidth: 0, flexWrap: 'wrap', gap: 4 }
const BADGE_STYLE: CSSProperties = {
  display: 'inline-flex',
  maxWidth: '100%',
  alignItems: 'center',
  border: '1px solid #bae6fd',
  borderRadius: 4,
  background: '#f0f9ff',
  color: '#0369a1',
  fontSize: 12,
  fontWeight: 600,
  padding: '1px 6px',
}
const STATUS_BADGE_STYLE: CSSProperties = {
  ...BADGE_STYLE,
  borderColor: '#bbf7d0',
  background: '#f0fdf4',
  color: '#047857',
}
const ACTION_BUTTON_STYLE: CSSProperties = {
  border: 0,
  borderRadius: 4,
  background: 'transparent',
  color: '#64748b',
  cursor: 'pointer',
  fontSize: 18,
  lineHeight: 1,
}

function HeaderLabel({
  width,
  justify = 'flex-start',
  children,
}: {
  width: number
  justify?: CSSProperties['justifyContent']
  children: ReactNode
}) {
  return <div style={{ ...HEADER_STYLE, justifyContent: justify, width }}>{children}</div>
}

function Badge({ children, status = false }: { children: ReactNode; status?: boolean }) {
  return <span style={status ? STATUS_BADGE_STYLE : BADGE_STYLE}>{children}</span>
}

const ColumnTrackOverlay: HeaderSlotCustomComponent = () => <span aria-hidden="true" style={COLUMN_TRACK_OVERLAY_STYLE} />

const SortIconBoundary: HeaderSlotCustomComponent = ({ column }) => {
  const isActive = column.field === 'updated'

  return (
    <span aria-hidden="true" style={SORT_ICON_BOUNDARY_STYLE}>
      <span style={isActive ? ACTIVE_SORT_ICON_STYLE : SORT_ICON_STYLE}>
        <svg fill="none" height="14" viewBox="0 0 16 16" width="14">
          <path
            d="M5 3.5 2.75 5.75h4.5L5 3.5ZM11 12.5l2.25-2.25h-4.5L11 12.5ZM5 5.75v6.5M11 10.25v-6.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      </span>
      <span data-table-element-role="sort-icon-end-marker" style={SORT_ICON_END_MARKER_STYLE} />
    </span>
  )
}

const PromptResizeHandle: HeaderSlotCustomComponent = ({ columnKey, headerRef }) => {
  const resizeColumn = usePublisher(resizeColumn$)
  const clearColumnWidthOverride = usePublisher(clearColumnWidthOverride$)

  return (
    <div
      data-table-element-role="resize-handle"
      style={{
        alignSelf: 'stretch',
        cursor: 'col-resize',
        display: 'flex',
        justifyContent: 'center',
        touchAction: 'none',
        userSelect: 'none',
        width: 10,
      }}
      onDoubleClick={(event) => {
        event.preventDefault()
        clearColumnWidthOverride({ key: columnKey })
      }}
      onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
        event.preventDefault()
        const startWidth = headerRef.current?.getBoundingClientRect().width
        if (startWidth === undefined) {
          return
        }

        const startX = event.clientX
        const ownerDocument = event.currentTarget.ownerDocument
        const pointerId = event.pointerId
        event.currentTarget.setPointerCapture(pointerId)

        const onPointerMove = (moveEvent: globalThis.PointerEvent) => {
          resizeColumn({ key: columnKey, width: Math.max(64, startWidth + moveEvent.clientX - startX) })
        }

        const onPointerEnd = () => {
          ownerDocument.removeEventListener('pointermove', onPointerMove)
          ownerDocument.removeEventListener('pointerup', onPointerEnd)
          ownerDocument.removeEventListener('pointercancel', onPointerEnd)
        }

        ownerDocument.addEventListener('pointermove', onPointerMove)
        ownerDocument.addEventListener('pointerup', onPointerEnd, { once: true })
        ownerDocument.addEventListener('pointercancel', onPointerEnd, { once: true })
      }}
    >
      <span style={{ alignSelf: 'center', background: '#cbd5e1', borderRadius: 999, height: 18, width: 2 }} />
    </div>
  )
}

function ResizeColumnOnMount({ columnKey, width }: { columnKey: string; width: number | undefined }) {
  const resizeColumn = usePublisher(resizeColumn$)

  useEffect(() => {
    if (width !== undefined) {
      resizeColumn({ key: columnKey, width })
    }
  }, [columnKey, resizeColumn, width])

  return null
}

function ResizeEdge({ enabled }: { enabled: boolean }) {
  return enabled ? <HeaderEdge component={PromptResizeHandle} /> : null
}

function SortIconBoundarySlots({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <>
      <HeaderOverlay component={ColumnTrackOverlay} />
      <HeaderEnd component={SortIconBoundary} />
    </>
  ) : null
}

export function PromptListGrowTable({
  height = TABLE_STYLE.height,
  resizeDescriptionTo,
  resizable = false,
  resizeNameTo,
  showSortIconBoundaries = false,
  width = '100%',
}: {
  height?: CSSProperties['height']
  resizeDescriptionTo?: number
  resizable?: boolean
  resizeNameTo?: number
  showSortIconBoundaries?: boolean
  width?: CSSProperties['width']
}) {
  return (
    <VirtuosoDataTable style={{ height, width }} source={PROMPTS}>
      <ResizeColumnOnMount columnKey="name" width={resizeNameTo} />
      <ResizeColumnOnMount columnKey="description" width={resizeDescriptionTo} />

      <Column id="name" field="name" grow={1}>
        <ColumnHeader>
          <ResizeEdge enabled={resizable} />
          <SortIconBoundarySlots enabled={showSortIconBoundaries} />
          {() => <HeaderLabel width={PROMPT_COLUMN_BASE_WIDTHS.name}>Name</HeaderLabel>}
        </ColumnHeader>
        <Cell>
          {({ row }) => {
            const prompt = row.data as PromptRow
            return (
              <div style={CELL_STACK_STYLE}>
                <span style={CELL_PRIMARY_STYLE}>{prompt.name}</span>
                <span style={CELL_SECONDARY_STYLE}>{prompt.slug}</span>
              </div>
            )
          }}
        </Cell>
      </Column>

      <Column id="description" field="description" grow={3}>
        <ColumnHeader>
          <ResizeEdge enabled={resizable} />
          <SortIconBoundarySlots enabled={showSortIconBoundaries} />
          {() => <HeaderLabel width={PROMPT_COLUMN_BASE_WIDTHS.description}>Description</HeaderLabel>}
        </ColumnHeader>
        <Cell>
          {({ cellValue }) => (
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {String(cellValue === '' ? 'No description' : (cellValue ?? 'No description'))}
            </span>
          )}
        </Cell>
      </Column>

      <Column id="versions" field="versions">
        <ColumnHeader>
          <ResizeEdge enabled={resizable} />
          {() => <HeaderLabel width={PROMPT_COLUMN_BASE_WIDTHS.versions}>Versions</HeaderLabel>}
        </ColumnHeader>
        <Cell>
          {({ row }) => (
            <div style={BADGE_ROW_STYLE}>
              {(row.data as PromptRow).versions.map((version) => (
                <Badge key={version}>{version}</Badge>
              ))}
            </div>
          )}
        </Cell>
      </Column>

      <Column id="labels" field="labels">
        <ColumnHeader>
          <ResizeEdge enabled={resizable} />
          {() => <HeaderLabel width={PROMPT_COLUMN_BASE_WIDTHS.labels}>Labels</HeaderLabel>}
        </ColumnHeader>
        <Cell>
          {({ row }) => (
            <div style={BADGE_ROW_STYLE}>
              <Badge status>{(row.data as PromptRow).status}</Badge>
              {(row.data as PromptRow).labels.slice(0, 2).map((label) => (
                <Badge key={label}>{label}</Badge>
              ))}
            </div>
          )}
        </Cell>
      </Column>

      <Column id="updated" field="updated">
        <ColumnHeader>
          <ResizeEdge enabled={resizable} />
          <SortIconBoundarySlots enabled={showSortIconBoundaries} />
          {() => <HeaderLabel width={PROMPT_COLUMN_BASE_WIDTHS.updated}>Updated</HeaderLabel>}
        </ColumnHeader>
        <Cell>{({ cellValue }) => <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{String(cellValue)}</span>}</Cell>
      </Column>

      <Column id="actions">
        <ColumnHeader>
          <ResizeEdge enabled={resizable} />
          {() => (
            <HeaderLabel justify="center" width={PROMPT_COLUMN_BASE_WIDTHS.actions}>
              <span aria-label="Actions">...</span>
            </HeaderLabel>
          )}
        </ColumnHeader>
        <Cell>
          {() => (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button aria-label="Open actions" style={ACTION_BUTTON_STYLE} type="button">
                ...
              </button>
            </div>
          )}
        </Cell>
      </Column>
    </VirtuosoDataTable>
  )
}
