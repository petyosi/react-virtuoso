import { useEffect, useRef, useCallback } from 'react'
import { useSizeWithElRef } from './useSize'
import { WindowViewportInfo } from '../interfaces'
import useResizeObserver from './useResizeObserver'

const getScrollElementInfo = (element: HTMLElement, customScrollParent: HTMLElement) => {
  const rect = element.getBoundingClientRect()
  const seRect = customScrollParent.getBoundingClientRect()
  const deltaTop = rect.top - seRect.top
  return {
    offsetTop: deltaTop + customScrollParent.scrollTop,
    visibleHeight: seRect.height - Math.max(0, deltaTop),
    visibleWidth: rect.width,
  }
}

export default function useWindowViewportRectRef(callback: (info: WindowViewportInfo) => void, customScrollParent?: HTMLElement) {
  const viewportInfo = useRef<WindowViewportInfo | null>(null)

  const calculateInfo = useCallback(
    (element: HTMLElement | null) => {
      if (element === null) {
        return
      }
      const rect = element.getBoundingClientRect()
      const visibleHeight = window.innerHeight - Math.max(0, rect.top)

      const visibleWidth = rect.width
      const offsetTop = rect.top + window.pageYOffset
      viewportInfo.current = customScrollParent
        ? getScrollElementInfo(element, customScrollParent)
        : {
            offsetTop,
            visibleHeight,
            visibleWidth,
          }
      callback(viewportInfo.current)
    },
    [callback, customScrollParent]
  )

  const { callbackRef, ref } = useSizeWithElRef(calculateInfo)

  const windowEH = useCallback(() => {
    calculateInfo(ref.current)
  }, [calculateInfo, ref])

  useResizeObserver(customScrollParent, windowEH) // resize events do not trigger on elements so use an observer
  useEffect(() => {
    const element = customScrollParent ? customScrollParent : window

    element?.addEventListener('scroll', windowEH)
    !customScrollParent && window.addEventListener('resize', windowEH)
    return () => {
      element?.removeEventListener('scroll', windowEH)
      !customScrollParent && window.removeEventListener('resize', windowEH)
    }
  }, [windowEH, customScrollParent])

  return callbackRef
}
