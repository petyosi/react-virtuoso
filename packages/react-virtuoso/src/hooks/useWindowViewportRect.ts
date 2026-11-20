import React from 'react'

import { getCSSZoom, scaleForZoom } from '../utils/correctItemSize'
import useIsomorphicLayoutEffect from './useIsomorphicLayoutEffect'
import { useSizeWithElRef } from './useSize'

import type { WindowViewportInfo } from '../interfaces'

export default function useWindowViewportRectRef(
  callback: (info: WindowViewportInfo) => void,
  customScrollParent: HTMLElement | undefined,
  skipAnimationFrame: boolean
) {
  const viewportInfo = React.useRef<null | WindowViewportInfo>(null)
  // Resize observers queue measurements for the next frame. A frame queued before the parent changed
  // still holds an old calculateInfo, so it must read the parent from here, not from its closure.
  const customScrollParentRef = React.useRef(customScrollParent)

  useIsomorphicLayoutEffect(() => {
    customScrollParentRef.current = customScrollParent
  }, [customScrollParent])

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
      const customScrollParent = customScrollParentRef.current

      if (customScrollParent) {
        const customScrollParentRect = customScrollParent.getBoundingClientRect()
        const deltaTop = rect.top - customScrollParentRect.top
        scrollerZoom = getCSSZoom(customScrollParent)

        visibleHeight = scaleForZoom(customScrollParentRect.height - Math.max(0, deltaTop), 1 / listZoom)
        offsetTop = scaleForZoom(deltaTop, 1 / scrollerZoom) + customScrollParent.scrollTop
      } else {
        const theElementWindow = ref.current!.ownerDocument.defaultView!
        scrollerZoom = 1
        visibleHeight = scaleForZoom(theElementWindow.innerHeight - Math.max(0, rect.top), 1 / listZoom)
        offsetTop = rect.top + theElementWindow.scrollY
      }

      viewportInfo.current = {
        listHeight: scaleForZoom(rect.height, 1 / listZoom),
        offsetTop,
        visibleHeight,
        visibleWidth: scaleForZoom(rect.width, 1 / listZoom),
        zoomRatio: scrollerZoom / listZoom,
      }

      callback(viewportInfo.current)
    },
    // A new identity on parent change makes useSize observe the list again, which measures the new parent.
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
        observer.disconnect()
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
