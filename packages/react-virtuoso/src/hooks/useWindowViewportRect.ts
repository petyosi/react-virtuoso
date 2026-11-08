import React from 'react'

import { getCSSZoom } from '../utils/correctItemSize'
import { useSizeWithElRef } from './useSize'

import type { WindowViewportInfo } from '../interfaces'

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
      // Rects are scaled by CSS zoom, scroll positions are not. The sizes are reported in the list's pixels,
      // offsetTop in the scroll container's pixels.
      const rect = element.getBoundingClientRect()
      const listZoom = getCSSZoom(element)
      let offsetTop: number, scrollerZoom: number, visibleHeight: number

      if (customScrollParent) {
        const customScrollParentRect = customScrollParent.getBoundingClientRect()
        const deltaTop = rect.top - customScrollParentRect.top
        scrollerZoom = getCSSZoom(customScrollParent)

        visibleHeight = (customScrollParentRect.height - Math.max(0, deltaTop)) / listZoom
        offsetTop = deltaTop / scrollerZoom + customScrollParent.scrollTop
      } else {
        const theElementWindow = ref.current!.ownerDocument.defaultView!
        scrollerZoom = 1
        visibleHeight = (theElementWindow.innerHeight - Math.max(0, rect.top)) / listZoom
        offsetTop = rect.top + theElementWindow.scrollY
      }

      viewportInfo.current = {
        listHeight: rect.height / listZoom,
        offsetTop,
        visibleHeight,
        visibleWidth: rect.width / listZoom,
        zoomRatio: scrollerZoom / listZoom,
      }

      callback(viewportInfo.current)
    },
    // oxlint-disable-next-line exhaustive-deps
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

    const theElementWindow = ref.current?.ownerDocument.defaultView

    theElementWindow?.addEventListener('scroll', scrollAndResizeEventHandler)
    theElementWindow?.addEventListener('resize', scrollAndResizeEventHandler)
    return () => {
      theElementWindow?.removeEventListener('scroll', scrollAndResizeEventHandler)
      theElementWindow?.removeEventListener('resize', scrollAndResizeEventHandler)
    }
  }, [scrollAndResizeEventHandler, customScrollParent, ref])

  return callbackRef
}
