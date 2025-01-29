/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/**
 * Transformers change and combine streams, similar to operators.
 * urx comes with two combinators - [[combineLatest]] and [[merge]], and one convenience filter - [[duc]].
 *
 * @packageDocumentation
 */
import { Emitter, publish, reset, subscribe, Subscription } from './actions'
import { RESET, SUBSCRIBE } from './constants'
import { Comparator, defaultComparator, distinctUntilChanged, pipe } from './pipe'
import { stream } from './streams'
import { joinProc } from './utils'

/**
 * Merges one or more emitters from the same type into a new Emitter which emits values from any of the source emitters.
 * ```ts
 * const foo = stream<number>()
 * const bar = stream<number>()
 *
 * subscribe(merge(foo, bar), (value) => console.log(value)) // 42, 43
 *
 * publish(foo, 42)
 * publish(bar, 43)
 * ```
 */
export function merge<T>(...sources: Emitter<T>[]): Emitter<T> {
  return function (action: SUBSCRIBE | RESET, subscription?: Subscription<any>) {
    switch (action) {
      case SUBSCRIBE:
        return joinProc(...sources.map((source) => subscribe(source, subscription!)))
      case RESET:
        // do nothing, we are stateless
        return
      default:
        throw new Error(`unrecognized action ${action}`)
    }
  } as Emitter<T>
}

/**
 * A convenience wrapper that emits only the distinct values from the passed Emitter. Wraps [[pipe]] and [[distinctUntilChanged]].
 *
 * ```ts
 * const foo = stream<number>()
 *
 * // this line...
 * const a = duc(foo)
 *
 * // is equivalent to this
 * const b = pipe(distinctUntilChanged(foo))
 * ```
 *
 * @param source The source emitter.
 * @param comparator optional custom comparison function for the two values.
 *
 * @typeParam T the type of the value emitted by the source.
 *
 * @returns the resulting emitter.
 */
export function duc<T>(source: Emitter<T>, comparator: Comparator<T> = defaultComparator): Emitter<T> {
  return pipe(source, distinctUntilChanged(comparator))
}

/**
 * Creates an emitter with the latest values from all passed emitters as an array.
 *
 * `combineLatest` acts as a Depot. Using it on stateless streams persists the last emitted value of each [[Emitter]].
 * Provided that all emitters have emitted at least once, subscribing to the resulting emitter will immediately receive their combined latest values.
 *
 * ```ts
 * const foo = stream<number>()
 * const bar = stream<number>()
 *
 * subscribe(combineLatest(foo, bar), ([foo, bar]) => console.log({ foo, bar }))
 *
 * publish(foo, 42)
 * publish(bar, 43) // { foo: 42, bar: 43 }
 * publish(foo, 44) // { foo: 44, bar: 43 }
 * publish(bar, 45) // { foo: 44, bar: 45 }
 * ```
 */
export function combineLatest<O1, O2>(...emitters: [Emitter<O1>, Emitter<O2>]): Emitter<[O1, O2]> // prettier-ignore
export function combineLatest<O1, O2, O3>( ...emitters: [Emitter<O1>, Emitter<O2>, Emitter<O3>]): Emitter<[O1, O2, O3]> // prettier-ignore
export function combineLatest<O1, O2, O3, O4>( ...emitters: [Emitter<O1>, Emitter<O2>, Emitter<O3>, Emitter<O4>]): Emitter<[O1, O2, O3, O4]> // prettier-ignore
export function combineLatest<O1, O2, O3>( ...emitters: [Emitter<O1>, Emitter<O2>, Emitter<O3>]): Emitter<[O1, O2, O3]> // prettier-ignore
export function combineLatest<O1, O2, O3, O4, O5>( ...emitters: [Emitter<O1>, Emitter<O2>, Emitter<O3>, Emitter<O4>, Emitter<O5>]): Emitter<[O1, O2, O3, O4, O5]> // prettier-ignore
export function combineLatest<O1, O2, O3, O4, O5, O6>( ...emitters: [Emitter<O1>, Emitter<O2>, Emitter<O3>, Emitter<O4>, Emitter<O5>, Emitter<O6>]): Emitter<[O1, O2, O3, O4, O5, O6]> // prettier-ignore
export function combineLatest<O1, O2, O3, O4, O5, O6, O7>( ...emitters: [Emitter<O1>, Emitter<O2>, Emitter<O3>, Emitter<O4>, Emitter<O5>, Emitter<O6>, Emitter<O7>]): Emitter<[O1, O2, O3, O4, O5, O6, O7]> // prettier-ignore
export function combineLatest<O1, O2, O3, O4, O5, O6, O7, O8>( ...emitters: [Emitter<O1>, Emitter<O2>, Emitter<O3>, Emitter<O4>, Emitter<O5>, Emitter<O6>, Emitter<O7>, Emitter<O8>]): Emitter<[O1, O2, O3, O4, O5, O6, O7, O8]> // prettier-ignore
export function combineLatest<O1, O2, O3, O4, O5, O6, O7, O8, O9>( ...emitters: [Emitter<O1>, Emitter<O2>, Emitter<O3>, Emitter<O4>, Emitter<O5>, Emitter<O6>, Emitter<O7>, Emitter<O8>, Emitter<O9>]): Emitter<[O1, O2, O3, O4, O5, O6, O7, O8, O9]> // prettier-ignore
export function combineLatest<O1, O2, O3, O4, O5, O6, O7, O8, O9, O10>( ...emitters: [Emitter<O1>, Emitter<O2>, Emitter<O3>, Emitter<O4>, Emitter<O5>, Emitter<O6>, Emitter<O7>, Emitter<O8>, Emitter<O9>, Emitter<O10>]): Emitter<[O1, O2, O3, O4, O5, O6, O7, O8, O9, O10]> // prettier-ignore
export function combineLatest<O1, O2, O3, O4, O5, O6, O7, O8, O9, O10, O11>( ...emitters: [Emitter<O1>, Emitter<O2>, Emitter<O3>, Emitter<O4>, Emitter<O5>, Emitter<O6>, Emitter<O7>, Emitter<O8>, Emitter<O9>, Emitter<O10>, Emitter<O11>]): Emitter<[O1, O2, O3, O4, O5, O6, O7, O8, O9, O10, O11]> // prettier-ignore
export function combineLatest(...emitters: Emitter<any>[]): Emitter<any> {
  const innerSubject = stream<any>()
  const values = new Array(emitters.length)
  let called = 0
  const allCalled = Math.pow(2, emitters.length) - 1

  emitters.forEach((source, index) => {
    const bit = Math.pow(2, index)
    subscribe(source, (value) => {
      values[index] = value
      called = called | bit
      if (called === allCalled) {
        publish(innerSubject, values)
      }
    })
  })

  return function (action: SUBSCRIBE | RESET, subscription?: Subscription<any>) {
    switch (action) {
      case SUBSCRIBE:
        if (called === allCalled) {
          subscription!(values)
        }
        return subscribe(innerSubject, subscription!)
      case RESET:
        return reset(innerSubject)
      default:
        throw new Error(`unrecognized action ${action}`)
    }
  } as Emitter<any>
}
