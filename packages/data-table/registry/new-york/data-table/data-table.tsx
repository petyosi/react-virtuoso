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
          'rounded-md border border-border bg-background text-foreground',
          // row styling
          '[&_[data-testid=virtuoso-table-row]]:border-b [&_[data-testid=virtuoso-table-row]]:border-border [&_[data-testid=virtuoso-table-row]]:transition-colors [&_[data-testid=virtuoso-table-row]:hover]:bg-muted/50',
          // sticky header styling
          '[&_[data-table-element-role=sticky-header]]:border-b [&_[data-table-element-role=sticky-header]]:border-border [&_[data-table-element-role=sticky-header]]:bg-background',
          // group row styling
          '[&_[data-group-row]]:bg-muted/50 [&_[data-group-row]]:font-medium',
          // sticky column explicit background to prevent bleed-through
          '[&_[data-sticky]]:bg-background',
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

function DataTableColumnHeader(props: ColumnHeader.Props) {
  if ('children' in props) {
    const userRender = props.children
    return (
      <ColumnHeader>
        {(params) => (
          <div className="flex h-10 items-center px-2 text-left align-middle text-sm font-medium text-muted-foreground">
            {userRender(params)}
          </div>
        )}
      </ColumnHeader>
    )
  }
  const UserComponent = props.component
  return (
    <ColumnHeader
      component={(params) => (
        <div className="flex h-10 items-center px-2 text-left align-middle text-sm font-medium text-muted-foreground">
          <UserComponent {...params} />
        </div>
      )}
    />
  )
}

function DataTableCell(props: CellDefinitionProps) {
  const userRender = props.children
  return <Cell>{(params) => <div className="px-2 py-1.5 align-middle text-sm">{userRender(params)}</div>}</Cell>
}

interface CellDefinitionProps {
  children: CellRenderFunction
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
