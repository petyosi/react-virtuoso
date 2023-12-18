import { useRef } from 'react'

import { useRcPortalWindowContext } from './useRcPortalWindowContext'

export type CallbackRefParam = HTMLElement | null

export function useSizeWithElRef(callback: (e: HTMLElement) => void, enabled = true) {
  const ref = useRef<CallbackRefParam>(null)
  const { externalWindow = window } = useRcPortalWindowContext()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let callbackRef = (_el: CallbackRefParam) => {
    // eslint-disable-next-line no-void
    void 0
  }

  // TODO: fix after upgrade ts
  if (typeof externalWindow['ResizeObserver'] !== 'undefined') {
    const observer = new externalWindow['ResizeObserver']((entries: ResizeObserverEntry[]) => {
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
