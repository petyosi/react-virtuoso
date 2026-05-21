---
title: Choosing a Data Model
description: Give the table a local or remote model before adding table features.
sidebar:
  label: Choosing a Model
---

Every data table starts with a data model. Columns describe how fields render; the model describes
where rows come from and which actions can change them.

Choose the model by asking where the rows live:

Use one of these model types:

- [`localModel()`](/data-table/data-model/local-data-model/) when the browser already has the rows and
  derives the displayed rows through filtering, sorting, grouping, or edits.
- [`remoteModel()`](/data-table/data-model/remote-data-model/) when rows come from an API and requests
  depend on request params, cursors, or the currently rendered range.

Both model types can opt specific actions into state persistence. That saves user intent such as a
filter, search term, sort choice, or grouping mode; it does not save the row data itself.

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

## Model details

The local and remote model pages cover the details separately:

- [Local Data Model](/data-table/data-model/local-data-model/) explains pipelines, source updates,
  persistence, and grouped rows.
- [Remote Data Model](/data-table/data-model/remote-data-model/) explains fetch lifecycle, actions,
  viewport-driven fetching, cancellation, grouped rows, and loading UI.
- [Columns for Dynamic Schemas](/data-table/columns/inferring-columns-from-model-data/) explains
  how dynamic local or remote model schemas become column declarations.

## Group rows

Grouped tables use a flattened row array plus `groups` markers. The marker tells the table which
flattened row is a group header, so it can render `GroupHeaderCell`, sticky group headers, and row
measurements correctly.

```typescript
const model = localModel({
  data: [
    { label: 'Office' },
    { id: 'SKU-001', name: 'Standing Desk', category: 'Office' },
    { id: 'SKU-002', name: 'Desk Lamp', category: 'Office' },
  ],
  groups: [{ index: 0, level: 0 }],
})
```

For a complete grouped example, see [Grouped Rows](/data-table/features/grouped-rows/).
