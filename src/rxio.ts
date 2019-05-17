import { Subject, Observable, Subscription } from 'rxjs'
import { distinctUntilChanged } from 'rxjs/operators'

type TCallback<T> = (val: T) => void

export function makeOutput<T>(observable: Observable<T>) {
  let subscription: Subscription | undefined

  return (callback: TCallback<T> | undefined) => {
    subscription && subscription.unsubscribe()
    if (callback) {
      subscription = observable.pipe(distinctUntilChanged()).subscribe(callback)
    }
  }
}

export function makeInput<T>(subject: Subject<T>) {
  return (val: T) => {
    subject.next(val)
  }
}

export type TOutput<T> = (callback: TCallback<T>) => void
export type TInput<T> = TCallback<T>
