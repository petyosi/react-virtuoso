import type { NodeRef, Out, Realm } from './realm'

/**
 * An operator that transforms a node into another node, used in the {@link Realm.pipe} method.
 * @typeParam In - The type of values that the incoming node will emit.
 * @typeParam Out - The type of values that the resulting node will emit.
 * @category Operators
 */
export type Operator<I, O> = (source: Out<I>, realm: Realm) => NodeRef<O>

/**
 * Shorter alias for {@link Operator}, to avoid extra long type signatures.
 * @category Operators
 */
export type O<In, Out> = Operator<In, Out>

/**
 * Maps a the passed value with a projection function.
 * @category Operators
 */
export function map<I, O>(mapFunction: (value: I) => O) {
  return ((source, r) => {
    const sink = r.signalInstance<O>()
    r.connect({
      map: (done) => (value) => {
        done(mapFunction(value as I))
      },
      sink,
      sources: [source],
    })
    return sink
  }) as Operator<I, O>
}

/**
 * Pulls the latest values from the passed nodes.
 * Note: The operator does not emit when the nodes emit. If you want to get that, use the `combine` function.
 * @category Operators
 */
export function withLatestFrom<I, T1>(...nodes: [Out<T1>]): (source: Out<I>) => NodeRef<[I, T1]> // prettier-ignore
export function withLatestFrom<I, T1, T2>(...nodes: [Out<T1>, Out<T2>]): (source: Out<I>) => NodeRef<[I, T1, T2]> // prettier-ignore
export function withLatestFrom<I, T1, T2, T3>(...nodes: [Out<T1>, Out<T2>, Out<T3>]): (source: Out<I>) => NodeRef<[I, T1, T2, T3]> // prettier-ignore
export function withLatestFrom<I, T1, T2, T3, T4>(
  ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>]
): (source: Out<I>) => NodeRef<[I, T1, T2, T3, T4]> // prettier-ignore
export function withLatestFrom<I, T1, T2, T3, T4, T5>(
  ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>]
): (source: Out<I>) => NodeRef<[I, T1, T2, T3, T4, T5]> // prettier-ignore
export function withLatestFrom<I, T1, T2, T3, T4, T5, T6>(
  ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>]
): (source: Out<I>) => NodeRef<[I, T1, T2, T3, T4, T5, T6]> // prettier-ignore
export function withLatestFrom<I, T1, T2, T3, T4, T5, T6, T7>(
  ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>]
): (source: Out<I>) => NodeRef<[I, T1, T2, T3, T4, T5, T6, T7]> // prettier-ignore
export function withLatestFrom<I, T1, T2, T3, T4, T5, T6, T7, T8>(
  ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>]
): (source: Out<I>) => NodeRef<[I, T1, T2, T3, T4, T5, T6, T7, T8]> // prettier-ignore
export function withLatestFrom<I>(...nodes: Out[]) {
  return ((source, r) => {
    const sink = r.signalInstance()
    r.connect({
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
 * @category Operators
 */
export function mapTo<I, O>(value: O): Operator<I, O> {
  return (source, r) => {
    const sink = r.signalInstance<O>()
    r.connect({
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
 * @category Operators
 */
export function filter<I, O = I>(predicate: (value: I) => boolean): Operator<I, O> {
  return (source, r) => {
    const sink = r.signalInstance<O>()
    r.connect({
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
 * @category Operators
 */
export function once<I>(): Operator<I, I> {
  return (source, r) => {
    const sink = r.signalInstance<I>()

    let passed = false
    r.connect({
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
 * @category Operators
 */
export function scan<I, O>(accumulator: (current: O, value: I) => O, seed: O): Operator<I, O> {
  return (source, r) => {
    const sink = r.signalInstance<O>()
    r.connect({
      map: (done) => (value) => {
        // biome-ignore lint/style/noParameterAssign: this saves space
        // biome-ignore lint/suspicious/noAssignInExpressions: this saves space
        done((seed = accumulator(seed, value as I)))
      },
      sink,
      sources: [source],
    })
    return sink
  }
}

/**
 * Throttles the output of a node with the specified delay.
 * @category Operators
 */
export function throttleTime<I>(delay: number): Operator<I, I> {
  return (source, r) => {
    const sink = r.signalInstance<I>()
    let currentValue: I | undefined
    let timeout: null | ReturnType<typeof setTimeout> = null

    r.sub(source, (value) => {
      currentValue = value

      if (timeout !== null) {
        return
      }

      timeout = setTimeout(() => {
        timeout = null
        r.pub(sink, currentValue)
      }, delay)
    })

    return sink
  }
}

/**
 * Debounces the output of a node with the specified delay.
 * @category Operators
 */
export function debounceTime<I>(delay: number): Operator<I, I> {
  return (source, r) => {
    const sink = r.signalInstance<I>()
    let currentValue: I | undefined
    let timeout: null | ReturnType<typeof setTimeout> = null

    r.sub(source, (value) => {
      currentValue = value

      if (timeout !== null) {
        clearTimeout(timeout)
      }

      timeout = setTimeout(() => {
        r.pub(sink, currentValue)
      }, delay)
    })

    return sink
  }
}

/**
 * Delays the output of a node with `queueMicrotask`.
 * @category Operators
 */
export function delayWithMicrotask<I>(): Operator<I, I> {
  return (source, r) => {
    const sink = r.signalInstance<I>()
    r.sub(source, (value) => {
      queueMicrotask(() => {
        r.pub(sink, value)
      })
    })
    return sink
  }
}

/**
 * description Buffers the stream of a node until the passed note emits.
 * @category Operators
 */
export function onNext<I, O>(bufNode: NodeRef<O>): Operator<I, [I, O]> {
  return (source, r) => {
    const sink = r.signalInstance<[I, O]>()
    const bufferValue = Symbol()
    let pendingValue: I | typeof bufferValue = bufferValue
    r.connect({
      map: (done) => (value) => {
        if (pendingValue !== bufferValue) {
          done([pendingValue, value])
          pendingValue = bufferValue
        }
      },
      sink,
      sources: [bufNode],
    })
    r.sub(source, (value) => {
      pendingValue = value
    })
    return sink
  }
}

/**
 * Handles a promise value through the specified callbacks.
 * @category Operators
 */
export function handlePromise<I, OutSuccess, OnLoad, OutError>(
  onLoad: () => OnLoad,
  onSuccess: (value: I) => OutSuccess,
  onError: (error: unknown) => OutError
): Operator<I | Promise<I>, OnLoad | OutError | OutSuccess> {
  return (source, r) => {
    const sink = r.signalInstance<OnLoad | OutError | OutSuccess>()
    r.sub(source, (value) => {
      if (value !== null && typeof value === 'object' && 'then' in value) {
        r.pub(sink, onLoad())
        value
          .then((value) => {
            r.pub(sink, onSuccess(value))
            return
          })
          .catch((error: unknown) => {
            r.pub(sink, onError(error))
          })
      } else {
        r.pub(sink, onSuccess(value))
      }
    })
    return sink
  }
}
