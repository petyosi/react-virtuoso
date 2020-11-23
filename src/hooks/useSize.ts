import { useRef } from 'react'
import ResizeObserver from 'resize-observer-polyfill'

export type CallbackRefParam = HTMLElement | null

export default function useSize(callback: (e: HTMLElement) => void, enabled: boolean = true) {
  const ref = useRef<CallbackRefParam>(null)
  const observer = new ResizeObserver(entries => {
    callback(entries[0].target as HTMLElement)
  })

  const callbackRef = (elRef: CallbackRefParam) => {
    if (elRef && enabled) {
      observer.observe(elRef)
      ref.current = elRef
    } else {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
      ref.current = null
    }
  }

  return callbackRef
}
