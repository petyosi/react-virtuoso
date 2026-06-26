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
Optional feature UI parts are separate registry items:

```bash
npx shadcn@latest add petyosi/react-virtuoso/data-table-resize-handle
npx shadcn@latest add petyosi/react-virtuoso/data-table-sort-header-button
```

The registry item names are hyphenated. The installed imports remain nested (`@/components/ui/data-table/column-resize`, `@/components/ui/data-table/column-sort`). Do not run path-shaped shadcn commands such as `data-table/column-resize` or `data-table/column-sort`; shadcn resolves registry item names, not import paths.

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
    <DataTable model={model} style={{ height: 360 }}>
      <DataTableColumn field="name">
        <DataTableColumnHeader>Product</DataTableColumnHeader>
        <DataTableCell className="font-medium">{({ cellValue }) => String(cellValue)}</DataTableCell>
      </DataTableColumn>
    </DataTable>
  )
}
```

Columns are JSX, not config objects. `field` is both the row-data lookup key and the column's public identifier (used by visibility, reordering, persistence). The table needs a real height, like every Virtuoso component.

Treat `field` and `id` as stable column identities, not as user-facing labels. Add an explicit `DataTableColumnHeader` for every visible column. This is especially important for display-only columns such as `actions`: use a visible label like `Actions` unless the product intentionally wants an icon-only/headerless column, in which case use `sr-only` text for accessibility.

When a table should fill the remaining height in a page, panel, or card, use a measured flex column instead of a fixed pixel height. Every flex ancestor between the measured container and the table needs `min-h-0`; non-table chrome should be `shrink-0`; the table should be the growing child with `style={{ height: '100%' }}`:

```tsx
<section className="flex h-full min-h-0 flex-col">
  <PageHeader className="shrink-0" />
  <div className="flex min-h-0 flex-1 flex-col gap-3">
    <Toolbar className="shrink-0" />
    <DataTable className="min-h-0 flex-1" model={model} style={{ height: '100%' }}>
      {/* columns */}
    </DataTable>
  </div>
</section>
```

This is optional. If the parent does not have a definite height, keep using a fixed height (`style={{ height: 360 }}`) or choose `useWindowScroll` / `customScrollParent` deliberately.

Column widths are owned by the table through header measurements. Put base width classes such as `w-*`, `min-w-*`, and `basis-*` on `DataTableColumnHeader`, not on `DataTableCell`. Cells render inside tracks sized from header measurements; cell width utilities can force body content outside those tracks and make columns overlap at narrow widths. Use cell `className` for typography, alignment, padding, truncation, and color. For complex cell content, put `min-w-0` on an inner wrapper instead of widening the cell.

When building a table, choose fixed vs growing columns from the data being displayed:

- Keep compact columns fixed by omitting `grow`: ids, slugs, checkboxes, action menus, icon buttons, status labels, badges, versions, counts, dates, timestamps, and short enum or metadata columns.
- Mark text-heavy columns as growing with `DataTableColumn grow={number}`: names, titles, descriptions, summaries, messages, notes, paths, and other content where extra horizontal space improves scanning or reduces truncation.
- Use positive finite grow values. `grow={0}` is equivalent to omitting `grow`; prefer omission for fixed columns unless a generated config shape needs an explicit value.
- Ground the choice in local understanding of the table. A `name` column often grows, but a short code-like name may be fixed; a `label` column is often fixed, but user-authored labels may grow.
- Do not make every column grow. `grow` protects compact columns from absorbing leftover space while useful text columns take the room.

Example:

```tsx
<DataTableColumn field="name" grow={1}>
  <DataTableColumnHeader className="min-w-72">Name</DataTableColumnHeader>
  <DataTableCell>{NameCell}</DataTableCell>
</DataTableColumn>

<DataTableColumn field="description" grow={3}>
  <DataTableColumnHeader className="min-w-80">Description</DataTableColumnHeader>
  <DataTableCell>{DescriptionCell}</DataTableCell>
</DataTableColumn>

<DataTableColumn id="actions">
  <DataTableColumnHeader className="w-16 justify-center">Actions</DataTableColumnHeader>
  <DataTableCell>{ActionsCell}</DataTableCell>
</DataTableColumn>
```

## Choosing a data model

| Situation                                                       | Model                                                                                                 |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Rows in memory; filter/sort/group client-side                   | `localModel({ data, pipeline?, actions?, groups? })`                                                  |
| API-backed, known total count (placeholder rows while fetching) | `remoteModel` with offset mode (`defaultOffsetViewportHandler`); fetch returns `{ rows, totalCount }` |
| API-backed, cursor pagination / infinite append                 | `remoteModel` with append mode (`defaultAppendViewportHandler`); fetch returns `{ rows }`             |

Hold the model in `useState` with lazy init — `const [model] = useState(() => localModel({ data }))`. Do not use `useMemo`; React may discard memoized values, and the model instance must be retained. Module scope is fine for a static singleton table.

Local filtering/sorting/grouping runs through a named-stage pipeline: declare `pipeline: ['filter', 'sort']` plus `actions`, then dispatch with `model.send({ action: 'filter', payload })`. See [local-data-model](references/2.data-model/01.local-data-model.md) and the [local-filter-sort-group example](references/8.examples/07.local-filter-sort-group.md).

For remote sorting/filtering/search controls, keep the action payload in the model rather than mirroring it in React state. Seed defaults with `initialActions`, dispatch changes with `model.send()` or `dispatchModelAction$`, and read `modelActionState$` to paint active controls. This is especially important when `modelStatePersistenceAdapter()` restores saved action state.

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
- The shadcn wrapper already renders the app-level table frame (`rounded-md border`) on `DataTable`. Do not add `rounded-md border` at each table instance; use `className` only for intentional frame overrides such as `rounded-xl`, `border-0`, `border-2`, shadows, or table variable overrides.
- The shadcn wrapper exposes table-level CSS variables (`--data-table-bg`, `--data-table-fg`, `--data-table-border`, `--data-table-muted`, `--data-table-muted-fg`, `--data-table-row-hover`, `--data-table-sticky-hover`) and uses them for sticky headers, sticky columns, rows, and loading surfaces. When adapting to a host design system, override those variables once on `DataTable` or in the copied wrapper defaults instead of styling sticky cells individually.
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

| Symptom                                 | Fix                                                                                                                                          |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Blank table or header only              | Give the table a measurable height                                                                                                           |
| Table does not fill its panel           | Use the optional flex-height pattern: measured parent, `min-h-0` ancestors, `shrink-0` chrome, `DataTable` as `flex-1` with `height: '100%'` |
| Shadcn component imports fail           | Run the registry install, or import headless from `@virtuoso.dev/data-table`                                                                 |
| Shadcn creates a literal `@/` directory | Make the alias resolvable from the root config shadcn reads; with solution-style tsconfigs, mirror `@/*` paths in root `tsconfig.json`       |
| Page and table both scroll              | Use only one scroll mode                                                                                                                     |
| Remote rows never appear                | Return the right fetch shape (`{ rows, totalCount }` for offset mode) and pass the `signal` through                                          |
| Rows remount / lose state after sorting | Add `computeRowKey`                                                                                                                          |
| Body cells overlap columns              | Move width classes from `DataTableCell` to `DataTableColumnHeader`; use `DataTableColumn grow={...}` for extra width                         |
| Action/display column has no header     | Add an explicit visible `DataTableColumnHeader` label, e.g. `Actions`; `field`/`id` is an identity, not a UI label                           |
| Double outer border/frame               | Remove call-site `rounded-md border`; the shadcn wrapper already owns the default table frame                                                |
| Sticky/header colors don't match body   | Override the shadcn wrapper's `--data-table-*` variables on `DataTable` or in the copied wrapper defaults                                    |
| Sticky columns clipped                  | Check parent `overflow` and header min-widths                                                                                                |
| Empty cells flash on horizontal scroll  | Raise `columnOverscanCount`                                                                                                                  |

Before shipping a shadcn table, grep for width utilities on cells and move them to headers:

```bash
rg 'DataTableCell.*className=.*(w-|min-w|max-w|basis-|grow|shrink|flex-(none|auto|initial|1|\[))'
```

For tests, wrap in `VirtuosoDataTableTestingContext.Provider value={{ itemHeight, viewportHeight }}` (JSDOM has no layout) and assert behavior, not exact DOM row counts — overscan renders extra rows. Use real-browser tests for sticky columns, resizing, and drag interactions. See [testing](references/9.guides/01.testing.md).

## References

- [references/README.md](references/README.md) — overview
- `references/1.installation/` — [shadcn](references/1.installation/01.shadcn.md), [headless](references/1.installation/02.headless.md)
- `references/2.data-model/` — [local](references/2.data-model/01.local-data-model.md), [remote](references/2.data-model/02.remote-data-model.md), [row-keys](references/2.data-model/03.row-keys.md)
- `references/3.columns/` — [defining-columns](references/3.columns/01.defining-columns.md), [cell-and-header-renderers](references/3.columns/02.cell-and-header-renderers.md), [column-groups](references/3.columns/03.column-groups.md), [sticky-columns](references/3.columns/04.sticky-columns.md), [visibility](references/3.columns/05.column-visibility.md), [resizing](references/3.columns/06.column-resizing.md), [reordering](references/3.columns/07.column-reordering.md), [runtime-columns](references/3.columns/08.runtime-columns.md), [column-layout](references/3.columns/09.column-layout.md)
- Features: [grouped-rows](references/4.grouped-rows.md), [state-persistence](references/5.state-persistence.md), [controlling-the-table](references/6.controlling-the-table.md)
- `references/7.customization/` — [styling](references/7.customization/01.styling.md), [replacing-internals](references/7.customization/02.replacing-internals.md), [empty-and-loading-states](references/7.customization/03.empty-and-loading-states.md), [scroll-containers](references/7.customization/04.scroll-containers.md), [ambient-context](references/7.customization/05.ambient-context.md), [header-slots](references/7.customization/06.header-slots.md), [shadcn-wrapper](references/7.customization/07.shadcn-wrapper.md)
- `references/8.examples/` — worked examples from basic table to remote pagination, dashboards, and persistence
- `references/9.guides/` — [testing](references/9.guides/01.testing.md), [performance](references/9.guides/02.performance.md), [troubleshooting](references/9.guides/03.troubleshooting.md), [migrating-from-table-virtuoso](references/9.guides/04.migrating-from-table-virtuoso.md), [debug-instrumentation](references/9.guides/05.debug-instrumentation.md)

Full API reference: <https://virtuoso.dev/data-table/>
