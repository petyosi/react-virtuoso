import { useEffect, useRef, useCallback } from 'react'
import { useSizeWithElRef } from './useSize'
import { WindowViewportInfo } from '../interfaces'

export default function useWindowViewportRectRef(callback: (info: WindowViewportInfo) => void) {
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
      viewportInfo.current = {
        offsetTop,
        visibleHeight,
        visibleWidth,
      }
      callback(viewportInfo.current)
    },
    [callback]
  )

  const { callbackRef, ref } = useSizeWithElRef(calculateInfo)

  const windowEH = useCallback(() => {
    calculateInfo(ref.current)
  }, [calculateInfo, ref])

  useEffect(() => {
    window.addEventListener('scroll', windowEH)
    window.addEventListener('resize', windowEH)
    return () => {
      window.removeEventListener('scroll', windowEH)
      window.removeEventListener('resize', windowEH)
    }
  }, [windowEH])

  return callbackRef
}
