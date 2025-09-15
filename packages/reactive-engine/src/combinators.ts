/* eslint-disable @typescript-eslint/no-explicit-any */
import type { O } from './operators'
import type { Inp, NodeRef, Out, Subscription } from './types'

import { Stream } from './nodes'
import { addNodeInit } from './nodeUtils'
import { tap } from './utils'

/**
 * Combines the values from multiple nodes into a single node that emits an array of the latest values of the nodes.
 *
 * When one of the source nodes emits a value, the combined node emits an array of the latest values from each node.
 * @typeParam T1 - The type of values that the first node will emit.
 * @category Combinators
 */
export function combine(...nodes: Out[]): Out
/** @hidden */
export function combine<T1>(...nodes: [Out<T1>]): Out<T1>; // prettier-ignore
/** @hidden */
export function combine<T1, T2>(...nodes: [Out<T1>, Out<T2>]): Out<[T1, T2]>; // prettier-ignore
/** @hidden */
export function combine<T1, T2, T3>(...nodes: [Out<T1>, Out<T2>, Out<T3>]): Out<[T1, T2, T3]>; // prettier-ignore
/** @hidden */
export function combine<T1, T2, T3, T4>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>]): Out<[T1, T2, T3, T4]>; // prettier-ignore
/** @hidden */
export function combine<T1, T2, T3, T4, T5>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>]): Out<[T1, T2, T3, T4, T5]>; // prettier-ignore
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>]): Out<[T1, T2, T3, T4, T5, T6]>; // prettier-ignore
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6, T7>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>]): Out<[T1, T2, T3, T4, T5, T6, T7]>; // prettier-ignore
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6, T7, T8>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8]>; // prettier-ignore
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>; // prettier-ignore
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>; // prettier-ignore
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11]>; // prettier-ignore
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12]>; // prettier-ignore
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13]>; // prettier-ignore
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14]>; // prettier-ignore
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15]>; // prettier-ignore
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16]>; // prettier-ignore
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>, Out<T17>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17]>; // prettier-ignore
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>, Out<T17>, Out<T18>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18]>; // prettier-ignore
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>, Out<T17>, Out<T18>, Out<T19>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19]>; // prettier-ignore
export function combine(...nodes: Out[]): Out {
  return tap(Stream<unknown>(), (sink$) => {
    addNodeInit(nodes[0], (r) => {
      // eslint-disable-next-line prefer-spread
      r.link(r.combine.apply(r, nodes), sink$)
    })
  })
}

/**
 * Subscribes to multiple nodes at once. If any of the nodes emits a value, the subscription will be called with an array of the latest values from each node.
 * If the nodes change within a single execution cycle, the subscription will be called only once with the final node values.
 *
 * @typeParam T1 - The type of values that the first node will emit.
 * @category Combinators
 *
 * @example
 * ```ts
 * const foo$ = Cell('foo')
 * const bar$ = Cell('bar')
 *
 * const trigger$ = Stream<number>(true, (r) => {
 *   r.link(r.pipe(trigger$, map(i => `foo${i}`)), foo$)
 *   r.link(r.pipe(trigger$, map(i => `bar${i}`)), bar$)
 * })
 *
 * const r = new Engine()
 * r.subMultiple([foo$, bar$], ([foo, bar]) => console.log(foo, bar))
 * r.pub(trigger$, 2)
 * ```
 */
export function subMultiple(nodes: Out[], subscription: Subscription<any>): void
/** @hidden */
export function subMultiple<T1>(nodes: [Out<T1>], subscription: Subscription<[T1]>): void
/** @hidden */
export function subMultiple<T1, T2>(nodes: [Out<T1>, Out<T2>], subscription: Subscription<[T1, T2]>): void
/** @hidden */
export function subMultiple<T1, T2, T3>(nodes: [Out<T1>, Out<T2>, Out<T3>], subscription: Subscription<[T1, T2, T3]>): void
/** @hidden */
export function subMultiple<T1, T2, T3, T4>(nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>], subscription: Subscription<[T1, T2, T3, T4]>): void
/** @hidden */
export function subMultiple<T1, T2, T3, T4, T5>( nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>], subscription: Subscription<[T1, T2, T3, T4, T5]>): void // prettier-ignore
/** @hidden */
export function subMultiple<T1, T2, T3, T4, T5, T6>( nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>], subscription: Subscription<[T1, T2, T3, T4, T5, T6]>): void // prettier-ignore
/** @hidden */
export function subMultiple<T1, T2, T3, T4, T5, T6, T7>( nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>], subscription: Subscription<[T1, T2, T3, T4, T5, T6, T7]>): void // prettier-ignore
/** @hidden */
export function subMultiple<T1, T2, T3, T4, T5, T6, T7, T8>( nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>], subscription: Subscription<[T1, T2, T3, T4, T5, T6, T7, T8]>): void // prettier-ignore

export function subMultiple(nodes: Out[], subscription: Subscription<any>): void {
  addNodeInit(nodes[0], (r) => {
    r.subMultiple(nodes, subscription)
  })
}

/**
 * Creates a new node that emits the values of the source node transformed through the specified operators.
 *
 * @typeParam T - The type of values that the source node will emit.
 * @category Combinators
 *
 * @example
 * ```ts
 * const stream = Stream<number>(true, (r) => {
 *   const streamPlusOne = r.pipe(stream, map(i => i + 1))
 *   r.sub(streamPlusOne, console.log)
 * })
 * const r = new Engine()
 * r.pub(stream, 1)
 * ```
 */
export function pipe<T>(source$: Out<T>, ...operators: O<unknown, unknown>[]): NodeRef
/** @hidden */
export function pipe<T>(s$: Out<T>): NodeRef<T> // prettier-ignore
/** @hidden */
export function pipe<T, O1>(s: Out<T>, o1: O<T, O1>): NodeRef<O1> // prettier-ignore
/** @hidden */
export function pipe<T, O1, O2>(s: Out<T>, ...o: [O<T, O1>, O<O1, O2>]): NodeRef<O2> // prettier-ignore
/** @hidden */
export function pipe<T, O1, O2, O3>(s: Out<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>]): NodeRef<O3> // prettier-ignore
/** @hidden */
export function pipe<T, O1, O2, O3, O4>(s: Out<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>]): NodeRef<O4> // prettier-ignore
/** @hidden */
export function pipe<T, O1, O2, O3, O4, O5>(s: Out<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>]): NodeRef<O5> // prettier-ignore
/** @hidden */
export function pipe<T, O1, O2, O3, O4, O5, O6>(s: Out<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>]): NodeRef<O6> // prettier-ignore
/** @hidden */
export function pipe<T, O1, O2, O3, O4, O5, O6, O7>( s: Out<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>, O<O6, O7>]): NodeRef<O7> // prettier-ignore
/** @hidden */
export function pipe<T, O1, O2, O3, O4, O5, O6, O7, O8>( s: Out<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>, O<O6, O7>, O<O7, O8>]): NodeRef<O8> // prettier-ignore
/** @hidden */
export function pipe<T, O1, O2, O3, O4, O5, O6, O7, O8, O9>( s: Out<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>, O<O6, O7>, O<O7, O8>, O<O8, O9>]): NodeRef<O9> // prettier-ignore
export function pipe<T>(source$: Out<T>, ...operators: O<unknown, unknown>[]): NodeRef {
  return tap(Stream<unknown>(), (sink$) => {
    addNodeInit(source$, (r) => {
      r.link(r.pipe.apply(r, [source$, ...operators]), sink$)
    })
  })
}

/**
 * Convenient for mutation of cells that contian non-primitive values (e.g. arrays, or objects).
 * Specifies that the cell value should be changed when source emits, with the result of the map callback parameter.
 * the map parameter gets called with the current value of the cell and the value published through the source.
 * @typeParam T - the type of the cell value.
 * @typeParam K - the type of the value published through the source.
 *
 * @category Combinators
 *
 * @example
 * ```ts
 * const items$ = Cell<string[]([])
 * const addItem$ = Stream<string>(false, (r) => {
 *   r.changeWith(items$, addItem$, (items, item) => [...items, item])
 * })
 * const r = new Engine()
 * r.pub(addItem$, 'foo')
 * r.pub(addItem$, 'bar')
 * r.getValue(items$) // ['foo', 'bar']
 * ```
 */
export function changeWith<T, K>(cell: Inp<T>, source: Out<K>, map: (cellValue: T, streamValue: K) => T) {
  addNodeInit(source, (r) => {
    r.changeWith(cell, source, map)
  })
}

/**
 * Links the output of a node to the input of another node.
 * @typeParam T - The type of values that the nodes will emit.
 * @category Combinators
 */
export function link<T>(source: Out<T>, sink: Inp<T>) {
  addNodeInit(source, (r) => {
    r.link(source, sink)
  })
}

/**
 * Subscribes to the values published in the referred node.
 * @param node - the cell/stream to subscribe to.
 * @param subscription - the callback to execute when the node receives a new value.
 * @returns a function that, when called, will cancel the subscription.
 * @typeParam T - The type of values that the node will emit.
 *
 * @category Combinators
 *
 * @example
 * ```ts
 * const stream = Stream<number>()
 * const r = new Engine()
 * const unsub = r.sub(stream, console.log)
 * r.pub(stream, 2)
 * unsub()
 * r.pub(stream, 3)
 * ```
 */
export function sub<T>(node: Out<T>, subscription: Subscription<T>) {
  addNodeInit(node, (r) => {
    r.sub(node, subscription)
  })
}

/**
 * Subscribes exclusively to values in the referred node within an engine instance.
 * Calling this multiple times on a single node will remove the previous subscription created through `singletonSub`.
 * Subscriptions created through `sub` are not affected.
 * @returns a function that, when called, will cancel the subscription.
 * @typeParam T - The type of values that the node will emit.
 *
 * @category Combinators
 *
 * @example
 * ```ts
 * const stream = Stream<number>()
 * const r = new Engine()
 * // console.log will run only once.
 * r.singletonSub(stream, console.log)
 * r.singletonSub(stream, console.log)
 * r.singletonSub(stream, console.log)
 * r.pub(stream, 2)
 * ```
 */
export function singletonSub<T>(node: Out<T>, subscription: Subscription<T>) {
  addNodeInit(node, (r) => {
    r.singletonSub(node, subscription)
  })
}
