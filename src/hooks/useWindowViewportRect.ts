import { useEffect, useRef, useCallback } from 'react'
import { useSizeWithElRef } from './useSize'
import { WindowViewportInfo } from '../interfaces'
import useResizeObserver from './useResizeObserver'

const getScrollElementInfo = (element: HTMLElement, scrollElement: HTMLElement) => {
  const rect = element.getBoundingClientRect()
  const seRect = scrollElement.getBoundingClientRect()
  const deltaTop = rect.top - seRect.top
  return {
    offsetTop: deltaTop + scrollElement.scrollTop,
    visibleHeight: seRect.height - Math.max(0, deltaTop),
    visibleWidth: rect.width,
  }
}

export default function useWindowViewportRectRef(callback: (info: WindowViewportInfo) => void, scrollElement?: HTMLElement) {
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
      viewportInfo.current = scrollElement
        ? getScrollElementInfo(element, scrollElement)
        : {
            offsetTop,
            visibleHeight,
            visibleWidth,
          }
      callback(viewportInfo.current)
    },
    [callback, scrollElement]
  )

  const { callbackRef, ref } = useSizeWithElRef(calculateInfo)

  const windowEH = useCallback(() => {
    calculateInfo(ref.current)
  }, [calculateInfo, ref])

  useResizeObserver(scrollElement, windowEH) // resize events do not trigger on elements so use an observer
  useEffect(() => {
    const element = scrollElement ? scrollElement : window

    element?.addEventListener('scroll', windowEH)
    !scrollElement && window.addEventListener('resize', windowEH)
    return () => {
      element?.removeEventListener('scroll', windowEH)
      !scrollElement && window.removeEventListener('resize', windowEH)
    }
  }, [windowEH, scrollElement])

  return callbackRef
}
