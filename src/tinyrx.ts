export type TSubscriber<T> = (val: T) => void
export type TSubscription = () => void
export type TSubscribe<T> = (subscriber: TSubscriber<T>) => TSubscription
export type TOperator<T, K> = (val: T, done: (result: K) => void) => void

export interface TObservable<T> {
  subscribe: TSubscribe<T>
  pipe(...operators: []): TObservable<T>
  pipe<R1>(...operators: [TOperator<T, R1>]): TObservable<R1>
  pipe<R1, R2>(...operators: [TOperator<T, R1>, TOperator<R1, R2>]): TObservable<R2>
  pipe<R1, R2, R3>(...operators: [TOperator<T, R1>, TOperator<R1, R2>, TOperator<R2, R3>]): TObservable<R3>
}

function combineOperators<A1>(): TOperator<A1, A1>
function combineOperators<A1, R1>(o1: TOperator<A1, R1>): TOperator<A1, R1>
function combineOperators<A1, R1, R2>(o1: TOperator<A1, R1>, o2: TOperator<R1, R2>): TOperator<A1, R2>
function combineOperators<A1, R1, R2>(o1: TOperator<A1, R1>, o2: TOperator<R1, R2>): TOperator<A1, R2>
function combineOperators<A1, R1, R2, R3>(
  o1: TOperator<A1, R1>,
  o2: TOperator<R1, R2>,
  o3: TOperator<R2, R3>
): TOperator<A1, R3>
function combineOperators<A1, R1, R2, R3, R4>(
  o1: TOperator<A1, R1>,
  o2: TOperator<R1, R2>,
  o3: TOperator<R2, R3>,
  o4: TOperator<R3, R4>
): TOperator<A1, R4>
function combineOperators<T>(...operators: TOperator<any, any>[]): TOperator<T, any>
function combineOperators<T, K>(...operators: TOperator<any, any>[]) {
  if (operators.length === 0) {
    return (value: T, subscriber: (value: T) => void) => subscriber(value)
  }
  if (operators.length === 1) {
    return operators[0]
  }

  return (value: T, subscriber: (value: K) => void): void => {
    let acc = (value: any) => subscriber(value)
    operators
      .slice()
      .reverse()
      .forEach(operator => {
        const prevCallback = acc
        acc = value => operator(value, prevCallback)
      })
    acc(value)
  }
}

function buildPipe<T>(subscribe: TSubscribe<T>) {
  function pipe(...operators: []): TObservable<T>
  function pipe<R1>(...operators: [TOperator<T, R1>]): TObservable<R1>
  function pipe<R1, R2>(...operators: [TOperator<T, R1>, TOperator<R1, R2>]): TObservable<R2>
  function pipe<R1, R2, R3>(...operators: [TOperator<T, R1>, TOperator<R1, R2>, TOperator<R2, R3>]): TObservable<R3>
  function pipe<K extends TOperator<any, any>[]>(...operators: K) {
    const operator = combineOperators(...operators)
    return observable(subscribe, operator)
  }
  return pipe
}

export function observable<T, K>(source: TSubscribe<T>, operator: TOperator<T, K>) {
  const subscribe = (subscriber: TSubscriber<K>) => {
    return source(val => operator(val, subscriber))
  }

  return {
    subscribe,
    pipe: buildPipe(subscribe),
  }
}

export function subject<T>(initial?: T, distinct = true) {
  let subscribers: TSubscriber<T>[] = []
  let val: T | undefined = initial

  const next = (newVal: T) => {
    if (!distinct || newVal !== val) {
      val = newVal
      subscribers.forEach(subscriber => subscriber(newVal))
    }
  }

  const subscribe = (subscriber: TSubscriber<T>) => {
    subscribers.push(subscriber)
    if (val !== undefined) {
      subscriber(val)
    }
    return () => {
      subscribers = subscribers.filter(sub => sub !== subscriber)
    }
  }

  return {
    next,
    subscribe,
    pipe: buildPipe(subscribe),
    subscribers,
  }
}

export function coldSubject<T>() {
  let subscribers: TSubscriber<T>[] = []

  const next = (newVal: T) => {
    subscribers.forEach(subscriber => subscriber(newVal))
  }

  const subscribe = (subscriber: TSubscriber<T>) => {
    subscribers.push(subscriber)
    return () => {
      subscribers = subscribers.filter(sub => sub !== subscriber)
    }
  }

  return {
    next,
    subscribe,
    pipe: buildPipe(subscribe),
  }
}

export function combineLatest<S1, S2>(s1: TObservable<S1>, s2: TObservable<S2>): TObservable<[S1, S2]>
export function combineLatest<S1, S2, S3>(
  s1: TObservable<S1>,
  s2: TObservable<S2>,
  s3: TObservable<S3>
): TObservable<[S1, S2, S3]>
export function combineLatest<S1, S2, S3, S4>(
  s1: TObservable<S1>,
  s2: TObservable<S2>,
  s3: TObservable<S3>,
  s4: TObservable<S4>
): TObservable<[S1, S2, S3, S4]>
export function combineLatest<S1, S2, S3, S4, S5, S6, S7>(
  s1: TObservable<S1>,
  s2: TObservable<S2>,
  s3: TObservable<S3>,
  s4: TObservable<S4>,
  s5: TObservable<S5>,
  s6: TObservable<S6>,
  s7: TObservable<S7>
): TObservable<[S1, S2, S3, S4, S5, S6, S7]>
export function combineLatest<S1, S2, S3, S4, S5, S6, S7, S8>(
  s1: TObservable<S1>,
  s2: TObservable<S2>,
  s3: TObservable<S3>,
  s4: TObservable<S4>,
  s5: TObservable<S5>,
  s6: TObservable<S6>,
  s7: TObservable<S7>,
  s8: TObservable<S8>
): TObservable<[S1, S2, S3, S4, S5, S6, S7, S8]>
export function combineLatest(...sources: TObservable<any>[]): TObservable<any[]> {
  const called = Array<boolean>(sources.length).fill(false)
  const values = Array<any>(sources.length)
  let subscribers: TSubscriber<any>[] = []

  const publish = (subscribers: TSubscriber<any>[]) => {
    called.every(isCalled => isCalled) && subscribers.forEach(subscriber => subscriber(values))
  }

  sources.forEach((source, index) => {
    source.subscribe(val => {
      called[index] = true
      values[index] = val
      publish(subscribers)
    })
  })

  const subscribe = (subscriber: TSubscriber<any[]>) => {
    subscribers.push(subscriber)
    publish([subscriber])
    return () => {
      subscribers = subscribers.filter(sub => sub !== subscriber)
    }
  }

  return { subscribe, pipe: buildPipe(subscribe) }
}

export function map<T, K>(map: (val: T) => K): (val: T, subscriber: TSubscriber<K>) => void {
  return (val: T, subscriber: TSubscriber<K>) => {
    subscriber(map(val))
  }
}

export function mapTo<T>(val: T) {
  return (_: any, done: TSubscriber<T>) => done(val)
}

export function skip<T>(times: number) {
  return (val: T, done: TSubscriber<T>) => {
    if (times > 0) {
      times--
    } else {
      done(val)
    }
  }
}

export function filter<T>(predicate: (val: T) => boolean) {
  return (val: T, done: TSubscriber<T>) => {
    predicate(val) && done(val)
  }
}

export function debounceTime<T>(time: number) {
  let val: T | undefined
  let timeout: any

  return (newVal: T, done: TSubscriber<T>) => {
    val = newVal
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      done(val!)
    }, time)
  }
}

export function scan<T, K>(scanner: (prevVal: T, current: K) => T, initialValue: T) {
  let prevVal: T = initialValue
  return (newVal: K, done: TSubscriber<T>) => {
    done((prevVal = scanner(prevVal, newVal)))
  }
}

export function withLatestFrom<T, R1>(s1: TObservable<R1>): (val: T, done: TSubscriber<[T, R1]>) => void
export function withLatestFrom<T, R1, R2>(
  s1: TObservable<R1>,
  s2: TObservable<R2>
): (val: T, done: TSubscriber<[T, R1, R2]>) => void
export function withLatestFrom<T, R1, R2, R3>(
  s1: TObservable<R1>,
  s2: TObservable<R2>,
  s3: TObservable<R3>
): (val: T, done: TSubscriber<[T, R1, R2, R3]>) => void
export function withLatestFrom<T, R1, R2, R3, R4>(
  s1: TObservable<R1>,
  s2: TObservable<R2>,
  s3: TObservable<R3>,
  s4: TObservable<R4>
): (val: T, done: TSubscriber<[T, R1, R2, R3, R4]>) => void
export function withLatestFrom<T, R1, R2, R3, R4, R5>(
  s1: TObservable<R1>,
  s2: TObservable<R2>,
  s3: TObservable<R3>,
  s4: TObservable<R4>,
  s5: TObservable<R5>
): (val: T, done: TSubscriber<[T, R1, R2, R3, R4, R5]>) => void

export function withLatestFrom<T>(...sources: TObservable<any>[]) {
  const called = Array<boolean>(sources.length).fill(false)
  const values = Array<any>(sources.length)
  sources.forEach((source, index) => {
    source.subscribe(val => {
      values[index] = val
      called[index] = true
    })
  })

  return (val: T, done: TSubscriber<any>) => {
    called.every(isCalled => isCalled) && done([val, ...values])
  }
}
