import type { Engine, Inp, NodeRef, Out, Subscription } from '@virtuoso.dev/reactive-engine-core'

import * as React from 'react'
import invariant from 'tiny-invariant'

export const useIsomorphicLayoutEffect = typeof document !== 'undefined' ? React.useLayoutEffect : React.useEffect

// Global registry for ID-based engine lookup (internal, not exported)
interface EngineRegistryEntry {
  engine: Engine | null
  subscribers: Set<() => void>
}

const engineRegistry = new Map<string, EngineRegistryEntry>()

function getOrCreateEntry(id: string): EngineRegistryEntry {
  let entry = engineRegistry.get(id)
  if (!entry) {
    entry = { engine: null, subscribers: new Set() }
    engineRegistry.set(id, entry)
  }
  return entry
}

export function setRegistryEngine(id: string, engine: Engine | null): void {
  const entry = getOrCreateEntry(id)
  entry.engine = engine
  entry.subscribers.forEach((cb) => {
    cb()
  })
  if (entry.subscribers.size === 0 && engine === null) {
    engineRegistry.delete(id)
  }
}

function subscribeToRegistry(id: string, callback: () => void): () => void {
  const entry = getOrCreateEntry(id)
  entry.subscribers.add(callback)
  return () => {
    entry.subscribers.delete(callback)
    if (entry.subscribers.size === 0 && entry.engine === null) {
      engineRegistry.delete(id)
    }
  }
}

function getRegistryEngine(id: string): Engine | null {
  return engineRegistry.get(id)?.engine ?? null
}

/**
 * The context that provides an engine instance used by the built-in hooks. Instantiated by {@link EngineProvider}.
 *
 * @category React Hooks and Components
 * @function
 */
export const EngineContext = React.createContext<Engine | null>(null)

/**
 * Returns a reference to the current engine instance created in the {@link EngineProvider}.
 *
 * @remarks Accessing the engine instance directly in React is rarely needed.
 * Use {@link useCellValue} and {@link usePublisher} to interact with the nodes.
 * @category React Hooks and Components
 */
export function useEngine() {
  const engine = React.useContext(EngineContext)
  invariant(engine !== null, 'useEngine must be used within an EngineProvider')
  return engine
}

function useCellValueWithStore<T>(cell: Out<T>): T {
  const engine = useEngine()
  engine.register(cell)

  const cb = React.useCallback((c: Subscription<T>) => engine.sub(cell, c), [engine, cell])

  return React.useSyncExternalStore(
    cb,
    () => engine.getValue(cell),
    () => engine.getValue(cell)
  )
}

/**
 * React 16 hook fallback for useCellValue when useSyncExternalStore is not available.
 */
function useCellValueWithState<T>(cell: Out<T>): T {
  const engine = useEngine()
  engine.register(cell)
  const [value, setValue] = React.useState(() => engine.getValue(cell))

  useIsomorphicLayoutEffect(() => {
    return engine.sub(cell, setValue)
  }, [engine, cell])

  return value
}

/**
 * Gets the current value of the cell. The component is re-rendered when the cell value changes.
 *
 * @remarks If you need the values of multiple nodes from the engine and those nodes might change in the same computiation, you can {@link useCellValues} to reduce re-renders.
 *
 * @returns The current value of the cell.
 * @typeParam T - the type of the value that the cell caries.
 * @param cell - The cell to use.
 *
 * @example
 * ```tsx
 * const cell$ = Cell(0)
 * //...
 * function MyComponent() {
 *   const cell = useCellValue(cell$)
 *   return <div>{cell}</div>
 * }
 * ```
 * @category React Hooks and Components
 * @function
 */
export const useCellValue = 'useSyncExternalStore' in React ? useCellValueWithStore : useCellValueWithState

/**
 * Returns the up-to-date values of the passed cells.
 * The component is re-rendered each time any of the cells emits a new value.
 * @category React Hooks and Components
 * @returns Correclty typed array with the current values of the passed cells.
 *
 * @remarks This hook works only with cells, don't pass streams or triggers.
 *
 * @example
 * ```tsx
 * import { Cell, useCellValues }
 * const foo$ = Cell('foo')
 * const bar$ = Cell('bar')
 * // ...
 * // The component should be wrapped in an EngineProvider.
 * function MyComponent() {
 *   const [foo, bar] = useCellValues(foo$, bar$)
 *   return <div>{foo} - {bar}</div>
 * }
 * ```
 */
/** @hidden */
export function useCellValues<T1>(...cells: [Out<T1>]): [T1] // prettier-ignore
/** @hidden */
export function useCellValues<T1, T2>(...cells: [Out<T1>, Out<T2>]): [T1, T2] // prettier-ignore
/** @hidden */
export function useCellValues<T1, T2, T3>(...cells: [Out<T1>, Out<T2>, Out<T3>]): [T1, T2, T3] // prettier-ignore
/** @hidden */
export function useCellValues<T1, T2, T3, T4>(...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>]): [T1, T2, T3, T4] // prettier-ignore
/** @hidden */
export function useCellValues<T1, T2, T3, T4, T5>(...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>]): [T1, T2, T3, T4, T5] // prettier-ignore
/** @hidden */
export function useCellValues<T1, T2, T3, T4, T5, T6>(...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>]): [T1, T2, T3, T4, T5, T6] // prettier-ignore
/** @hidden */
export function useCellValues<T1, T2, T3, T4, T5, T6, T7>(...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>]): [T1, T2, T3, T4, T5, T6, T7] // prettier-ignore
/** @hidden */
export function useCellValues<T1, T2, T3, T4, T5, T6, T7, T8>(...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>]): [T1, T2, T3, T4, T5, T6, T7, T8] // prettier-ignore
/** @hidden */
export function useCellValues<T1, T2, T3, T4, T5, T6, T7, T8, T9>(...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>]): [T1, T2, T3, T4, T5, T6, T7, T8, T9] // prettier-ignore
/** @hidden */
export function useCellValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>]): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10] // prettier-ignore
/** @hidden */
export function useCellValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>]): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11] // prettier-ignore
/** @hidden */
export function useCellValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>(...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>]): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12] // prettier-ignore
/** @hidden */
export function useCellValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>(...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>]): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13] // prettier-ignore
/** @hidden */
export function useCellValues(...cells: Out[]): unknown[]
export function useCellValues(...cells: Out[]): unknown[] {
  const engine = useEngine()

  const combinedCell = React.useMemo(() => {
    return engine.combineCells(cells)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, ...cells])

  return useCellValue(combinedCell)
}

/**
 * Returns a function that publishes its passed argument into the specified node.
 * @param node$ - the node to publish in.
 * @typeParam T - The type of values that the node accepts.
 * @returns The publisher function for the passed `node$`.
 *
 * @example
 * ```tsx
 * import {Stream, e, usePublisher} from '@virtuoso.dev/reactive-engine-react'
 *
 * const stream$ = Stream<number>()
 * e.sub(stream, (value) => console.log(`${value} was published in the stream`))
 *
 * //...
 * function MyComponent() {
 *  const pub = usePublisher(stream);
 *  return <button onClick={() => pub(2)}>Push a value into the stream</button>
 * }
 * ```
 *
 * @category React Hooks and Components
 */
export function usePublisher<T>(node$: Inp<T>) {
  const engine = useEngine()
  engine.register(node$)
  return React.useCallback(
    (value: T) => {
      engine.pub(node$, value)
    },
    [engine, node$]
  )
}

/**
 * Returns a tuple of the current value of a cell and a publisher function (similar to `useState`).
 * The component re-renderes when the cell value changes.
 *
 * @remarks The reactive engine state management allows you to keep your state logic outside of your React components.
 * Be careful not to use this hook too often alongside `useEffect` for example, as this means that you're losing the benefits of the reactive engine design.
 *
 * @param cell - The cell to use.
 * @returns A tuple of the current value of the cell and a publisher function.
 * @typeParam T - The type of values that the cell emits/accepts.
 * @category React Hooks and Components
 */
export function useCell<T>(cell: NodeRef<T>): [T, (value: T) => void] {
  return [useCellValue<T>(cell), usePublisher<T>(cell)]
}

// Remote hooks - for accessing engines by ID from anywhere in the app

function useRemoteEngine(engineId: string): Engine | null {
  const [engine, setEngine] = React.useState<Engine | null>(() => getRegistryEngine(engineId))

  useIsomorphicLayoutEffect(() => {
    setEngine(getRegistryEngine(engineId))
    return subscribeToRegistry(engineId, () => {
      setEngine(getRegistryEngine(engineId))
    })
  }, [engineId])

  return engine
}

/**
 * Gets the current value of the cell from an engine identified by `engineId`.
 * Returns `undefined` when the engine is not available yet.
 *
 * @param cell - The cell to read from.
 * @param engineId - The ID of the engine to read from (must match the `engineId` prop of an EngineProvider).
 * @returns The current value of the cell, or `undefined` if the engine is not available.
 * @typeParam T - The type of the value that the cell carries.
 *
 * @example
 * ```tsx
 * const cell$ = Cell(0)
 * // ...
 * function SiblingComponent() {
 *   const value = useRemoteCellValue(cell$, 'my-engine')
 *   if (value === undefined) return <div>Loading...</div>
 *   return <div>{value}</div>
 * }
 * ```
 * @category React Hooks and Components
 */
export function useRemoteCellValue<T>(cell: Out<T>, engineId: string): T | undefined {
  const engine = useRemoteEngine(engineId)
  const [value, setValue] = React.useState<T | undefined>(() => (engine ? engine.getValue(cell) : undefined))

  useIsomorphicLayoutEffect(() => {
    if (!engine) {
      setValue(undefined)
      return
    }
    engine.register(cell)
    setValue(engine.getValue(cell))
    return engine.sub(cell, setValue)
  }, [engine, cell])

  return value
}

/**
 * Returns a function that publishes values to a node in an engine identified by `engineId`.
 * Returns a no-op function when the engine is not available yet.
 *
 * @param node$ - The node to publish to.
 * @param engineId - The ID of the engine to publish to (must match the `engineId` prop of an EngineProvider).
 * @returns A publisher function that accepts values of type T.
 * @typeParam T - The type of values that the node accepts.
 *
 * @example
 * ```tsx
 * const trigger$ = Trigger()
 * // ...
 * function SiblingComponent() {
 *   const publish = useRemotePublisher(trigger$, 'my-engine')
 *   return <button onClick={() => publish()}>Trigger</button>
 * }
 * ```
 * @category React Hooks and Components
 */
export function useRemotePublisher<T>(node$: Inp<T>, engineId: string): (value: T) => void {
  const engine = useRemoteEngine(engineId)

  useIsomorphicLayoutEffect(() => {
    if (engine) {
      engine.register(node$)
    }
  }, [engine, node$])

  return React.useCallback(
    (value: T) => {
      if (engine) {
        engine.pub(node$, value)
      }
    },
    [engine, node$]
  )
}

/**
 * Returns a tuple of the current value and a publisher function for a cell in an engine identified by `engineId`.
 * Returns `[undefined, noop]` when the engine is not available yet.
 *
 * @param cell - The cell to use.
 * @param engineId - The ID of the engine (must match the `engineId` prop of an EngineProvider).
 * @returns A tuple of the current value (or undefined) and a publisher function.
 * @typeParam T - The type of values that the cell emits/accepts.
 *
 * @example
 * ```tsx
 * const cell$ = Cell(0)
 * // ...
 * function SiblingComponent() {
 *   const [value, setValue] = useRemoteCell(cell$, 'my-engine')
 *   if (value === undefined) return <div>Loading...</div>
 *   return <button onClick={() => setValue(value + 1)}>{value}</button>
 * }
 * ```
 * @category React Hooks and Components
 */
export function useRemoteCell<T>(cell: NodeRef<T>, engineId: string): [T | undefined, (value: T) => void] {
  return [useRemoteCellValue<T>(cell, engineId), useRemotePublisher<T>(cell, engineId)]
}

/**
 * Options for the {@link useRemoteCellValues} hook.
 * @category React Hooks and Components
 */
export interface RemoteCellValuesOptions<T extends unknown[]> {
  cells: { [K in keyof T]: Out<T[K]> }
  engineId: string
}

/**
 * Returns the up-to-date values of the passed cells from an engine identified by `engineId`.
 * Returns `undefined` when the engine is not available yet.
 *
 * @param options - An object containing the cells array and engineId.
 * @returns An array with the current values of the cells, or `undefined` if the engine is not available.
 *
 * @example
 * ```tsx
 * const foo$ = Cell('foo')
 * const bar$ = Cell('bar')
 * // ...
 * function SiblingComponent() {
 *   const values = useRemoteCellValues({ cells: [foo$, bar$], engineId: 'my-engine' })
 *   if (values === undefined) return <div>Loading...</div>
 *   const [foo, bar] = values
 *   return <div>{foo} - {bar}</div>
 * }
 * ```
 * @category React Hooks and Components
 */
/** @hidden */
export function useRemoteCellValues<T1>(options: RemoteCellValuesOptions<[T1]>): [T1] | undefined // prettier-ignore
/** @hidden */
export function useRemoteCellValues<T1, T2>(options: RemoteCellValuesOptions<[T1, T2]>): [T1, T2] | undefined // prettier-ignore
/** @hidden */
export function useRemoteCellValues<T1, T2, T3>(options: RemoteCellValuesOptions<[T1, T2, T3]>): [T1, T2, T3] | undefined // prettier-ignore
/** @hidden */
export function useRemoteCellValues<T1, T2, T3, T4>(options: RemoteCellValuesOptions<[T1, T2, T3, T4]>): [T1, T2, T3, T4] | undefined // prettier-ignore
/** @hidden */
export function useRemoteCellValues<T1, T2, T3, T4, T5>(options: RemoteCellValuesOptions<[T1, T2, T3, T4, T5]>): [T1, T2, T3, T4, T5] | undefined // prettier-ignore
/** @hidden */
export function useRemoteCellValues<T1, T2, T3, T4, T5, T6>(options: RemoteCellValuesOptions<[T1, T2, T3, T4, T5, T6]>): [T1, T2, T3, T4, T5, T6] | undefined // prettier-ignore
/** @hidden */
export function useRemoteCellValues<T1, T2, T3, T4, T5, T6, T7>(options: RemoteCellValuesOptions<[T1, T2, T3, T4, T5, T6, T7]>): [T1, T2, T3, T4, T5, T6, T7] | undefined // prettier-ignore
/** @hidden */
export function useRemoteCellValues<T1, T2, T3, T4, T5, T6, T7, T8>(options: RemoteCellValuesOptions<[T1, T2, T3, T4, T5, T6, T7, T8]>): [T1, T2, T3, T4, T5, T6, T7, T8] | undefined // prettier-ignore
/** @hidden */
export function useRemoteCellValues<T1, T2, T3, T4, T5, T6, T7, T8, T9>(options: RemoteCellValuesOptions<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>): [T1, T2, T3, T4, T5, T6, T7, T8, T9] | undefined // prettier-ignore
/** @hidden */
export function useRemoteCellValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(options: RemoteCellValuesOptions<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10] | undefined // prettier-ignore
/** @hidden */
export function useRemoteCellValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(options: RemoteCellValuesOptions<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11]>): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11] | undefined // prettier-ignore
/** @hidden */
export function useRemoteCellValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>(options: RemoteCellValuesOptions<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12]>): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12] | undefined // prettier-ignore
/** @hidden */
export function useRemoteCellValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>(options: RemoteCellValuesOptions<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13]>): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13] | undefined // prettier-ignore
/** @hidden */
export function useRemoteCellValues(options: RemoteCellValuesOptions<unknown[]>): undefined | unknown[]
export function useRemoteCellValues(options: RemoteCellValuesOptions<unknown[]>): undefined | unknown[] {
  const { cells, engineId } = options
  const engine = useRemoteEngine(engineId)

  const combinedCell = React.useMemo(() => {
    return engine ? engine.combineCells(cells) : null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, ...cells])

  const [values, setValues] = React.useState<undefined | unknown[]>(() =>
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
