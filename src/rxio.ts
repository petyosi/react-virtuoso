import { TObservable, TSubscription } from './tinyrx'

export interface TOutput<T> {
  (callback: TCallback<T> | undefined): void
}

export interface TInput<T> {
  (val: T): void
}

type TCallback<T> = (val: T) => void

export function makeOutput<T>(observable: TObservable<T>): TOutput<T> {
  let unsubscribe: TSubscription | undefined

  return (callback: TCallback<T> | undefined) => {
    if (unsubscribe) {
      unsubscribe()
    }
    if (callback) {
      unsubscribe = observable.subscribe(callback)
    }
  }
}

export function makeInput<T>(subject: { next: (value: T) => void }): TInput<T> {
  return subject.next
}
