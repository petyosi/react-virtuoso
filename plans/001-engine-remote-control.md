# Engine Remote Control PRP

## Purpose

Enable components anywhere in the app to interact with an `EngineProvider`'s engine instance via a global registry, without prop drilling or tree position requirements.

## Core Principles

1. **Context is King**: Include ALL necessary documentation, examples, and caveats
2. **Validation Loops**: Provide executable tests/lints the AI can run and fix
3. **Information Dense**: Use keywords and patterns from the codebase
4. **Progressive Success**: Start simple, validate, then enhance
5. **Global rules**: Follow all rules in CLAUDE.md (if exists)

---

## Goal

Add an `engineId` prop to `EngineProvider` that registers the engine in a global registry, and create `useRemote*` hook variants that can access engines by ID from anywhere in the app.

## Why

- **Developer experience**: Allows reading cell values and publishing to nodes from any component without restructuring the component tree
- **Simplicity**: No wrapper component needed - just add `engineId` to `EngineProvider`
- **Flexibility**: Multiple engines can coexist with different IDs
- **Integration**: Follows existing reactive-engine-react patterns and conventions

## What

When `EngineProvider` has an `engineId` prop, it registers its engine in a global registry. Components anywhere can use `useRemote*` hooks with that ID to access the engine. The hooks gracefully return `undefined`/noop when the engine isn't available yet.

**Why `useRemote*` variants?** Due to React's rendering order, components may render before `EngineProvider` mounts. The regular hooks (`useCellValue`, etc.) throw when no engine exists. The remote variants return `undefined` / noop until the engine becomes available.

### User-Visible API

```tsx
// EngineProvider with engineId registers in global registry
<>
  <SiblingComponent />
  <EngineProvider engineId="my-engine" initFn={initFn}>
    <NestedComponent />
  </EngineProvider>
</>

function SiblingComponent() {
  // Access engine by ID from anywhere - returns undefined until engine mounts
  const value = useRemoteCellValue(myCell$, 'my-engine')
  const publish = useRemotePublisher(myTrigger$, 'my-engine')

  if (value === undefined) return <div>Loading...</div>
  return <button onClick={() => publish()}>{value}</button>
}

// Multi-engine usage
<EngineProvider engineId="engine-a" initFn={initFnA}>...</EngineProvider>
<EngineProvider engineId="engine-b" initFn={initFnB}>...</EngineProvider>

<MultiEngineComponent />

function MultiEngineComponent() {
  // Access different engines by ID
  const valueA = useRemoteCellValue(myCell$, 'engine-a')
  const valueB = useRemoteCellValue(myCell$, 'engine-b')
  const publishA = useRemotePublisher(myTrigger$, 'engine-a')

  return (
    <div>
      <span>Engine A: {valueA ?? 'loading'}</span>
      <span>Engine B: {valueB ?? 'loading'}</span>
      <button onClick={() => publishA()}>Trigger A</button>
    </div>
  )
}

// Inside EngineProvider, regular hooks still work as before
function NestedComponent() {
  const value = useCellValue(myCell$) // throws if no provider - same as before
  return <div>{value}</div>
}
```

### Hook Signatures

```typescript
// Basic hooks (existing, unchanged)
useCellValue<T>(cell: Out<T>): T
usePublisher<T>(node$: Inp<T>): (value: T) => void
useCell<T>(cell: NodeRef<T>): [T, (value: T) => void]
useCellValues<T1, T2, ...>(...cells): [T1, T2, ...]

// Remote hooks (new) - require engineId parameter
useRemoteCellValue<T>(cell: Out<T>, engineId: string): T | undefined
useRemotePublisher<T>(node$: Inp<T>, engineId: string): (value: T) => void
useRemoteCell<T>(cell: NodeRef<T>, engineId: string): [T | undefined, (value: T) => void]

// useRemoteCellValues - options object form with engineId (strongly typed)
useRemoteCellValues<T1, T2, ...>(options: { cells: [Out<T1>, Out<T2>, ...], engineId: string }): [T1, T2, ...] | undefined
```

### Hook Behavior Comparison

| Hook | No Engine | Engine Available |
|------|-----------|------------------|
| `useCellValue` | throws | returns value |
| `useRemoteCellValue(cell$, id)` | returns `undefined` | returns value from engine with ID |
| `usePublisher` | throws | returns publisher fn |
| `useRemotePublisher(node$, id)` | returns noop fn | returns publisher fn for engine with ID |
| `useCell` | throws | returns `[value, publisher]` |
| `useRemoteCell(cell$, id)` | returns `[undefined, noop]` | returns `[value, publisher]` |
| `useCellValues` | throws | returns values array |
| `useRemoteCellValues({ cells, engineId })` | returns `undefined` | returns values array |

### Success Criteria

- [ ] `EngineProvider` accepts optional `engineId` prop
- [ ] When `engineId` provided, `EngineProvider` registers engine in global registry
- [ ] Engine is unregistered from registry on unmount
- [ ] `useRemoteCellValue(cell$, id)` returns `undefined` when no engine, value when available
- [ ] `useRemotePublisher(node$, id)` returns noop when no engine, publisher when available
- [ ] `useRemoteCell(cell$, id)` returns `[undefined, noop]` when no engine
- [ ] `useRemoteCellValues({ cells, engineId })` returns `undefined` when no engine
- [ ] Components re-render when engine becomes available
- [ ] Multiple engines with different IDs work independently
- [ ] All exports added to package index
- [ ] Unit tests pass
- [ ] TypeScript types are correct

---

## All Needed Context

### Documentation & References

```yaml
- file: packages/reactive-engine-react/src/EngineProvider.tsx
  why: Current EngineProvider implementation - will be modified to register in global registry

- file: packages/reactive-engine-react/src/hooks.ts
  why: Contains EngineContext, useEngine, useCellValue, usePublisher patterns to follow

- file: packages/reactive-engine-react/src/hooks.test.tsx
  why: Testing patterns with @testing-library/react, vitest

- file: packages/reactive-engine-react/src/index.ts
  why: Export patterns - where to add new exports
```

### Current Codebase Tree

```text
packages/reactive-engine-react/src/
├── EngineProvider.tsx    # Main provider component
├── hooks.ts              # Context + all hooks
├── hooks.test.tsx        # Unit tests
└── index.ts              # Public exports
```

### Desired Codebase Tree

```text
packages/reactive-engine-react/src/
├── EngineProvider.tsx       # MODIFY: add engineId prop, register in global registry
├── hooks.ts                 # MODIFY: add global registry and useRemote* hooks
├── hooks.test.tsx           # MODIFY: add remote hooks tests
└── index.ts                 # MODIFY: export new hooks
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: useIsomorphicLayoutEffect must be used instead of useLayoutEffect for SSR
const useIsomorphicLayoutEffect = typeof document !== 'undefined' ? React.useLayoutEffect : React.useEffect

// CRITICAL: Engine initialization happens in useIsomorphicLayoutEffect, not useState initializer
// This is deliberate - ensures cleanup/disposal works correctly in Strict Mode

// CRITICAL: The EngineProvider renders null until engine is created
return engine && <EngineContext.Provider value={engine}>{children}</EngineContext.Provider>

// CRITICAL: useRemote* hooks must use useState + useEffect pattern (not useSyncExternalStore)
// This avoids Rules of Hooks violations when engine is null
// Pattern follows existing useCellValueWithState fallback

// CRITICAL: Global registry must clean up entries when no subscribers AND no engine
// Otherwise memory leaks can occur

// PATTERN: Use tiny-invariant for runtime assertions
import invariant from 'tiny-invariant'
invariant(engine !== null, 'useEngine must be used within an EngineProvider')

// PATTERN: Regular hooks throw if no provider; useRemote* hooks return undefined/noop
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
// Global registry for ID-based engine lookup
// Maps engineId -> { engine, subscribers }
interface EngineRegistryEntry {
  engine: Engine | null
  subscribers: Set<() => void>
}

const engineRegistry = new Map<string, EngineRegistryEntry>()

// Extended EngineProviderProps (add engineId)
interface EngineProviderProps {
  children: React.ReactNode
  engineId?: string           // NEW: optional ID to register in global registry
  // ... existing props unchanged
  initFn?: (engine: Engine) => void
  initWith?: Record<symbol, unknown>
  updateDeps?: unknown[]
  updateFn?: (engine: Engine) => void
}
```

### List of Tasks

```yaml
Task 1: Add global registry to hooks.ts
  MODIFY packages/reactive-engine-react/src/hooks.ts:
    - Add engineRegistry Map and helper functions (setRegistryEngine, subscribeToRegistry, getRegistryEngine)
    - Registry is internal (not exported)

Task 2: Modify EngineProvider to register in global registry
  MODIFY packages/reactive-engine-react/src/EngineProvider.tsx:
    - Add optional engineId prop to EngineProviderProps interface
    - After engine creation, if engineId provided, register in global registry
    - Clean up by unregistering on unmount

Task 3: Add useRemote* hook variants (require engineId)
  MODIFY packages/reactive-engine-react/src/hooks.ts:
    - Add useRemoteCellValue(cell$, engineId): look up engine from registry, return undefined if not found
    - Add useRemotePublisher(node$, engineId): return noop if engine not found
    - Add useRemoteCell(cell$, engineId): returns [undefined, noop] when no engine
    - Add useRemoteCellValues({ cells, engineId }): options object form only

Task 4: Update exports
  MODIFY packages/reactive-engine-react/src/index.ts:
    - Export useRemoteCellValue, useRemotePublisher, useRemoteCell, useRemoteCellValues
    - Export RemoteCellValuesOptions type

Task 5: Add unit tests
  MODIFY packages/reactive-engine-react/src/hooks.test.tsx:
    - Test useRemoteCellValue returns undefined before engine, value after
    - Test useRemotePublisher returns noop before engine, working fn after
    - Test useRemoteCell returns [undefined, noop] before engine
    - Test re-render occurs when engine becomes available
    - Test multiple engines with different IDs work independently
    - Test engine unmount causes hooks to return undefined again
```

### Per Task Pseudocode

```typescript
// Task 1: Global registry in hooks.ts (internal, not exported)
interface EngineRegistryEntry {
  engine: Engine | null
  subscribers: Set<() => void>
}

const engineRegistry = new Map<string, EngineRegistryEntry>()

// Registry helper functions (internal)
function getOrCreateEntry(id: string): EngineRegistryEntry {
  let entry = engineRegistry.get(id)
  if (!entry) {
    entry = { engine: null, subscribers: new Set() }
    engineRegistry.set(id, entry)
  }
  return entry
}

function setRegistryEngine(id: string, engine: Engine | null): void {
  const entry = getOrCreateEntry(id)
  entry.engine = engine
  // Notify all subscribers
  entry.subscribers.forEach(cb => cb())
}

function subscribeToRegistry(id: string, callback: () => void): () => void {
  const entry = getOrCreateEntry(id)
  entry.subscribers.add(callback)
  return () => {
    entry.subscribers.delete(callback)
    // Clean up entry if no subscribers and no engine
    if (entry.subscribers.size === 0 && entry.engine === null) {
      engineRegistry.delete(id)
    }
  }
}

function getRegistryEngine(id: string): Engine | null {
  return engineRegistry.get(id)?.engine ?? null
}

// Task 2: EngineProvider modification - add engineId prop
export const EngineProvider = ({ engineId, children, engineId: storageId, initFn, initWith, updateDeps, updateFn }) => {
  const [engine, setEngine] = React.useState<Engine | null>(null)

  useIsomorphicLayoutEffect(() => {
    const instance = new Engine(initWith, storageId)
    setEngine(instance)
    initFn?.(instance)

    // Register in global registry if engineId provided
    if (engineId) {
      setRegistryEngine(engineId, instance)
    }

    return () => {
      // Unregister from global registry
      if (engineId) {
        setRegistryEngine(engineId, null)
      }
      instance.dispose()
    }
  }, [initWith, storageId, engineId])

  useIsomorphicLayoutEffect(() => {
    if (engine) {
      updateFn?.(engine)
    }
  }, [engine, ...(updateDeps ?? [])])

  return engine && <EngineContext.Provider value={engine}>{children}</EngineContext.Provider>
}

// Task 3: useRemote* hook variants (require engineId)
// IMPORTANT: Use useState + useEffect pattern to avoid Rules of Hooks violations

const noop = () => {}

// Helper hook to get engine by ID from global registry
function useRemoteEngine(engineId: string): Engine | null {
  const [engine, setEngine] = React.useState<Engine | null>(() => getRegistryEngine(engineId))

  useIsomorphicLayoutEffect(() => {
    // Sync initial state
    setEngine(getRegistryEngine(engineId))
    // Subscribe to changes
    return subscribeToRegistry(engineId, () => {
      setEngine(getRegistryEngine(engineId))
    })
  }, [engineId])

  return engine
}

// useRemoteCellValue: uses useState + useEffect pattern (like useCellValueWithState)
export function useRemoteCellValue<T>(cell: Out<T>, engineId: string): T | undefined {
  const engine = useRemoteEngine(engineId)

  // Always call hooks unconditionally
  const [value, setValue] = React.useState<T | undefined>(() =>
    engine ? engine.getValue(cell) : undefined
  )

  useIsomorphicLayoutEffect(() => {
    if (!engine) {
      setValue(undefined)
      return
    }
    engine.register(cell)
    // Sync current value
    setValue(engine.getValue(cell))
    // Subscribe to changes
    return engine.sub(cell, setValue)
  }, [engine, cell])

  return value
}

// useRemotePublisher: returns stable noop when no engine, real publisher when available
export function useRemotePublisher<T>(node$: Inp<T>, engineId: string): (value: T) => void {
  const engine = useRemoteEngine(engineId)

  // Register node when engine available
  useIsomorphicLayoutEffect(() => {
    if (engine) {
      engine.register(node$)
    }
  }, [engine, node$])

  // Return memoized callback - noop when no engine
  return React.useCallback(
    (value: T) => {
      if (engine) {
        engine.pub(node$, value)
      }
      // else: noop - silently ignore
    },
    [engine, node$]
  )
}

export function useRemoteCell<T>(cell: NodeRef<T>, engineId: string): [T | undefined, (value: T) => void] {
  return [useRemoteCellValue(cell, engineId), useRemotePublisher(cell as Inp<T>, engineId)]
}

// useRemoteCellValues: options object form only (engineId required)
interface RemoteCellValuesOptions<T extends unknown[]> {
  cells: { [K in keyof T]: Out<T[K]> }
  engineId: string
}

// Strongly typed overloads
/** @hidden */
export function useRemoteCellValues<T1>(options: RemoteCellValuesOptions<[T1]>): [T1] | undefined
/** @hidden */
export function useRemoteCellValues<T1, T2>(options: RemoteCellValuesOptions<[T1, T2]>): [T1, T2] | undefined
/** @hidden */
export function useRemoteCellValues<T1, T2, T3>(options: RemoteCellValuesOptions<[T1, T2, T3]>): [T1, T2, T3] | undefined
/** @hidden */
export function useRemoteCellValues<T1, T2, T3, T4>(options: RemoteCellValuesOptions<[T1, T2, T3, T4]>): [T1, T2, T3, T4] | undefined
/** @hidden */
export function useRemoteCellValues<T1, T2, T3, T4, T5>(options: RemoteCellValuesOptions<[T1, T2, T3, T4, T5]>): [T1, T2, T3, T4, T5] | undefined
// ... continue up to 12 or 13 like useCellValues

// Implementation
/** @hidden */
export function useRemoteCellValues(options: RemoteCellValuesOptions<unknown[]>): unknown[] | undefined
export function useRemoteCellValues(options: RemoteCellValuesOptions<unknown[]>): unknown[] | undefined {
  const { cells, engineId } = options
  const engine = useRemoteEngine(engineId)

  // Create combined cell only when engine is available
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const combinedCell = React.useMemo(() => {
    return engine ? engine.combineCells(cells) : null
  }, [engine, ...cells])

  // Use useState + useEffect pattern (no conditional hooks)
  const [values, setValues] = React.useState<unknown[] | undefined>(() =>
    engine && combinedCell ? engine.getValue(combinedCell) : undefined
  )

  useIsomorphicLayoutEffect(() => {
    if (!engine || !combinedCell) {
      setValues(undefined)
      return
    }
    engine.register(combinedCell)
    setValues(engine.getValue(combinedCell))
    return engine.sub(combinedCell, setValues)
  }, [engine, combinedCell])

  return values
}
```

### Integration Points

```yaml
EXPORTS:
  - add to: packages/reactive-engine-react/src/index.ts
  - exports:
    - useRemoteCellValue (hook)
    - useRemotePublisher (hook)
    - useRemoteCell (hook)
    - useRemoteCellValues (hook)
    - RemoteCellValuesOptions<T> (type)

PROPS:
  - add to: EngineProviderProps interface
  - prop: engineId?: string
```

---

## Validation Loop

### Level 1: Syntax & Style

```bash
cd packages/reactive-engine-react && pnpm typecheck && pnpm lint && pnpm format
```

### Level 2: Unit Tests

```typescript
// Required test cases:
// 1. useRemoteCellValue returns undefined when EngineProvider not mounted
// 2. useRemoteCellValue returns value after EngineProvider with matching engineId mounts
// 3. useRemotePublisher returns noop when EngineProvider not mounted
// 4. useRemotePublisher returns working fn after EngineProvider mounts
// 5. useRemoteCell returns [undefined, noop] before, [value, fn] after
// 6. useRemoteCellValues({ cells, engineId }) works correctly
// 7. Component re-renders when engine becomes available
// 8. Engine unmount causes hooks to return undefined again
// 9. Multiple engines with different IDs work independently
// 10. EngineProvider without engineId does NOT register in global registry
// 11. Hooks work from components anywhere in the tree (not just siblings)
```

```bash
cd packages/reactive-engine-react && pnpm test
```

### Level 3: Integration Test

```bash
# Build and verify exports
cd packages/reactive-engine-react && pnpm build
# Verify the exports are available
node -e "const pkg = require('./dist/index.js'); console.log(Object.keys(pkg))"
```

---

## Final Validation Checklist

- [ ] All tests pass (`pnpm test`)
- [ ] No linting errors (`pnpm lint`)
- [ ] No type errors (`pnpm typecheck`)
- [ ] Format check passes (`pnpm format:check`)
- [ ] Build succeeds (`pnpm build`)
- [ ] New exports visible in build output:
  - [ ] `useRemoteCellValue`
  - [ ] `useRemotePublisher`
  - [ ] `useRemoteCell`
  - [ ] `useRemoteCellValues`
  - [ ] `RemoteCellValuesOptions`
- [ ] `EngineProviderProps` includes `engineId?: string`

---

## Anti-Patterns to Avoid

- Don't create refs during render (use useState or useRef + useEffect)
- Don't use useLayoutEffect directly (use useIsomorphicLayoutEffect for SSR)
- Don't skip registering nodes with engine before using them
- Don't forget cleanup in useEffect/useLayoutEffect
- Don't access engine synchronously before EngineProvider renders (engine is null initially)
- Don't provide a new context value object on every render (memoize with useMemo)

---

## Clarifications

### Session 2026-01-31

- Q: Can existing hooks (`useCellValue`, etc.) work in siblings? → A: No, due to rendering order. Siblings render before `EngineProvider` mounts, so engine is null. **Solution**: Create `useRemote*` hook variants that return `undefined`/noop when engine unavailable, instead of throwing.

- Q: How should `useRemote*` hooks handle null engine without violating Rules of Hooks? → A: Use `useState` + `useEffect` pattern (like the existing React 16 fallback `useCellValueWithState`). Hooks always run unconditionally, but return `undefined`/noop when engine is null.

- Q: How does `useRemoteCellValues` support `engineId`? → A: Options object form only: `useRemoteCellValues({ cells: [cell1$, cell2$], engineId: 'engine-a' })` with strongly typed overloads.

- Q: Do we need an `EngineRemoteControl` wrapper component? → A: **No**. Since we have a global registry, `EngineProvider` can register directly when it has an `engineId` prop. The `useRemote*` hooks always require an explicit `engineId` to look up from the registry. This is simpler - no wrapper component needed.

---

## Open Questions

None - all questions have been clarified.

---

## Confidence Score: 9/10

Reasoning:

- (+) Simplified design - no wrapper component needed, just add `engineId` prop to EngineProvider
- (+) Clear existing patterns to follow in hooks.ts and EngineProvider.tsx
- (+) `useRemote*` variants use useState + useEffect (same as existing React 16 fallback pattern)
- (+) No Rules of Hooks violations - all hooks called unconditionally
- (+) Re-render handled naturally via registry subscriptions
- (+) Existing hooks remain unchanged - no breaking changes
- (+) Graceful degradation: undefined/noop instead of throwing
- (+) Hooks work from anywhere in the app via global registry

Recommend: **Execute** - design is simple and solid.
