import type { O } from './operators'
import type { Inp, NodeRef, Out, Subscription } from './types'

import { Stream } from './nodes'
import { addNodeInit } from './nodeUtils'
import { tap } from './utils'

/** @hidden */
export function combine<T1>(...nodes: [Out<T1>]): Out<T1> // biome-ignore format: keep-one-liner
/** @hidden */
export function combine<T1, T2>(...nodes: [Out<T1>, Out<T2>]): Out<[T1, T2]> // biome-ignore format: keep-one-liner
/** @hidden */
export function combine<T1, T2, T3>(...nodes: [Out<T1>, Out<T2>, Out<T3>]): Out<[T1, T2, T3]> // biome-ignore format: keep-one-liner
/** @hidden */
export function combine<T1, T2, T3, T4>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>]): Out<[T1, T2, T3, T4]> // biome-ignore format: keep-one-liner
/** @hidden */
export function combine<T1, T2, T3, T4, T5>(...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>]): Out<[T1, T2, T3, T4, T5]> // biome-ignore format: keep-one-liner
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6>(
  ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>]
): Out<[T1, T2, T3, T4, T5, T6]> // biome-ignore format: keep-one-liner
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6, T7>(
  ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>]
): Out<[T1, T2, T3, T4, T5, T6, T7]> // biome-ignore format: keep-one-liner
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6, T7, T8>(
  ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>]
): Out<[T1, T2, T3, T4, T5, T6, T7, T8]> // biome-ignore format: keep-one-liner
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
  ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>]
): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9]> // biome-ignore format: keep-one-liner
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
  ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>]
): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]> // biome-ignore format: keep-one-liner
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(
  ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>]
): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11]> // biome-ignore format: keep-one-liner
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>(
  ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>]
): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12]> // biome-ignore format: keep-one-liner
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>(
  ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>, Out<T9>, Out<T10>, Out<T11>, Out<T12>, Out<T13>]
): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13]> // biome-ignore format: keep-one-liner
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14>(
  ...nodes: [
    Out<T1>,
    Out<T2>,
    Out<T3>,
    Out<T4>,
    Out<T5>,
    Out<T6>,
    Out<T7>,
    Out<T8>,
    Out<T9>,
    Out<T10>,
    Out<T11>,
    Out<T12>,
    Out<T13>,
    Out<T14>,
  ]
): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14]> // biome-ignore format: keep-one-liner
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>(
  ...nodes: [
    Out<T1>,
    Out<T2>,
    Out<T3>,
    Out<T4>,
    Out<T5>,
    Out<T6>,
    Out<T7>,
    Out<T8>,
    Out<T9>,
    Out<T10>,
    Out<T11>,
    Out<T12>,
    Out<T13>,
    Out<T14>,
    Out<T15>,
  ]
): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15]> // biome-ignore format: keep-one-liner
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16>(
  ...nodes: [
    Out<T1>,
    Out<T2>,
    Out<T3>,
    Out<T4>,
    Out<T5>,
    Out<T6>,
    Out<T7>,
    Out<T8>,
    Out<T9>,
    Out<T10>,
    Out<T11>,
    Out<T12>,
    Out<T13>,
    Out<T14>,
    Out<T15>,
    Out<T16>,
  ]
): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16]> // biome-ignore format: keep-one-liner
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17>(
  ...nodes: [
    Out<T1>,
    Out<T2>,
    Out<T3>,
    Out<T4>,
    Out<T5>,
    Out<T6>,
    Out<T7>,
    Out<T8>,
    Out<T9>,
    Out<T10>,
    Out<T11>,
    Out<T12>,
    Out<T13>,
    Out<T14>,
    Out<T15>,
    Out<T16>,
    Out<T17>,
  ]
): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17]> // biome-ignore format: keep-one-liner
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18>(
  ...nodes: [
    Out<T1>,
    Out<T2>,
    Out<T3>,
    Out<T4>,
    Out<T5>,
    Out<T6>,
    Out<T7>,
    Out<T8>,
    Out<T9>,
    Out<T10>,
    Out<T11>,
    Out<T12>,
    Out<T13>,
    Out<T14>,
    Out<T15>,
    Out<T16>,
    Out<T17>,
    Out<T18>,
  ]
): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18]> // biome-ignore format: keep-one-liner
/** @hidden */
export function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19>(
  ...nodes: [
    Out<T1>,
    Out<T2>,
    Out<T3>,
    Out<T4>,
    Out<T5>,
    Out<T6>,
    Out<T7>,
    Out<T8>,
    Out<T9>,
    Out<T10>,
    Out<T11>,
    Out<T12>,
    Out<T13>,
    Out<T14>,
    Out<T15>,
    Out<T16>,
    Out<T17>,
    Out<T18>,
    Out<T19>,
  ]
): Out<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19]> // biome-ignore format: keep-one-liner
export function combine(...nodes: Out[]): Out
/**
 * Combines the values from multiple nodes into a single node that emits an array of the latest values of the nodes.
 * This function is overloaded to support up to 19 nodes with proper type inference.
 *
 * @param nodes - The nodes to combine. Can be any number of output nodes.
 *
 * @returns A new node that emits an array containing the latest values from all input nodes.
 * When any input node emits, the combined node emits an array of all current values.
 * For a single node, returns an array with that node's value. For multiple nodes,
 * returns a tuple array maintaining the order of input nodes.
 *
 * @typeParam T1, T2, ... - The types of values that each input node emits.
 *
 * @example
 * ```ts
 * import { Engine, Cell, combine } from '@virtuoso.dev/reactive-engine'
 *
 * const cell1$ = Cell(10)
 * const cell2$ = Cell('hello')
 * const combined$ = combine(cell1$, cell2$)
 * const engine = new Engine()
 *
 * engine.sub(combined$, (values) => console.log(values))
 * engine.pub(cell1$, 20) // logs [20, 'hello']
 * engine.pub(cell2$, 'world') // logs [20, 'world']
 * ```
 *
 * @category Combinators
 */
export function combine(...nodes: Out[]): Out {
  return tap(Stream<unknown>(), (sink$) => {
    if (nodes.length > 0) {
      addNodeInit(
        (r) => {
          r.link(r.combine(...nodes), sink$)
        },
        ...nodes
      )
    }
  })
}

/** @hidden */
export function merge<T1>(s1: Out<T1>): Out<T1> // biome-ignore format: keep-one-liner
/** @hidden */
export function merge<T1, T2>(s1: Out<T1>, s2: Out<T2>): Out<T1 | T2> // biome-ignore format: keep-one-liner
/** @hidden */
export function merge<T1, T2, T3>(s1: Out<T1>, s2: Out<T2>, s3: Out<T3>): Out<T1 | T2 | T3> // biome-ignore format: keep-one-liner
/** @hidden */
export function merge<T1, T2, T3, T4>(s1: Out<T1>, s2: Out<T2>, s3: Out<T3>, s4: Out<T4>): Out<T1 | T2 | T3 | T4> // biome-ignore format: keep-one-liner
/** @hidden */
export function merge<T1, T2, T3, T4, T5>(s1: Out<T1>, s2: Out<T2>, s3: Out<T3>, s4: Out<T4>, s5: Out<T5>): Out<T1 | T2 | T3 | T4 | T5> // biome-ignore format: keep-one-liner
/** @hidden */
export function merge<T1, T2, T3, T4, T5, T6>(
  s1: Out<T1>,
  s2: Out<T2>,
  s3: Out<T3>,
  s4: Out<T4>,
  s5: Out<T5>,
  s6: Out<T6>
): Out<T1 | T2 | T3 | T4 | T5 | T6> // biome-ignore format: keep-one-liner
/** @hidden */
export function merge<T1, T2, T3, T4, T5, T6, T7>(
  s1: Out<T1>,
  s2: Out<T2>,
  s3: Out<T3>,
  s4: Out<T4>,
  s5: Out<T5>,
  s6: Out<T6>,
  s7: Out<T7>
): Out<T1 | T2 | T3 | T4 | T5 | T6 | T7> // biome-ignore format: keep-one-liner
/** @hidden */
export function merge<T1, T2, T3, T4, T5, T6, T7, T8>(
  s1: Out<T1>,
  s2: Out<T2>,
  s3: Out<T3>,
  s4: Out<T4>,
  s5: Out<T5>,
  s6: Out<T6>,
  s7: Out<T7>,
  s8: Out<T8>
): Out<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8> // biome-ignore format: keep-one-liner
/** @hidden */
export function merge<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
  s1: Out<T1>,
  s2: Out<T2>,
  s3: Out<T3>,
  s4: Out<T4>,
  s5: Out<T5>,
  s6: Out<T6>,
  s7: Out<T7>,
  s8: Out<T8>,
  s9: Out<T9>
): Out<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9> // biome-ignore format: keep-one-liner
/** @hidden */
export function merge<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
  s1: Out<T1>,
  s2: Out<T2>,
  s3: Out<T3>,
  s4: Out<T4>,
  s5: Out<T5>,
  s6: Out<T6>,
  s7: Out<T7>,
  s8: Out<T8>,
  s9: Out<T9>,
  s10: Out<T10>
): Out<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10> // biome-ignore format: keep-one-liner
/** @hidden */
export function merge<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(
  s1: Out<T1>,
  s2: Out<T2>,
  s3: Out<T3>,
  s4: Out<T4>,
  s5: Out<T5>,
  s6: Out<T6>,
  s7: Out<T7>,
  s8: Out<T8>,
  s9: Out<T9>,
  s10: Out<T10>,
  s11: Out<T11>
): Out<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11> // biome-ignore format: keep-one-liner
/** @hidden */
export function merge<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>(
  s1: Out<T1>,
  s2: Out<T2>,
  s3: Out<T3>,
  s4: Out<T4>,
  s5: Out<T5>,
  s6: Out<T6>,
  s7: Out<T7>,
  s8: Out<T8>,
  s9: Out<T9>,
  s10: Out<T10>,
  s11: Out<T11>,
  s12: Out<T12>
): Out<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12> // biome-ignore format: keep-one-liner
/** @hidden */
export function merge<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>(
  s1: Out<T1>,
  s2: Out<T2>,
  s3: Out<T3>,
  s4: Out<T4>,
  s5: Out<T5>,
  s6: Out<T6>,
  s7: Out<T7>,
  s8: Out<T8>,
  s9: Out<T9>,
  s10: Out<T10>,
  s11: Out<T11>,
  s12: Out<T12>,
  s13: Out<T13>
): Out<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13> // biome-ignore format: keep-one-liner
/** @hidden */
export function merge<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14>(
  s1: Out<T1>,
  s2: Out<T2>,
  s3: Out<T3>,
  s4: Out<T4>,
  s5: Out<T5>,
  s6: Out<T6>,
  s7: Out<T7>,
  s8: Out<T8>,
  s9: Out<T9>,
  s10: Out<T10>,
  s11: Out<T11>,
  s12: Out<T12>,
  s13: Out<T13>,
  s14: Out<T14>
): Out<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14> // biome-ignore format: keep-one-liner
/** @hidden */
export function merge<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>(
  s1: Out<T1>,
  s2: Out<T2>,
  s3: Out<T3>,
  s4: Out<T4>,
  s5: Out<T5>,
  s6: Out<T6>,
  s7: Out<T7>,
  s8: Out<T8>,
  s9: Out<T9>,
  s10: Out<T10>,
  s11: Out<T11>,
  s12: Out<T12>,
  s13: Out<T13>,
  s14: Out<T14>,
  s15: Out<T15>
): Out<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15> // biome-ignore format: keep-one-liner
/** @hidden */
export function merge<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16>(
  s1: Out<T1>,
  s2: Out<T2>,
  s3: Out<T3>,
  s4: Out<T4>,
  s5: Out<T5>,
  s6: Out<T6>,
  s7: Out<T7>,
  s8: Out<T8>,
  s9: Out<T9>,
  s10: Out<T10>,
  s11: Out<T11>,
  s12: Out<T12>,
  s13: Out<T13>,
  s14: Out<T14>,
  s15: Out<T15>,
  s16: Out<T16>
): Out<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15 | T16> // biome-ignore format: keep-one-liner
/** @hidden */
export function merge<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17>(
  s1: Out<T1>,
  s2: Out<T2>,
  s3: Out<T3>,
  s4: Out<T4>,
  s5: Out<T5>,
  s6: Out<T6>,
  s7: Out<T7>,
  s8: Out<T8>,
  s9: Out<T9>,
  s10: Out<T10>,
  s11: Out<T11>,
  s12: Out<T12>,
  s13: Out<T13>,
  s14: Out<T14>,
  s15: Out<T15>,
  s16: Out<T16>,
  s17: Out<T17>
): Out<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15 | T16 | T17> // biome-ignore format: keep-one-liner
/** @hidden */
export function merge<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18>(
  s1: Out<T1>,
  s2: Out<T2>,
  s3: Out<T3>,
  s4: Out<T4>,
  s5: Out<T5>,
  s6: Out<T6>,
  s7: Out<T7>,
  s8: Out<T8>,
  s9: Out<T9>,
  s10: Out<T10>,
  s11: Out<T11>,
  s12: Out<T12>,
  s13: Out<T13>,
  s14: Out<T14>,
  s15: Out<T15>,
  s16: Out<T16>,
  s17: Out<T17>,
  s18: Out<T18>
): Out<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15 | T16 | T17 | T18> // biome-ignore format: keep-one-liner
/** @hidden */
export function merge<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19>(
  s1: Out<T1>,
  s2: Out<T2>,
  s3: Out<T3>,
  s4: Out<T4>,
  s5: Out<T5>,
  s6: Out<T6>,
  s7: Out<T7>,
  s8: Out<T8>,
  s9: Out<T9>,
  s10: Out<T10>,
  s11: Out<T11>,
  s12: Out<T12>,
  s13: Out<T13>,
  s14: Out<T14>,
  s15: Out<T15>,
  s16: Out<T16>,
  s17: Out<T17>,
  s18: Out<T18>,
  s19: Out<T19>
): Out<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15 | T16 | T17 | T18 | T19> // biome-ignore format: keep-one-liner
export function merge(...sources: Out[]): Out
/**
 * Merges multiple nodes into a single stream that emits whenever any source emits.
 * Unlike `combine`, `merge` emits the individual value from whichever source emitted,
 * not an array of all values. This function is overloaded to support up to 19 nodes
 * with proper type inference as union types.
 *
 * @param sources - The nodes to merge. Can be any number of output nodes.
 *
 * @returns A new stream that emits individual values from any of the input nodes.
 * When any input node emits, the merged stream emits that exact value (not an array).
 * The type is inferred as a union of all input types.
 *
 * @typeParam T1, T2, ... - The types of values that each input node emits.
 *
 * @example
 * ```ts
 * import { Engine, Cell, Stream, merge } from '@virtuoso.dev/reactive-engine'
 *
 * const cell1$ = Cell(10)
 * const cell2$ = Cell('hello')
 * const merged$ = merge(cell1$, cell2$)
 * const engine = new Engine()
 *
 * engine.sub(merged$, (value) => console.log(value))
 * engine.pub(cell1$, 20) // logs 20 (not [20, 'hello'])
 * engine.pub(cell2$, 'world') // logs 'world' (not [20, 'world'])
 * ```
 *
 * @category Combinators
 */
export function merge(...sources: Out[]): Out {
  return tap(Stream<unknown>(), (sink$) => {
    if (sources.length > 0) {
      addNodeInit(
        (r) => {
          r.link(r.merge(...sources), sink$)
        },
        ...sources
      )
    }
  })
}

/** @hidden */
export function subMultiple<T1>(nodes: [Out<T1>], subscription: Subscription<[T1]>): void
/** @hidden */
export function subMultiple<T1, T2>(nodes: [Out<T1>, Out<T2>], subscription: Subscription<[T1, T2]>): void
/** @hidden */
export function subMultiple<T1, T2, T3>(nodes: [Out<T1>, Out<T2>, Out<T3>], subscription: Subscription<[T1, T2, T3]>): void // biome-ignore format: keep-one-liner
/** @hidden */
export function subMultiple<T1, T2, T3, T4>(nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>], subscription: Subscription<[T1, T2, T3, T4]>): void // biome-ignore format: keep-one-liner
/** @hidden */
export function subMultiple<T1, T2, T3, T4, T5>(
  nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>],
  subscription: Subscription<[T1, T2, T3, T4, T5]>
): void // biome-ignore format: keep-one-liner
/** @hidden */
export function subMultiple<T1, T2, T3, T4, T5, T6>(
  nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>],
  subscription: Subscription<[T1, T2, T3, T4, T5, T6]>
): void // biome-ignore format: keep-one-liner
/** @hidden */
export function subMultiple<T1, T2, T3, T4, T5, T6, T7>(
  nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>],
  subscription: Subscription<[T1, T2, T3, T4, T5, T6, T7]>
): void // biome-ignore format: keep-one-liner
/** @hidden */
export function subMultiple<T1, T2, T3, T4, T5, T6, T7, T8>(
  nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>],
  subscription: Subscription<[T1, T2, T3, T4, T5, T6, T7, T8]>
): void // biome-ignore format: keep-one-liner
export function subMultiple(nodes: Out[], subscription: Subscription<unknown>): void
/**
 * Subscribes to multiple nodes at once. This function is overloaded to support up to 8 nodes with proper type inference.
 * When any of the input nodes emits a value, the subscription will be called with an array of the latest values from each node.
 *
 * @param nodes - Array of nodes to subscribe to.
 * @param subscription - Callback function that receives an array of current values and the engine instance.
 *
 * @typeParam T1, T2, ... - The types of values that each input node emits.
 *
 * @example
 * ```ts
 * import { Engine, Cell, Stream, subMultiple } from '@virtuoso.dev/reactive-engine'
 *
 * const cell1$ = Cell(1)
 * const cell2$ = Cell('hello')
 * const engine = new Engine()
 *
 * subMultiple([cell1$, cell2$], (values, eng) => {
 *   console.log('Values:', values) // [number, string]
 * })
 *
 * engine.pub(cell1$, 42) // logs 'Values: [42, "hello"]'
 * engine.pub(cell2$, 'world') // logs 'Values: [42, "world"]'
 * ```
 *
 * @remarks The subscription is called for each individual node emission. If multiple nodes
 * are updated in sequence, the subscription will be called once for each update.
 *
 * @category Combinators
 */
//biome-ignore lint/suspicious/noExplicitAny: this is ok
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function subMultiple(nodes: Out[], subscription: Subscription<any>): void {
  if (nodes.length > 0) {
    addNodeInit(
      (r) => {
        r.subMultiple(nodes, subscription)
      },
      ...nodes
    )
  }
}

/** @hidden */
export function pipe<T>(s$: Out<T>): NodeRef<T> // biome-ignore format: keep-one-liner
/** @hidden */
export function pipe<T, O1>(s: Out<T>, o1: O<T, O1>): NodeRef<O1> // biome-ignore format: keep-one-liner
/** @hidden */
export function pipe<T, O1, O2>(s: Out<T>, ...o: [O<T, O1>, O<O1, O2>]): NodeRef<O2> // biome-ignore format: keep-one-liner
/** @hidden */
export function pipe<T, O1, O2, O3>(s: Out<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>]): NodeRef<O3> // biome-ignore format: keep-one-liner
/** @hidden */
export function pipe<T, O1, O2, O3, O4>(s: Out<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>]): NodeRef<O4> // biome-ignore format: keep-one-liner
/** @hidden */
export function pipe<T, O1, O2, O3, O4, O5>(s: Out<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>]): NodeRef<O5> // biome-ignore format: keep-one-liner
/** @hidden */
export function pipe<T, O1, O2, O3, O4, O5, O6>(
  s: Out<T>,
  ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>]
): NodeRef<O6> // biome-ignore format: keep-one-liner
/** @hidden */
export function pipe<T, O1, O2, O3, O4, O5, O6, O7>(
  s: Out<T>,
  ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>, O<O6, O7>]
): NodeRef<O7> // biome-ignore format: keep-one-liner
/** @hidden */
export function pipe<T, O1, O2, O3, O4, O5, O6, O7, O8>(
  s: Out<T>,
  ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>, O<O6, O7>, O<O7, O8>]
): NodeRef<O8> // biome-ignore format: keep-one-liner
/** @hidden */
export function pipe<T, O1, O2, O3, O4, O5, O6, O7, O8, O9>(
  s: Out<T>,
  ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>, O<O6, O7>, O<O7, O8>, O<O8, O9>]
): NodeRef<O9> // biome-ignore format: keep-one-liner
export function pipe<T>(source$: Out<T>, ...operators: O<unknown, unknown>[]): NodeRef
/**
 * Creates a new node that emits the values of the source node transformed through the specified operators.
 * This function is overloaded to support up to 9 operators with proper type inference for chaining.
 *
 * @param source$ - The source node to transform.
 * @param operators - Variable number of operators to apply in sequence.
 *
 * @returns A new node that emits the transformed values. If no operators are provided,
 * returns a node that emits the same values as the source.
 *
 * @typeParam T - The type of values that the source node emits.
 * @typeParam O1, O2, ... - The output types of each operator in the chain.
 *
 * @example
 * ```ts
 * import { Engine, Stream, pipe } from '@virtuoso.dev/reactive-engine'
 * import { map } from '@virtuoso.dev/reactive-engine/operators'
 *
 * const source$ = Stream<number>()
 * const doubled$ = pipe(source$, map(x => x * 2))
 * const doubledPlusOne$ = pipe(
 *   source$,
 *   map(x => x * 2),
 *   map(x => x + 1)
 * )
 *
 * const engine = new Engine()
 * engine.sub(doubled$, console.log)
 * engine.pub(source$, 5) // logs 10
 * ```
 *
 * @category Combinators
 */
export function pipe<T>(source$: Out<T>, ...operators: O<unknown, unknown>[]): NodeRef {
  return tap(Stream<unknown>(), (sink$) => {
    addNodeInit((eng) => {
      const pipe$ = eng.pipe.apply(eng, [source$, ...operators])
      eng.link(pipe$, sink$)
      // call this after the sink has been linked
      eng.copyDistinctValue(pipe$, sink$)
    }, source$)
  })
}

/**
 * Updates a cell's value based on emissions from a source node using a mapping function.
 * This is particularly useful for updating cells containing non-primitive values (arrays, objects)
 * in an immutable way.
 *
 * @param cell$ - The cell to update.
 * @param source$ - The source node whose emissions trigger the update.
 * @param map - Function that receives the current cell value and the source emission,
 *   and returns the new value for the cell.
 *
 * @typeParam T - The type of the cell value.
 * @typeParam K - The type of the value emitted by the source node.
 *
 * @example
 * ```ts
 * import { Engine, Cell, Stream, changeWith } from '@virtuoso.dev/reactive-engine'
 *
 * const items$ = Cell<string[]>([])
 * const addItem$ = Stream<string>()
 * const engine = new Engine()
 *
 * changeWith(items$, addItem$, (currentItems, newItem) => {
 *   return [...currentItems, newItem] // immutable update
 * })
 *
 * engine.pub(addItem$, 'foo')
 * console.log(engine.getValue(items$)) // ['foo']
 *
 * engine.pub(addItem$, 'bar')
 * console.log(engine.getValue(items$)) // ['foo', 'bar']
 * ```
 *
 * @category Combinators
 */
export function changeWith<T, K>(cell$: Inp<T>, source$: Out<K>, map: (cellValue: T, streamValue: K) => T) {
  addNodeInit((eng) => {
    eng.changeWith(cell$, source$, map)
  }, source$)
}

/**
 * Connects the output of a source node to the input of a sink node.
 * When the source emits a value, that value is automatically published to the sink.
 *
 * @param source$ - The output node whose values will be forwarded.
 * @param sink$ - The input node that will receive the forwarded values.
 *
 * @typeParam T - The type of values being linked between the nodes.
 *
 * @example
 * ```ts
 * import { Engine, Stream, Cell, link } from '@virtuoso.dev/reactive-engine'
 *
 * const source$ = Stream<number>()
 * const target$ = Cell(0)
 * const engine = new Engine()
 *
 * link(source$, target$)
 *
 * engine.pub(source$, 42)
 * console.log(engine.getValue(target$)) // 42
 * ```
 *
 * @category Combinators
 */
export function link<T>(source$: Out<T>, sink$: Inp<T>) {
  addNodeInit((eng) => {
    eng.link(source$, sink$)
  }, source$)
}

/**
 * Subscribes to the values emitted by a node. The subscription callback will be called
 * each time the node emits a value.
 *
 * @param node$ - The output node to subscribe to (cell or stream).
 * @param subscription - Callback function that receives the emitted value and engine instance.
 *
 * @typeParam T - The type of values that the node emits.
 *
 * @example
 * ```ts
 * import { Engine, Stream, sub } from '@virtuoso.dev/reactive-engine'
 *
 * const stream$ = Stream<number>()
 * const engine = new Engine()
 *
 * sub(stream$, (value) => {
 *   console.log('Received:', value)
 * })
 *
 * engine.pub(stream$, 42) // logs 'Received: 42'
 * engine.pub(stream$, 43) // logs 'Received: 43'
 * ```
 *
 * @remarks This creates a persistent subscription that will remain active until the engine
 * is disposed. Use this for ongoing subscriptions to node emissions.
 *
 * @category Combinators
 */
export function sub<T>(node$: Out<T>, subscription: Subscription<T>) {
  addNodeInit((r) => {
    r.sub(node$, subscription)
  }, node$)
}

/**
 * Creates an exclusive subscription to a node. Only one singleton subscription can exist
 * per node - calling this multiple times on the same node will replace the previous
 * singleton subscription. Regular subscriptions created with `sub` are not affected.
 *
 * @param node$ - The output node to subscribe to exclusively.
 * @param subscription - Callback function that receives the emitted value and engine instance.
 *
 * @typeParam T - The type of values that the node emits.
 *
 * @example
 * ```ts
 * import { Engine, Stream, sub, singletonSub } from '@virtuoso.dev/reactive-engine'
 *
 * const stream$ = Stream<number>()
 * const engine = new Engine()
 *
 * // Regular subscription - will persist
 * sub(stream$, (value) => console.log('Regular:', value))
 *
 * // First singleton subscription
 * singletonSub(stream$, (value) => console.log('Singleton 1:', value))
 *
 * // This replaces the first singleton subscription
 * singletonSub(stream$, (value) => console.log('Singleton 2:', value))
 *
 * engine.pub(stream$, 42)
 * // Output:
 * // Regular: 42
 * // Singleton 2: 42
 * ```
 *
 * @remarks Useful for scenarios where you need exactly one subscription of a particular
 * type, such as UI updates or singleton services.
 *
 * @category Combinators
 */
export function singletonSub<T>(node$: Out<T>, subscription: Subscription<T>) {
  addNodeInit((eng) => {
    eng.singletonSub(node$, subscription)
  }, node$)
}
