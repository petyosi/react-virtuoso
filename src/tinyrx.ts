type TSubscriber<T> = (val: T) => void
export type TSubscription = () => void
type TSubscribe<T> = (subscriber: TSubscriber<T>) => TSubscription
type TOperator<T, K> = (val: T, done: (result: K) => void) => void
export interface TObservable<T> {
  subscribe: TSubscribe<T>
  pipe: <K extends {}>(operator: TOperator<T, K>) => TObservable<K>
}

export function myObservable<T, K>(source: TSubscribe<T>, operator: TOperator<T, K>) {
  const subscribe = (subscriber: TSubscriber<K>) => {
    return source(val => operator(val, subscriber))
  }

  const pipe = <P extends {}>(operator: TOperator<K, P>) => {
    return myObservable<K, P>(subscribe, operator)
  }

  return {
    subscribe,
    pipe,
  }
}

export function mySubject<T>(initial?: T) {
  let subscribers: TSubscriber<T>[] = []
  let val: T | undefined = initial

  const next = (newVal: T) => {
    if (newVal !== val) {
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

  const pipe = <K extends {}>(operator: TOperator<T, K>) => {
    return myObservable<T, K>(subscribe, operator)
  }

  return {
    next,
    subscribe,
    pipe,
    subscribers,
  }
}

export function combineLatest<S1, S2>(s1: TSubscribe<S1>, s2: TSubscribe<S2>): TObservable<[S1, S2]>
export function combineLatest<S1, S2, S3>(
  s1: TSubscribe<S1>,
  s2: TSubscribe<S2>,
  s3: TSubscribe<S3>
): TObservable<[S1, S2, S3]>
export function combineLatest<S1, S2, S3, S4>(
  s1: TSubscribe<S1>,
  s2: TSubscribe<S2>,
  s3: TSubscribe<S3>,
  s4: TSubscribe<S4>
): TObservable<[S1, S2, S3, S4]>
export function combineLatest<S1, S2, S3, S4, S5, S6, S7>(
  s1: TSubscribe<S1>,
  s2: TSubscribe<S2>,
  s3: TSubscribe<S3>,
  s4: TSubscribe<S4>,
  s5: TSubscribe<S5>,
  s6: TSubscribe<S6>,
  s7: TSubscribe<S7>
): TObservable<[S1, S2, S3, S4, S5, S6, S7]>
export function combineLatest(...sources: TSubscribe<any>[]): TObservable<any[]> {
  const called = Array<boolean>(sources.length).fill(false)
  const values = Array<any>(sources.length)
  let subscribers: TSubscriber<any>[] = []

  const publish = (subscribers: TSubscriber<any>[]) => {
    called.every(isCalled => isCalled) && subscribers.forEach(subscriber => subscriber(values))
  }

  sources.forEach((source, index) => {
    source(val => {
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

  const pipe = <K extends {}>(operator: TOperator<any[], K>) => {
    return myObservable<any[], K>(subscribe, operator)
  }

  return { subscribe, pipe }
}

export function combineOperators<A1, R1, R2>(o1: TOperator<A1, R1>, o2: TOperator<R1, R2>): TOperator<A1, R2>
export function combineOperators<A1, R1, R2>(o1: TOperator<A1, R1>, o2: TOperator<R1, R2>): TOperator<A1, R2>
export function combineOperators<A1, R1, R2, R3>(
  o1: TOperator<A1, R1>,
  o2: TOperator<R1, R2>,
  o3: TOperator<R2, R3>
): TOperator<A1, R3>
export function combineOperators<A1, R1, R2, R3, R4>(
  o1: TOperator<A1, R1>,
  o2: TOperator<R1, R2>,
  o3: TOperator<R2, R3>,
  o4: TOperator<R3, R4>
): TOperator<A1, R4>
export function combineOperators<T, K>(...operators: TOperator<unknown, unknown>[]) {
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

export function map<T, K>(map: (val: T) => K): (val: T, subscriber: TSubscriber<K>) => void {
  return (val: T, subscriber: TSubscriber<K>) => {
    subscriber(map(val))
  }
}

export function audit<T>() {
  let val: T | undefined
  let timeout: any

  return (newVal: T, done: TSubscriber<T>) => {
    val = newVal
    if (!timeout) {
      timeout = setTimeout(() => {
        timeout = undefined
        done(val!)
      }, 0)
    }
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

export function distinctUntilChanged<T>() {
  // let val: T | undefined

  return (newVal: T, done: TSubscriber<T>) => {
    done(newVal)
  }
}

export function scan<T, K>(scanner: (prevVal: T, current: K) => T, initialValue: T) {
  let prevVal: T = initialValue
  return (newVal: K, done: TSubscriber<T>) => {
    done((prevVal = scanner(prevVal, newVal)))
  }
}

export function withLatestFrom<T, R1>(s1: TSubscribe<R1>): (val: T, done: TSubscriber<[T, R1]>) => void
export function withLatestFrom<T, R1, R2>(
  s1: TSubscribe<R1>,
  s2: TSubscribe<R2>
): (val: T, done: TSubscriber<[T, R1, R2]>) => void

export function withLatestFrom<T>(...sources: TSubscribe<any>[]) {
  const called = Array<boolean>(sources.length).fill(false)
  const values = Array<any>(sources.length)
  sources.forEach((source, index) => {
    source(val => {
      values[index] = val
      called[index] = true
    })
  })

  return (val: T, done: TSubscriber<any>) => {
    called.every(isCalled => isCalled) && done([val, ...values])
  }
}
