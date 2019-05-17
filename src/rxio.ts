import { Subject, Observable } from 'rxjs'
import { distinctUntilChanged } from 'rxjs/operators'

type TCallback<T> = (val: T) => void

export function makeOutput<T>(observable: Observable<T>) {
  let theCallback: TCallback<T> | null = null
  observable.pipe(distinctUntilChanged()).subscribe(val => theCallback && theCallback(val))
  return (callback: TCallback<T>) => {
    theCallback = callback
  }
}

export function makeInput<T>(subject: Subject<T>) {
  return (val: T) => {
    subject.next(val)
  }
}

export type TOutput<T> = (callback: TCallback<T>) => void
export type TInput<T> = TCallback<T>
