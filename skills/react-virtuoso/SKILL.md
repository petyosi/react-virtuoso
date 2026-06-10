---
name: react-virtuoso
description: >-
  Build virtualized lists, grids, and tables with react-virtuoso. Use this skill when (1) rendering large or infinite lists,
  (2) building grouped lists with sticky headers, (3) virtualizing HTML tables, (4) laying out same-sized items in a responsive grid,
  (5) building feeds or logs that follow new items at the bottom, (6) diagnosing virtualization symptoms such as jumpy scrolling,
  a list that does not scroll to the bottom, items overlapping, blank items, or "zero-sized element" errors, or (7) any task involving
  Virtuoso, GroupedVirtuoso, VirtuosoGrid, TableVirtuoso, VirtuosoHandle, itemContent, followOutput, or firstItemIndex.
---

# react-virtuoso

`react-virtuoso` renders only the visible portion of large lists, grids, and tables. It measures item sizes automatically with ResizeObserver — variable item heights work out of the box, with no size configuration.

```tsx
import { Virtuoso } from 'react-virtuoso'
;<Virtuoso style={{ height: '100%' }} data={users} itemContent={(index, user) => <div>{user.name}</div>} />
```

## Picking the right component

| Need                                                                    | Use                                                                 |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Flat list, variable or fixed item heights                               | `Virtuoso`                                                          |
| Groups with sticky group headers                                        | `GroupedVirtuoso`                                                   |
| HTML table with virtualized rows                                        | `TableVirtuoso`                                                     |
| Table with grouped rows and sticky group headers                        | `GroupedTableVirtuoso`                                              |
| Same-sized items in a responsive multi-column grid                      | `VirtuosoGrid`                                                      |
| Chat / AI conversation UI (streaming, stick-to-bottom, prepend history) | `@virtuoso.dev/message-list` — use the `message-list` skill instead |
| Data grid with columns, sorting, filtering, column features             | `@virtuoso.dev/data-table` — use the `data-table` skill instead     |

All components share the same core props (`data`/`totalCount`, `itemContent`, `components`, scroll callbacks, ref methods).

## What you do NOT need to do

Unlike TanStack Virtual or react-window, react-virtuoso measures items itself. Do not carry those libraries' patterns over:

- No `estimateSize`, no `measureElement`, no `data-index` wiring — measurement is automatic.
- No absolute positioning or `transform: translateY` on items — the library positions items.
- No fixed `itemSize` requirement — variable heights are the default. If items genuinely have one uniform height, pass `fixedItemHeight` as a performance optimization only.
- No windowing math — pass `data` (or `totalCount`) and render the item in `itemContent`.

## Core rules

- **The component needs a height.** Set `style={{ height: '100%' }}` (with a sized parent) or a fixed height. A zero-height container renders nothing.
- **Never put CSS margins on items.** ResizeObserver reports `contentRect`, which excludes margins, so the computed total height comes up short — the classic symptom is a list that cannot scroll all the way to the bottom. Use padding instead. Watch for default margins on `<p>`, headings, `<ul>`, `<blockquote>`, `<pre>`.
- **Use `data`, not `totalCount`, when you have the items.** With `data`, `itemContent={(index, item) => ...}` receives the item. Use `totalCount` only when items are derived from the index. Updates must produce a new array reference.
- **Provide `computeItemKey={(index, item) => item.id}`** whenever the list can be prepended, reordered, or filtered. The default key is the index, which remounts items (losing state) when positions shift.
- **Define `components` overrides outside the render function.** Inline definitions create a new component type each render, remounting the subtree on every scroll. `Scroller` and `List` overrides must forward `ref` to their DOM element.
- **Item content must not render zero-height elements.** The error "zero-sized element, this should not happen" means an item measured 0px — filter empty items out of the data instead.

## Common patterns

### Infinite scrolling

```tsx
<Virtuoso data={items} endReached={() => loadMore()} itemContent={(index, item) => <Item item={item} />} />
```

`endReached` fires at the bottom; render a spinner via `components.Footer`. For "load more" on click, put the button in `Footer`.

### Prepending items (reverse infinite scroll)

Prepending naively makes the list jump. Instead, keep a `firstItemIndex` that you decrease by the number of prepended items:

```tsx
const [firstItemIndex, setFirstItemIndex] = useState(START)

const prepend = (older: Item[]) => {
  setFirstItemIndex((i) => i - older.length)
  setItems((current) => [...older, ...current])
}

<Virtuoso firstItemIndex={firstItemIndex} initialTopMostItemIndex={START} data={items} startReached={prepend} ... />
```

`firstItemIndex` must stay a positive number, so start it large (e.g. `100000`). For `GroupedVirtuoso`, decrease it by the number of new items only, excluding the group headers. See [endless-scrolling](references/1.virtuoso/endless-scrolling.md).

### Following new items (logs, feeds)

```tsx
<Virtuoso followOutput="smooth" data={messages} ... />
```

`followOutput` scrolls to new bottom items only when the user is already at the bottom. It accepts `'auto' | 'smooth' | false` or a function `(isAtBottom) => ...` for custom logic. For full chat UIs prefer `@virtuoso.dev/message-list`.

### Scrolling programmatically

```tsx
const ref = useRef<VirtuosoHandle>(null)
ref.current?.scrollToIndex({ index: 500, align: 'center', behavior: 'smooth' })
```

Also on the handle: `scrollIntoView` (only scrolls if not visible — right for keyboard navigation), `scrollTo`/`scrollBy` (pixel-based), and `getState` (snapshot for `restoreStateFrom` when remounting, e.g. back navigation).

To start at an item, use `initialTopMostItemIndex={{ index, align: 'start' }}` — not `initialScrollTop`, which first renders at the top and then jumps.

### Grouped lists

```tsx
<GroupedVirtuoso
  groupCounts={[20, 30]} // items per group, in order
  groupContent={(groupIndex) => <Header group={groups[groupIndex]} />}
  itemContent={(index, groupIndex) => <Item item={items[index]} />} // index is absolute across all items
/>
```

You provide flat data plus `groupCounts`; map indexes back to your data yourself.

### Tables

```tsx
<TableVirtuoso
  data={rows}
  fixedHeaderContent={() => (
    <tr>
      <th>Name</th>
    </tr>
  )}
  itemContent={(index, row) => (
    <>
      <td>{row.name}</td>
    </>
  )} // <td> cells only — the row <tr> is rendered for you
/>
```

Do not set `border-collapse: collapse` on the table — the sticky header's borders scroll away with the body. Use `border-collapse: separate` with explicit cell borders. Customize structure via `components` (`Table`, `TableRow`, `TableHead`, `TableBody`).

### Grid

`VirtuosoGrid` virtualizes same-sized items in columns. You control column count with CSS — give `components.Item` a percentage width (`33%` for three columns, changed via media queries) and `components.List` `display: flex; flex-wrap: wrap`. See [grid-responsive-columns](references/3.virtuoso-grid/grid-responsive-columns.md).

### Page-level scrolling

Use `useWindowScroll` to drive the list from the document scroll, or `customScrollParent={element}` to attach to an existing scrollable ancestor. Pick exactly one scroll mode — combining them makes both containers scroll.

### Testing

JSDOM has no layout, so items will not render in Jest/Vitest without mocked measurements:

```tsx
render(<Virtuoso data={data} />, {
  wrapper: ({ children }) => (
    <VirtuosoMockContext.Provider value={{ viewportHeight: 300, itemHeight: 100 }}>{children}</VirtuosoMockContext.Provider>
  ),
})
```

Use `VirtuosoGridMockContext` (adds `viewportWidth`, `itemWidth`) for grids. Prefer real-browser tests (Playwright) for scroll behavior.

## Troubleshooting

| Symptom                                                                       | Likely cause                                                     | Fix                                                                                          |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Nothing renders                                                               | Container has zero height                                        | Give the component or its parent a real height                                               |
| Cannot scroll to the last items / jumps near the bottom                       | Margins on item content                                          | Replace margins with padding                                                                 |
| Items flicker or lose state while scrolling                                   | Inline `components` definitions or index-based keys              | Hoist components; add `computeItemKey`                                                       |
| List jumps on prepend                                                         | Items added without `firstItemIndex` adjustment                  | Use the `firstItemIndex` prepend pattern                                                     |
| "zero-sized element, this should not happen"                                  | An item rendered with zero height                                | Filter empty items from the data                                                             |
| "ResizeObserver loop completed with undelivered notifications" overlay in dev | Benign ResizeObserver timing, surfaced by the dev-server overlay | Disable `runtimeErrors` in the webpack/vite overlay config; safe to filter in error tracking |
| Hard-to-explain size behavior                                                 | —                                                                | Set `logLevel={LogLevel.DEBUG}` and watch the console with all levels enabled                |

Tuning: `increaseViewportBy` renders extra pixels outside the viewport (smoother, more DOM); `defaultItemHeight` skips the initial probe render; `fixedItemHeight` skips measurement entirely (uniform items only); `scrollSeekConfiguration` swaps items for placeholders during fast scrolling.

## References

Detailed guides with full code in [references/](references/):

- [references/README.md](references/README.md) — package overview and full feature list
- `references/1.virtuoso/` — flat list guides: [basic-usage](references/1.virtuoso/basic-usage.md), [endless-scrolling](references/1.virtuoso/endless-scrolling.md), [press-to-load-more](references/1.virtuoso/press-to-load-more.md), [initial-index](references/1.virtuoso/initial-index.md), [scroll-to-index](references/1.virtuoso/scroll-to-index.md), [keyboard-navigation](references/1.virtuoso/keyboard-navigation.md), [customize-rendering](references/1.virtuoso/customize-rendering.md), [footer](references/1.virtuoso/footer.md), [top-items](references/1.virtuoso/top-items.md), [scroll-handling](references/1.virtuoso/scroll-handling.md), [range-change-callback](references/1.virtuoso/range-change-callback.md), [scroll-seek-placeholders](references/1.virtuoso/scroll-seek-placeholders.md), [auto-resizing](references/1.virtuoso/auto-resizing.md), [window-scrolling](references/1.virtuoso/window-scrolling.md), [custom-scroll-container](references/1.virtuoso/custom-scroll-container.md), [horizontal-mode](references/1.virtuoso/horizontal-mode.md)
- `references/2.grouped-virtuoso/` — grouped lists: [grouped-numbers](references/2.grouped-virtuoso/grouped-numbers.md), [grouped-by-first-letter](references/2.grouped-virtuoso/grouped-by-first-letter.md), [scroll-to-group](references/2.grouped-virtuoso/scroll-to-group.md), [grouped-with-load-on-demand](references/2.grouped-virtuoso/grouped-with-load-on-demand.md)
- `references/3.virtuoso-grid/` — [grid-responsive-columns](references/3.virtuoso-grid/grid-responsive-columns.md)
- `references/4.table-virtuoso/` — tables: [basic-table](references/4.table-virtuoso/basic-table.md), [table-fixed-headers](references/4.table-virtuoso/table-fixed-headers.md), [table-fixed-columns](references/4.table-virtuoso/table-fixed-columns.md), [table-grouped](references/4.table-virtuoso/table-grouped.md)
- `references/5.third-party-integration/` — [mocking-in-tests](references/5.third-party-integration/mocking-in-tests.md), [tanstack-table-integration](references/5.third-party-integration/tanstack-table-integration.md), [mui-table-virtual-scroll](references/5.third-party-integration/mui-table-virtual-scroll.md), [material-ui-endless-scrolling](references/5.third-party-integration/material-ui-endless-scrolling.md)
- [references/6.troubleshooting.md](references/6.troubleshooting.md) — full troubleshooting guide

Full API reference: <https://virtuoso.dev/react-virtuoso/>
