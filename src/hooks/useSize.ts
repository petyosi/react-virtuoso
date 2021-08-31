import { useRef } from 'react'

// TypeScript 4.1 does not yet include typings for ResizeObserver (4.2 does)
declare const ResizeObserver: typeof import('resize-observer-polyfill').default

export type CallbackRefParam = HTMLElement | null

export function useSizeWithElRef(callback: (e: HTMLElement) => void, enabled = true) {
  const ref = useRef<CallbackRefParam>(null)
  const observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
    const element = entries[0].target as HTMLElement
    // Revert the RAF below - it causes a blink in the upward scrolling fix
    // See e2e/chat example
    // Avoid Resize loop limit exceeded error
    // https://github.com/edunad/react-virtuoso/commit/581d4558f2994adea375291b76fe59605556c08f
    // requestAnimationFrame(() => {
    //
    // if display: none, the element won't have an offsetParent
    // measuring it at this mode is not going to work
    // https://stackoverflow.com/a/21696585/1009797
    if (element.offsetParent !== null) {
      callback(element)
    }
    // })
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

  return { ref, callbackRef }
}

export default function useSize(callback: (e: HTMLElement) => void, enabled = true) {
  return useSizeWithElRef(callback, enabled).callbackRef
}
