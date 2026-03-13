# React Virtuoso Data Table

`@virtuoso.dev/data-table` is a virtualized React data table with row and column virtualization, grouped data support, sticky columns, remote data models, and a reactive engine for external control.

It is the successor to `TableVirtuoso` when you need a table-specific API instead of a virtualized HTML table primitive. The recommended distribution is the shadcn-style wrapper published from `virtuoso.dev`, which gives you styled cells and headers while keeping the headless engine available for advanced behavior.

## Choose your starting point

- [Shadcn installation](/data-table/installation/shadcn/) for the fastest path to a polished table
- [Headless installation](/data-table/installation/headless/) for custom design systems or non-Tailwind stacks
- [Tutorial](/data-table/tutorial/intro/) for a progressive build from basic columns to remote control
- [Examples](/data-table/examples/basic-table/) for task-oriented recipes
- [API reference](/data-table/api-reference/) for the full type and export surface

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
- The headless package exposes a reactive engine for local and remote data models.

## Migrating from `TableVirtuoso`

If you are coming from `TableVirtuoso`, start by moving row rendering logic into `DataTableColumn` definitions:

- `itemContent` becomes one or more `DataTableCell` renderers
- sticky or grouped structures move into `sticky`, `GroupHeaderCell`, and `ColumnGroup`
- imperative scrolling stays available through the table ref and `VirtuosoDataTableMethods`

For teams already standardized on shadcn/ui, the wrapper keeps the migration surface small because the styled building blocks are installed into your app and can be edited like any other component.

## Feature map

- Tutorial:
  Learn the full flow from basic columns to remote data and external controls in the [10-part tutorial](/data-table/tutorial/intro/).
- Examples:
  Jump directly to grouped rows, sticky columns, remote loading, and custom scroll parents in the [examples section](/data-table/examples/basic-table/).
- Concepts:
  Read deeper guides on data shapes, models, composition, theming, testing, troubleshooting, and performance under [/data-table/](/data-table/).

## License

MIT
