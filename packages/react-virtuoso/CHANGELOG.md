# react-virtuoso

## 4.18.12

### Patch Changes

- [#1487](https://github.com/petyosi/react-virtuoso/pull/1487) [`d975e6c`](https://github.com/petyosi/react-virtuoso/commit/d975e6c4eab2d56b23948c8b958c1d9b5c508c0c) Thanks [@petyosi](https://github.com/petyosi)! - Measure window-scrolling lists before they enter the viewport so their estimated height is included in the document layout.

## 4.18.11

### Patch Changes

- [#1458](https://github.com/petyosi/react-virtuoso/pull/1458) [`0d5214a`](https://github.com/petyosi/react-virtuoso/commit/0d5214a21a0cc5c044ef57db3d53b62431ff4f2c) Thanks [@wanxiankai](https://github.com/wanxiankai)! - Handle horizontal list direction changes between LTR and RTL without remounting the list.

## 4.18.10

### Patch Changes

- [`fca20fa`](https://github.com/petyosi/react-virtuoso/commit/fca20fade0aea9f012f885bac97d5088be6a2ae3) Thanks [@petyosi](https://github.com/petyosi)! - Fix explicit `undefined` initial top-most item index values crashing when empty
  data updates to an object-form initial index.

## 4.18.9

### Patch Changes

- [#1444](https://github.com/petyosi/react-virtuoso/pull/1444) [`0c68e81`](https://github.com/petyosi/react-virtuoso/commit/0c68e81ff8b5314f23ab8e484908a9f6e13002ec) Thanks [@Luccas-carvalho](https://github.com/Luccas-carvalho)! - Harden scroll-target and initial-index handling:
  - Clamp the initial top-most item index to the available range, so an out-of-range `initialTopMostItemIndex` (for example after the data set shrinks) no longer starts the list at a blank or mid-list position.
  - Stop mutating the location object passed to `scrollToIndex`; `normalizeIndexLocation` now applies its defaults to a shallow copy.
  - Treat a default-positioned `initialTopMostItemIndex` of `{ index: 0 }` the same as `0`, avoiding a redundant initial scroll and a delayed `followOutput`.

## 4.18.8

### Patch Changes

- [#1442](https://github.com/petyosi/react-virtuoso/pull/1442) [`6b1467c`](https://github.com/petyosi/react-virtuoso/commit/6b1467cd808eadcb16fcc8bed8f80671c274f220) Thanks [@Luccas-carvalho](https://github.com/Luccas-carvalho)! - Clamp out-of-range scroll target indexes to the last available item.

## 4.18.7

### Patch Changes

- [#1399](https://github.com/petyosi/react-virtuoso/pull/1399) [`1fca093`](https://github.com/petyosi/react-virtuoso/commit/1fca093bc7bfbd2c8c65db968eb2d473713f63ea) Thanks [@petyosi](https://github.com/petyosi)! - Fix horizontal Virtuoso item positioning and scrolling in RTL layouts.

## 4.18.6

### Patch Changes

- [#1393](https://github.com/petyosi/react-virtuoso/pull/1393) [`fa9dd31`](https://github.com/petyosi/react-virtuoso/commit/fa9dd3194f7d276c311b97fd5d10677a53db6ed3) Thanks [@petyosi](https://github.com/petyosi)! - Fix `useWindowScroll` SSR layout collapse by rendering the window viewport in normal flow while preserving sticky top items.

## 4.18.5

### Patch Changes

- [#1388](https://github.com/petyosi/react-virtuoso/pull/1388) [`5871779`](https://github.com/petyosi/react-virtuoso/commit/5871779a7e5e422ed8980ce5ed231858ce06a8d9) Thanks [@petyosi](https://github.com/petyosi)! - Fix useSyncExternalStore detection for React 19+

  The version check used `startsWith('18')` which excluded React 19, causing it to fall back to the legacy useState+useLayoutEffect subscription path. This could cause tearing issues in concurrent rendering scenarios. Changed to `parseInt(React.version) >= 18` to correctly use useSyncExternalStore for React 18 and above.

## 4.18.4

### Patch Changes

- [#1375](https://github.com/petyosi/react-virtuoso/pull/1375) [`620b260`](https://github.com/petyosi/react-virtuoso/commit/620b260d9c3674e4fb5b812699774a0af6bd649d) Thanks [@marcospassos](https://github.com/marcospassos)! - Fix `atBottomStateChange` in `useWindowScroll` lists when the Virtuoso instance is rendered below other page content.

## 4.18.3

### Patch Changes

- [`161db63`](https://github.com/petyosi/react-virtuoso/commit/161db63a12bd7419dc339da075f3a78e6473a9a9) Thanks [@petyosi](https://github.com/petyosi)! - Use changeset publish for proper git tagging and GitHub release creation

## 4.18.2

### Patch Changes

- [#1361](https://github.com/petyosi/react-virtuoso/pull/1361) [`7b38166`](https://github.com/petyosi/react-virtuoso/commit/7b3816607c2b8fa3eb8818bea6e291c93a91112d) Thanks [@petyosi](https://github.com/petyosi)! - Replace ESLint and Prettier with oxlint and oxfmt for faster linting and formatting. Modernize TypeScript configuration with `verbatimModuleSyntax` and ES2022 build targets.

  Source code changes are non-behavioral: stricter equality checks (`===`/`!==` instead of truthiness), `??` instead of `||` for defaults, early returns instead of else blocks, self-closing JSX tags, and removal of unnecessary JSX fragments. `LogLevel` in react-virtuoso is changed from a TypeScript enum to a const object — the named exports (`LogLevel.DEBUG`, etc.) work identically, but enum reverse-mapping (`LogLevel[0]`) is no longer supported.

## 4.18.1

### Patch Changes

- [#1328](https://github.com/petyosi/react-virtuoso/pull/1328) [`2d2c1c5`](https://github.com/petyosi/react-virtuoso/commit/2d2c1c56d72ae0c05e54d8e393a42b96d9603175) Thanks [@petyosi](https://github.com/petyosi)! - Fix missing type for table

## 4.18.0

### Minor Changes

- [#1318](https://github.com/petyosi/react-virtuoso/pull/1318) [`8d47a4d`](https://github.com/petyosi/react-virtuoso/commit/8d47a4d8a7ecdd4caa36eb336b6921738d73f425) Thanks [@petyosi](https://github.com/petyosi)! - Updated API reference

## 4.17.0

### Minor Changes

- 58b9703: Add `minOverscanItemCount` prop to ensure a minimum number of items are rendered before/after the viewport, useful for tall or collapsible items where pixel-based overscan is insufficient.

## 4.16.1

### Patch Changes

- 497681b: provenance test

## 4.16.0

### Minor Changes

- 7e327d8: Added heightEstimates prop to provide per-item height estimates for more accurate initial scrollbar sizing with variable height items

## 4.15.0

### Minor Changes

- 34646ce: Support fixed size for groups in grouped virtuoso

## 4.14.1

### Patch Changes

- f4f307f: Fix bogus context attribute

## 4.14.0

### Minor Changes

- 0898bc7: Support `scrollIntoViewOnChange prop for Virtoso"

## 4.13.0

### Minor Changes

- 7ee973e: Support table grouping

## 4.12.8

### Patch Changes

- dbe93a0: Follow output works with fixedItemHeight set

## 4.12.7

### Patch Changes

- a04ba00: Fix for prepend items flickering

## 4.12.6

### Patch Changes

- bb0402e: Support window scrolling to iframe react portals

## 4.12.5

### Patch Changes

- b1d4519: Revert node requirements

## 4.12.4

### Patch Changes

- fdbf0c5: Updated to latest tooling
- fdbf0c5: correct TS types for custom component, context is always passed
