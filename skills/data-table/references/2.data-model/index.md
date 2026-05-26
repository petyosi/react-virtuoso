---
title: Choosing a Data Model
description: Give the table a local or remote model before adding table features.
sidebar:
  label: Choosing a Model
---

The model owns the rows; columns own the rendering. Pick the model that matches where rows come from:

- [`localModel()`](/data-table/data-model/local-data-model/) — rows already in the browser, with filter, sort, group, and edit actions deriving the displayed rows.
- [`remoteModel()`](/data-table/data-model/remote-data-model/) — rows fetched from an API as request params, cursors, or the rendered range change.

Both models can persist action state (filter values, sort choice, grouping mode) through opt-in adapters. Row data itself is never persisted.

## Basic local model

Use a local model for in-memory rows. Keep the model stable and pass it to `DataTable` with
`model={model}`.

```tsx live
import { DataTable, DataTableCell, DataTableColumn, DataTableColumnHeader } from '@/components/ui/data-table'
import { localModel } from '@virtuoso.dev/data-table'

const rows = [
  { id: 'SKU-001', name: 'Standing Desk', category: 'Office', stock: 14 },
  { id: 'SKU-002', name: 'USB-C Dock', category: 'Peripherals', stock: 42 },
  { id: 'SKU-003', name: 'Mechanical Keyboard', category: 'Peripherals', stock: 28 },
]

const model = localModel({ data: rows })

export default function App() {
  return (
    <DataTable className="rounded-xl" model={model} style={{ height: 280 }}>
      <DataTableColumn field="name">
        <DataTableColumnHeader>Product</DataTableColumnHeader>
        <DataTableCell className="font-medium">{({ cellValue }) => String(cellValue)}</DataTableCell>
      </DataTableColumn>
      <DataTableColumn field="category">
        <DataTableColumnHeader>Category</DataTableColumnHeader>
        <DataTableCell>{({ cellValue }) => String(cellValue)}</DataTableCell>
      </DataTableColumn>
      <DataTableColumn field="stock">
        <DataTableColumnHeader className="justify-end">Stock</DataTableColumnHeader>
        <DataTableCell className="text-right tabular-nums">{({ cellValue }) => String(cellValue)}</DataTableCell>
      </DataTableColumn>
    </DataTable>
  )
}
```

## Where to go next

- [Local Data Model](/data-table/data-model/local-data-model/) — pipelines, source updates, persistence, grouping (single- and multi-level).
- [Remote Data Model](/data-table/data-model/remote-data-model/) — pagination vs. infinite scrolling, actions, cancellation, grouped rows, loading UI.
- [Generating Columns at Runtime](/data-table/columns/runtime-columns/) — discovering and declaring columns when the list isn't known up front.
