import * as React from 'react'

import type { Inp, NodeRef, Out, Subscription, TracerConsole } from './types'

import { Engine } from './Engine'

/**
 * The context that provides the engine for the built-in hooks.
 * @category React Components
 * @function
 */
export const EngineContext = React.createContext<Engine | null>(null)

/**
 * @inline
 * @category React Components
 */
export interface EngineProviderProps {
  /**
   * The children to render
   */
  children: React.ReactNode
  /**
   * A console instance (usually, the browser console, but you can pass your own logger) that enables diagnostic messages about the engine state cycles.
   */
  console?: TracerConsole
  /**
   * The initial values to set in the engine
   */
  initWith?: Record<string, unknown>
  /**
   * the label to use in the tracer messages
   */
  label?: string
  /**
   * The values to update in the engine on each render
   */
  updateWith?: Record<string, unknown>
}

/**
 * @category React Components
 * @function
 */
export const EngineProvider: React.FC<EngineProviderProps> = ({
  children,
  console: theEngineConsole,
  initWith,
  label,
  updateWith = {},
}) => {
  const [engine, setEngine] = React.useState<Engine | null>(null)

  useIsomorphicLayoutEffect(() => {
    const engine = new Engine(initWith)
    setEngine(engine)
    return () => {
      engine.dispose()
    }
  }, [])

  useIsomorphicLayoutEffect(() => {
    engine?.setTracerConsole(theEngineConsole)
  }, [theEngineConsole, engine])

  useIsomorphicLayoutEffect(() => {
    engine?.setLabel(label ?? '')
  }, [label, engine])

  useIsomorphicLayoutEffect(() => {
    engine?.pubIn(updateWith)
  }, [updateWith, engine])

  return engine && <EngineContext.Provider value={engine}>{children}</EngineContext.Provider>
}

const useIsomorphicLayoutEffect = typeof document !== 'undefined' ? React.useLayoutEffect : React.useEffect

/**
 * Returns a direct reference to the current engine. Use with caution.
 *
 * If possible, design your logic in a reactive manner, and use {@link useCellValue} and {@link usePublisher} to access the output of the engine.
 * @category Hooks
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
 * @remarks If you need the values of multiple nodes from the engine and those nodes might change in the same computiation, you can `useCellValues` to reduce re-renders.
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
 * @category Hooks
 * @function
 */
export const useCellValue = 'useSyncExternalStore' in React ? useCellValueWithStore : useCellValueWithState

/**
 * Retreives the values of the passed cells.
 * The component is re-rendered each time any of the referred cells changes its value.
 * @category Hooks
 * @returns Correclty typed array with the current values of the passed cells.
 * @typeParam T1 - The type of values that the first cell emits.
 *
 * @example
 * ```tsx
 * const foo$ = Cell('foo')
 * const bar$ = Cell('bar')
 * //...
 * function MyComponent() {
 *   const [foo, bar] = useCellValues(foo$, bar$)
 *   return <div>{foo} - {bar}</div>
 * }
 * ```
 */
export function useCellValues(...cells: Out[]): unknown[]
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
export function useCellValues<T1, T2, T3, T4, T5, T6>( ...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>]): [T1, T2, T3, T4, T5, T6] // prettier-ignore
/** @hidden */
export function useCellValues<T1, T2, T3, T4, T5, T6, T7>( ...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>]): [T1, T2, T3, T4, T5, T6, T7] // prettier-ignore
/** @hidden */
export function useCellValues<T1, T2, T3, T4, T5, T6, T7, T8>( ...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>]): [T1, T2, T3, T4, T5, T6, T7, T8] // prettier-ignore
/** @hidden */
export function useCellValues<T1, T2, T3, T4, T5, T6, T7, T8, T9>( ...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>]): [T1, T2, T3, T4, T5, T6, T7, T8, T9] // prettier-ignore
/** @hidden */
export function useCellValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>( ...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>]): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10] // prettier-ignore
/** @hidden */
export function useCellValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>( ...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>]): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11] // prettier-ignore
/** @hidden */
export function useCellValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>( ...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>]): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12] // prettier-ignore
/** @hidden */
export function useCellValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>( ...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>]): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13] // prettier-ignore
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
 * @typeParam T - The type of values that the node will accept.
 * @example
 * ```tsx
 * const stream = Stream<number>(true, (r) => {
 *  r.sub(stream, (value) => console.log(`${value} was published in the stream`))
 * })
 * //...
 * function MyComponent() {
 *  const pub = usePublisher(stream);
 *  return <button onClick={() => pub(2)}>Push a value into the stream</button>
 * }
 * ```
 * @category Hooks
 */
export function usePublisher<T>(node: Inp<T>) {
  const engine = useEngine()
  engine.register(node)
  return React.useCallback(
    (value: T) => {
      engine.pub(node, value)
    },
    [engine, node]
  )
}

/**
 * Returns a tuple of the current value of the cell and a publisher function (similar to useState).
 * The component will be re-rendered when the cell value changes.
 *
 * @remarks If you need just a publisher, use {@link usePublisher}.
 *
 * @param cell - The cell to use.
 * @returns A tuple of the current value of the cell and a publisher function.
 * @typeParam T - The type of values that the cell will emit/accept.
 * @category Hooks
 */
export function useCell<T>(cell: NodeRef<T>): [T, (value: T) => void] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
  return [useCellValue<T>(cell), usePublisher<T>(cell as any)]
}
