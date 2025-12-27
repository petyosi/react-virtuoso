/**
 * @categoryDescription Nodes
 * The nodes functions are used to create node definitions.
 */

import type { O } from './operators'
import type { Distinct, Inp, NodeRef, Out } from './types'

import { link, pipe } from './combinators'
import { CELL_TYPE, nodeDefs$$ } from './globals'
import { addNodeInit } from './nodeUtils'
import { tap } from './utils'

/**
 * Defines a new **stateless node** and returns a reference to it.
 *
 * @param distinct - Controls duplicate value emission. Default is `true` (distinct).
 * Setting it to `true` will cause the node to emit only when the new value is different from the current value.
 * Pass `false` to make the cell  emit every time when published, even when the new value equals the current one.
 * Pass custom function `(prev: T \| undefined, next: T) => boolean` to define your own equality check for non-primitive types.
 *
 * @typeParam T - The type of values that the node emits and accepts.
 *
 * @returns A node reference that can be published to with values of type `T`.
 *
 * @example
 * ```ts
 * import { Engine, Stream } from '@virtuoso.dev/reactive-engine'
 *
 * // Basic usage with default distinct behavior
 * const stream$ = Stream<number>()
 * const engine = new Engine()
 *
 * engine.sub(stream$, (value) => console.log('received:', value))
 * engine.pub(stream$, 42) // logs 'received: 42'
 * engine.pub(stream$, 42) // no output (duplicate filtered)
 * engine.pub(stream$, 43) // logs 'received: 43'
 *
 * // With custom distinct comparator
 * const objStream$ = Stream<{id: number}>((a, b) => a?.id === b?.id)
 * engine.sub(objStream$, console.log)
 * engine.pub(objStream$, {id: 1}) // emits
 * engine.pub(objStream$, {id: 1}) // filtered (same id)
 * ```
 *
 * @remarks Streams are stateless - they don't hold values between publications.
 * Use {@link Cell} if you need stateful behavior with initial values.
 *
 * @category Nodes
 */
export function Stream<T>(distinct: Distinct<T> = true): NodeRef<T> {
  return tap(Symbol(), (id) => {
    nodeDefs$$.set(id, { distinct, type: 'stream' })
  }) as NodeRef<T>
}

/**
 * Defines a new **stateful node** and returns a reference to it.
 *
 * @param value - The initial value of the node. Stateful nodes always have a current value.
 * @param distinct - Controls duplicate value emission. Default is `true` (distinct).
 * Setting it to `true` will cause the node to emit only when the new value is different from the current value.
 * Pass `false` to make the cell  emit every time when published, even when the new value equals the current one.
 * Pass custom function `(prev: T \| undefined, next: T) => boolean` to define your own equality check for non-primitive types.
 *
 * @typeParam T - The type of values that the node stores, emits, and accepts.
 *
 * @returns A node reference that maintains state and can be published to with values of type `T`.
 *
 * @example
 * ```ts
 * import { Engine, Cell } from '@virtuoso.dev/reactive-engine'
 *
 * // Basic usage
 * const counter$ = Cell(0)
 * const engine = new Engine()
 *
 * console.log(engine.getValue(counter$)) // 0 (initial value)
 *
 * engine.sub(counter$, (value) => console.log('counter:', value))
 * engine.pub(counter$, 1) // logs 'counter: 1'
 * console.log(engine.getValue(counter$)) // 1 (updated value)
 *
 * // Distinct behavior (default)
 * engine.pub(counter$, 1) // no output (same value)
 * engine.pub(counter$, 2) // logs 'counter: 2'
 *
 * // Non-distinct cell
 * const alwaysEmit$ = Cell(0, false)
 * engine.sub(alwaysEmit$, console.log)
 * engine.pub(alwaysEmit$, 0) // emits even though it's the same value
 * ```
 *
 * @remarks Unlike RxJS `BehaviorSubject`, a cell does not immediately invoke its subscriptions
 * when subscribed to. It only emits values when published to, either directly or through
 * its relationships.
 *
 * @category Nodes
 */
export function Cell<T>(value: T, distinct: Distinct<T> = true): NodeRef<T> {
  return tap(Symbol(), (id) => {
    nodeDefs$$.set(id, { distinct, initial: value, type: CELL_TYPE })
  }) as NodeRef<T>
}

/**
 * Defines a new **stateless, valueless node** and returns a reference to it.
 *
 * @returns A node reference that can be published to without passing value to trigger its subscriptions.
 *
 * @example
 * ```ts
 * import { Engine, Trigger } from '@virtuoso.dev/reactive-engine'
 *
 * const trigger$ = Trigger()
 * const engine = new Engine()
 *
 * engine.sub(trigger$, () => console.log('triggered!'))
 * engine.pub(trigger$) // logs 'triggered!'
 * ```
 *
 * @remarks A trigger is useful for triggering side effects or coordinating actions without passing data.
 *
 * @category Nodes
 */
export function Trigger(): NodeRef<void> {
  return tap(Symbol(), (id) => {
    nodeDefs$$.set(id, { distinct: false, type: 'stream' })
  }) as NodeRef<void>
}

/**
 * Defines a new **stateful node**, links it to an existing node transform and returns a reference to it.

 * @param value - the initial value of the node.
 * @param source$ - a node reference to link to.
 * @param distinct - if true, the node will only emit values that are different from the previous value. Optionally, a custom distinct function can be provided if the node values are non-primitive.
 * @typeParam T - The type of values that the node emits/accepts.
 * @example
 * ```ts
 * import { e, Engine, Cell, DerivedCell } from '@virtuoso.dev/reactive-engine'
 *
 * const bar$ = Cell('bar')
 * const foo$ = DerivedCell('foo', e.pipe(bar$, (bar) => `foo${bar}`), true)
 * e.sub(foo$, (val) => console.log(val))
 *
 * const eng = new Engine()
 * eng.pub(bar$, '-bar') // the foo$ subscription will log 'foo-bar'
 * ```
 * @category Nodes
 */
export function DerivedCell<T>(value: T, source$: NodeRef<T>, distinct: Distinct<T> = true): NodeRef<T> {
  return tap(Symbol(), (id) => {
    nodeDefs$$.set(id, {
      distinct,
      initial: value,
      type: CELL_TYPE,
    })

    addNodeInit((r, node$) => {
      r.link(source$, node$)
    }, id as NodeRef<T>)
  }) as NodeRef<T>
}

/**
 * Creates a tuple of nodes &ndash; an input, and an output.
 * The output node transforms and emits the value of the input through the provided operator chain.
 * @typeParam T - The type of values that the input node will accept.
 * @returns A tuple of nodes, the first one is the input, and the second one is the output.
 * @param operators one or more operators that are chained to transform the input value.
 *
 *
 * @example
 * ```ts
 * import { e, Pipe } from '@virtuoso.dev/reactive-engine'
 *
 * const [input$, output$] = Pipe(e.map(value => value * 2))
 * e.sub(output$, (value) => console.log(value))
 *
 * const eng = new Engine()
 * eng.pub(input$, 2) // the subscription will log "4"
 * ```
 * @category Nodes
 */
export function Pipe<T>(...operators: O<unknown, unknown>[]): [Inp<T>, Out]
/** @hidden */
export function Pipe<T, O1>(o1: O<T, O1>): [Inp<T>, Out<O1>] // biome-ignore format: keep-one-liner
/** @hidden */
export function Pipe<T, O1, O2>(...o: [O<T, O1>, O<O1, O2>]): [Inp<T>, Out<O2>] // biome-ignore format: keep-one-liner
/** @hidden */
export function Pipe<T, O1, O2, O3>(...o: [O<T, O1>, O<O1, O2>, O<O2, O3>]): [Inp<T>, Out<O3>] // biome-ignore format: keep-one-liner
/** @hidden */
export function Pipe<T, O1, O2, O3, O4>(...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>]): [Inp<T>, Out<O4>] // biome-ignore format: keep-one-liner
/** @hidden */
export function Pipe<T, O1, O2, O3, O4, O5>(...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>]): [Inp<T>, Out<O5>] // biome-ignore format: keep-one-liner
/** @hidden */
export function Pipe<T, O1, O2, O3, O4, O5, O6>(...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>]): [Inp<T>, Out<O6>] // biome-ignore format: keep-one-liner
/** @hidden */
export function Pipe<T, O1, O2, O3, O4, O5, O6, O7>(
  ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>, O<O6, O7>]
): [Inp<T>, Out<O7>] // biome-ignore format: keep-one-liner
/** @hidden */
export function Pipe<T, O1, O2, O3, O4, O5, O6, O7, O8>(
  ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>, O<O6, O7>, O<O7, O8>]
): [Inp<T>, Out<O8>] // biome-ignore format: keep-one-liner
/** @hidden */
export function Pipe<T, O1, O2, O3, O4, O5, O6, O7, O8, O9>(
  ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>, O<O6, O7>, O<O7, O8>, O<O8, O9>]
): [Inp<T>, Out<O9>] // biome-ignore format: keep-one-liner
export function Pipe<T>(...operators: O<unknown, unknown>[]): [Inp<T>, Out] {
  const input$ = Stream<T>()
  const output$ = Stream<unknown>()
  link(pipe(input$, ...operators), output$)

  return [input$, output$]
}
