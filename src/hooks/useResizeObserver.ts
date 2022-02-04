import { useEffect } from 'react'

const isAvailable = typeof ResizeObserver !== 'undefined'

export default function useResizeObserver(scrollElement: HTMLElement | undefined, callback: () => void) {
  useEffect(() => {
    const observer = isAvailable && scrollElement ? new ResizeObserver(() => callback()) : undefined
    isAvailable && scrollElement && observer?.observe(scrollElement)
    return () => {
      isAvailable && scrollElement && observer?.unobserve(scrollElement)
    }
  }, [callback, scrollElement])
}
