# @virtuoso.dev/data-table

## 0.3.0

### Minor Changes

- [#1448](https://github.com/petyosi/react-virtuoso/pull/1448) [`b019057`](https://github.com/petyosi/react-virtuoso/commit/b01905744d0d4525c892df60deb284300dc8ffc3) Thanks [@petyosi](https://github.com/petyosi)! - Add column-level `grow` sizing so selected columns can absorb leftover table width by ratio while compact columns keep their base widths. Header end slots now align to the rendered edge of grown columns, which keeps sortable header buttons visually anchored at the column boundary.

  The data-table docs, shadcn registry wrapper, and data-table skill guidance now also cover wrapper-owned styling surfaces, flex-height table layouts, explicit headers for display-only columns, and model-owned sort/filter/search state.

## 0.2.0

### Minor Changes

- [#1440](https://github.com/petyosi/react-virtuoso/pull/1440) [`ad7f2b0`](https://github.com/petyosi/react-virtuoso/commit/ad7f2b0d03567d7dd98433a67223bc36b8c7443c) Thanks [@petyosi](https://github.com/petyosi)! - Add id-based data table columns for display-only and computed values, keep
  table-only props off DOM elements, and avoid disposing reactive engines during
  React 18 StrictMode's development-only effect replay.

### Patch Changes

- Updated dependencies [[`ad7f2b0`](https://github.com/petyosi/react-virtuoso/commit/ad7f2b0d03567d7dd98433a67223bc36b8c7443c)]:
  - @virtuoso.dev/reactive-engine-react@0.2.4

## 0.1.4

### Patch Changes

- Updated dependencies [[`5f90dfd`](https://github.com/petyosi/react-virtuoso/commit/5f90dfd83a4acb5b1f0d30ff19190c98d1591443)]:
  - @virtuoso.dev/reactive-engine-core@0.0.8
  - @virtuoso.dev/reactive-engine-react@0.2.3

## 0.1.3

### Patch Changes

- [`4782bf1`](https://github.com/petyosi/react-virtuoso/commit/4782bf19f8c000d0f1f46bcad69c6b1375644d33) Thanks [@petyosi](https://github.com/petyosi)! - Refresh external scroll measurements while scrolling so tables stay aligned when content before them changes height.

- [`de57c35`](https://github.com/petyosi/react-virtuoso/commit/de57c354a685e584ff21d267c7b9a9beed10cb13) Thanks [@petyosi](https://github.com/petyosi)! - Fix custom scroll parent height estimation when a table starts below the external viewport.

  Extend reactive engine `combine` typings for larger tuples used by data table internals.

- Updated dependencies [[`de57c35`](https://github.com/petyosi/react-virtuoso/commit/de57c354a685e584ff21d267c7b9a9beed10cb13)]:
  - @virtuoso.dev/reactive-engine-core@0.0.7
  - @virtuoso.dev/reactive-engine-react@0.2.2

## 0.1.2

### Patch Changes

- [`23cde5a`](https://github.com/petyosi/react-virtuoso/commit/23cde5aa1bce42b337cc914abb035d69852d80c6) Thanks [@petyosi](https://github.com/petyosi)! - Fix sticky table headers when `customScrollParent` or `useWindowScroll` is used with wrappers that apply horizontal overflow styles.

## 0.1.1

### Patch Changes

- [`06f253a`](https://github.com/petyosi/react-virtuoso/commit/06f253a9c69fd145165534f79fe5fad721e7ed6d) Thanks [@petyosi](https://github.com/petyosi)! - Fix Data Table scroll behavior in sticky-column, external-scroller, and window-scroll layouts.
  - Match sticky column hover transitions with the rest of the row in the shadcn wrapper.
  - Avoid rendering the internal scrollbar overlay when `customScrollParent` or `useWindowScroll` owns scrolling.
  - Restore row virtualization for `useWindowScroll` by measuring against the window viewport instead of the table wrapper height.

## 0.1.0

### Minor Changes

- [#1412](https://github.com/petyosi/react-virtuoso/pull/1412) [`94338de`](https://github.com/petyosi/react-virtuoso/commit/94338dec93fba3f52532b8f7af3958856eee2bcc) Thanks [@petyosi](https://github.com/petyosi)! - Release `@virtuoso.dev/data-table` 0.1.0 as the first stable version. The package provides row and column virtualization, grouped rows, sticky columns, remote loading, column resize/reorder/visibility, dynamic columns, and state persistence.

  Bump `@virtuoso.dev/reactive-engine-core` and `@virtuoso.dev/reactive-engine-react` for SSR support required by the data table: synchronous engine creation in `EngineProvider` and an `isDisposed` flag on `Engine`.

### Patch Changes

- Updated dependencies [[`94338de`](https://github.com/petyosi/react-virtuoso/commit/94338dec93fba3f52532b8f7af3958856eee2bcc)]:
  - @virtuoso.dev/reactive-engine-core@0.0.6
  - @virtuoso.dev/reactive-engine-react@0.2.2
