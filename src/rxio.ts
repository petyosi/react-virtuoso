import { TObservable, distinctUntilChanged, TSubscription } from './tinyrx'

type TCallback<T> = (val: T) => void

export function makeOutput<T>(observable: TObservable<T>) {
  let unsubscribe: TSubscription | undefined

  return (callback: TCallback<T> | undefined) => {
    unsubscribe && unsubscribe()
    if (callback) {
      unsubscribe = observable.pipe(distinctUntilChanged()).subscribe(callback)
    }
  }
}

export function makeInput<T>(subject: { next: (val: T) => void }) {
  return subject.next
}

export type TOutput<T> = (callback: TCallback<T>) => void
export type TInput<T> = TCallback<T>
