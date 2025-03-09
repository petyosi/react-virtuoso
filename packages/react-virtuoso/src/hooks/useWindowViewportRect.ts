import React from 'react'

import { WindowViewportInfo } from '../interfaces'
import { useSizeWithElRef } from './useSize'

export default function useWindowViewportRectRef(
  callback: (info: WindowViewportInfo) => void,
  customScrollParent: HTMLElement | undefined,
  skipAnimationFrame: boolean
) {
  const viewportInfo = React.useRef<null | WindowViewportInfo>(null)

  const calculateInfo = React.useCallback(
    (element: HTMLElement | null) => {
      if (!element?.offsetParent) {
        return
      }
      const rect = element.getBoundingClientRect()
      const visibleWidth = rect.width
      let offsetTop: number, visibleHeight: number

      if (customScrollParent) {
        const customScrollParentRect = customScrollParent.getBoundingClientRect()
        const deltaTop = rect.top - customScrollParentRect.top

        visibleHeight = customScrollParentRect.height - Math.max(0, deltaTop)
        offsetTop = deltaTop + customScrollParent.scrollTop
      } else {
        const theElementWindow = ref.current!.ownerDocument.defaultView!
        visibleHeight = theElementWindow.innerHeight - Math.max(0, rect.top)
        offsetTop = rect.top + theElementWindow.scrollY
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
    } else {
      const theElementWindow = ref.current!.ownerDocument.defaultView!
      theElementWindow.addEventListener('scroll', scrollAndResizeEventHandler)
      theElementWindow.addEventListener('resize', scrollAndResizeEventHandler)
      return () => {
        theElementWindow.removeEventListener('scroll', scrollAndResizeEventHandler)
        theElementWindow.removeEventListener('resize', scrollAndResizeEventHandler)
      }
    }
  }, [scrollAndResizeEventHandler, customScrollParent])

  return callbackRef
}
