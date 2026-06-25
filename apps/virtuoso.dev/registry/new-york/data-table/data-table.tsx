'use client'

import * as React from 'react'

import {
  VirtuosoDataTable,
  Column,
  ColumnHeader,
  HeaderEdge,
  HeaderEnd,
  HeaderOverlay,
  HeaderStart,
  Cell,
  GroupHeaderCell,
  ColumnGroup,
  ColumnGroupHeader,
  setColumnSticky$,
  loadingState$,
  useVirtuosoLocation,
  useCurrentlyRenderedData,
  useVirtuosoLoadingState,
} from '@virtuoso.dev/data-table'
import { reorderColumns$ } from '@virtuoso.dev/data-table/column-reorder'
import { AlertCircle, Loader2 } from 'lucide-react'
import '@virtuoso.dev/data-table/styles.css'
import { cn } from '@/lib/utils'

import type {
  VirtuosoDataTableProps,
  CellRenderParams,
  CellRenderFunction,
  ColumnHeaderChildren,
  ColumnHeaderRenderParams,
  ColumnHeaderRenderFunction,
  ColumnHeaderCustomComponent,
  HeaderSlotRenderParams,
  HeaderSlotRenderFunction,
  HeaderSlotCustomComponent,
  ColumnState,
  ColumnInfo,
  RowLocation,
  ListScrollLocation,
  Row,
  GroupHeaderCellProps,
  GroupHeaderRenderParams,
  GroupHeaderRenderFunction,
  GroupHeaderCustomComponent,
  ColumnGroupInfo,
  ColumnGroupHeaderRenderParams,
  ColumnGroupHeaderRenderFunction,
  ColumnGroupHeaderCustomComponent,
  SetColumnStickyPayload,
  DataTableComponents,
  RowComponentProps,
  StickyHeaderComponentProps,
  StickyColumnContainerComponentProps,
  LoadingComponentProps,
  DataTableLoadingState,
} from '@virtuoso.dev/data-table'
import type { ReorderColumnsPayload } from '@virtuoso.dev/data-table/column-reorder'

const TableRow = React.forwardRef<HTMLDivElement, RowComponentProps & { context?: unknown }>(function TableRow(
  { context: _context, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'border-b border-transparent bg-clip-padding transition-colors hover:bg-[var(--data-table-row-hover)]',
        'after:content-[""] after:absolute after:-bottom-px after:inset-x-0 after:h-px after:bg-[var(--data-table-border)] after:z-3'
      )}
      {...props}
    />
  )
})

const TableStickyHeader = React.forwardRef<HTMLDivElement, StickyHeaderComponentProps & { context?: unknown }>(function TableStickyHeader(
  { context: _context, style, ...props },
  ref
) {
  const mergedStyle = React.useMemo(() => ({ position: 'sticky' as const, top: 0, zIndex: 1, ...style }), [style])
  return <div ref={ref} className="border-b border-[var(--data-table-border)] bg-[var(--data-table-bg)]" style={mergedStyle} {...props} />
})

const TableStickyColumnContainer = React.forwardRef<HTMLDivElement, StickyColumnContainerComponentProps & { context?: unknown }>(
  function TableStickyColumnContainer({ context: _context, ...props }, ref) {
    return <div ref={ref} className="bg-[var(--data-table-bg)] transition-colors" {...props} />
  }
)

function TableLoadingOverlay({ loadingState }: LoadingComponentProps) {
  const isError = loadingState.refresh.status === 'error'
  const message = isError ? (loadingState.refresh.errorMessage ?? 'Update failed') : 'Refreshing rows...'

  return (
    <div aria-live="polite" className="flex justify-center px-3 pt-3" role="status">
      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--data-table-border)] bg-[color-mix(in_oklch,var(--data-table-bg)_90%,transparent)] px-3 py-1.5 text-xs text-[var(--data-table-muted-fg)] shadow-sm backdrop-blur-xs">
        {isError ? <AlertCircle className="size-3.5" /> : <Loader2 className="size-3.5 animate-spin" />}
        <span>{message}</span>
      </div>
    </div>
  )
}

function TableLoadingPlaceholder({ loadingState }: LoadingComponentProps) {
  const isError = loadingState.initial.status === 'error'
  const message = isError ? (loadingState.initial.errorMessage ?? 'Failed to load rows') : 'Loading rows...'

  return (
    <div aria-live="polite" className="px-3 py-4" role="status">
      <div className="rounded-xl border border-[var(--data-table-border)] bg-[color-mix(in_oklch,var(--data-table-muted)_20%,transparent)] p-4 shadow-xs">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--data-table-border)] bg-[var(--data-table-bg)] px-3 py-1.5 text-xs text-[var(--data-table-muted-fg)]">
          {isError ? <AlertCircle className="size-3.5" /> : <Loader2 className="size-3.5 animate-spin" />}
          <span>{message}</span>
        </div>
        {!isError ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.6fr)] gap-3">
                <div className="h-4 animate-pulse rounded bg-[var(--data-table-muted)]" />
                <div className="h-4 animate-pulse rounded bg-[color-mix(in_oklch,var(--data-table-muted)_80%,transparent)]" />
                <div className="h-4 animate-pulse rounded bg-[color-mix(in_oklch,var(--data-table-muted)_60%,transparent)]" />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function TableLoadingFooter({ loadingState }: LoadingComponentProps) {
  const isError = loadingState.end.status === 'error'
  const message = isError ? (loadingState.end.errorMessage ?? 'Failed to load more rows') : 'Loading more rows...'

  return (
    <div
      aria-live="polite"
      className="flex min-h-10 items-center justify-center border-t border-[var(--data-table-border)] bg-[color-mix(in_oklch,var(--data-table-bg)_95%,transparent)] px-3 py-2 text-xs text-[var(--data-table-muted-fg)]"
      role="status"
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--data-table-border)] bg-[color-mix(in_oklch,var(--data-table-muted)_60%,transparent)] px-3 py-1 shadow-xs">
        {isError ? <AlertCircle className="size-3.5" /> : <Loader2 className="size-3.5 animate-spin" />}
        <span>{message}</span>
      </div>
    </div>
  )
}

const TABLE_COMPONENTS: DataTableComponents = {
  Row: TableRow,
  StickyHeader: TableStickyHeader,
  StickyColumnContainer: TableStickyColumnContainer,
  LoadingPlaceholder: TableLoadingPlaceholder,
  LoadingOverlay: TableLoadingOverlay,
  LoadingFooter: TableLoadingFooter,
}

function DataTable<Data, Context = unknown, Group = unknown>({
  className,
  components,
  ...props
}: VirtuosoDataTableProps<Data, Context, Group> & { className?: string }) {
  const mergedComponents = React.useMemo(() => ({ ...TABLE_COMPONENTS, ...components }) as DataTableComponents<Context>, [components])

  return (
    <VirtuosoDataTable
      className={cn(
        'relative w-full overflow-hidden rounded-md border border-[var(--data-table-border)] bg-[var(--data-table-bg)] text-[var(--data-table-fg)] text-sm',
        '[--data-table-bg:hsl(var(--background))]',
        '[--data-table-border:hsl(var(--border))]',
        '[--data-table-fg:hsl(var(--foreground))]',
        '[--data-table-muted:hsl(var(--muted))]',
        '[--data-table-muted-fg:hsl(var(--muted-foreground))]',
        '[--data-table-row-hover:hsl(var(--muted)/0.5)]',
        '[--data-table-sticky-hover:color-mix(in_oklch,var(--data-table-muted)_50%,var(--data-table-bg))]',
        '**:data-[scope=colgroup]:border-b **:data-[scope=colgroup]:border-[var(--data-table-border)]',
        '**:data-group-row:bg-[var(--data-table-muted)] **:data-group-row:font-medium',
        '[&_[data-table-element-role=row]:hover_[data-sticky]]:bg-[var(--data-table-sticky-hover)]',
        className
      )}
      components={mergedComponents}
      {...props}
    />
  )
}

function DataTableColumn(props: Column.Props) {
  return <Column {...props} />
}

interface DataTableColumnHeaderProps {
  children?: unknown
  component?: ColumnHeaderCustomComponent
  className?: string
}

function DataTableColumnHeader(props: DataTableColumnHeaderProps) {
  const measureClassName = 'flex h-10 items-center px-2 align-middle text-sm font-medium text-[var(--data-table-fg)]'
  const contentClassName = cn('flex min-w-0 items-center overflow-hidden truncate', props.className)

  if (props.component) {
    return <ColumnHeader className={cn(measureClassName, props.className)} component={props.component} />
  }

  const wrapRender =
    (render: ColumnHeaderRenderFunction): ColumnHeaderRenderFunction =>
    (params) => <div className={contentClassName}>{render(params)}</div>

  if (
    props.children === null ||
    props.children === undefined ||
    typeof props.children === 'string' ||
    typeof props.children === 'number' ||
    typeof props.children === 'function'
  ) {
    const userRender = props.children
    return (
      <ColumnHeader className={measureClassName}>
        {wrapRender((params) => (typeof userRender === 'function' ? userRender(params) : userRender))}
      </ColumnHeader>
    )
  }

  const wrapChildren = (children: unknown): unknown => {
    if (Array.isArray(children)) {
      return children.map(wrapChildren)
    }
    if (React.isValidElement(children) && children.type === React.Fragment) {
      return wrapChildren((children.props as { children?: unknown }).children)
    }
    if (typeof children === 'function') {
      return wrapRender(children as ColumnHeaderRenderFunction)
    }
    return children
  }

  return <ColumnHeader className={measureClassName}>{wrapChildren(props.children) as ColumnHeaderChildren}</ColumnHeader>
}

function DataTableCell(props: CellDefinitionProps) {
  const { children, className } = props
  return (
    <Cell className={cn('min-w-0 overflow-hidden truncate p-2 align-middle text-sm', className)}>
      {(params) => (typeof children === 'function' ? children(params) : children)}
    </Cell>
  )
}

interface CellDefinitionProps {
  children: CellRenderFunction | React.ReactNode
  className?: string
}

function DataTableGroupHeader(props: GroupHeaderCellProps) {
  const className = cn(
    'border-b border-[var(--data-table-border)] bg-[var(--data-table-muted)] px-2 py-2 text-sm font-medium text-[var(--data-table-fg)]',
    props.className
  )

  if ('component' in props) {
    return <GroupHeaderCell className={className} component={props.component} />
  }

  return <GroupHeaderCell className={className}>{props.children}</GroupHeaderCell>
}

export {
  DataTable,
  DataTableColumn,
  DataTableColumnHeader,
  DataTableCell,
  DataTableGroupHeader,
  // Re-export types
  type VirtuosoDataTableProps,
  type CellRenderParams,
  type CellRenderFunction,
  type ColumnHeaderChildren,
  type ColumnHeaderRenderParams,
  type ColumnHeaderRenderFunction,
  type ColumnHeaderCustomComponent,
  type HeaderSlotRenderParams,
  type HeaderSlotRenderFunction,
  type HeaderSlotCustomComponent,
  type ColumnState,
  type ColumnInfo,
  type RowLocation,
  type ListScrollLocation,
  type Row,
  type GroupHeaderRenderParams,
  type GroupHeaderRenderFunction,
  type GroupHeaderCustomComponent,
  type ColumnGroupInfo,
  type ColumnGroupHeaderRenderParams,
  type ColumnGroupHeaderRenderFunction,
  type ColumnGroupHeaderCustomComponent,
  type SetColumnStickyPayload,
  type ReorderColumnsPayload,
  type DataTableComponents,
  type RowComponentProps,
  type StickyHeaderComponentProps,
  type StickyColumnContainerComponentProps,
  type LoadingComponentProps,
  type DataTableLoadingState,
  // Re-export components and utilities
  GroupHeaderCell,
  ColumnGroup,
  ColumnGroupHeader,
  HeaderStart,
  HeaderEnd,
  HeaderEdge,
  HeaderOverlay,
  setColumnSticky$,
  reorderColumns$,
  loadingState$,
  useVirtuosoLocation,
  useCurrentlyRenderedData,
  useVirtuosoLoadingState,
}
