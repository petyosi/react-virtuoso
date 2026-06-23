---
name: data-table
description: >-
  Build virtualized data tables with @virtuoso.dev/data-table. Use this skill when (1) building a data grid with sorting, filtering,
  or grouped rows, (2) installing the shadcn-styled or headless table, (3) connecting remote/paginated data sources, (4) adding sticky,
  resizable, reorderable, or hideable columns, (5) persisting table state, (6) controlling a table from outside (scrolling, actions),
  (7) migrating from TableVirtuoso, or any task involving VirtuosoDataTable, DataTable, DataTableColumn, localModel, remoteModel,
  or engine refs like scrollToRow$ and dispatchModelAction$.
---

# @virtuoso.dev/data-table

A virtualized React data table (rows and columns) with grouped rows, sticky columns, column resizing/reordering/visibility, state persistence, and remote data support. It is the successor to `TableVirtuoso` for table-shaped problems: instead of row renderers, you pass a data source (model) and declare columns as JSX.

## Installation: two paths

**Shadcn (pre-styled wrapper)** — for projects using shadcn/ui conventions:

```bash
npx shadcn@latest add petyosi/react-virtuoso/data-table
```

This installs a styled wrapper at `@/components/ui/data-table` exporting `DataTable`, `DataTableColumn`, `DataTableColumnHeader`, `DataTableCell`.

**Headless** — for custom design systems:

```bash
npm install @virtuoso.dev/data-table
```

Import the structural styles (`@import '@virtuoso.dev/data-table/styles.css'`) and use the unstyled `VirtuosoDataTable`, `Column`, `ColumnHeader`, `Cell`. Ask which path fits the project before installing; the shadcn wrapper is the faster start in Tailwind/shadcn codebases.

## Minimal example (shadcn wrapper)

```tsx
import { DataTable, DataTableCell, DataTableColumn, DataTableColumnHeader } from '@/components/ui/data-table'
import { localModel } from '@virtuoso.dev/data-table'

const model = localModel({ data: products })

export default function App() {
  return (
    <DataTable className="rounded-xl" model={model} style={{ height: 360 }}>
      <DataTableColumn field="name">
        <DataTableColumnHeader>Product</DataTableColumnHeader>
        <DataTableCell className="font-medium">{({ cellValue }) => String(cellValue)}</DataTableCell>
      </DataTableColumn>
    </DataTable>
  )
}
```

Columns are JSX, not config objects. `field` is both the row-data lookup key and the column's public identifier (used by visibility, reordering, persistence). The table needs a real height, like every Virtuoso component.

## Choosing a data model

| Situation                                                       | Model                                                                                                 |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Rows in memory; filter/sort/group client-side                   | `localModel({ data, pipeline?, actions?, groups? })`                                                  |
| API-backed, known total count (placeholder rows while fetching) | `remoteModel` with offset mode (`defaultOffsetViewportHandler`); fetch returns `{ rows, totalCount }` |
| API-backed, cursor pagination / infinite append                 | `remoteModel` with append mode (`defaultAppendViewportHandler`); fetch returns `{ rows }`             |

Hold the model in `useState` with lazy init — `const [model] = useState(() => localModel({ data }))`. Do not use `useMemo`; React may discard memoized values, and the model instance must be retained. Module scope is fine for a static singleton table.

Local filtering/sorting/grouping runs through a named-stage pipeline: declare `pipeline: ['filter', 'sort']` plus `actions`, then dispatch with `model.send({ action: 'filter', payload })`. See [local-data-model](references/2.data-model/01.local-data-model.md) and the [local-filter-sort-group example](references/8.examples/07.local-filter-sort-group.md).

Provide `computeRowKey={({ data }) => data.id}` whenever rows can reorder (sort, filter, remote updates) — without it rows remount and lose local state.

## Column features

- **Sticky columns:** `<DataTableColumn field="name" sticky="left" />` (or `"right"`); multiple sticky columns stack.
- **Visibility:** declaratively via `visible={false}`, or at runtime through `setColumnVisibility$` / `columnVisibilityState$` from `@virtuoso.dev/data-table/column-visibility`.
- **Resizing:** mount `ResizeHandle` in the `HeaderEdge` slot; programmatic via `resizeColumn$` from `@virtuoso.dev/data-table/column-resize`.
- **Reordering:** `ReorderGrip` in `HeaderStart` + `ReorderDropZone` in `HeaderOverlay`; programmatic via `reorderColumns$` from `@virtuoso.dev/data-table/column-reorder`.
- **Header slots:** `HeaderStart` (before label), `HeaderEnd` (after label), `HeaderEdge` (pinned to the column boundary), `HeaderOverlay` (covers the header) — see [header-slots](references/7.customization/06.header-slots.md).
- **Grouped rows:** pass `groups: [{ index, level }]` alongside `data` and render headers with `GroupHeaderCell` — see [grouped-rows](references/4.grouped-rows.md).

State persistence: mount `<DataTableStatePersistence adapters={[...]} storageKey="my-table" />` with adapters from the feature subpaths (`columnVisibilityPersistenceAdapter()`, `columnOrderPersistenceAdapter()`, `columnWidthPersistenceAdapter()`, `modelStatePersistenceAdapter()`). See [state-persistence](references/5.state-persistence.md).

## Controlling the table from outside

The table's state lives in an internal reactive engine, and the package intentionally exports cells (readable state, `$`-suffixed) and streams (actions) for remote control — state is not lifted into props:

```tsx
import { scrollLocation$, scrollToRow$, useEngineRef, useRemoteCellValue, useRemotePublisher } from '@virtuoso.dev/data-table'

const engineRef = useEngineRef()
const scrollToRow = useRemotePublisher(scrollToRow$, engineRef)
const location = useRemoteCellValue(scrollLocation$, engineRef)

<DataTable engineRef={engineRef} model={model}>...</DataTable>
<button onClick={() => scrollToRow({ index: 100, align: 'start' })}>Go to row 100</button>
```

For UI far from the table, pass `engineId="orders-table"` and use the same hooks with the string id. Useful nodes: `scrollToRow$`, `scrollIntoView$`, `setColumnVisibility$`, `dispatchModelAction$` (actions); `scrollLocation$`, `columns$`, `columnVisibilityState$`, `modelActionState$`, `loadingState$` (state). See [controlling-the-table](references/6.controlling-the-table.md).

## Customization

- Styling goes through `className` on the wrapper components and semantic data attributes — never use `data-testid` as a styling hook.
- Replace internals via the `components` prop: `Row`, `StickyColumnContainer`, `LoadingPlaceholder`, `LoadingOverlay`, `LoadingFooter` (component overrides must forward refs). Top-level: `EmptyPlaceholder`, `ScrollElement`.
- `context={{ ... }}` flows to `computeRowKey`, `EmptyPlaceholder`, loading slots, and component overrides — but not to cell/header renderers (use React context there). See [ambient-context](references/7.customization/05.ambient-context.md).
- Scroll modes: default internal scroller, `useWindowScroll`, or `customScrollParent` — pick exactly one.

## Migrating from TableVirtuoso

| TableVirtuoso         | data-table                                                  |
| --------------------- | ----------------------------------------------------------- |
| `data` array          | `localModel({ data })` passed as `model`                    |
| `itemContent`         | `DataTableColumn` + `DataTableCell`                         |
| `fixedHeaderContent`  | `DataTableColumnHeader`                                     |
| grouped rows          | `groups` + `GroupHeaderCell`                                |
| fixed columns (CSS)   | `sticky="left"` / `sticky="right"`                          |
| ref + `scrollToIndex` | `engineRef` + `scrollToRow$`                                |
| `rangeChanged`        | `onRenderedDataChange`, `viewportRange$`, `scrollLocation$` |

Full guide: [migrating-from-table-virtuoso](references/9.guides/04.migrating-from-table-virtuoso.md).

## Troubleshooting

| Symptom                                 | Fix                                                                                                 |
| --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Blank table or header only              | Give the table a measurable height                                                                  |
| Shadcn component imports fail           | Run the registry install, or import headless from `@virtuoso.dev/data-table`                        |
| Page and table both scroll              | Use only one scroll mode                                                                            |
| Remote rows never appear                | Return the right fetch shape (`{ rows, totalCount }` for offset mode) and pass the `signal` through |
| Rows remount / lose state after sorting | Add `computeRowKey`                                                                                 |
| Sticky columns clipped                  | Check parent `overflow` and column min-widths                                                       |
| Empty cells flash on horizontal scroll  | Raise `columnOverscanCount`                                                                         |

For tests, wrap in `VirtuosoDataTableTestingContext.Provider value={{ itemHeight, viewportHeight }}` (JSDOM has no layout) and assert behavior, not exact DOM row counts — overscan renders extra rows. Use real-browser tests for sticky columns, resizing, and drag interactions. See [testing](references/9.guides/01.testing.md).

## References

- [references/README.md](references/README.md) — overview
- `references/1.installation/` — [shadcn](references/1.installation/01.shadcn.md), [headless](references/1.installation/02.headless.md)
- `references/2.data-model/` — [local](references/2.data-model/01.local-data-model.md), [remote](references/2.data-model/02.remote-data-model.md), [row-keys](references/2.data-model/03.row-keys.md)
- `references/3.columns/` — [defining-columns](references/3.columns/01.defining-columns.md), [cell-and-header-renderers](references/3.columns/02.cell-and-header-renderers.md), [column-groups](references/3.columns/03.column-groups.md), [sticky-columns](references/3.columns/04.sticky-columns.md), [visibility](references/3.columns/05.column-visibility.md), [resizing](references/3.columns/06.column-resizing.md), [reordering](references/3.columns/07.column-reordering.md), [runtime-columns](references/3.columns/08.runtime-columns.md)
- Features: [grouped-rows](references/4.grouped-rows.md), [state-persistence](references/5.state-persistence.md), [controlling-the-table](references/6.controlling-the-table.md)
- `references/7.customization/` — [styling](references/7.customization/01.styling.md), [replacing-internals](references/7.customization/02.replacing-internals.md), [empty-and-loading-states](references/7.customization/03.empty-and-loading-states.md), [scroll-containers](references/7.customization/04.scroll-containers.md), [ambient-context](references/7.customization/05.ambient-context.md), [header-slots](references/7.customization/06.header-slots.md), [shadcn-wrapper](references/7.customization/07.shadcn-wrapper.md)
- `references/8.examples/` — worked examples from basic table to remote pagination, dashboards, and persistence
- `references/9.guides/` — [testing](references/9.guides/01.testing.md), [performance](references/9.guides/02.performance.md), [troubleshooting](references/9.guides/03.troubleshooting.md), [migrating-from-table-virtuoso](references/9.guides/04.migrating-from-table-virtuoso.md), [debug-instrumentation](references/9.guides/05.debug-instrumentation.md)

Full API reference: <https://virtuoso.dev/data-table/>
