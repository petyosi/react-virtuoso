import { useEffect, useRef, useCallback } from 'react'
import { useSizeWithElRef } from './useSize'
import { WindowViewportInfo } from '../interfaces'

const getScrollElementInfo = (element: HTMLElement, scrollElement: HTMLElement) => {
  const rect = element.getBoundingClientRect()
  const seRect = scrollElement.getBoundingClientRect()
  var deltaTop = rect.top - seRect.top  
  return {
    offsetTop: deltaTop + scrollElement.scrollTop,
    visibleHeight: seRect.height - Math.max(0, deltaTop),
    visibleWidth: rect.width
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
      viewportInfo.current = scrollElement ? getScrollElementInfo(element, scrollElement) : {
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

  useEffect(() => {
    var element = scrollElement ? scrollElement : window

    element?.addEventListener('scroll', windowEH)
    element?.addEventListener('resize', windowEH)
    return () => {
      element?.removeEventListener('scroll', windowEH)
      element?.removeEventListener('resize', windowEH)
    }
  }, [windowEH, scrollElement])

  return callbackRef
}
