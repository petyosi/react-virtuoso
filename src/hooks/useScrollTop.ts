import { useRef, useCallback, useEffect } from 'react'

export type CallbackRefParam = HTMLElement | null

export default function useScrollTop(scrollTopCallback: (scrollTop: number) => void, smoothScrollTargetReached: (yes: true) => void) {
  const scrollerRef = useRef<any>(null)
  const scrollTopTarget = useRef<any>(null)
  const timeoutRef = useRef<any>(null)

  const handler = useCallback(
    (ev: Event) => {
      const scrollTop = (ev.target as HTMLElement).scrollTop
      scrollTopCallback(Math.max(scrollTop, 0))

      if (scrollTopTarget.current !== null && scrollTop === scrollTopTarget.current) {
        scrollTopTarget.current = null
        smoothScrollTargetReached(true)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
      }
    },
    [scrollTopCallback, smoothScrollTargetReached]
  )

  useEffect(() => {
    const localRef = scrollerRef.current!
    handler({ target: localRef } as Event)
    localRef.addEventListener('scroll', handler)

    return () => {
      localRef.removeEventListener('scroll', handler)
    }
  }, [scrollerRef, handler])

  const scrollToCallback = (location: ScrollToOptions) => {
    const scrollerElement = scrollerRef.current
    if (!scrollerElement) {
      return
    }

    // avoid system hanging because the DOM never called back
    // with the scrollTop
    if (scrollerElement.offsetHeight === scrollerElement.scrollHeight) {
      scrollTopCallback(scrollerElement.scrollTop)
      return
    }

    const maxScrollTop = scrollerElement.scrollHeight - scrollerElement.offsetHeight
    location.top = Math.max(Math.min(maxScrollTop, location.top!), 0)

    if (location.behavior === 'smooth') {
      scrollTopTarget.current = location.top
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null
        smoothScrollTargetReached(true)
      }, 1000)
    } else {
      scrollTopTarget.current = null
    }

    scrollerElement.scrollTo(location)
  }

  const scrollByCallback = (location: ScrollToOptions) => {
    if (scrollTopTarget.current === null) {
      scrollerRef.current.scrollBy(location)
    }
  }

  return { scrollerRef, scrollByCallback, scrollToCallback }
}
