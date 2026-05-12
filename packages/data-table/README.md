# React Virtuoso Data Table

`@virtuoso.dev/data-table` is a virtualized React data table with row and column virtualization,
grouped data support, sticky columns, local and remote data models, and a reactive engine for table
instance control.

It is the successor to `TableVirtuoso` when you need a table-specific API instead of a virtualized HTML table primitive. The recommended distribution is the shadcn-style wrapper published from `virtuoso.dev`, which gives you styled cells and headers while keeping the headless engine available for advanced behavior.

## Choose your starting point

- [Shadcn installation](/data-table/installation/shadcn/) for the fastest path to a polished table
- [Headless installation](/data-table/installation/headless/) for custom design systems or non-Tailwind stacks
- [Data binding](/data-table/data-binding/) for direct data, local models, and remote models
- [Column definitions](/data-table/column-definitions/) for headers, cells, and stable column identity
- [Inferring columns](/data-table/inferring-columns-from-model-data/) for dynamic model schemas
- [Feature chapters](/data-table/features/grouped-rows/) for grouped rows, sticky columns, resizing, reordering, visibility, persistence, and table instance control
- [Examples](/data-table/examples/basic-table/) for task-oriented recipes
- [API reference](/data-table/api-reference/) for the main package types and exports

## Quick start

```tsx live
import { DataTable, DataTableCell, DataTableColumn, DataTableColumnHeader } from '@/components/ui/data-table'

const products = [
  { id: 'SKU-001', name: 'Standing Desk', category: 'Office', price: 699, stock: 14 },
  { id: 'SKU-002', name: 'USB-C Dock', category: 'Peripherals', price: 229, stock: 42 },
  { id: 'SKU-003', name: 'Mechanical Keyboard', category: 'Peripherals', price: 169, stock: 28 },
  { id: 'SKU-004', name: 'Noise-canceling Headset', category: 'Audio', price: 319, stock: 9 },
]

const currency = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  style: 'currency',
})

export default function App() {
  return (
    <DataTable className="rounded-xl" data={{ data: products, groups: [] }} style={{ height: 320 }}>
      <DataTableColumn field="name">
        <DataTableColumnHeader>Name</DataTableColumnHeader>
        <DataTableCell className="font-medium">{({ cellValue }) => String(cellValue)}</DataTableCell>
      </DataTableColumn>
      <DataTableColumn field="category">
        <DataTableColumnHeader>Category</DataTableColumnHeader>
        <DataTableCell>{({ cellValue }) => String(cellValue)}</DataTableCell>
      </DataTableColumn>
      <DataTableColumn field="price">
        <DataTableColumnHeader className="justify-end">Price</DataTableColumnHeader>
        <DataTableCell className="text-right tabular-nums">{({ cellValue }) => currency.format(Number(cellValue))}</DataTableCell>
      </DataTableColumn>
      <DataTableColumn field="stock">
        <DataTableColumnHeader className="justify-end">Stock</DataTableColumnHeader>
        <DataTableCell className="text-right tabular-nums">{({ cellValue }) => String(cellValue)}</DataTableCell>
      </DataTableColumn>
    </DataTable>
  )
}
```

## Why use it instead of `TableVirtuoso`

- You define columns declaratively instead of returning raw `<td>` fragments.
- Both axes are virtualized, so very wide tables stay responsive.
- Group headers, sticky columns, and column groups are first-class.
- The headless package exposes local and remote data models plus table instance control APIs.

## Migrating from `TableVirtuoso`

If you are coming from `TableVirtuoso`, start by moving row rendering logic into `DataTableColumn` definitions:

- `itemContent` becomes one or more `DataTableCell` renderers
- sticky or grouped structures move into `sticky`, `GroupHeaderCell`, and `ColumnGroup`
- programmatic scrolling moves to table instance control with `engineRef` / `engineId` and `scrollToRow$`

For teams already standardized on shadcn/ui, the wrapper keeps the migration surface small because the styled building blocks are installed into your app and can be edited like any other component.

See [Migrating From TableVirtuoso](/data-table/guides/migrating-from-table-virtuoso/) for the full mapping.

## Documentation map

Start with the two required setup tasks:

1. [Bind data](/data-table/data-binding/) with direct `data`, `localSource()`, or `remoteSource()`.
2. [Define columns](/data-table/column-definitions/) with `DataTableColumn`, headers, and cells.

Then add the features your table needs:

- [Grouped rows](/data-table/features/grouped-rows/) for sectioned local and remote datasets
- [Column groups](/data-table/features/column-groups/) and [sticky columns](/data-table/features/sticky-columns/) for wide operational tables
- [Column resizing](/data-table/features/column-resizing/), [column reordering](/data-table/features/column-reordering/), and [column visibility](/data-table/features/column-visibility/) for user-controlled layouts
- [State persistence](/data-table/features/state-persistence/) for saving table and model state
- [Table instance control](/data-table/features/table-instance-control/) for toolbars and surrounding UI

Visual customization is covered separately:

- [shadcn wrapper](/data-table/customization/shadcn-wrapper/)
- [styling cells, headers, and rows](/data-table/customization/styling-cells-headers-and-rows/)
- [empty, loading, and error states](/data-table/customization/empty-loading-and-error-states/)
- [header slots](/data-table/customization/header-slots/)
- [custom scroll containers](/data-table/customization/custom-scroll-containers/)

## License

MIT
