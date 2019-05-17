import { useRef, useState, useLayoutEffect } from 'react'
import ResizeObserver from 'resize-observer-polyfill'
import { Observable } from 'rxjs'
import { distinctUntilChanged } from 'rxjs/operators'
import { TInput } from './rxio'

type UseHeight = (input: TInput<number>, onMount?: (ref: CallbackRefParam) => void) => (ref: CallbackRefParam) => void

export type CallbackRefParam = HTMLElement | null

export const useHeight: UseHeight = (input, onMount) => {
  const ref = useRef<CallbackRefParam>(null)
  const observer = new ResizeObserver(([{ contentRect: { height } }]) => {
    input(height)
  })

  const callbackRef = (elRef: CallbackRefParam) => {
    if (elRef) {
      observer.observe(elRef)
      if (onMount) {
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
