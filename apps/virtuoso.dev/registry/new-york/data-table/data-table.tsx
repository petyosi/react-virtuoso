'use client'

import * as React from 'react'

import {
  VirtuosoDataTable,
  Column,
  ColumnHeader,
  Cell,
  GroupHeaderCell,
  ColumnGroup,
  ColumnGroupHeader,
  setColumnSticky$,
  reorderColumns$,
  useVirtuosoMethods,
  useVirtuosoLocation,
  useCurrentlyRenderedData,
} from '@virtuoso.dev/data-table'

import { cn } from '@/lib/utils'

import type {
  VirtuosoDataTableProps,
  VirtuosoDataTableMethods,
  CellRenderParams,
  CellRenderFunction,
  ColumnHeaderRenderParams,
  ColumnHeaderRenderFunction,
  ColumnHeaderCustomComponent,
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
  ReorderColumnsPayload,
} from '@virtuoso.dev/data-table'

const DataTable = React.forwardRef<VirtuosoDataTableMethods, VirtuosoDataTableProps<unknown, unknown, unknown>>(
  ({ className, ...props }, ref) => {
    return (
      <VirtuosoDataTable
        ref={ref}
        className={cn(
          'relative w-full overflow-x-auto bg-background text-foreground text-sm',
          // row styling: transparent border for spacing, ::after for visible border above sticky containers
          '[&_[data-table-element-role=row]]:border-b [&_[data-table-element-role=row]]:border-transparent [&_[data-table-element-role=row]]:bg-clip-padding [&_[data-table-element-role=row]:hover]:bg-muted/50',
          '[&_[data-table-element-role=row]]:after:content-[""] [&_[data-table-element-role=row]]:after:absolute [&_[data-table-element-role=row]]:after:-bottom-px [&_[data-table-element-role=row]]:after:inset-x-0 [&_[data-table-element-role=row]]:after:h-px [&_[data-table-element-role=row]]:after:bg-border [&_[data-table-element-role=row]]:after:z-3',
          // sticky header styling
          '[&_[data-table-element-role=sticky-header]]:border-b [&_[data-table-element-role=sticky-header]]:border-border [&_[data-table-element-role=sticky-header]]:bg-background',
          // column group header border
          '[&_[data-scope=colgroup]]:border-b [&_[data-scope=colgroup]]:border-border',
          // group row styling
          '[&_[data-group-row]]:bg-muted/50 [&_[data-group-row]]:font-medium',
          // sticky column: background to prevent bleed-through
          '[&_[data-sticky]]:bg-background',
          // sticky column hover: opaque mix that matches the semi-transparent row hover
          '[&_[data-table-element-role=row]:hover_[data-sticky]]:bg-[color-mix(in_oklch,var(--color-muted)_50%,var(--color-background))]',
          className
        )}
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

type DataTableColumnHeaderProps =
  | {
      children: ColumnHeaderRenderFunction | React.ReactNode
      className?: string
    }
  | {
      component: ColumnHeaderCustomComponent
      className?: string
    }

function DataTableColumnHeader(props: DataTableColumnHeaderProps) {
  const className = cn('flex h-10 items-center px-2 align-middle text-sm font-medium text-foreground whitespace-nowrap', props.className)

  if ('children' in props) {
    const userRender = props.children
    return (
      <ColumnHeader className={className}>{(params) => (typeof userRender === 'function' ? userRender(params) : userRender)}</ColumnHeader>
    )
  }

  const UserComponent = props.component
  return <ColumnHeader className={className} component={UserComponent} />
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
  type ColumnHeaderRenderParams,
  type ColumnHeaderRenderFunction,
  type ColumnHeaderCustomComponent,
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
  // Re-export components and utilities
  GroupHeaderCell,
  ColumnGroup,
  ColumnGroupHeader,
  setColumnSticky$,
  reorderColumns$,
  useVirtuosoMethods,
  useVirtuosoLocation,
  useCurrentlyRenderedData,
}
