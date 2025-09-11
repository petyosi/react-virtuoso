import { Engine } from './engine'
import { CELL_TYPE, nodeDefs$$ } from './globals'
import { Distinct, NodeInit, NodeRef } from './types'
import { noop, tap } from './utils'

/**
 * Defines a new **stateless, valueless node** and returns a reference to it.
 * Once a realm instance publishes or subscribes to the node, an instance of that node it will be registered in the realm.
 * @param init - an optional function that will be called when the node is registered in a realm. Can be used to create subscriptions and define relationships to other nodes. Any referred nodes will be registered in the realm automatically.
 * @example
 * ```ts
 * const foo$ = Action((r) => {
 *   r.sub(foo$, () => console.log('foo action'))
 * })
 * const r = new Realm()
 * r.pub(foo$)
 * ```
 * @category Nodes
 * @remark An action is just a signal with `void` value. It can be used to trigger side effects.
 */
export function Action(init: NodeInit<void> = noop): NodeRef<void> {
  return tap(Symbol(), (id) => {
    nodeDefs$$.set(id, { distinct: false, init, type: 'signal' })
  }) as NodeRef<void>
}

/**
 * Defines a new **stateless node** and returns a reference to it.
 * Once a realm instance publishes or subscribes to the node, an instance of that node it will be registered in the realm.
 * @param init - an optional function that will be called when the node is registered in a realm. Can be used to create subscriptions and define relationships to other nodes. Any referred nodes will be registered in the realm automatically.
 * @param distinct - true by default. The node emits values that are different from the previous value. Optionally, a custom distinct function can be provided if the node values are non-primitive.
 * @example
 * ```ts
 * const foo$ = Signal<string>(true, (r) => {
 *   r.sub(foo$, console.log)
 * })
 * const r = new Realm()
 * r.pub(foo$, 'bar') // the subscription will log 'bar'
 * ```
 * @category Nodes
 */

export function Signal<T>(init: NodeInit<T> = noop, distinct: Distinct<T> = false): NodeRef<T> {
  return tap(Symbol(), (id) => {
    nodeDefs$$.set(id, { distinct, init, type: 'signal' })
  }) as NodeRef<T>
}

/**
 * Defines a new **stateful node** and returns a reference to it.
 * Once a realm instance publishes or subscribes to the node, an instance of that node it will be registered in the realm.
 * @param value - the initial value of the node. Stateful nodes always have a value.
 * @param init - an optional function that will be called when the node is registered in a realm. Can be used to create subscriptions and define relationships to other nodes. Any referred nodes will be registered in the realm automatically.
 * @param distinct - if true, the node will only emit values that are different from the previous value. Optionally, a custom distinct function can be provided if the node values are non-primitive.
 * @example
 * ```ts
 * const foo$ = Cell('foo',  (r) => {
 *   r.sub(foo$, console.log)
 * }, true)
 * const r = new Realm()
 * r.pub(foo$, 'bar') // the subscription will log 'bar'
 * ```
 * @remarks Unlike the RxJS `BehaviorSubject`, a stateful node does not immediately invoke its subscriptions when subscribed to. It only emits values when you publish something in it, either directly or through its relationships.
 * If you need to get the current value of a stateful node, use {@link Engine.getValue}.
 * @category Nodes
 */

export function Cell<T>(value: T, init: (r: Engine) => void = noop, distinct: Distinct<T> = true): NodeRef<T> {
  return tap(Symbol(), (id) => {
    nodeDefs$$.set(id, { distinct, init, initial: value, type: CELL_TYPE })
  }) as NodeRef<T>
}

/**
 * Defines a new **stateful node**, links it to an existing node transform and returns a reference to it.
 * Once a realm instance publishes or subscribes to the node, an instance of that node it will be registered in the realm.
 * @param value - the initial value of the node. Stateful nodes always have a value.
 * @param linkFn - an function that will be called when the node is registered in a realm. Should return a node reference to link to.
 * @param distinct - if true, the node will only emit values that are different from the previous value. Optionally, a custom distinct function can be provided if the node values are non-primitive.
 * @example
 * ```ts
 * const bar$ = Cell('bar')
 * const foo$ = DerivedCell('foo',  (r, cell$) => {
 * r.sub(cell$, console.log)
 * return r.pipe(bar$, (bar) => `foo${bar}`)
 * }, true)
 * const r = new Realm()
 * r.pub(bar$, '-bar') // the subscription will log 'bar'
 * ```
 * @category Nodes
 */
export function DerivedCell<T>(value: T, linkFn: (r: Engine, cell: NodeRef<T>) => NodeRef<T>, distinct: Distinct<T> = true): NodeRef<T> {
  return tap(Symbol(), (id) => {
    nodeDefs$$.set(id, {
      distinct,
      init: (r, node$) => {
        r.link(linkFn(r, node$), node$)
      },
      initial: value,
      type: CELL_TYPE,
    })
  }) as NodeRef<T>
}
