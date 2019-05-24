import { TObservable, TSubscriber } from './tinyrx'

type TCallback<T> = (val: T) => void

export function makeOutput<T>(observable: TObservable<T>) {
  let theCallback: TCallback<T> | undefined
  let subscription: TSubscriber<T> = val => {
    theCallback && theCallback(val)
  }

  let subscribed = false

  return (callback: TCallback<T> | undefined) => {
    theCallback = callback
    if (!subscribed) {
      observable.subscribe(subscription)
      subscribed = true
    }
  }
}

export function makeInput<T>(subject: { next: (value: T) => void }) {
  return subject.next
}

export type TOutput<T> = (callback: TCallback<T>) => void
export type TInput<T> = TCallback<T>
