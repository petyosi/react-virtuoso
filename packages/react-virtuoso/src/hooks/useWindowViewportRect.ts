import React from 'react'
import type { WindowViewportInfo } from '../interfaces'
import { useSizeWithElRef } from './useSize'

export default function useWindowViewportRectRef(
  callback: (info: WindowViewportInfo) => void,
  customScrollParent: HTMLElement | undefined,
  skipAnimationFrame: boolean
) {
  const viewportInfo = React.useRef<WindowViewportInfo | null>(null)

  const calculateInfo = React.useCallback(
    (element: HTMLElement | null) => {
      if (element === null || !element.offsetParent) {
        return
      }
      const rect = element.getBoundingClientRect()
      const visibleWidth = rect.width
      let visibleHeight: number
      let offsetTop: number

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

  const { callbackRef, ref } = useSizeWithElRef(calculateInfo, true, skipAnimationFrame)

  const scrollAndResizeEventHandler = React.useCallback(() => {
    calculateInfo(ref.current)
  }, [calculateInfo, ref])

  React.useEffect(() => {
    if (customScrollParent) {
      customScrollParent.addEventListener('scroll', scrollAndResizeEventHandler)
      const observer = new ResizeObserver(() => {
        requestAnimationFrame(scrollAndResizeEventHandler)
      })
      observer.observe(customScrollParent)
      return () => {
        customScrollParent.removeEventListener('scroll', scrollAndResizeEventHandler)
        observer.unobserve(customScrollParent)
      }
    }

    window.addEventListener('scroll', scrollAndResizeEventHandler)
    window.addEventListener('resize', scrollAndResizeEventHandler)
    return () => {
      window.removeEventListener('scroll', scrollAndResizeEventHandler)
      window.removeEventListener('resize', scrollAndResizeEventHandler)
    }
  }, [scrollAndResizeEventHandler, customScrollParent])

  return callbackRef
}
