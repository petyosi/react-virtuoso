---
title: Overview
description: Define the visible columns, headers, and cells that turn model rows into a grid.
sidebar:
  order: 0
  label: Overview
---

Columns decide which fields are visible, in what order, at what width, and how each cell is rendered. You declare them as JSX children of `DataTable` — one `DataTableColumn` per visible field, with its header and cell renderer inside.

The JSX reads like a static description of the table, but `DataTableColumn` and its children don't render in place. Each one registers a definition with the table, which then draws the virtualized header row and the visible body cells from those definitions. That indirection is what makes virtualization possible: a single cell renderer is reused across many row positions as the user scrolls, and headers compose cleanly with sticky pinning, resizing, slots, and visibility.

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

- `DataTableColumn` — one column, keyed by `field`.
- `DataTableColumnHeader` — header content and header class.
- `DataTableCell` — body-cell renderer and cell class.

Omit the header to fall back to the field name; omit the cell to fall back to the field value.

`field` is both the cell lookup key (`row.data[field]`) and the column's persistent identity. Keep it stable across releases if you use any column features that save state — see [State Persistence](/data-table/state-persistence/#field-names-are-the-persistence-contract) for the rules around renaming.

## Where to go next

Declarative shape:

- [Defining Columns](/data-table/columns/defining-columns/) — `field`, default rendering, declaration order, visibility, generated columns.
- [Formatting Cells and Headers](/data-table/columns/cell-and-header-renderers/) — render params, extracted renderer functions, custom header content.
- [Column Groups](/data-table/columns/column-groups/) — wrap adjacent columns under a shared header.
- [Sticky Columns](/data-table/columns/sticky-columns/) — pin a column to the left or right edge during horizontal scrolling.

Interactive layout:

- [Column Visibility](/data-table/columns/column-visibility/) — declarative defaults, runtime toggling, "Columns" picker.
- [Column Resizing](/data-table/columns/column-resizing/) — drag handle in the header, presets, auto-fit.
- [Column Reordering](/data-table/columns/column-reordering/) — drag-and-drop individual columns or whole groups.

Dynamic schemas:

- [Generating Columns at Runtime](/data-table/columns/runtime-columns/) — discovering and declaring columns when the list isn't known up front.
