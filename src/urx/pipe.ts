/**
 *
 * Stream values can be transformed and controlled by {@link pipe | **piping**} through **operators**.
 * urx includes several operators like [[map]], [[filter]], [[scan]], and [[throttleTime]].
 * The [[withLatestFrom]] operator allows the combination of values from other streams.
 *
 * ```ts
 * const foo = stream<number>()
 *
 * // create an emitter that first adds 2 to the passed value, then multiplies it by * 2
 * const bar = pipe(foo, map(value => value + 2), map(value => value * 2))
 * subscribe(bar, value => console.log(value))
 * publish(foo, 2) // outputs 8
 * ```
 *
 * ### Implementing Custom Operators
 * To implement your own operators, implement the [[Operator]] interface.
 * @packageDocumentation
 */
import { compose, thrush } from './utils'
import { Emitter, subscribe, Subscription, reset } from './actions'
import { SUBSCRIBE, RESET } from './constants'

/**
 * Operators can transform and control the flow of values.
 * [[pipe]] is used to transform one Emitter into another by stacking operators to its values.
 * To build your own operator that looks like the built-in ones,
 * create a function which returns an operator.
 * The following custom operator multiplies the passed value:
 *
 * ```ts
 * function multiplyBy(multiplier: number): Operator<number> {
 *  return done => value => done(value * multiplier)
 * }
 *
 * const foo = stream<number>()
 * const multipliedFoo = pipe(foo, multiplyBy(3))
 * subscribe(multipliedFoo, value => console.log(value))
 * publish(foo, 42)
 * ```
 */
export interface Operator<Input, Output = Input> {
  (done: (value: Output) => void): (value: Input) => void
}

/** @internal */
type CombineOperatorsReturnType<I, O> = (subscriber: (value: O) => void) => (value: I) => void

/** @internal */
function combineOperators<I>(...operators: Operator<any, any>[]): CombineOperatorsReturnType<I, any> {
  return (subscriber: (value: any) => void) => {
    return operators.reduceRight(thrush, subscriber)
  }
}

/** @internal */
type O<I, OP> = Operator<I, OP>

/**
 * Creates a new emitter from the passed one by piping its values through one or more operators.
 * Operators can perform various actions like filter values, pull values from other emitters, or compute new values.
 *
 * ```ts
 * const foo = stream<number>()
 *
 * // create an emitter that first adds 2 to the passed value, then multiplies it by * 2
 * const bar = pipe(foo, map(value => value + 2), map(value => value * 2))
 * subscribe(bar, value => console.log(value))
 * publish(foo, 2) // outputs 8
 * ```
 * #### Sharing Subscription Calculations
 *
 * `pipe` acts as a proxy for the source emitter, and re-runs the operators for each subscription to the derived emitter.
 * Use [[streamFromEmitter]] or [[statefulStreamFromEmitter]] to avoid that.
 */
export function pipe<T>(s: Emitter<T>): Emitter<T> // prettier-ignore
export function pipe<T, O1>(s: Emitter<T>, o1: O<T, O1>): Emitter<O1> // prettier-ignore
export function pipe<T, O1, O2>(s: Emitter<T>, ...o: [O<T, O1>, O<O1, O2>]): Emitter<O2> // prettier-ignore
export function pipe<T, O1, O2, O3>(s: Emitter<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>]): Emitter<O3> // prettier-ignore
export function pipe<T, O1, O2, O3, O4>(s: Emitter<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>]): Emitter<O4> // prettier-ignore
export function pipe<T, O1, O2, O3, O4, O5>(s: Emitter<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>]): Emitter<O5> // prettier-ignore
export function pipe<T, O1, O2, O3, O4, O5, O6>(s: Emitter<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>]): Emitter<O6> // prettier-ignore
export function pipe<T, O1, O2, O3, O4, O5, O6, O7>(s: Emitter<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>, O<O6, O7>]): Emitter<O7> // prettier-ignore
export function pipe<T>(source: Emitter<T>, ...operators: O<any, any>[]): Emitter<any> {
  // prettier-ignore
  const project = combineOperators(...operators)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return ((action: SUBSCRIBE | RESET, subscription: Subscription<any>) => {
    switch (action) {
      case SUBSCRIBE:
        return subscribe(source, project(subscription))
      case RESET:
        reset(source)
        return
    }
  }) as Emitter<any>
}

/**
 * A function which determines if two values are equal.
 * Implement custom comparators when [[distinctUntilChanged]] needs to work on non-primitive objects.
 * @returns true if values should be considered equal.
 */
export interface Comparator<T> {
  (previous: T, next: T): boolean
}

/**
 * The default [[Comparator]] for [[distinctUntilChanged]] and [[duc]].
 */
export function defaultComparator<T>(previous: T, next: T) {
  return previous === next
}

/**
 * Filters out identical values. Pass an optional [[Comparator]] if you need to filter non-primitive values.
 * ```ts
 * const foo = stream<number>()
 *
 * subscribe(
 *  pipe(foo, distinctUntilChanged()),
 *  console.log
 * ) // will be called only once
 *
 * publish(foo, 42)
 * publish(foo, 42)
 * ```
 */
export function distinctUntilChanged<T>(comparator: Comparator<T> = defaultComparator): Operator<T> {
  let current: T
  return (done) => (next) => {
    if (!comparator(current, next)) {
      current = next
      done(next)
    }
  }
}

/**
 * Filters out values for which the predicator does not return `true`-ish.
 * ```ts
 * const foo = stream<number>()
 *
 * subscribe(
 *  pipe(foo, filter(value => value % 2 === 0)),
 *  console.log
 * ) // will be called only with even values
 *
 * publish(foo, 2)
 * publish(foo, 3)
 * publish(foo, 4)
 * publish(foo, 5)
 * ```
 */
export function filter<T>(predicate: (value: T) => boolean): Operator<T> {
  return (done) => (value) => {
    predicate(value) && done(value)
  }
}

/**
 * Maps values using the provided project function.
 * ```ts
 * const foo = stream<number>()
 *
 * subscribe(
 *  pipe(foo, map(value => value * 2)),
 *  console.log
 * ) // 4, 6
 *
 * publish(foo, 2)
 * publish(foo, 3)
 * ```
 */
export function map<T, K>(project: (value: T) => K): Operator<T, K> {
  return (done) => compose(done, project)
}

/**
 * Maps values to the hard-coded value.
 * ```ts
 * const foo = stream<number>()
 *
 * subscribe(
 *  pipe(foo, mapTo(3)),
 *  console.log
 * ) // 3, 3
 *
 * publish(foo, 1)
 * publish(foo, 2)
 * ```
 */
export function mapTo<T>(value: T): Operator<unknown, T> {
  return (done) => () => done(value)
}

/**
 * Works like Array#reduce.
 * Applies an accumulator function on the emitter, and outputs intermediate result. Starts with the initial value.
 * ```ts
 * const foo = stream<number>()
 *
 * subscribe(
 *  pipe(foo, scan((acc, value) => acc + value, 2),
 *  console.log
 * ) // 3, 5
 *
 * publish(foo, 1)
 * publish(foo, 2)
 * ```
 */
export function scan<T, K>(scanner: (current: T, value: K) => T, initial: T): Operator<K, T> {
  return (done) => (value) => done((initial = scanner(initial, value)))
}

/**
 * Skips the specified amount of values from the emitter.
 * ```ts
 * const foo = stream<number>()
 *
 * subscribe(
 *  pipe(foo, skip(2)),
 *  console.log
 * ) // 3, 4
 *
 * publish(foo, 1) // skipped
 * publish(foo, 2) // skipped
 * publish(foo, 3)
 * publish(foo, 4)
 * ```
 */
export function skip<T>(times: number): Operator<T> {
  return (done) => (value) => {
    times > 0 ? times-- : done(value)
  }
}

/**
 * Throttles flowing values at the provided interval in milliseconds.
 * [Throttle VS Debounce in SO](https://stackoverflow.com/questions/25991367/difference-between-throttling-and-debouncing-a-function).
 *
 * ```ts
 *  const foo = stream<number>()
 *  publish(foo, 1)
 *
 *  setTimeout(() => publish(foo, 2), 20)
 *  setTimeout(() => publish(foo, 3), 20)
 *
 *  subscribe(pipe(foo, throttleTime(50)), val => {
 *    console.log(value); // 3
 *  })
 * ```
 */
export function throttleTime<T>(interval: number): Operator<T> {
  let currentValue: T | undefined
  let timeout: any

  return (done) => (value) => {
    currentValue = value

    if (timeout) {
      return
    }

    timeout = setTimeout(() => {
      timeout = undefined
      done(currentValue!)
    }, interval)
  }
}

/**
 * Debounces flowing values at the provided interval in milliseconds.
 * [Throttle VS Debounce in SO](https://stackoverflow.com/questions/25991367/difference-between-throttling-and-debouncing-a-function).
 *
 * ```ts
 *  const foo = stream<number>()
 *  publish(foo, 1)
 *
 *  setTimeout(() => publish(foo, 2), 20)
 *  setTimeout(() => publish(foo, 3), 20)
 *
 *  subscribe(pipe(foo, debounceTime(50)), val => {
 *    console.log(value); // 3
 *  })
 * ```
 */
export function debounceTime<T>(interval: number): Operator<T> {
  let currentValue: T | undefined
  let timeout: ReturnType<typeof setTimeout>

  return (done) => (value) => {
    currentValue = value
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      done(currentValue!)
    }, interval)
  }
}

/**
 * Combines the source Emitter with the latest values from the specified Emitters into an array. Outputs only when the source Emitter emits.
 * See [[combineLatest]] for a transformer that outputs when any of the emitters emit.
 *
 * ```ts
 *  const foo = stream<number>()
 *  const bar = stream<number>()
 *  subscribe(
 *    pipe(
 *      foo,
 *      withLatestFrom(bar)
 *    ),
 *    (([foo, bar]) => console.log({ foo, bar }))
 *  )
 *
 *  publish(foo, 1) // nothing happens, bar has not emitted yet
 *  publish(bar, 1) // still nothing
 *  publish(foo, 2) // logs { foo: 2, bar: 1 }
 *  publish(bar, 2)
 *  publish(foo, 3) // logs { foo: 3, bar: 2 }
 * ```
 */
export function withLatestFrom<T, R1>(...s: [Emitter<R1>]): Operator<T, [T, R1]> // prettier-ignore
export function withLatestFrom<T, R1, R2>(...s: [Emitter<R1>, Emitter<R2>]): Operator<T, [T, R1, R2]> // prettier-ignore
export function withLatestFrom<T, R1, R2, R3>( ...s: [Emitter<R1>, Emitter<R2>, Emitter<R3>]): Operator<T, [T, R1, R2, R3]> // prettier-ignore
export function withLatestFrom<T, R1, R2, R3, R4>( ...s: [Emitter<R1>, Emitter<R2>, Emitter<R3>, Emitter<R4>]): Operator<T, [T, R1, R2, R3, R4]> // prettier-ignore
export function withLatestFrom<T, R1, R2, R3, R4, R5>( ...s: [Emitter<R1>, Emitter<R2>, Emitter<R3>, Emitter<R4>, Emitter<R5>]): Operator<T, [T, R1, R2, R3, R4, R5]> // prettier-ignore
export function withLatestFrom<T, R1, R2, R3, R4, R5, R6>( ...s: [Emitter<R1>, Emitter<R2>, Emitter<R3>, Emitter<R4>, Emitter<R5>, Emitter<R6>]): Operator<T, [T, R1, R2, R3, R4, R5, R6]> // prettier-ignore
export function withLatestFrom<T, R1, R2, R3, R4, R5, R6, R7>( ...s: [Emitter<R1>, Emitter<R2>, Emitter<R3>, Emitter<R4>, Emitter<R5>, Emitter<R6>, Emitter<R7>]): Operator<T, [T, R1, R2, R3, R4, R5, R6, R7]> // prettier-ignore
export function withLatestFrom(...sources: Emitter<any>[]): Operator<any, any> {
  const values = new Array(sources.length)
  let called = 0
  let pendingCall: null | (() => void) = null
  const allCalled = Math.pow(2, sources.length) - 1

  sources.forEach((source, index) => {
    const bit = Math.pow(2, index)
    subscribe(source, (value) => {
      const prevCalled = called
      called = called | bit
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      values[index] = value
      if (prevCalled !== allCalled && called === allCalled && pendingCall) {
        pendingCall()
        pendingCall = null
      }
    })
  })

  return (done) => (value) => {
    const call = () => done([value].concat(values))
    if (called === allCalled) {
      call()
    } else {
      pendingCall = call
    }
  }
}
