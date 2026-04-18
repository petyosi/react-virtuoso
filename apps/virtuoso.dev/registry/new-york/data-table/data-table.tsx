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
  useVirtuosoMethods,
  useVirtuosoLocation,
  useCurrentlyRenderedData,
} from '@virtuoso.dev/data-table'
import { reorderColumns$ } from '@virtuoso.dev/data-table/column-reorder'
import '@virtuoso.dev/data-table/styles.css'
import { cn } from '@/lib/utils'

import type {
  VirtuosoDataTableProps,
  VirtuosoDataTableMethods,
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
  TableData,
  RowLocation,
  ListScrollLocation,
  Row,
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
        'border-b border-transparent bg-clip-padding transition-colors hover:bg-muted/50',
        'after:content-[""] after:absolute after:-bottom-px after:inset-x-0 after:h-px after:bg-border after:z-3'
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
  return <div ref={ref} className="border-b border-border bg-background" style={mergedStyle} {...props} />
})

const TableStickyColumnContainer = React.forwardRef<HTMLDivElement, StickyColumnContainerComponentProps & { context?: unknown }>(
  function TableStickyColumnContainer({ context: _context, ...props }, ref) {
    return <div ref={ref} className="bg-background" {...props} />
  }
)

const TABLE_COMPONENTS: DataTableComponents = {
  Row: TableRow,
  StickyHeader: TableStickyHeader,
  StickyColumnContainer: TableStickyColumnContainer,
}

const DataTable = React.forwardRef<VirtuosoDataTableMethods, VirtuosoDataTableProps<unknown, unknown, unknown>>(
  ({ className, ...props }, ref) => {
    return (
      <VirtuosoDataTable
        ref={ref}
        className={cn(
          'relative w-full overflow-x-auto bg-background text-foreground text-sm',
          '**:data-[scope=colgroup]:border-b **:data-[scope=colgroup]:border-border',
          '**:data-group-row:bg-muted/50 **:data-group-row:font-medium',
          '[&_[data-table-element-role=row]:hover_[data-sticky]]:bg-[color-mix(in_oklch,var(--color-muted)_50%,var(--color-background))]',
          className
        )}
        components={TABLE_COMPONENTS}
        {...props}
      />
    )
  }
) as (<Data, Context = unknown, Group = unknown>(
  props: VirtuosoDataTableProps<Data, Context, Group> & {
    ref?: React.Ref<VirtuosoDataTableMethods<Data>>
    className?: string
  }
) => React.ReactElement) & { displayName?: string }

DataTable.displayName = 'DataTable'

function DataTableColumn(props: Column.Props) {
  return <Column {...props} />
}

interface DataTableColumnHeaderProps {
  children?: unknown
  component?: ColumnHeaderCustomComponent
  className?: string
}

function DataTableColumnHeader(props: DataTableColumnHeaderProps) {
  const className = cn('flex h-10 items-center px-2 align-middle text-sm font-medium text-foreground whitespace-nowrap', props.className)

  if (props.component) {
    return <ColumnHeader className={className} component={props.component} />
  }

  if (
    props.children === null ||
    props.children === undefined ||
    typeof props.children === 'string' ||
    typeof props.children === 'number' ||
    typeof props.children === 'function'
  ) {
    const userRender = props.children
    return (
      <ColumnHeader className={className}>
        {(params: ColumnHeaderRenderParams) => (typeof userRender === 'function' ? userRender(params) : userRender)}
      </ColumnHeader>
    )
  }

  return <ColumnHeader className={className}>{props.children as ColumnHeaderChildren}</ColumnHeader>
}

function DataTableCell(props: CellDefinitionProps) {
  const { children, className } = props
  return (
    <Cell className={cn('p-2 align-middle text-sm whitespace-nowrap', className)}>
      {(params) => (typeof children === 'function' ? children(params) : children)}
    </Cell>
  )
}

interface CellDefinitionProps {
  children: CellRenderFunction | React.ReactNode
  className?: string
}

export {
  DataTable,
  DataTableColumn,
  DataTableColumnHeader,
  DataTableCell,
  // Re-export types
  type VirtuosoDataTableProps,
  type VirtuosoDataTableMethods,
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
  type TableData,
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
  useVirtuosoMethods,
  useVirtuosoLocation,
  useCurrentlyRenderedData,
}
