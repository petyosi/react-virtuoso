import { Engine } from './engine'
import { addNodeInit, CELL_TYPE, nodeDefs$$ } from './globals'
import { Distinct, NodeRef } from './types'
import { tap } from './utils'

/**
 * Defines a new **stateless, valueless node** and returns a reference to it.
 * Once an engine instance publishes or subscribes to the node, an instance of that node it will be registered in the engine.
 * @param init - an optional function that will be called when the node is registered in an engine. Can be used to create subscriptions and define relationships to other nodes. Any referred nodes will be registered in the engine automatically.
 * @example
 * ```ts
 * const foo$ = Action((r) => {
 *   r.sub(foo$, () => console.log('foo action'))
 * })
 * const r = new Engine()
 * r.pub(foo$)
 * ```
 * @category Nodes
 * @remark An action is just a signal with `void` value. It can be used to trigger side effects.
 */
export function Action(): NodeRef<void> {
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
 * const foo$ = DerivedCell('foo',  (r, cell$) => {
 * r.sub(cell$, console.log)
 * return r.pipe(bar$, (bar) => `foo${bar}`)
 * }, true)
 * const r = new Engine()
 * r.pub(bar$, '-bar') // the subscription will log 'bar'
 * ```
 * @category Nodes
 */
export function DerivedCell<T>(value: T, linkFn: (r: Engine, cell: NodeRef<T>) => NodeRef<T>, distinct: Distinct<T> = true): NodeRef<T> {
  return tap(Symbol(), (id) => {
    nodeDefs$$.set(id, {
      distinct,
      initial: value,
      type: CELL_TYPE,
    })

    addNodeInit(id as NodeRef<T>, (r, node$) => {
      r.link(linkFn(r, node$), node$)
    })
  }) as NodeRef<T>
}
