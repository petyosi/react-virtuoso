import * as React from 'react'

import type { Engine } from './Engine'
import type { Inp, NodeRef, Out, Subscription } from './types'

export const useIsomorphicLayoutEffect = typeof document !== 'undefined' ? React.useLayoutEffect : React.useEffect

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
  if (engine === null) {
    throw new Error('useEngine must be used within an EngineProvider')
  }
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
export function useCellValues(...cells: Out[]): unknown[]
/** @hidden */
export function useCellValues<T1>(...cells: [Out<T1>]): [T1] // biome-ignore format: keep-one-liner
/** @hidden */
export function useCellValues<T1, T2>(...cells: [Out<T1>, Out<T2>]): [T1, T2] // biome-ignore format: keep-one-liner
/** @hidden */
export function useCellValues<T1, T2, T3>(...cells: [Out<T1>, Out<T2>, Out<T3>]): [T1, T2, T3] // biome-ignore format: keep-one-liner
/** @hidden */
export function useCellValues<T1, T2, T3, T4>(...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>]): [T1, T2, T3, T4] // biome-ignore format: keep-one-liner
/** @hidden */
export function useCellValues<T1, T2, T3, T4, T5>(...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>]): [T1, T2, T3, T4, T5] // biome-ignore format: keep-one-liner
/** @hidden */
export function useCellValues<T1, T2, T3, T4, T5, T6>(
  ...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>]
): [T1, T2, T3, T4, T5, T6] // biome-ignore format: keep-one-liner
/** @hidden */
export function useCellValues<T1, T2, T3, T4, T5, T6, T7>(
  ...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>]
): [T1, T2, T3, T4, T5, T6, T7] // biome-ignore format: keep-one-liner
/** @hidden */
export function useCellValues<T1, T2, T3, T4, T5, T6, T7, T8>(
  ...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>]
): [T1, T2, T3, T4, T5, T6, T7, T8] // biome-ignore format: keep-one-liner
/** @hidden */
export function useCellValues<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
  ...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>]
): [T1, T2, T3, T4, T5, T6, T7, T8, T9] // biome-ignore format: keep-one-liner
/** @hidden */
export function useCellValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
  ...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>]
): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10] // biome-ignore format: keep-one-liner
/** @hidden */
export function useCellValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(
  ...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>]
): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11] // biome-ignore format: keep-one-liner
/** @hidden */
export function useCellValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>(
  ...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>]
): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12] // biome-ignore format: keep-one-liner
/** @hidden */
export function useCellValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>(
  ...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>]
): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13] // biome-ignore format: keep-one-liner
export function useCellValues(...cells: Out[]): unknown[] {
  const engine = useEngine()

  // biome-ignore lint/correctness/useExhaustiveDependencies: I know better
  const combinedCell = React.useMemo(() => {
    return engine.combineCells(cells)
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
 * import {Stream, e, usePublisher} from '@virtuoso.dev/reactive-engine'
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
  // biome-ignore lint/suspicious/noExplicitAny: we need that any here
  return [useCellValue<T>(cell), usePublisher<T>(cell as any)]
}
