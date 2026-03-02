# react-virtuoso

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
