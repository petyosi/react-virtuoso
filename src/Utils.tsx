import { useRef, useState, useLayoutEffect } from 'react'
import ResizeObserver from 'resize-observer-polyfill'
import { Observer, Observable } from 'rxjs'
import { distinctUntilChanged } from 'rxjs/operators'

type UseHeight = (
  observer$: Observer<number>,
  onMount?: ((ref: CallbackRefParam) => void) | null
) => (ref: CallbackRefParam) => void

export type CallbackRefParam = HTMLElement | null

export const useHeight: UseHeight = (observer$, onMount = null) => {
  const ref = useRef<CallbackRefParam>(null)
  const observer = new ResizeObserver(([{ contentRect: { height } }]) => {
    observer$.next(height)
  })

  const callbackRef = (elRef: CallbackRefParam) => {
    if (elRef) {
      observer.observe(elRef)
      if (onMount !== null) {
        onMount(elRef)
      }
      ref.current = elRef
    } else {
      observer.unobserve(ref.current!)
      ref.current = null
    }
  }
  return callbackRef
}

export function useObservable<T>(observable$: Observable<T>, initialValue: T): T {
  const [value, setValue] = useState(initialValue)

  useLayoutEffect(() => {
    observable$.pipe(distinctUntilChanged()).subscribe(setValue)
  }, [])

  return value
}
