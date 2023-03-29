import React from 'react'

export type CallbackRefParam = HTMLElement | null

export function useSizeWithElRef(callback: (e: HTMLElement) => void, enabled = true) {
  const ref = React.useRef<CallbackRefParam>(null)

  let callbackRef = (elRef: CallbackRefParam) => {
    if (elRef) {
      callback(elRef)
      ref.current = elRef
    } else {
      ref.current = null
    }
  }

  if (typeof ResizeObserver !== 'undefined' && enabled) {
    const observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      const element = entries[0].target as HTMLElement
      if (element.offsetParent !== null) {
        callback(element)
      }
    })

    callbackRef = (elRef: CallbackRefParam) => {
      if (elRef) {
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
