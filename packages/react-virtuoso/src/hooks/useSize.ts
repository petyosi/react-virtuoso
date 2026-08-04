import React from 'react'
import ReactDOM from 'react-dom'

export type CallbackRefParam = HTMLElement | null

export default function useSize(callback: (e: HTMLElement) => void, enabled: boolean, skipAnimationFrame: boolean) {
  return useSizeWithElRef(callback, enabled, skipAnimationFrame).callbackRef
}

export function useSizeWithElRef(callback: (e: HTMLElement) => void, enabled: boolean, skipAnimationFrame: boolean) {
  const ref = React.useRef<CallbackRefParam>(null)

  let callbackRef = (_el: CallbackRefParam) => {
    void 0
  }

  const observer = React.useMemo(() => {
    if (typeof ResizeObserver !== 'undefined') {
      return new ResizeObserver((entries: ResizeObserverEntry[]) => {
        const code = () => {
          const element = entries[0]!.target as HTMLElement
          if (element.offsetParent !== null) {
            callback(element)
          }
        }
        if (skipAnimationFrame) {
          // A ResizeObserver callback isn't a React-managed event, so an unwrapped setState
          // here would paint one frame late. Match useScrollTop.ts's treatment of scroll events.
          ReactDOM.flushSync(code)
        } else {
          requestAnimationFrame(code)
        }
      })
    }
    return null
  }, [callback, skipAnimationFrame])

  callbackRef = (elRef: CallbackRefParam) => {
    if (elRef && enabled) {
      observer?.observe(elRef)
      ref.current = elRef
    } else {
      if (ref.current) {
        observer?.unobserve(ref.current)
      }
      ref.current = null
    }
  }

  return { callbackRef, ref }
}
