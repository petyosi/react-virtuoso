import type { O } from './operators'
import type { Distinct, Inp, NodeRef, Out } from './types'

import { link, pipe } from './combinators'
import { CELL_TYPE, nodeDefs$$ } from './globals'
import { addNodeInit } from './nodeUtils'
import { tap } from './utils'

/**
 * Defines a new **stateless, valueless node** and returns a reference to it.
 * Once an engine instance publishes or subscribes to the node, an instance of that node it will be registered in the engine.
 * @param init - an optional function that will be called when the node is registered in an engine. Can be used to create subscriptions and define relationships to other nodes. Any referred nodes will be registered in the engine automatically.
 * @example
 * ```ts
 * const foo$ = Trigger()
 *
 * e.sub(foo$, () => console.log('foo trigger'))
 *
 * const r = new Engine()
 * r.pub(foo$)
 * ```
 * @category Nodes
 * @remark A trigger is just a signal with `void` value. It can be used to trigger side effects.
 */
export function Trigger(): NodeRef<void> {
  return tap(Symbol(), (id) => {
    nodeDefs$$.set(id, { distinct: false, type: 'stream' })
  }) as NodeRef<void>
}

/**
 * Defines a new **stateless node** and returns a reference to it.
 * Once an engine instance publishes or subscribes to the node, an instance of that node it will be registered in the engine.
 * @param init - an optional function that will be called when the node is registered in an engine. Can be used to create subscriptions and define relationships to other nodes. Any referred nodes will be registered in the engine automatically.
 * @param distinct - true by default. The node emits values that are different from the previous value. Optionally, a custom distinct function can be provided if the node values are non-primitive.
 * @example
 * ```ts
 * const foo$ = Stream<string>(true, (r) => {
 *   r.sub(foo$, console.log)
 * })
 * const r = new Engine()
 * r.pub(foo$, 'bar') // the subscription will log 'bar'
 * ```
 * @category Nodes
 */

export function Stream<T>(distinct: Distinct<T> = true): NodeRef<T> {
  return tap(Symbol(), (id) => {
    nodeDefs$$.set(id, { distinct, type: 'stream' })
  }) as NodeRef<T>
}

/**
 * Defines a new **stateful node** and returns a reference to it.
 * Once an engine instance publishes or subscribes to the node, an instance of that node it will be registered in the engine.
 * @param value - the initial value of the node. Stateful nodes always have a value.
 * @param init - an optional function that will be called when the node is registered in an engine. Can be used to create subscriptions and define relationships to other nodes. Any referred nodes will be registered in the engine automatically.
 * @param distinct - if true, the node will only emit values that are different from the previous value. Optionally, a custom comparator function can be provided if the node values are non-primitive.
 * @example
 * ```ts
 * const foo$ = Cell('foo',  (r) => {
 *   r.sub(foo$, console.log)
 * }, true)
 * const r = new Engine()
 * r.pub(foo$, 'bar') // the subscription will log 'bar'
 * ```
 * @remarks Unlike the RxJS `BehaviorSubject`, a stateful node does not immediately invoke its subscriptions when subscribed to. It only emits values when you publish something in it, either directly or through its relationships.
 * If you need to get the current value of a stateful node, use {@link Engine.getValue}.
 * @category Nodes
 */

export function Cell<T>(value: T, distinct: Distinct<T> = true): NodeRef<T> {
  return tap(Symbol(), (id) => {
    nodeDefs$$.set(id, { distinct, initial: value, type: CELL_TYPE })
  }) as NodeRef<T>
}

/**
 * Defines a new **stateful node**, links it to an existing node transform and returns a reference to it.
 * Once an engine instance publishes or subscribes to the node, an instance of that node it will be registered in the engine.
 * @param value - the initial value of the node. Stateful nodes always have a value.
 * @param linkFn - an function that will be called when the node is registered in an engine. Should return a node reference to link to.
 * @param distinct - if true, the node will only emit values that are different from the previous value. Optionally, a custom distinct function can be provided if the node values are non-primitive.
 * @example
 * ```ts
 * const bar$ = Cell('bar')
 * const foo$ = DerivedCell('foo', e.pipe(bar$, (bar) => `foo${bar}`), true)
 *
 * const r = new Engine()
 * r.pub(bar$, '-bar') // the subscription will log 'bar'
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

    addNodeInit(id as NodeRef<T>, (r, node$) => {
      r.link(source$, node$)
    })
  }) as NodeRef<T>
}

export function Pipe<T, O1>( o1: O<T, O1>): [Inp<T>, Out<O1>] // prettier-ignore
export function Pipe<T, O1, O2>( ...o: [O<T, O1>, O<O1, O2>]): [Inp<T>, Out<O2>] // prettier-ignore
export function Pipe<T, O1, O2, O3>( ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>]): [Inp<T>, Out<O3>] // prettier-ignore
export function Pipe<T, O1, O2, O3, O4>( ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>]): [Inp<T>, Out<O4>] // prettier-ignore
export function Pipe<T, O1, O2, O3, O4, O5>( ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>]): [Inp<T>, Out<O5>] // prettier-ignore
export function Pipe<T, O1, O2, O3, O4, O5, O6>( ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>]): [Inp<T>, Out<O6>] // prettier-ignore
export function Pipe<T, O1, O2, O3, O4, O5, O6, O7>(  ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>, O<O6, O7>]): [Inp<T>, Out<O7>] // prettier-ignore
export function Pipe<T, O1, O2, O3, O4, O5, O6, O7, O8>(  ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>, O<O6, O7>, O<O7, O8>]): [Inp<T>, Out<O8>] // prettier-ignore
export function Pipe<T, O1, O2, O3, O4, O5, O6, O7, O8, O9>( ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>, O<O6, O7>, O<O7, O8>, O<O8, O9>]): [Inp<T>, Out<O9>] // prettier-ignore
export function Pipe<T>(...operators: O<unknown, unknown>[]): [Inp<T>, Out]
export function Pipe<T>(...operators: O<unknown, unknown>[]): [Inp<T>, Out] {
  const input$ = Stream<T>()
  const output$ = Stream<unknown>()
  link(pipe(input$, ...operators), output$)

  return [input$, output$]
}
