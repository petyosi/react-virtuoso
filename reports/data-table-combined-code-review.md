# `packages/data-table` Combined Pre-publish Code Review

---

## 1. Concurrency

### 1.1 `deduplicate` and `queue` only protect the synchronous part of `handleAction`

- **File(s):** `model-core.ts:216`, `model-core.ts:245`, `model-core.ts:248`
- **Severity:** Critical
- **Resolved:** `executeAction` now returns a boolean indicating sync vs async completion. `handleSend` only clears `inFlightActions` when the action completed synchronously (adapter returned a result). For async adapters (returning `null`), the action stays in `inFlightActions` until the async result arrives through the emitter callback, which now handles cleanup and queue draining. Append-mode `loadMore` was also updated to use `deduplicate` strategy so redundant dispatches are dropped while a fetch is in-flight. Tests added in `concurrency.test.ts`.

### 1.2 Superseded requests can overwrite newer data with stale responses

- **File(s):** `model-core.ts:234`, `model-core.ts:259`, `model-core.ts:63`
- **Severity:** Critical
- **Resolved:** Each `InFlightRequest` now captures `operationVersion` at dispatch time. The async emitter uses this captured version (not the current `view.operationVersion`) for the stale check. Cancelled requests are marked with a `cancelled` flag instead of being deleted from `inFlightRequests`, preserving the captured version for late-arriving results. The async emitter drops results from cancelled requests outright, and drops stale results via the existing `operationVersion < view.operationVersion` check (which now works correctly). Note: model-initiated supersede still does not call `adapter.handleCancel` — that remains a separate issue. Tests added in `concurrency.test.ts`.

---

## 2. Code Duplication

### 2.1 `getEffectiveSticky` duplicated between `header-tree.tsx` and `column-state.ts`

- **File(s):** `header-tree.tsx:39-56`, `column-state.ts:97-107`
- **Severity:** Moderate
- **Description:** The logic that walks a column's group ancestry chain to resolve effective sticky is implemented twice. `header-tree.tsx` has a standalone `getEffectiveSticky` function; `column-state.ts` inlines the same logic inside the `stickyColumnsState$` computation.
- **Suggested fix:** Use `getEffectiveSticky` from `header-tree.tsx` inside the `stickyColumnsState$` pipe in `column-state.ts`.

### 2.2 Registration/deregistration boilerplate repeated 6 times

- **File(s):** `Cell.tsx:25-42`, `Column.tsx:22-41`, `ColumnHeader.tsx:24-50`, `ColumnGroupHeader.tsx:22-48`, `ColumnGroup.tsx:16-36`, `GroupHeaderCell.tsx:18-39`
- **Severity:** Minor
- **Description:** Each module follows an identical pattern: a `Cell<Map>` for the collection, a `Stream` for register/deregister payloads, and a `changeWith` handler that spreads the Map to add/remove entries. The add path (`new Map([...existing, [id, value]])`) and remove path (`new Map([...existing].filter(...))`) are identical across all six.
- **Suggested fix:** Extract a generic `createRegistryCell<V>()` factory that returns `{ cell$, register$, useRegister }`. Each module calls the factory with its value type.

### 2.3 `totalHeight$` and `totalWidth$` are near-identical

- **File(s):** `sizes.ts:58-70`, `column-sizes.ts:17-29`
- **Severity:** Minor
- **Description:** Both derived cells compute `lastOffset + (count - lastIndex) * lastSize` with a fallback for when `lastIndex >= count`. Only the variable names differ (totalCount/columnCount, sizeState/columnSizeState).
- **Suggested fix:** Extract a `computeTotalSize(count, sizeState)` utility.

### 2.4 `measureItems` in `VirtualizedTableContent.tsx` duplicates logic in `resize-observing.ts`

- **File(s):** `VirtualizedTableContent.tsx:136-159`, `resize-observing.ts:131-151`
- **Severity:** Minor
- **Description:** Both iterate over elements, parse `data-index` and `data-knownSize`, compare against current size, and build coalesced `SizeRange[]` arrays. The logic is identical.
- **Suggested fix:** Extract a shared `buildSizeRangesFromElements(elements)` function.

---

## 3. Overly Complex Patterns

### 3.1 `rowsState$` combine takes 17 inputs, accesses globals inside scan

- **File(s):** `row-state.ts:72-236`
- **Severity:** Moderate
- **Resolved:** `increaseViewportBy$` moved into `e.combine` (now a proper reactive dependency). The remaining `getValue` calls (`viewportHeight$`, `headerHeight$`, `scrollTop$`, `scrollToPending$`, `scrollDirection$`, `lastJumpDueToRowResize$`) replaced with `e.withLatestFrom`, making the data flow explicit in the pipeline without adding them as triggering dependencies. These values are intentionally snapshot-read (not triggering) because they change in lockstep with `listScrollTop$` and other combine inputs that already drive recomputation.

### 3.2 Verification update: previous `Row` subscription blast radius appears fixed on the current branch

- **File(s):** `Row.tsx:96-207`, `Row.tsx:262-367`
- **Severity:** Resolved on current branch
- **Description:** The earlier critical finding that `NonMemoRow` subscribed directly to column-level cells no longer matches the current implementation. `Row.tsx` now splits rendering into `StickyLeftCells`, `ScrollableCells`, and `StickyRightCells`, and only the section components subscribe to the relevant column state. With the new unstable row render instrumentation, horizontal scroll now appears to re-render the `scrollable` section while leaving the outer row shell and sticky sections flat.
- **Suggested fix:** Keep this structure. Any further performance work should focus on reducing `ScrollableCells` cost, not on the old row-shell rerender issue.

---

## 4. Performance

### 4.1 Horizontal scroll cost is now isolated to `ScrollableCells`

- **File(s):** `Row.tsx:150-207`
- **Severity:** Moderate
- **Description:** The former all-row rerender issue appears addressed, but horizontal scroll still re-renders the `ScrollableCells` component for every visible row because it subscribes to `columnItemsState$`. That is materially better than rerendering the outer row shell and sticky sections, and it is likely the correct remaining hot path, but it still sets the ceiling for wide-table scroll performance.
- **Suggested fix:** Treat this as a secondary optimization target only if profiling still shows horizontal scroll cost is too high. Likely avenues are reducing work inside `ScrollableCells` or pushing more column layout reuse into precomputed structures.

### 4.2 Column overscan re-queries the entire tree

- **File(s):** `column-state.ts:194-213`
- **Severity:** Moderate
- **Description:** When `columnOverscanCount > 0`, the code calls `itemsWithinOffsets` a second time with `(0, nonStickyTotalWidth)` to get ALL non-sticky items, then filters by index range. For tables with hundreds of columns, this degenerates into an O(total columns) pass per horizontal scroll update.
- **Suggested fix:** Expand the viewport range by `overscanCount * estimatedColumnWidth` before the first `itemsWithinOffsets` call, eliminating the second query. Alternatively, extend `itemsWithinOffsets()` to accept an index overscan window directly.

### 4.3 Map reconstruction on every registration event

- **File(s):** `Cell.tsx:37-42`, `Column.tsx:36-41`, `ColumnHeader.tsx:45-50`, `ColumnGroupHeader.tsx:43-48`, `ColumnGroup.tsx:31-36`
- **Severity:** Moderate
- **Description:** On registration, `new Map([...existing, [id, value]])` spreads the entire map. On deregistration, `new Map([...existing].filter(...))` spreads to array, filters, and rebuilds. With 30 columns, mount produces 30 successive Map copies (sizes 1, 2, 3, ... 30), allocating ~465 intermediate entries total.
- **Suggested fix:** Use `Map.prototype.set()` / `Map.prototype.delete()` and return a new `Map(existing)` clone with the mutation. Or batch registrations with `useLayoutEffect` ordering.

### 4.4 `calculateCumulativeExcludedSize` is O(excludedIndices) per visible item

- **File(s):** `itemsWithinOffsets.ts:27-36`, called at line 111
- **Severity:** Moderate
- **Resolved:** Replaced per-item `calculateCumulativeExcludedSize` (which re-scanned all excluded indices) with a one-time precomputation of sorted excluded indices and cumulative sizes, plus a forward-advancing pointer in the main loop. Reduces from O(n\*k\*log m) to O(k log k + k log m) precomputation + O(n) traversal. Tests added in `itemsWithinOffsets.test.ts` covering both uniform and variable-sized excluded columns.

### 4.5 `walkWithin` and `walk` in AATree create intermediate arrays via spread

- **File(s):** `AATree.ts:110-130`, `AATree.ts:162-168`
- **Severity:** Minor
- **Description:** `walkWithin` uses `result = [...result, ...walkWithin(...)]` which creates O(n) intermediate arrays. `walk` uses `[...walk(node.l), { k, v }, ...walk(node.r)]`. Both are in the critical path during size state updates.
- **Suggested fix:** Use a mutation-based approach: pass a result array as a parameter and push to it.

### 4.6 `currentlyRenderedRows$` uses `shift()` in a while loop

- **File(s):** `row-state.ts:274-275`
- **Severity:** Minor
- **Description:** `rows.shift()` is O(n) for each call (shifts all remaining elements). In the worst case this is O(n^2). Additionally, a new array is created (`[...rowsState.rows]`) on every `scrollTop$` change, even when the result hasn't changed.
- **Suggested fix:** Use `findIndex` to find the first visible row, then `slice` from that index. Add an equality check to the DerivedCell to avoid propagating identical results.

### 4.7 `buildHeaderTree` called 3 times per render

- **File(s):** `VirtualizedTableContent.tsx:234, 251, 268`
- **Severity:** Minor
- **Resolved:** Header rendering extracted into `StickyHeaderContent` component with its own reactive subscriptions. All three header trees (left-sticky, scrollable, right-sticky) are now computed in a single `useMemo` keyed on `[columns, columnGroups]`. The component only re-renders when column-related state changes, not on scroll. See also 5.1.

---

## 5. Re-render Isolation

### 5.1 Header re-renders on every row state change

- **File(s):** `VirtualizedTableContent.tsx:80`, `VirtualizedTableContent.tsx:92-104`, `VirtualizedTableContent.tsx:234`, `VirtualizedTableContent.tsx:251`, `VirtualizedTableContent.tsx:268`
- **Severity:** Moderate
- **Resolved:** Header rendering extracted into a `StickyHeaderContent` component that subscribes only to column-related cells (`columns$`, `columnHeaders$`, `stickyColumnsState$`, `columnsState$`, `columnGroups$`, `columnGroupHeaders$`, `columnWidths$`, `hasHorizontalScroll$`). `VirtualizedTableContent` no longer subscribes to these cells. Vertical scrolling no longer triggers header re-renders or `buildHeaderTree` calls. Tests added in `header-rerender-isolation.test.tsx`.

### 5.2 `currentlyRenderedRows$` type is wrong

- **File(s):** `row-state.ts:269-280`, `hooks.ts:24-26`
- **Severity:** Minor
- **Description:** `currentlyRenderedRows$` has initial value typed as `DataArray[]` (= `unknown[][]`), but each element is a single data item (`row.data`), not an array. The cast `row.data as DataArray` is incorrect. The `useCurrentlyRenderedData<Data>()` hook then casts the result to `Data[]`, which papers over the type error. At runtime, the values are correct (individual data items), but the intermediate types are wrong.
- **Suggested fix:** Change the initial value type and mapping: `[] as unknown[]` and `row.data` without the `as DataArray` cast.

---

## 6. Edge Cases and Bugs

### 6.1 `Math.min` called with single argument -- no-op bug

- **File(s):** `dom.ts:161`, `scroll-to-row.ts:105`
- **Severity:** Critical
- **Resolved:** Added `viewportHeight` as the second argument to `Math.min` in both locations, clamping `forceBottomSpace` so it never exceeds the viewport height. The bug existed since the feature was first introduced (never had a second argument). A unit test covering the clamping behavior was added in `tests/node/scroll-to-row.test.ts`.

### 6.2 `reorderColumns` silently drops source column if target key doesn't exist

- **File(s):** `Column.tsx:74-101`
- **Severity:** Resolved
- **Description:** If `targetKey` is not present in the columns Map, the `for` loop will never enter the `key === targetKey` branch. Since the `key === sourceKey` branch `continue`s past the source, the source column is never added to `newMap`. The column is silently lost.
- **Resolved:** Fixed in commit `70dc9cfa`. `reorderColumns` now returns the original columns unchanged when the target key doesn't exist, preventing silent column loss.

### 6.3 Several props silently ignored after mount

- **File(s):** `VirtuosoDataTable.tsx:111`, `VirtuosoDataTable.tsx:135`, `VirtuosoDataTable.tsx:147`
- **Severity:** Moderate
- **Description:** Several props are only published during `initFn` and never updated. Changing them after mount silently does nothing.
- **Resolved props** (published in `updateFn`, added to `updateDeps`):
  - `increaseViewportBy` — Also moved from `getValue` to `e.combine` in `rowsState$`. Test added in `props-update-after-mount.test.tsx`.
  - `columnOverscanCount` — Was already in `e.combine` in `columnItemsState$`, only needed `updateFn`/`updateDeps`.
  - `EmptyPlaceholder` — Render-only cell, no reactive pipeline involvement.
  - `computeRowKey` — Render-only cell. Non-memoized functions will trigger redundant `updateFn` calls, but the cost is negligible since `VirtualizedTableContent` already re-renders on scroll.
- **Intentionally init-only** (document as construction-time options):
  - `ScrollElement` — Swapping the scroller element mid-lifecycle would require rebinding listeners and observers.
  - `useWindowScroll` — Switching between container and window scroll is a structural change.

### 6.4 Out-of-bounds `scrollToRow` is a silent no-op

- **File(s):** `scroll-to-row.ts:27`, `scroll-to-row.ts:78`, `scroll-to-row.ts:155`
- **Severity:** Moderate
- **Description:** Out-of-bounds `scrollToRow` input is not clamped or warned on. Invalid indices throw inside `rowHeight()`, then get swallowed and filtered out, so the public method becomes a silent no-op.
- **Suggested fix:** Clamp indices into `[0, totalCount - 1]` or emit a dev warning/error when the caller targets an invalid row.

### 6.5 `binaryArraySearch` throws on edge cases

- **File(s):** `binaryArraySearch.ts:27`
- **Severity:** Moderate
- **Resolved:** `findIndexOfClosestSmallerOrEqual` now returns `-1` instead of throwing. `findClosestSmallerOrEqual` returns `T | undefined` and callers (`rangesWithinOffsets`, `offsetOf`) guard against the empty/not-found case, returning safe defaults. `findRange` returns `[]` when the start index is `-1`.

### 6.6 Division by zero when item size is 0

- **File(s):** `itemsWithinOffsets.ts:91`
- **Severity:** Moderate
- **Resolved:** Three-layer defense: (1) `COLUMN_CELL_BASE_STYLE` now has `minHeight: 1` so cell wrappers enforce a minimum DOM height, preventing ResizeObserver from ever reporting 0 for rows that have cells. Column headers similarly have `minWidth: 1`. (2) `updateSizeState` validates in dev mode that no size range has `size <= 0`, throwing with an actionable error message identifying the offending index. (3) The `minHeight` is on cell wrappers (not the row container) to avoid false measurements during the column-registration phase when rows render without cells. Tests added in `itemsWithinOffsets.test.ts`; Ladle story `zero-height-items.stories.tsx` demonstrates the behavior with zero-height, mixed, and collapsible rows.

### 6.7 Data change resets entire size tree

- **File(s):** `sizes.ts:56`
- **Severity:** Moderate
- **Deferred:** The analysis assumed same-length data updates always contain the same items, but a same-length array can contain completely different items with different heights. Preserving measured sizes for replaced items would be incorrect. The current reset-on-data-change behavior is the safe default. Revisit only if a concrete scenario is identified where item identity is preserved across data updates and size retention is both safe and beneficial.

### 6.8 Aborted fetch can permanently block `loadMore` in append mode

- **File(s):** `remote-source.ts:421`, `remote-source.ts:442`, `remote-source.ts:454`
- **Severity:** Moderate
- **Resolved:** Moved `vd.fetching = false` and `vd.abortController = null` into the `finally` block so cleanup always runs regardless of how the try block exits (success, abort early return, or thrown error). The separate `catch` block for `vd.fetching` reset was removed as redundant. Previously, `handleCancel` would abort the controller without resetting `vd.fetching`, and if the fetch resolved after abort, the early return at `controller.signal.aborted` skipped cleanup, permanently blocking future `loadMore` calls. Test added in `append-abort-recovery.test.ts`.

### 6.9 `skip` operator captures mutable closure state

- **File(s):** `at-bottom.ts:75-87`
- **Severity:** Minor
- **Description:** The `skip` operator decrements a captured `skips` variable. If the subscription is torn down and re-established (which the engine may do), the skip count will be zero on the second subscription.
- **Suggested fix:** Document this as a "consume once" operator, or reset `skips` if re-subscription is possible.

---

## 7. Public API Surface Lock-in

### 7.1 ~~Raw reactive streams exported as public API~~

- **File(s):** `index.ts:8`
- **Severity:** ~~Critical~~ Not applicable
- **Resolved:** Exporting reactive node references (`setColumnSticky$`, `reorderColumns$`, etc.) is **intentional**. The reactive-engine-react package provides `useRemoteCellValue`, `useRemotePublisher`, and `engine.pub()` as the primary consumption pattern. Stream/Cell symbols are the public API contract by design -- consumers use them with `engine.pub(setColumnSticky$, payload)` or `useRemotePublisher(reorderColumns$, engineRef)`. This is the "remote-controlled state" pattern central to the reactive-engine architecture.

### 7.2 `export *` from `column-sizes.ts` -- audit which nodes are consumer-facing

- **File(s):** `index.ts:16`
- **Severity:** Moderate (downgraded from Critical)
- **Description:** Exports `columnCount$`, `columnSizeState$`, `columnRanges$`, `totalWidth$`. Given the remote-controlled state pattern, some of these may be intentional consumer-facing nodes (e.g., `totalWidth$` for layout). However, `columnSizeState$` exposes `SizeState` (AA tree internals) and `columnRanges$` could corrupt the size tree if published to. The `export *` makes it unclear which are intended API vs. internal plumbing.
- **Suggested fix:** Replace `export *` with explicit named exports. Export nodes that consumers should read/write, and keep internal-only nodes unexported. Use `export type` for types needed by consumers.

### 7.3 `export *` from `column-state.ts` -- audit which nodes are consumer-facing

- **File(s):** `index.ts:17`
- **Severity:** Moderate (downgraded from Critical)
- **Description:** Exports `stickyColumnsState$`, `columnsState$`, `columnItemsState$`, `columnOverscanCount$`, and `EMPTY_*` constants. Some of these (e.g., `columnsState$`, `stickyColumnsState$`) may be useful for consumers building custom column UIs via the remote-controlled state pattern. Others (e.g., `EMPTY_*` constants, `columnOverscanCount$`) are internal implementation details.
- **Suggested fix:** Replace `export *` with explicit named exports, distinguishing consumer-facing nodes from internal ones.

### 7.4 `export *` from `ColumnHeader.tsx` leaks internal components

- **File(s):** `index.ts:39`
- **Severity:** Moderate
- **Description:** Exports `columnHeaders$` (internal cell), `ColumnHeaderRenderer` and `ColumnHeaderRendererProps` (internal component used only in `header-tree.tsx`). These should not be public.
- **Suggested fix:** `export { ColumnHeader, type ColumnHeaderRenderParams, type ColumnHeaderRenderFunction, type ColumnHeaderCustomComponent } from './columns/ColumnHeader'`.

### 7.5 `@internal` interfaces exported from `interfaces.ts` via `export *`

- **File(s):** `index.ts:19`, `interfaces.ts:4-18,117-147,187-192`
- **Severity:** Moderate
- **Description:** `OffsetPoint`, `SizeRange`, `DataArray`, `Item`, `HeaderWrapperComponent`, `StickyHeaderWrapperComponent`, `FooterWrapperComponent`, `StickyFooterWrapperComponent`, `ComputeRowKey` are marked `@internal` but are still importable. TypeDoc may hide them from docs, but they're part of the JS export surface.
- **Suggested fix:** Move `@internal` types to a separate file that is not re-exported from `index.ts`, or use explicit named exports.

### 7.6 `VirtuosoDataTableTestingContext` exported from root

- **File(s):** `index.ts`
- **Severity:** Moderate
- **Description:** Test-only hooks are exported alongside production APIs, turning them into semver commitments.
- **Suggested fix:** Move test-only or unstable hooks behind separate subpaths such as `/testing` or `/unstable`.

### 7.7 Missing types from top-level exports

- **File(s):** `index.ts` vs `model/index.ts`
- **Severity:** Minor
- **Description:** `ParamTransformer`, `RemoteActionConfig`, `SourceMutator`, `SourceMutatorConfig` are exported from `model/index.ts` but not from the top-level `index.ts`. Consumers configuring `localSource` or `remoteSource` with actions need these types but can't import them from the package root.
- **Suggested fix:** Add these to the top-level `export type {}` block.

---

## 8. Memory Leaks

### 8.1 `bridgeModelToEngine` cleanup ignored on unmount

- **File(s):** `VirtuosoDataTable.tsx:93`, `VirtuosoDataTable.tsx:109`, `model-bridge.ts:7`
- **Severity:** Critical
- **Resolved:** `bridgeModelToEngine` now calls `engine.onDispose(cleanup)` internally, so the bridge's cleanup (disconnect message + unsubscribe from model + unsubscribe from engine viewport) runs automatically when the engine disposes on unmount. The cleanup function is still returned for callers that need manual/early teardown; both paths are idempotent. Tests added in `bridge-cleanup.test.ts` verifying that `handleDisconnect` is called on engine disposal and that per-view pipeline state in `localSource` is properly cleared on reconnect.

### 8.2 `ScrollbarOverlay` event listeners are never cleaned up

- **File(s):** `ScrollbarOverlay.tsx:102-163`
- **Severity:** Critical
- **Resolved:** Handlers are now stored as named variables (`hHandler`, `vHandler`, `contentHandler`) and element references are captured at effect-run time. The `useEffect` returns a cleanup function that removes all three listeners using the same references and clears pending `reschedule` timeouts. Test added in `scrollbar-overlay-listener-cleanup.test.tsx` verifying that mount/unmount cycles do not accumulate scroll event listeners.

### 8.3 `silenceResizeObserverError` listener never removed (capture flag mismatch)

- **File(s):** `VirtuosoDataTable.tsx:81-88`
- **Severity:** Moderate
- **Resolved:** `removeEventListener` now passes `{ capture: true }` to match `addEventListener`. Test added in `resize-observer-error-listener-cleanup.test.tsx` verifying that the capture flags match across mount/unmount.

### 8.4 `CustomScrollParentWrapper` doesn't rebind on prop change

- **File(s):** `scroller-elements.tsx:213`, `scroller-elements.tsx:225`
- **Severity:** Moderate
- **Description:** `CustomScrollParentWrapper` updates `customScrollParentRef.current` when the prop changes, but it never rebinds listeners or observers to the new element unless the wrapper ref itself unmounts. Changing `customScrollParent` mid-lifecycle leaves listeners on the old parent and the new parent inert.
- **Suggested fix:** Add an effect that detaches from the previous parent and attaches to the new one whenever `customScrollParent` changes.

---

## 9. SSR / Non-browser Safety

### 9.1 `ScrollbarOverlay` accesses `navigator.userAgent` at render time

- **File(s):** `ScrollbarOverlay.tsx:167`
- **Severity:** Critical
- **Resolved:** Guarded with `typeof navigator !== 'undefined'`. Note: on Node 21+, `navigator` is a global (returns `"Node.js/XX"` for `userAgent`), so this only crashes on older Node or edge runtimes without the guard. Additionally, `EngineProvider` was changed to create the engine synchronously in a `useState` initializer (instead of inside `useLayoutEffect`), enabling SSR rendering of the full component tree. The `ResizeObserver` resource was also guarded for SSR.

### 9.2 `delayWithAnimationFrame` calls `requestAnimationFrame` unconditionally

- **File(s):** `utils.ts:46`
- **Severity:** Minor
- **Description:** The `requestAnimationFrame` call is inside a subscription callback (not at module load), so it's only invoked at runtime. However, if any pipe using this operator runs during SSR (e.g., during server-side engine initialization), it will throw.
- **Suggested fix:** Guard: `typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame(frame) : setTimeout(frame, 16)`.

---

## 10. Silent Failures

### 10.1 All remote fetch failures are swallowed

- **File(s):** `remote-source.ts:252`, `remote-source.ts:291`, `remote-source.ts:453`
- **Severity:** Moderate
- **Description:** All remote fetch failures are swallowed. A broken data source leaves the table empty or half-populated with no error signal to the consumer.
- **Suggested fix:** Distinguish aborts from real failures and propagate non-abort failures through the model as `error` or `event` messages, with a dev-time warning path in the table.

### 10.2 Column key mismatch renders empty string without warning

- **File(s):** `Cell.tsx:74, 81`
- **Severity:** Moderate
- **Description:** If `column.field` doesn't match any property in the row's data object, `cellValue` is `undefined` and the cell renders an empty string. No dev-mode warning. This is one of the most common consumer mistakes (typo in field name).
- **Suggested fix:** In development mode, warn when `column.field` is not a key of `row.data`:

  ```ts
  if (process.env.NODE_ENV !== 'production' && row.data && typeof row.data === 'object' && !(column.field in row.data)) {
    console.warn(`Column field "${column.field}" not found in row data at index ${row.index}`)
  }
  ```

### 10.3 Zero-height container fails silently

- **File(s):** Various (table renders nothing)
- **Severity:** Minor
- **Description:** When the container element has zero height (common mistake: forgetting CSS `height`), `viewportHeight$ = 0`, `visibleListHeight$ = 0`, and no rows render. `tableReady$` never becomes true. There's no console warning to help the developer diagnose this.
- **Suggested fix:** After a timeout (e.g., 2 seconds), if `viewportHeight$` is still 0 and data is present, emit a dev-mode warning: `"VirtuosoDataTable: container element has zero height. Set a height on the parent element."`.

---

## Summary by Severity

| Severity | Count | Key findings |
|----------|-------|--------------|
| **Critical** | 7 | ~~Async dedup only protects sync path (1.1)~~, ~~stale async overwrites (1.2)~~, ~~`Math.min` single-arg bugs (6.1)~~, ~~public API leaks reactive internals (7.1)~~ (intentional remote-controlled state pattern), `export *` audit (7.2-7.3 downgraded to Moderate), ~~`bridgeModelToEngine` leak (8.1)~~, ~~ScrollbarOverlay listener leak (8.2)~~ |
| **Moderate** | 16 | `getEffectiveSticky` duplication (2.1), `rowsState$` complexity (3.1), residual horizontal scroll cost in `ScrollableCells` (4.1), column overscan (4.2), Map reconstruction (4.3), ~~cumulative excluded size O(n*k) (4.4)~~, ~~header re-renders (5.1)~~, props ignored after mount (6.3), scrollToRow silent no-op (6.4), ~~binary search throws (6.5)~~, ~~division by zero (6.6)~~, size tree reset (6.7), ~~abort blocks loadMore (6.8)~~, `export *` audit (7.2-7.3), ~~capture flag mismatch (8.3)~~, CustomScrollParent rebind (8.4), fetch errors swallowed (10.1), column key mismatch (10.2) |
| **Minor** | 8 | Registration boilerplate (2.2), totalHeight/totalWidth (2.3), measureItems duplication (2.4), AATree spread (4.5), shift() O(n^2) (4.6), ~~buildHeaderTree 3x (4.7)~~, skip operator (6.9), currentlyRenderedRows$ type (5.2), zero-height (10.3), rAF guard (9.2) |

## Recommended Fix Priority

1. **Public API surface audit** (7.2-7.6) -- replace `export *` with explicit named exports to distinguish consumer-facing nodes from internal plumbing (7.1 resolved: exporting reactive streams is intentional per the remote-controlled state pattern)
2. ~~**`Math.min` single-arg bugs** (6.1) -- actual logic errors in scroll calculations producing wrong results now~~ **Resolved**: clamped `forceBottomSpace` to `viewportHeight` in both locations, added unit test
3. ~~**`reorderColumns` data loss** (6.2) -- silently drops a column on invalid target key~~ **Resolved** in `70dc9cfa`
4. ~~**Async concurrency** (1.1, 1.2) -- stale data races and ineffective dedup in remote source workflows~~ **Resolved**: `inFlightActions` now persists through async completion; `operationVersion` captured per-request for stale detection; cancelled requests tracked and dropped
5. ~~**SSR crash** (9.1) -- `navigator` access at render time breaks server-side rendering~~ **Resolved**: `navigator` guarded, `EngineProvider` creates engine synchronously for SSR, `ResizeObserver` guarded
6. ~~**Memory leaks** (8.1, 8.2, 8.3)~~ -- all resolved: ~~bridge cleanup (8.1)~~, ~~ScrollbarOverlay (8.2)~~, ~~capture flag mismatch (8.3) **Resolved**: `removeEventListener` now passes `{ capture: true }`, test added~~
7. ~~**Header re-render isolation** (4.7/5.1)~~ **Resolved**: header rendering extracted into `StickyHeaderContent` component with own reactive subscriptions and memoized header trees; vertical scroll no longer triggers header re-renders
8. **Residual horizontal scroll cost** (4.1) -- no longer the original row-shell blast radius, but still worth profiling on wide tables

Updated after verification of the current branch: the original `Row` shell rerender finding no longer reproduces with the current `Row.tsx` structure. Verification included the unstable row render instrumentation and a passing focused browser test for horizontal-scroll instrumentation.
