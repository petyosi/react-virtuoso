# Data Table Integration Issues

Created: 2026-06-23

This report tracks integration issues found while wiring `@virtuoso.dev/data-table` into downstream applications.

## Display/action columns must exist in row data

Status: integration issue, not a package bug.

### Symptom

In development, the browser console can fill with warnings like:

```text
[VirtuosoDataTable] Column field "actions" not found in row data at index 4.
Available fields: id, organization_id, project_id, name, slug, variable_name,
type, description, created_at, updated_at, created_by, created_by_name,
version_count, latest_version
```

This repeats for each rendered row because the table validates every column field against each row object.

### Cause

`DataTableColumn` uses `field` as both:

- the public column identifier for sticky columns, reordering, resizing, visibility, and persistence
- the row-data lookup key used to compute `cellValue`

The dev warning is intentional and comes from `packages/data-table/src/columns/Cell.tsx` when `column.field in row.data` is false.

This is easy to hit with display-only columns:

```tsx
<DataTableColumn field="actions" sticky="right">
  <DataTableColumnHeader>Actions</DataTableColumnHeader>
  <DataTableCell>{({ row }) => <ActionsMenu row={row.data} />}</DataTableCell>
</DataTableColumn>
```

If the API row does not include `actions`, the UI works but the console is noisy.

### Downstream fix

Add a UI-only field before passing rows to the data table:

```ts
type TableRow = ApiRow & { actions: null }

const toTableRow = (row: ApiRow): TableRow => ({ ...row, actions: null })
```

Then use `remoteModel<TableRow, Params>` or `localModel<TableRow>` and map fetched rows through `toTableRow`.

### Product/docs follow-up

The component behavior is coherent, but the integration rule should be explicit in docs and skills:

- Display-only columns still need a row-data key matching `field`.
- Synthetic fields such as `actions: null` are the recommended pattern.
- Examples with `field="actions"` should include `actions` in the sample row shape.

## Public props leak to DOM elements

Status: package bug.

### Symptom

React warns that table-specific props are being passed to DOM elements:

```text
Warning: React does not recognize the `EmptyPlaceholder` prop on a DOM element.
If you intentionally want it to appear in the DOM as a custom attribute, spell it
as lowercase `emptyplaceholder` instead. If you accidentally passed it from a
parent component, remove it from the DOM element.
```

The stack points through `DataTable` to the data-table package internals.

### Cause

`packages/data-table/src/core/VirtuosoDataTable.tsx` reads some public props from
`props` after collecting `...scrollerProps`:

```tsx
const {
  model,
  computeRowKey = defaultComputeRowKey,
  context = null,
  engineId,
  engineRef,
  onScroll,
  onRenderedDataChange,
  useWindowScroll = false,
  customScrollParent = null,
  increaseViewportBy = 0,
  columnOverscanCount = 0,
  components,
  children,
  ...scrollerProps
} = props

const initialLocation = props.initialLocation ?? null
const EmptyPlaceholder = props.EmptyPlaceholder ?? null
const ScrollElement = props.ScrollElement ?? 'div'
```

Because `initialLocation`, `EmptyPlaceholder`, and `ScrollElement` are not
destructured before `...scrollerProps`, they remain in `scrollerProps`.
`VirtuosoDataTable` then passes `scrollerProps` into `VirtualizedTableContent`,
which reaches `TableLayoutRoot` and spreads those props onto a DOM `div`.

### Package fix

Destructure these props before `...scrollerProps`:

```tsx
const {
  initialLocation = null,
  EmptyPlaceholder = null,
  ScrollElement = 'div',
  ...scrollerProps
} = props
```

or otherwise omit public table-only props before passing HTML props to
`TableLayoutRoot`.

## Table layout can crash when useCellValues returns no tuple

Status: probable package bug.

### Symptom

The table can crash with:

```text
Uncaught TypeError: _ is not a function or its return value is not iterable
```

In the Vite-optimized dependency bundle, the error points to:

```js
const [n, r, s] = _(He, D2, Bn)
```

That line corresponds to `packages/data-table/src/layout/TableLayoutRoot.tsx`:

```tsx
const [scrollbarScrollerWidth, headerHeight, tableReady] = useCellValues(
  scrollBarScrollerWidth$,
  stickyHeaderHeight$,
  tableReady$
)
```

### Findings

The app has a single resolved version of `@virtuoso.dev/reactive-engine-react`
through `@virtuoso.dev/data-table@0.1.4`, so this does not look like a duplicate
dependency mismatch.

The Vite bundle imports `useCellValues` and the imported symbol exists. The
failure message is therefore consistent with `useCellValues(...)` returning
`undefined` during render, not with the symbol being absent.

`TableLayoutRoot` destructures the result directly and has no fallback for a
missing tuple.

### Package follow-up

Verify whether `useCellValues` can return `undefined` before the combined cell
has an initial value, especially during initial render, StrictMode remounts, or
engine registration order changes.

Potential fixes:

- Ensure `useCellValues` always returns an array with current/default values.
- Ensure all cells consumed by `TableLayoutRoot` are registered and initialized
  before the first render that calls `useCellValues`.
- Add a defensive fallback in `TableLayoutRoot` if a transient undefined return
  is possible.

Do not work around this in downstream apps until the package behavior is
understood; it is a core layout failure.

## Zero-height warning after layout crash

Status: likely secondary symptom; verify after fixing package crash.

### Symptom

The console shows:

```text
[VirtuosoDataTable] Container element has zero height. No rows will render.
Set a height on the container element or use useWindowScroll.
```

### Notes

The downstream table was rendered with an explicit height style, so this warning
is suspicious when it appears alongside the `TableLayoutRoot` crash above.

It may be a secondary effect: if `TableLayoutRoot` crashes before measurement
completes, `viewportHeight$` can remain `0` while `totalCount > 0`, triggering
the dev warning from `packages/data-table/src/layout/table-ready.ts`.

Re-test this warning after fixing the `useCellValues`/`TableLayoutRoot` crash.
If it still appears with a measurable container height, investigate the
ResizeObserver/measurement path as a separate package bug.
