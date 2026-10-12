import React from 'react'

import type { SizeObserverGroup } from './sizeObserverGroup'

export type CallbackRefParam = HTMLElement | null

export default function useSize(
  callback: (e: HTMLElement) => void,
  enabled: boolean,
  skipAnimationFrame: boolean,
  group?: SizeObserverGroup
) {
  return useSizeWithElRef(callback, enabled, skipAnimationFrame, group).callbackRef
}

export function useSizeWithElRef(
  callback: (e: HTMLElement) => void,
  enabled: boolean,
  skipAnimationFrame: boolean,
  group?: SizeObserverGroup
) {
  const ref = React.useRef<CallbackRefParam>(null)

  const measure = React.useCallback(() => {
    const element = ref.current
    if (element !== null && element.offsetParent !== null) {
      callback(element)
    }
  }, [callback])

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
        if (group) {
          group.measure()
        } else if (skipAnimationFrame) {
          code()
        } else {
          requestAnimationFrame(code)
        }
      })
    }
    return null
  }, [callback, skipAnimationFrame, group])

  callbackRef = (elRef: CallbackRefParam) => {
    if (elRef && enabled) {
      observer?.observe(elRef)
      ref.current = elRef
      group?.callbacks.add(measure)
    } else {
      if (ref.current) {
        observer?.unobserve(ref.current)
      }
      ref.current = null
      group?.callbacks.delete(measure)
    }
  }

  return { callbackRef, ref }
}
