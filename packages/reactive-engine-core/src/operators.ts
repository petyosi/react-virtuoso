import { createPromiseScheduler } from './promiseScheduler'

import type { Engine } from './Engine'
import type { PromiseWorkPolicy, SwitchMapPromiseResult } from './promiseScheduler'
import type { Distinct, NodeRef, Out } from './types'

export type { SwitchMapPromiseResult } from './promiseScheduler'

/**
 * An operator that transforms a node into another node, used in the {@link Engine.pipe} method.
 * @typeParam I - The type of values that the incoming node will emit.
 * @typeParam O - The type of values that the resulting node will emit.
 * @category Operators
 */
export type Operator<I, TOut> = (source: Out<I>, engine: Engine, context?: OperatorContext) => NodeRef<TOut>

/** @hidden */
export interface OperatorContext {
  pipeKey: symbol
}

/**
 * Shorter alias for {@link Operator}, to avoid extra long type signatures.
 * @category Misc
 */
export type O<In, TOut> = Operator<In, TOut>

/**
 * Maps a the passed value with a projection function.
 * @typeParam I - The type of values that the incoming node will emit.
 * @typeParam O - The type of values that the resulting node will emit.
 * @category Operators
 */
export function map<I, TOut>(mapFunction: (value: I) => TOut, distinct: Distinct<TOut> = true) {
  return ((source, eng) => {
    const sink = eng.streamInstance<TOut>(distinct)
    eng.connect({
      map: (done) => (value) => {
        done(mapFunction(value as I))
      },
      sink,
      sources: [source],
    })
    return sink
  }) satisfies Operator<I, TOut>
}

/**
 * Projects source values and drops nullish results.
 * Distinctness applies only to retained values and defaults to `true`.
 *
 * @category Operators
 */
export function filterMap<I, TOut>(project: (value: I) => null | TOut | undefined, distinct: Distinct<TOut> = true): Operator<I, TOut> {
  return (source, eng) => {
    const sink = eng.streamInstance<TOut>(distinct)
    eng.connect({
      map: (done) => (value) => {
        const projected = project(value as I)
        if (projected !== null && projected !== undefined) {
          done(projected)
        }
      },
      sink,
      sources: [source],
    })
    return sink
  }
}

/**
 * Emits every source value after the current synchronous propagation wave settles.
 * The continuation completes before the outer publication returns.
 *
 * @category Operators
 */
export function afterSettle<I>(): Operator<I, I> {
  return (source, eng, context) => {
    const sink = eng.streamInstance<I>(false)
    const settleKey = context?.pipeKey ?? Symbol('afterSettle')
    eng.sub(source, (value) => {
      eng.scheduleAfterSettle(sink, value, settleKey)
    })
    return sink
  }
}

/** @hidden */
export function withLatestFrom<I, T1>(...nodes: [Out<T1>]): (source: Out<I>) => NodeRef<[I, T1]> // prettier-ignore
/** @hidden */
export function withLatestFrom<I, T1, T2>(...nodes: [Out<T1>, Out<T2>]): (source: Out<I>) => NodeRef<[I, T1, T2]> // prettier-ignore
/** @hidden */
export function withLatestFrom<I, T1, T2, T3>(...nodes: [Out<T1>, Out<T2>, Out<T3>]): (source: Out<I>) => NodeRef<[I, T1, T2, T3]> // prettier-ignore
/** @hidden */
export function withLatestFrom<I, T1, T2, T3, T4>(
  ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>]
): (source: Out<I>) => NodeRef<[I, T1, T2, T3, T4]> // prettier-ignore
/** @hidden */
export function withLatestFrom<I, T1, T2, T3, T4, T5>(
  ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>]
): (source: Out<I>) => NodeRef<[I, T1, T2, T3, T4, T5]> // prettier-ignore
/** @hidden */
export function withLatestFrom<I, T1, T2, T3, T4, T5, T6>(
  ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>]
): (source: Out<I>) => NodeRef<[I, T1, T2, T3, T4, T5, T6]> // prettier-ignore
/** @hidden */
export function withLatestFrom<I, T1, T2, T3, T4, T5, T6, T7>(
  ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>]
): (source: Out<I>) => NodeRef<[I, T1, T2, T3, T4, T5, T6, T7]> // prettier-ignore
/** @hidden */
export function withLatestFrom<I, T1, T2, T3, T4, T5, T6, T7, T8>(
  ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>]
): (source: Out<I>) => NodeRef<[I, T1, T2, T3, T4, T5, T6, T7, T8]> // prettier-ignore
export function withLatestFrom<I>(...nodes: Out[]): Operator<I, unknown[]>
/**
 * Pulls the latest values from the passed nodes.
 * Note: The operator does not emit when the nodes emit. If you want to get that, use the `combine` function.
 * @typeParam I - The type of values that the incoming node will emit.
 * @typeParam T1 - The type of values that the first node will emit.
 * @category Operators
 */
export function withLatestFrom<I>(...nodes: Out[]) {
  return ((source, eng) => {
    const sink = eng.streamInstance()
    eng.connect({
      map:
        (done) =>
        (...args) => {
          done(args)
        },
      pulls: nodes,
      sink,
      sources: [source],
    })
    return sink
  }) as Operator<I, unknown[]>
}

/**
 * Operator that maps the output of a node to a fixed value.
 * @typeParam I - The type of values that the incoming node will emit.
 * @typeParam O - The type of the fixed value to map to.
 * @category Operators
 */
export function mapTo<I, TOut>(value: TOut): Operator<I, TOut> {
  return (source, eng) => {
    const sink = eng.streamInstance<TOut>()
    eng.connect({
      map: (done) => () => {
        done(value)
      },
      sink,
      sources: [source],
    })
    return sink
  }
}

/**
 * Operator that filters the output of a node.
 * If the predicate returns false, the emission is canceled.
 * Supports TypeScript type predicates for type narrowing.
 * @typeParam I - The type of values that the incoming node will emit.
 * @typeParam O - The type of values that the filtered node will emit.
 * @category Operators
 * @example
 * ```ts
 * // With type predicate - narrows type
 * const value$ = Cell<string | null>(null);
 * const filtered$ = e.pipe(value$, filter((v): v is string => v !== null));
 * // filtered$ type is Stream<string>
 *
 * // Without type predicate - preserves type
 * const filtered2$ = e.pipe(value$, filter((v) => v !== null));
 * // filtered2$ type is Stream<string | null>
 * ```
 */
export function filter<I, TOut extends I>(predicate: (value: I) => value is TOut): Operator<I, TOut>
export function filter<I>(predicate: (value: I) => boolean): Operator<I, I>
export function filter<I, TOut extends I>(predicate: ((value: I) => boolean) | ((value: I) => value is TOut)): Operator<I, TOut> {
  return (source, eng) => {
    const sink = eng.streamInstance<TOut>()
    eng.connect({
      map: (done) => (value) => {
        if (predicate(value as I)) {
          done(value)
        }
      },
      sink,
      sources: [source],
    })
    return sink
  }
}

/**
 * Operator that captures the first emitted value of a node.
 * Useful if you want to execute a side effect only once.
 * @typeParam I - The type of values that the node will emit.
 * @category Operators
 */
export function once<I>(): Operator<I, I> {
  return (source, eng) => {
    const sink = eng.streamInstance<I>()

    let passed = false
    eng.connect({
      map: (done) => (value) => {
        if (!passed) {
          passed = true
          done(value)
        }
      },
      sink,
      sources: [source],
    })
    return sink
  }
}

/**
 * Operator that runs with the latest and the current value of a node.
 * Works like the {@link https://rxjs.dev/api/operators/scan | RxJS scan operator}.
 * @typeParam I - The type of values that the incoming node will emit.
 * @typeParam O - The type of the accumulated value.
 * @category Operators
 */
export function scan<I, TOut>(accumulator: (current: TOut, value: I) => TOut, seed: TOut): Operator<I, TOut> {
  return (source, eng) => {
    const sink = eng.streamInstance<TOut>()
    let result = seed
    eng.connect({
      map: (done) => {
        return (value) => {
          result = accumulator(result, value as I)
          done(result)
        }
      },
      sink,
      sources: [source],
    })
    return sink
  }
}

/**
 * Throttles the output of a node with the specified delay.
 *
 * The resulting node is distinct by default: after the delay, a value equal to the previously
 * emitted one is suppressed. A valueless source such as a `Trigger` therefore passes only once.
 * Pass `false` as `distinct` when every throttled window must emit, or a comparator to define equality.
 * @param delay - The throttle window in milliseconds.
 * @param distinct - `true` by default. Pass `false` to re-emit equal values, or a comparator function.
 * @typeParam I - The type of values that the node will emit.
 * @category Operators
 */
export function throttleTime<I>(delay: number, distinct: Distinct<I> = true): Operator<I, I> {
  return (source, eng) => {
    const sink = eng.streamInstance<I>(distinct)
    let currentValue: I | undefined
    let timeout: null | ReturnType<typeof setTimeout> = null

    eng.sub(source, (value) => {
      currentValue = value

      if (timeout !== null) {
        return
      }

      timeout = setTimeout(() => {
        timeout = null
        eng.pub(sink, currentValue)
      }, delay)
    })

    return sink
  }
}

/**
 * Debounces the output of a node with the specified delay.
 *
 * The resulting node is distinct by default: after the source goes quiet, a value equal to the
 * previously emitted one is suppressed. A valueless source such as a `Trigger` therefore passes only
 * once. Pass `false` as `distinct` when every settled burst must emit, for example when debouncing
 * refetch requests, or a comparator to define equality.
 * @param delay - The quiet period in milliseconds.
 * @param distinct - `true` by default. Pass `false` to re-emit equal values, or a comparator function.
 * @typeParam I - The type of values that the node will emit.
 * @category Operators
 */
export function debounceTime<I>(delay: number, distinct: Distinct<I> = true): Operator<I, I> {
  return (source, eng) => {
    const sink = eng.streamInstance<I>(distinct)
    let currentValue: I | undefined
    let timeout: null | ReturnType<typeof setTimeout> = null

    eng.sub(source, (value) => {
      currentValue = value

      if (timeout !== null) {
        clearTimeout(timeout)
      }

      timeout = setTimeout(() => {
        eng.pub(sink, currentValue)
      }, delay)
    })

    return sink
  }
}

/**
 * Delays the output of a node with `queueMicrotask`.
 * @typeParam I - The type of values that the node will emit.
 * @category Operators
 */
export function delayWithMicrotask<I>(): Operator<I, I> {
  return (source, eng) => {
    const sink = eng.streamInstance<I>()
    eng.sub(source, (value) => {
      queueMicrotask(() => {
        eng.pub(sink, value)
      })
    })
    return sink
  }
}

/** Options shared by {@link switchMapPromise}, {@link concatMapPromise}, and {@link coalescePromise}. */
export interface PromiseOperatorOptions<TInput> {
  /**
   * Groups inputs by the returned value. Ordering, switching, and coalescing apply per key, and different keys run
   * independently. Keys are compared with `Map` semantics (`SameValueZero`). Without a key, all inputs share one group.
   */
  key?: (input: TInput) => unknown
}

/** Options for {@link coalescePromise}. */
export interface CoalescePromiseOptions<TInput> extends PromiseOperatorOptions<TInput> {
  /**
   * Combines the waiting input with a newer one for the same key. Defaults to keeping only `next`. Provide it when
   * inputs are partial updates, such as patches, so earlier changes are not dropped.
   */
  merge?: (waiting: TInput, next: TInput) => TInput
}

function promiseResultOperator<TInput, TValue>(
  policy: PromiseWorkPolicy,
  project: (input: TInput, signal: AbortSignal) => Promise<TValue>,
  options: CoalescePromiseOptions<TInput>
): Operator<TInput, SwitchMapPromiseResult<TInput, TValue>> {
  return (source, eng) => {
    const sink = eng.streamInstance<SwitchMapPromiseResult<TInput, TValue>>(false)
    const scheduler = createPromiseScheduler<TInput, TValue>(eng, policy, (input, signal) => project(input, signal), options, {
      onSettle: (result) => {
        eng.pub(sink, result)
      },
    })
    eng.sub(source, (input) => {
      scheduler.push(input)
    })
    return sink
  }
}

/**
 * Projects each source value to abortable Promise work and emits only the latest live result.
 * Results retain the input that created them and repeated equal results remain observable.
 *
 * Aborting the signal cancels client-side work only. A request that the server already received may still be applied,
 * so prefer {@link coalescePromise} or {@link concatMapPromise} for writes.
 *
 * @param project - Starts Promise work with the source input and an operator-owned abort signal.
 * @param options - Pass `key` to switch per key, so a new input aborts only the previous work with the same key.
 * @category Operators
 */
export function switchMapPromise<TInput, TValue>(
  project: (input: TInput, signal: AbortSignal) => Promise<TValue>,
  options: PromiseOperatorOptions<TInput> = {}
): Operator<TInput, SwitchMapPromiseResult<TInput, TValue>> {
  return promiseResultOperator('switch', project, options)
}

/**
 * Runs Promise work for each source value one at a time, in arrival order, and emits every result in that order.
 * Work is aborted only when the engine is disposed.
 *
 * @param project - Starts Promise work with the source input and an operator-owned abort signal.
 * @param options - Pass `key` to keep a separate queue per key, so different keys run concurrently.
 * @category Operators
 */
export function concatMapPromise<TInput, TValue>(
  project: (input: TInput, signal: AbortSignal) => Promise<TValue>,
  options: PromiseOperatorOptions<TInput> = {}
): Operator<TInput, SwitchMapPromiseResult<TInput, TValue>> {
  return promiseResultOperator('serial', project, options)
}

/**
 * Keeps at most one Promise work in flight and holds only the newest waiting input, which starts when the current work
 * settles, whether it succeeds or fails. Inputs replaced while waiting never start and emit nothing. Use it for writes
 * where the server must end on the newest value. Work is aborted only when the engine is disposed.
 *
 * @param project - Starts Promise work with the source input and an operator-owned abort signal.
 * @param options - Pass `key` to coalesce per key, and `merge` to combine waiting partial updates.
 * @category Operators
 */
export function coalescePromise<TInput, TValue>(
  project: (input: TInput, signal: AbortSignal) => Promise<TValue>,
  options: CoalescePromiseOptions<TInput> = {}
): Operator<TInput, SwitchMapPromiseResult<TInput, TValue>> {
  return promiseResultOperator('coalesce', project, options)
}

/**
 * Runs Promise work for one source value at a time and ignores values that arrive while that work runs. Ignored values
 * never start and emit nothing. The key frees as soon as the work settles, whether it succeeds or fails, so a subscriber
 * of the result can start new work for the same key. Use it for actions where a second request would be a duplicate,
 * such as a submit or delete button. Work is aborted only when the engine is disposed.
 *
 * Unlike {@link concatMapPromise} and {@link coalescePromise}, which hold a key while result subscribers run, the key is
 * already free inside them.
 *
 * @param project - Starts Promise work with the source input and an operator-owned abort signal.
 * @param options - Pass `key` to allow one running work per key, so different keys run concurrently.
 * @category Operators
 */
export function exhaustMapPromise<TInput, TValue>(
  project: (input: TInput, signal: AbortSignal) => Promise<TValue>,
  options: PromiseOperatorOptions<TInput> = {}
): Operator<TInput, SwitchMapPromiseResult<TInput, TValue>> {
  return promiseResultOperator('exhaust', project, options)
}

/**
 * description Buffers the stream of a node until the passed note emits.
 * @typeParam I - The type of values that the source node will emit.
 * @typeParam O - The type of values that the buffer node will emit.
 * @category Operators
 */
export function onNext<I, TOut>(bufNode: NodeRef<TOut>): Operator<I, [I, TOut]> {
  return (source, eng) => {
    const sink = eng.streamInstance<[I, TOut]>()
    const bufferValue = Symbol('pending')
    let pendingValue: I | typeof bufferValue = bufferValue
    eng.connect({
      map: (done) => (value) => {
        if (pendingValue !== bufferValue) {
          done([pendingValue, value])
          pendingValue = bufferValue
        }
      },
      sink,
      sources: [bufNode],
    })
    eng.sub(source, (value) => {
      pendingValue = value
    })
    return sink
  }
}

/**
 * Handles a promise value through the specified callbacks.
 * @typeParam I - The type of values that the incoming node will emit.
 * @typeParam OutSuccess - The type of value returned on success.
 * @typeParam OnLoad - The type of value returned during loading.
 * @typeParam OutError - The type of value returned on error.
 * @category Operators
 */
export function handlePromise<I, OutSuccess, OnLoad, OutError>(
  onLoad: () => OnLoad,
  onSuccess: (value: I) => OutSuccess,
  onError: (error: unknown) => OutError
): Operator<I | Promise<I>, OnLoad | OutError | OutSuccess> {
  return (source, eng) => {
    const sink = eng.streamInstance<OnLoad | OutError | OutSuccess>()
    eng.sub(source, (value) => {
      if (value !== null && typeof value === 'object' && 'then' in value) {
        eng.pub(sink, onLoad())
        value
          .then((resolved) => {
            eng.pub(sink, onSuccess(resolved))
            return undefined
          })
          .catch((error: unknown) => {
            eng.pub(sink, onError(error))
          })
      } else {
        eng.pub(sink, onSuccess(value))
      }
    })
    return sink
  }
}
