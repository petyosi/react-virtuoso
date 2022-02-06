import { useEffect, useRef, useCallback } from 'react'
import { useSizeWithElRef } from './useSize'
import { WindowViewportInfo } from '../interfaces'

export default function useWindowViewportRectRef(callback: (info: WindowViewportInfo) => void, customScrollParent?: HTMLElement) {
  const viewportInfo = useRef<WindowViewportInfo | null>(null)

  const calculateInfo = useCallback(
    (element: HTMLElement | null) => {
      if (element === null) {
        return
      }
      const rect = element.getBoundingClientRect()
      const visibleWidth = rect.width
      let visibleHeight: number, offsetTop: number

      if (customScrollParent) {
        const customScrollParentRect = customScrollParent.getBoundingClientRect()
        const deltaTop = rect.top - customScrollParentRect.top

        visibleHeight = customScrollParentRect.height - Math.max(0, deltaTop)
        offsetTop = deltaTop + customScrollParent.scrollTop
      } else {
        visibleHeight = window.innerHeight - Math.max(0, rect.top)
        offsetTop = rect.top + window.pageYOffset
      }

      viewportInfo.current = {
        offsetTop,
        visibleHeight,
        visibleWidth,
      }

      callback(viewportInfo.current)
    },
    [callback, customScrollParent]
  )

  const { callbackRef, ref } = useSizeWithElRef(calculateInfo)

  const scrollAndResizeEventHandler = useCallback(() => {
    calculateInfo(ref.current)
  }, [calculateInfo, ref])

  useEffect(() => {
    if (customScrollParent) {
      customScrollParent.addEventListener('scroll', scrollAndResizeEventHandler)
      const observer = new ResizeObserver(scrollAndResizeEventHandler)
      observer.observe(customScrollParent)
      return () => {
        customScrollParent.removeEventListener('scroll', scrollAndResizeEventHandler)
        observer.unobserve(customScrollParent)
      }
    } else {
      window.addEventListener('scroll', scrollAndResizeEventHandler)
      window.addEventListener('resize', scrollAndResizeEventHandler)
      return () => {
        window.removeEventListener('scroll', scrollAndResizeEventHandler)
        window.removeEventListener('resize', scrollAndResizeEventHandler)
      }
    }
  }, [scrollAndResizeEventHandler, customScrollParent])

  return callbackRef
}
