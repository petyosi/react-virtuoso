import { TObservable, TSubscription } from './tinyrx'

type TCallback<T> = (val: T) => void

export function makeOutput<T>(observable: TObservable<T>) {
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

export function makeInput<T>(subject: { next: (value: T) => void }) {
  return subject.next
}

export type TOutput<T> = (callback: TCallback<T> | undefined) => void
export type TInput<T> = TCallback<T>
