# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm build` - Build the library using TypeScript compiler and Vite
- `pnpm lint` - Run linting with oxlint (type-aware)
- `pnpm typecheck` - Run TypeScript type checking without emitting files
- `pnpm test` - Run tests with Vitest (node and browser projects)
- `pnpm dev` - Start Ladle development server for component stories
- `pnpm docs:build` - Generate TypeDoc documentation
- `pnpm docs:serve` - Serve generated documentation
- `pnpm format` - Format code with oxfmt
- `pnpm format:check` - Check formatting without modifying files

## After Making Changes

Run these commands after modifying code:

1. `pnpm format` - Format modified files
2. `pnpm lint` - Check for lint errors and fix any issues
3. `pnpm typecheck` - Verify no TypeScript errors
4. `pnpm test` - Run tests when changes affect component logic, state management, or virtualization behavior

Git hooks (via Lefthook) automatically run formatting and linting on pre-commit, and typecheck + tests on pre-push.

## Architecture Overview

This is a React virtualized data table component with both column and row virtualization. The architecture is based on a reactive state management system using `@virtuoso.dev/reactive-engine`.

### Core Components

- **VirtuosoDataTable** (`src/VirtuosoDataTable.tsx`) - Main React component that renders the virtualized data table
- **VirtualizedTableContent** (`src/VirtualizedTableContent.tsx`) - Renders the table content with row and column virtualization
- **Row** (`src/Row.tsx`) - Individual row renderer
- **Column** (`src/Column.tsx`) - Column renderer with virtualization
- **Cell** (`src/Cell.tsx`) - Cell renderer
- **ColumnHeader** (`src/ColumnHeader.tsx`) - Column header renderer
- **Data State** (`src/data.ts`) - Holds data cells (`data$`, `context$`, `totalCount$`)

### State Management Architecture

The component uses a realm-based reactive system with cells:

- **Cells** - Hold state values (e.g., `data$`, `context$`, `totalCount$`)
- **Realm** - Manages the reactive graph and subscriptions

Key state modules:

- `src/data.ts` - Core data cells
- `src/dom.ts` - DOM measurements and scroll handling
- `src/row-state.ts` - Row rendering state management and visible row computation
- `src/column-state.ts` - Column virtualization state
- `src/sizes.ts` - Size tree management for virtualization
- `src/state-flags.ts` - Scroll direction and bottom detection

### Virtualization System

- **Size Tree** (`src/sizing/AATree.ts`) - AA tree implementation for efficient size tracking
- **Offset Calculations** (`src/sizing/` directory) - Handles item positioning and measurements
- **Resize Observer** - Tracks item size changes dynamically
- **Viewport Management** - Renders only visible items with buffer zones

### Scroll Behavior Management

- **Scroll-to-Row** (`src/scroll-to-row.ts`) - Handles programmatic scrolling to specific rows
- **Smooth Scrolling** (`src/useSmoothScroll.ts`) - Custom smooth scroll implementation
- **Mobile Safari Fixes** (`src/reverse-scroll-fix.ts`) - Platform-specific scroll behavior corrections

### Testing Infrastructure

Tests are organized into two Vitest projects:

- **Node Tests** - Pure logic tests in `tests/node/` and `src/sizing/tests/node/`
- **Browser Tests** - Component tests using Playwright browser in `tests/browser/` and `src/tests/browser/`
  - Setup file: `src/tests/browser/setup.ts`
- **Ladle Stories** - Component stories in `src/_stories/` for development and visual testing
- **Testing Context** - `VirtuosoDataTableTestingContext` for controlled test environments

### Test Writing Guidelines

**Use exact assertions, not ranges.** Tests must verify precise expected values:

- Use `toBe(9)` not `toBeGreaterThan(0)` or `toBeLessThan(10)`
- Use `toHaveLength(3)` not `toHaveLength(expect.any(Number))`
- Calculate expected values from test constants (e.g., `Math.ceil((CONTAINER_HEIGHT - HEADER_HEIGHT) / ROW_HEIGHT)`)

**Every assertion must be derivable from the test setup.** If you set `COLUMN_COUNT = 6` and `CONTAINER_WIDTH = 300` with `COLUMN_WIDTH = 150`, then assert exactly 2 visible columns, not "less than 6".

**Avoid false-positive-prone patterns:**

- `toBeGreaterThan(0)` - passes even when value is wrong
- `toBeLessThan(TOTAL)` - passes even when virtualization is broken
- `not.toBe(previousValue)` without asserting the new expected value

**Correct pattern:**

```typescript
const visibleColumns = Math.floor(CONTAINER_WIDTH / COLUMN_WIDTH)
expect(cells.length).toBe(visibleColumns)
```

### API Surface

The component exposes an imperative API via ref (see `VirtuosoDataTableMethods` in `src/interfaces.ts`):

- `scrollToRow(location)` - Programmatic scrolling to a specific row
- `scrollIntoView(location)` - Scroll row into view if necessary
- `getScrollLocation()` - Current scroll position information
- `scrollerElement()` - Get reference to the scroller DOM element
- `cancelSmoothScroll()` - Cancel current smooth scroll animation
- `height(item)` - Get the known height of an item

### Key Design Patterns

1. **Reactive State Management** - All state changes flow through the reactive engine reactive system
2. **Declarative Data with Imperative Scroll** - Data is passed declaratively via prop; scroll operations are imperative via ref
3. **Performance Optimization** - Only renders visible items with efficient size caching
4. **Cross-platform Compatibility** - Handles browser-specific scroll behavior differences
5. **Internal State Ownership** - The table manages its own state internally. External code does not lift state out of the table and pass it back in as props. Instead, the table's internal state is accessible and controllable through an imperative "remote control" pattern (e.g., ref methods, command channels). This avoids the lifted-state antipattern where the developer extracts table state, transforms it, and feeds it back, which creates extra render cycles and race conditions.

## Research Guidelines

- **Must not use articles, docs, or source code from** TanStack Table, TanStack Virtual, AG Grid, MUI DataGrid.
- **Must not reference external libraries** like TanStack Table, TanStack Virtual, AG Grid, MUI DataGrid, or similar - their architecture is irrelevant to this codebase
- Focus exclusively on understanding and extending the existing patterns in this repository
