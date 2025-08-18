import { addNodeInit } from './globals'
import { Signal } from './nodes'
import { Subscription } from './types'
import { Out } from './types'
import { Inp } from './types'
import { tap } from './utils'

function combine<T1>(...nodes: [Out<T1>]): Out<T1>; // prettier-ignore
function combine<T1, T2>(...nodes: [Out<T1>, Out<T2>]): Out<[T1, T2]>; // prettier-ignore
function combine<T1, T2, T3>(...nodes: [Out<T1>, Out<T2>, Out<T3>]): Out<[T1, T2, T3]>; // prettier-ignore
function combine<T1, T2, T3, T4>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>]): Out<[T1, T2, T3, T4]>; // prettier-ignore
function combine<T1, T2, T3, T4, T5>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>]): Out<[T1, T2, T3, T4, T5]>; // prettier-ignore
function combine<T1, T2, T3, T4, T5, T6>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>]): Out<[T1, T2, T3, T4, T5, T6]>; // prettier-ignore
function combine<T1, T2, T3, T4, T5, T6, T7>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>]): Out<[T1, T2, T3, T4, T5, T6, T7]>; // prettier-ignore
function combine<T1, T2, T3, T4, T5, T6, T7, T8>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8]>; // prettier-ignore
function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>; // prettier-ignore
function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>; // prettier-ignore
function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11]>; // prettier-ignore
function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12]>; // prettier-ignore
function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13]>; // prettier-ignore
function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14]>; // prettier-ignore
function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15]>; // prettier-ignore
function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16]>; // prettier-ignore
function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>, Out<T17>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17]>; // prettier-ignore
function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>, Out<T17>, Out<T18>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18]>; // prettier-ignore
function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>, Out<T14>, Out<T15>, Out<T16>, Out<T17>, Out<T18>, Out<T19>]): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19]>; // prettier-ignore
function combine(...nodes: Out[]): Out
function combine(...nodes: Out[]): Out {
  return tap(Signal<unknown>(), (sink$) => {
    addNodeInit(nodes[0], (r) => {
      // @ts-expect-error this is fine
      // eslint-disable-next-line prefer-spread
      r.link(r.combine.apply(r, nodes), sink$)
    })
  })
}

function subMultiple<T1>(nodes: [Out<T1>], subscription: Subscription<[T1]>): void
function subMultiple<T1, T2>(nodes: [Out<T1>, Out<T2>], subscription: Subscription<[T1, T2]>): void
function subMultiple<T1, T2, T3>(nodes: [Out<T1>, Out<T2>, Out<T3>], subscription: Subscription<[T1, T2, T3]>): void
function subMultiple<T1, T2, T3, T4>(nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>], subscription: Subscription<[T1, T2, T3, T4]>): void
function subMultiple<T1, T2, T3, T4, T5>( nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>], subscription: Subscription<[T1, T2, T3, T4, T5]>): void // prettier-ignore
function subMultiple<T1, T2, T3, T4, T5, T6>( nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>], subscription: Subscription<[T1, T2, T3, T4, T5, T6]>): void // prettier-ignore
function subMultiple<T1, T2, T3, T4, T5, T6, T7>( nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>], subscription: Subscription<[T1, T2, T3, T4, T5, T6, T7]>): void // prettier-ignore
function subMultiple<T1, T2, T3, T4, T5, T6, T7, T8>( nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>], subscription: Subscription<[T1, T2, T3, T4, T5, T6, T7, T8]>): void // prettier-ignore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function subMultiple(nodes: Out[], subscription: Subscription<any>): void
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function subMultiple(nodes: Out[], subscription: Subscription<any>): void {
  addNodeInit(nodes[0], (r) => {
    r.subMultiple(nodes, subscription)
  })
}

export const R = {
  changeWith<T, K>(cell: Inp<T>, source: Out<K>, map: (cellValue: T, signalValue: K) => T) {
    addNodeInit(source, (r) => {
      r.changeWith(cell, source, map)
    })
  },
  /**
   * Combines the values from multiple nodes into a single node that emits an array of the latest values of the nodes.
   *
   * When one of the source nodes emits a value, the combined node emits an array of the latest values from each node.
   */
  combine,
  link<T>(source: Out<T>, sink: Inp<T>) {
    addNodeInit(source, (r) => {
      r.link(source, sink)
    })
  },
  singletonSub<T>(node: Out<T>, subscription: Subscription<T>) {
    addNodeInit(node, (r) => {
      r.singletonSub(node, subscription)
    })
  },
  sub<T>(node: Out<T>, subscription: Subscription<T>) {
    addNodeInit(node, (r) => {
      r.sub(node, subscription)
    })
  },
  subMultiple,
}
