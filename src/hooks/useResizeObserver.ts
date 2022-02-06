import { useEffect } from 'react'

const isAvailable = typeof ResizeObserver !== 'undefined'

export default function useResizeObserver(customScrollParent: HTMLElement | undefined, callback: () => void) {
  useEffect(() => {
    const observer = isAvailable && customScrollParent ? new ResizeObserver(() => callback()) : undefined
    isAvailable && customScrollParent && observer?.observe(customScrollParent)
    return () => {
      isAvailable && customScrollParent && observer?.unobserve(customScrollParent)
    }
  }, [callback, customScrollParent])
}
