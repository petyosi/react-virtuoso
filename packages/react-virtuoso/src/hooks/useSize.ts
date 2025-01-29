import React from 'react'

export type CallbackRefParam = HTMLElement | null

export function useSizeWithElRef(callback: (e: HTMLElement) => void, enabled: boolean, skipAnimationFrame: boolean) {
  const ref = React.useRef<CallbackRefParam>(null)

  let callbackRef = (_el: CallbackRefParam) => {
    void 0
  }

  if (typeof ResizeObserver !== 'undefined') {
    const observer = React.useMemo(() => {
      return new ResizeObserver((entries: ResizeObserverEntry[]) => {
        const code = () => {
          const element = entries[0].target as HTMLElement
          if (element.offsetParent !== null) {
            callback(element)
          }
        }
        skipAnimationFrame ? code() : requestAnimationFrame(code)
      })
    }, [callback])

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

export default function useSize(callback: (e: HTMLElement) => void, enabled: boolean, skipAnimationFrame: boolean) {
  return useSizeWithElRef(callback, enabled, skipAnimationFrame).callbackRef
}
