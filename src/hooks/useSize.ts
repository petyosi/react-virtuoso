import { useRef } from 'react'
import ResizeObserver from 'resize-observer-polyfill'

export type CallbackRefParam = HTMLElement | null

export function useSizeWithElRef(callback: (e: HTMLElement) => void, enabled: boolean = true) {
  const ref = useRef<CallbackRefParam>(null)
  const observer = new ResizeObserver(entries => {
    const element = entries[0].target as HTMLElement
    // Avoid Resize loop limit exceeded error
    // https://github.com/edunad/react-virtuoso/commit/581d4558f2994adea375291b76fe59605556c08f
    requestAnimationFrame(() => {
      // if display: none, the element won't have an offsetParent
      // measuring it at this mode is not going to work
      // https://stackoverflow.com/a/21696585/1009797
      if (element.offsetParent !== null) {
        callback(element)
      }
    })
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

export default function useSize(callback: (e: HTMLElement) => void, enabled: boolean = true) {
  return useSizeWithElRef(callback, enabled).callbackRef
}
