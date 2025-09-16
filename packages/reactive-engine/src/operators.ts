import { CC } from './CC'
import { type Engine } from './Engine'
import { getNodeLabel } from './nodeUtils'
import { type NodeRef, type Out } from './types'

/**
 * An operator that transforms a node into another node, used in the {@link Engine.pipe} method.
 * @typeParam I - The type of values that the incoming node will emit.
 * @typeParam O - The type of values that the resulting node will emit.
 * @category Operators
 */
export type Operator<I, O> = (source: Out<I>, engine: Engine) => NodeRef<O>

/**
 * Shorter alias for {@link Operator}, to avoid extra long type signatures.
 * @category Misc
 */
export type O<In, Out> = Operator<In, Out>

function traceOperator(eng: Engine, opName: string, source: symbol, value: unknown, what?: unknown): void {
  eng.tracer.log(
    CC.blue(`OP: ${opName}`),
    CC.plain(' '),
    CC.gray(getNodeLabel(source)),
    CC.plain(' (value: '),
    CC.plain(JSON.stringify(value)),
    CC.plain(') with '),
    CC.yellow(JSON.stringify(what))
  )
}

/**
 * Maps a the passed value with a projection function.
 * @typeParam I - The type of values that the incoming node will emit.
 * @typeParam O - The type of values that the resulting node will emit.
 * @category Operators
 */
export function map<I, O>(mapFunction: (value: I) => O) {
  return ((source, eng) => {
    const sink = eng.streamInstance<O>()
    eng.connect({
      map: (done) => (value) => {
        traceOperator(eng, 'map', source, value, mapFunction.name)
        done(mapFunction(value as I))
      },
      sink,
      sources: [source],
    })
    return sink
  }) satisfies Operator<I, O>
}

/** @hidden */
export function withLatestFrom<I, T1>(...nodes: [Out<T1>]): (source: Out<I>) => NodeRef<[I, T1]> // prettier-ignore
/** @hidden */
export function withLatestFrom<I, T1, T2>(...nodes: [Out<T1>, Out<T2>]): (source: Out<I>) => NodeRef<[I, T1, T2]> // prettier-ignore
/** @hidden */
export function withLatestFrom<I, T1, T2, T3>(...nodes: [Out<T1>, Out<T2>, Out<T3>]): (source: Out<I>) => NodeRef<[I, T1, T2, T3]> // prettier-ignore
/** @hidden */
export function withLatestFrom<I, T1, T2, T3, T4>( ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>]): (source: Out<I>) => NodeRef<[I, T1, T2, T3, T4]> // prettier-ignore
/** @hidden */
export function withLatestFrom<I, T1, T2, T3, T4, T5>( ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>]): (source: Out<I>) => NodeRef<[I, T1, T2, T3, T4, T5]> // prettier-ignore
/** @hidden */
export function withLatestFrom<I, T1, T2, T3, T4, T5, T6>( ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>]): (source: Out<I>) => NodeRef<[I, T1, T2, T3, T4, T5, T6]> // prettier-ignore
/** @hidden */
export function withLatestFrom<I, T1, T2, T3, T4, T5, T6, T7>( ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>]): (source: Out<I>) => NodeRef<[I, T1, T2, T3, T4, T5, T6, T7]> // prettier-ignore
/** @hidden */
export function withLatestFrom<I, T1, T2, T3, T4, T5, T6, T7, T8>( ...nodes: [Out<T1>, Out<T2>, Out<T3>, Out<T4>, Out<T5>, Out<T6>, Out<T7>, Out<T8>]): (source: Out<I>) => NodeRef<[I, T1, T2, T3, T4, T5, T6, T7, T8]> // prettier-ignore
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
          traceOperator(eng, 'withLatestFrom', source, args)
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
export function mapTo<I, O>(value: O): Operator<I, O> {
  return (source, eng) => {
    const sink = eng.streamInstance<O>()
    eng.connect({
      map: (done) => () => {
        traceOperator(eng, 'mapTo', source, '', value)
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
 * @typeParam I - The type of values that the incoming node will emit.
 * @typeParam O - The type of values that the filtered node will emit.
 * @category Operators
 */
export function filter<I, O = I>(predicate: (value: I) => boolean): Operator<I, O> {
  return (source, eng) => {
    const sink = eng.streamInstance<O>()
    eng.connect({
      map: (done) => (value) => {
        traceOperator(eng, 'filter', source, value, predicate.name || '<anonymous>')
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
          traceOperator(eng, 'once', source, value)
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
export function scan<I, O>(accumulator: (current: O, value: I) => O, seed: O): Operator<I, O> {
  return (source, eng) => {
    const sink = eng.streamInstance<O>()
    eng.connect({
      map: (done) => (value) => {
        traceOperator(eng, 'scan', source, value, seed)
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
 * @typeParam I - The type of values that the node will emit.
 * @category Operators
 */
export function throttleTime<I>(delay: number): Operator<I, I> {
  return (source, eng) => {
    const sink = eng.streamInstance<I>()
    let currentValue: I | undefined
    let timeout: null | ReturnType<typeof setTimeout> = null

    eng.sub(source, (value) => {
      traceOperator(eng, 'throttle', source, value, `${delay}ms`)
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
 * @typeParam I - The type of values that the node will emit.
 * @category Operators
 */
export function debounceTime<I>(delay: number): Operator<I, I> {
  return (source, eng) => {
    const sink = eng.streamInstance<I>()
    let currentValue: I | undefined
    let timeout: null | ReturnType<typeof setTimeout> = null

    eng.sub(source, (value) => {
      traceOperator(eng, 'debounceTime', source, value, `${delay}ms`)
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
      traceOperator(eng, 'delayWithMicrotask', source, value)
      queueMicrotask(() => {
        eng.pub(sink, value)
      })
    })
    return sink
  }
}

/**
 * description Buffers the stream of a node until the passed note emits.
 * @typeParam I - The type of values that the source node will emit.
 * @typeParam O - The type of values that the buffer node will emit.
 * @category Operators
 */
export function onNext<I, O>(bufNode: NodeRef<O>): Operator<I, [I, O]> {
  return (source, eng) => {
    const sink = eng.streamInstance<[I, O]>()
    const bufferValue = Symbol()
    let pendingValue: I | typeof bufferValue = bufferValue
    eng.connect({
      map: (done) => (value) => {
        if (pendingValue !== bufferValue) {
          traceOperator(eng, 'onNext', source, [pendingValue, value])
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
          .then((value) => {
            traceOperator(eng, 'handlePromise', source, value)
            eng.pub(sink, onSuccess(value))
            return
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
