import * as React from 'react'

import type { Inp, NodeRef, Out } from './types'

import { RealmContext } from './react'

const useIsomorphicLayoutEffect = typeof document !== 'undefined' ? React.useLayoutEffect : React.useEffect

/**
 * Returns a direct reference to the current realm. Use with caution.
 *
 * If possible, design your logic in a reactive manner, and use {@link useCellValue} and {@link usePublisher} to access the output of the realm.
 * @category Hooks
 */
export function useRealm() {
  const realm = React.useContext(RealmContext)
  if (realm === null) {
    throw new Error('useRealm must be used within a RealmContextProvider')
  }
  return realm
}

function useCellValueWithStore<T>(cell: Out<T>): T {
  const realm = useRealm()
  realm.register(cell)

  const cb = React.useCallback((c: () => void) => realm.sub(cell, c), [realm, cell])

  return React.useSyncExternalStore(
    cb,
    () => realm.getValue(cell),
    () => realm.getValue(cell)
  )
}

function useCellValueWithState<T>(cell: Out<T>): T {
  const realm = useRealm()
  realm.register(cell)
  const [value, setValue] = React.useState(() => realm.getValue(cell))

  useIsomorphicLayoutEffect(() => {
    const unsub = realm.sub(cell, () => {
      setValue(() => realm.getValue(cell))
    })
    return () => {
      unsub()
    }
  }, [realm, cell])

  return value
}

/**
 * Gets the current value of the cell. The component is re-rendered when the cell value changes.
 *
 * @remark If you need the values of multiple nodes from the realm and those nodes might change in the same computiation, you can `useCellValues` to reduce re-renders.
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
 */
export const useCellValue = 'useSyncExternalStore' in React ? useCellValueWithStore : useCellValueWithState

/**
 * Retreives the values of the passed cells.
 * The component is re-rendered each time any of the referred cells changes its value.
 * @category Hooks
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
export function useCellValues<T1>(...cells: [Out<T1>]): [T1] // prettier-ignore
export function useCellValues<T1, T2>(...cells: [Out<T1>, Out<T2>]): [T1, T2] // prettier-ignore
export function useCellValues<T1, T2, T3>(...cells: [Out<T1>, Out<T2>, Out<T3>]): [T1, T2, T3] // prettier-ignore
export function useCellValues<T1, T2, T3, T4>(...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>]): [T1, T2, T3, T4] // prettier-ignore
export function useCellValues<T1, T2, T3, T4, T5>(...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>]): [T1, T2, T3, T4, T5] // prettier-ignore
export function useCellValues<T1, T2, T3, T4, T5, T6>(
  ...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>]
): [T1, T2, T3, T4, T5, T6] // prettier-ignore
export function useCellValues<T1, T2, T3, T4, T5, T6, T7>(
  ...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>]
): [T1, T2, T3, T4, T5, T6, T7] // prettier-ignore
export function useCellValues<T1, T2, T3, T4, T5, T6, T7, T8>(
  ...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>]
): [T1, T2, T3, T4, T5, T6, T7, T8] // prettier-ignore
export function useCellValues<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
  ...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>]
): [T1, T2, T3, T4, T5, T6, T7, T8, T9] // prettier-ignore
export function useCellValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
  ...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>]
): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10] // prettier-ignore
export function useCellValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(
  ...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>]
): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11] // prettier-ignore
export function useCellValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>(
  ...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>]
): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12] // prettier-ignore
export function useCellValues<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>(
  ...cells: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>]
): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13] // prettier-ignore
export function useCellValues(...cells: Out[]): unknown[] {
  const realm = useRealm()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, prefer-spread, @typescript-eslint/no-explicit-any
  return useCellValue(realm.combineCells.apply(realm, cells as any))
}

/**
 * Returns a function that publishes its passed argument into the specified node.
 * @example
 * ```tsx
 * const signal$ = Signal<number>(true, (r) => {
 *  r.sub(signal$, (value) => console.log(`${value} was published in the signal`))
 * })
 * //...
 * function MyComponent() {
 *  const pub = usePublisher(signal$);
 *  return <button onClick={() => pub(2)}>Push a value into the signal</button>
 * }
 * ```
 * @category Hooks
 */
export function usePublisher<T>(node: Inp<T>) {
  const realm = useRealm()
  realm.register(node)
  return React.useCallback(
    (value: T) => {
      realm.pub(node, value)
    },
    [realm, node]
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
 * @category Hooks
 */
export function useCell<T>(cell: NodeRef<T>): [T, (value: T) => void] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
  return [useCellValue<T>(cell), usePublisher<T>(cell as any)]
}
