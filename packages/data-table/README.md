# React Virtuoso Data Table

`@virtuoso.dev/data-table` is a virtualized React data table with row and column virtualization,
grouped data support, sticky columns, state persistence, and column resizing, reordering, and
visibility features.

It is the successor to `TableVirtuoso` when you need a table-specific API instead of a virtualized HTML table primitive. The recommended distribution is the shadcn-style wrapper published from `virtuoso.dev`, which gives you styled cells and headers while keeping the headless engine available for advanced behavior.

## Choose your starting point

- [Shadcn installation](/data-table/installation/shadcn/) for the fastest path to a polished table
- [Headless installation](/data-table/installation/headless/) for custom design systems or non-Tailwind stacks
- [Data model](/data-table/data-model/) for local and remote models
- [Columns](/data-table/columns/) for headers, cells, column groups, sticky pinning, visibility, resizing, reordering, and dynamic schemas
- [Grouped rows](/data-table/grouped-rows/), [state persistence](/data-table/state-persistence/), and [controlling the table](/data-table/controlling-the-table/) from surrounding UI

## Quick start

```tsx live
import { DataTable, DataTableCell, DataTableColumn, DataTableColumnHeader } from '@/components/ui/data-table'
import { localModel } from '@virtuoso.dev/data-table'

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

const model = localModel({ data: products })

export default function App() {
  return (
    <DataTable className="rounded-xl" model={model} style={{ height: 320 }}>
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

## Migrating from `TableVirtuoso`

If you are coming from `TableVirtuoso`, start by moving row rendering logic into `DataTableColumn` definitions:

- `itemContent` becomes one or more `DataTableCell` renderers
- sticky or grouped structures move into `sticky`, `GroupHeaderCell`, and `ColumnGroup`
- programmatic scrolling moves to table instance control with `engineRef` / `engineId` and `scrollToRow$`

For teams already standardized on shadcn/ui, the wrapper keeps the migration surface small because the styled building blocks are installed into your app and can be edited like any other component.

See [Migrating From TableVirtuoso](/data-table/guides/migrating-from-table-virtuoso/) for the full mapping.

## Documentation map

Start with the two required setup tasks:

1. [Data model](/data-table/data-model/) with `localModel()` or `remoteModel()`.
2. [Columns](/data-table/columns/) with `DataTableColumn`, headers, and cells.

Then add the features your table needs:

- [Column groups](/data-table/columns/column-groups/) and [sticky columns](/data-table/columns/sticky-columns/) for wide operational tables
- [Column visibility](/data-table/columns/column-visibility/), [resizing](/data-table/columns/column-resizing/), and [reordering](/data-table/columns/column-reordering/) for user-controlled layouts
- [Grouped rows](/data-table/grouped-rows/) for sectioned local and remote datasets
- [State persistence](/data-table/state-persistence/) for saving table feature state and
  model action state
- [Controlling the table](/data-table/controlling-the-table/) from toolbars and surrounding UI

Visual customization is covered separately:

- [styling cells, headers, and rows](/data-table/customization/styling/)
- [replacing internals](/data-table/customization/replacing-internals/)
- [empty and loading states](/data-table/customization/empty-and-loading-states/)
- [scroll containers](/data-table/customization/scroll-containers/)
- [ambient context](/data-table/customization/ambient-context/) — a bag of values available throughout the table's customizable parts
- [header slots](/data-table/customization/header-slots/) — mount sort buttons, filter menus, and other controls inside column headers
- [inside the shadcn wrapper](/data-table/customization/shadcn-wrapper/) — change app-wide defaults by editing the wrapper file

## License

MIT
