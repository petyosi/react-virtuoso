---
title: Overview
description: Define the visible columns, headers, and cells that turn model rows into a grid.
sidebar:
  order: 0
  label: Overview
---

Columns are the table schema. The data model decides which rows exist; columns decide which fields
are visible, what order they appear in, how wide they measure, and which renderers the table should
use for headers and cells.

The column components are declarations. They do not render a standalone header or cell where they
appear in JSX. Instead, each `DataTableColumn` registers a column definition with the table. Its
children register the header and cell definitions for that column. The table then uses those
definitions while it renders the virtualized header row and the currently visible body cells.

That distinction matters because rows and columns are virtualized. A cell definition can be reused
for many row instances over time, and a header definition can be combined with column sizing,
sticky positioning, header slots, and user-controlled visibility.

## Basic columns

```tsx live
import { DataTable, DataTableCell, DataTableColumn, DataTableColumnHeader } from '@/components/ui/data-table'
import { localModel } from '@virtuoso.dev/data-table'

const rows = [
  { id: 'SKU-001', name: 'Standing Desk', category: 'Office', price: 699, stock: 14 },
  { id: 'SKU-002', name: 'USB-C Dock', category: 'Peripherals', price: 229, stock: 42 },
  { id: 'SKU-003', name: 'Mechanical Keyboard', category: 'Peripherals', price: 169, stock: 28 },
]

const currency = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  style: 'currency',
})

const model = localModel({ data: rows })

export default function App() {
  return (
    <DataTable className="rounded-xl" model={model} style={{ height: 280 }}>
      <DataTableColumn field="name">
        <DataTableColumnHeader>Product</DataTableColumnHeader>
        <DataTableCell>
          {({ row }) => (
            <div className="flex flex-col">
              <span className="font-medium">{row.data.name}</span>
              <span className="text-xs text-muted-foreground">{row.data.id}</span>
            </div>
          )}
        </DataTableCell>
      </DataTableColumn>
      <DataTableColumn field="price">
        <DataTableColumnHeader className="justify-end">Price</DataTableColumnHeader>
        <DataTableCell className="text-right tabular-nums">{({ cellValue }) => currency.format(Number(cellValue))}</DataTableCell>
      </DataTableColumn>
      <DataTableColumn field="stock">
        <DataTableColumnHeader>Status</DataTableColumnHeader>
        <DataTableCell>
          {({ row }) => (
            <span className={row.data.stock < 20 ? 'font-medium text-amber-600' : 'text-foreground'}>
              {row.data.stock < 20 ? 'Low stock' : 'Healthy'}
            </span>
          )}
        </DataTableCell>
      </DataTableColumn>
    </DataTable>
  )
}
```

## What each part defines

- `DataTableColumn` defines a column, keyed by its `field`.
- `DataTableColumnHeader` defines the header content and header class for that column.
- `DataTableCell` defines the body-cell renderer and cell class for that column.
- The table combines those definitions with row data, column state, sizing, and virtualization.

When a header or cell definition is omitted, the table falls back to the column field name for the
header and the selected field value for the cell.

## Next steps

- [Defining Columns](/data-table/columns/defining-columns/) covers `field`, default rendering,
  declaration order, visibility, and generated columns.
- [Cell and Header Renderers](/data-table/columns/cell-and-header-renderers/) covers render params,
  extracted renderer functions, and custom header content.
- [Identity and Context](/data-table/columns/identity-and-context/) covers stable column keys, row
  keys, and the table `context` prop.
- [Inferring Columns From Model Data](/data-table/columns/inferring-columns-from-model-data/) covers
  generated columns for dynamic local and remote schemas.
