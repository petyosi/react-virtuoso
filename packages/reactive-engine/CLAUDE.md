# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

- Build: `npm run build` (TypeScript compilation + Vite build)
- Lint: `npm run lint`
- Typecheck: `npm run typecheck` (TypeScript type checking without emit)
- Test: `npm run test` (Vitest with browser mode)
- Test watch mode: `npm run test:watch`
- Run single test: `npx vitest <test-file-path>` or `npx vitest -t "<test-name>"`
- Component stories: `npm run ladle` (Ladle dev server for stories)
- Type validation: `npm run are-the-types-wrong`

## Architecture Overview

Reactive Engine is a push-based reactive state management library built around three core concepts:

### Core Node Types

- **Cells**: Stateful nodes that store values and emit when changed
- **Streams**: Stateless nodes that only emit values without storage
- **Triggers**: Valueless nodes for signaling without data

### Key Components

- **Engine**: Central orchestrator that manages node instances, state, subscriptions, and computation cycles
- **Operators**: Functional transformers like `map`, `filter`, `throttleTime` for data flow manipulation
- **Combinators**: Connect nodes with `link`, `pipe` for complex data flow graphs

### Node Definition Pattern

All nodes are defined using factory functions (`Cell`, `Stream`, `Trigger`) that return node references. Node definitions are global module-level symbols, while actual instances live inside Engine instances.

```ts
// Definition (global)
const myCell$ = Cell(0, (engine) => {
  // Initialization logic
})

// Usage (per-engine instance)
const engine = new Engine()
engine.pub(myCell$, 42)
```

### React Integration

- `EngineProvider`: Context provider that creates engine instances
- Hooks: `useCellValue`, `usePublisher`, `useCellValues`, `useEngine`
- Automatic node initialization when referenced in hooks

## Code Patterns

### TypeScript Types

Using `any` should be avoided at all costs. Use `unknown` if necessary, but prefer strict typing.

### Node Naming Convention

Use `$` suffix for node references to distinguish them from their values:

```ts
const count$ = Cell(0)
const count = useCellValue(count$) // value without $
```

### Distinct Behavior

Nodes are distinct by default (only emit when value changes). Override with:

- `false` for always emit
- Custom comparator function for complex objects

## Operators and combinators

- All operators, combinators, and node utilities are exposed in an `e` export. Unless specifically testing the engine instance, always use them through the `e` export.

For example:

```
import {e, Cell} from '@virtuoso.dev/reactive-engine'

const count$ = Cell(0)
e.sub(count$, () => console.log('count changed'))
```

## Testing Approach

- Always import everything from the root export, not from the individual files
- Always use the `e` utility export when writing operators and combinators
- Always use the `e` utility export for subscriptions
- Node tests in `src/test/node/` using Vitest
- Browser/React tests in `src/test/browser/` using Vitest browser mode
- Stories in `src/stories/` using Ladle
- Focus on testing node behavior independent of React when possible
- Always run eslint after the tests and the typecheck passes.

## Key Implementation Files

- `src/Engine.ts`: Core engine implementation with pub/sub, state management
- `src/nodes.ts`: Node factory functions (Cell, Stream, Trigger)
- `src/operators.ts`: Data transformation operators
- `src/combinators.ts`: Node connection utilities
- `src/react.tsx`: React integration (provider, hooks)
- `src/types.ts`: Core type definitions

## Development Notes

- Built as ESM-only package with Vite
- Uses vitest for testing with browser mode for React components
- TypeScript with strict typing, exports full API surface
- No external runtime dependencies (React is peer dependency)
- Optimized for push-based reactive patterns vs pull-based state management
- Always run eslint after tests and typecheck passes, and fix the errors.

