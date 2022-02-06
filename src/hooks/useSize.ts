import { useRef } from 'react'

export type CallbackRefParam = HTMLElement | null

export function useSizeWithElRef(callback: (e: HTMLElement) => void, enabled = true) {
  const ref = useRef<CallbackRefParam>(null)

  let callbackRef = (_el: CallbackRefParam) => {
    void 0
  }

  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      const element = entries[0].target as HTMLElement
      if (element.offsetParent !== null) {
        callback(element)
      }
    })

    callbackRef = (elRef: CallbackRefParam) => {
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
  }

  return { ref, callbackRef }
}

export default function useSize(callback: (e: HTMLElement) => void, enabled = true) {
  return useSizeWithElRef(callback, enabled).callbackRef
}
