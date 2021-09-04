import { useRef, useCallback, useEffect } from 'react'
import * as u from '@virtuoso.dev/urx'
import { correctItemSize } from '../utils/correctItemSize'

export type ScrollerRef = Window | HTMLElement | null

function approximatelyEqual(num1: number, num2: number) {
  return Math.abs(num1 - num2) < 1
}

export default function useScrollTop(
  scrollTopCallback: (scrollTop: number) => void,
  smoothScrollTargetReached: (yes: true) => void,
  scrollerElement: any,
  scrollerRefCallback: (ref: ScrollerRef) => void = u.noop
) {
  const scrollerRef = useRef<HTMLElement | null | Window>(null)
  const scrollTopTarget = useRef<any>(null)
  const timeoutRef = useRef<any>(null)

  const handler = useCallback(
    (ev: Event) => {
      const el = ev.target as HTMLElement
      const scrollTop =
        (el as any) === window || (el as any) === document ? window.pageYOffset || document.documentElement.scrollTop : el.scrollTop
      scrollTopCallback(Math.max(scrollTop, 0))

      if (scrollTopTarget.current !== null) {
        if (scrollTop === scrollTopTarget.current || scrollTop <= 0 || scrollTop === el.scrollHeight - correctItemSize(el, 'height')) {
          scrollTopTarget.current = null
          smoothScrollTargetReached(true)
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
          }
        }
      }
    },
    [scrollTopCallback, smoothScrollTargetReached]
  )

  useEffect(() => {
    const localRef = scrollerRef.current!

    scrollerRefCallback(scrollerRef.current)
    handler(({ target: localRef } as unknown) as Event)
    localRef.addEventListener('scroll', handler, { passive: true })

    return () => {
      scrollerRefCallback(null)
      localRef.removeEventListener('scroll', handler)
    }
  }, [scrollerRef, handler, scrollerElement, scrollerRefCallback])

  function scrollToCallback(location: ScrollToOptions) {
    const scrollerElement = scrollerRef.current
    if (!scrollerElement) {
      return
    }

    const isSmooth = location.behavior === 'smooth'

    let offsetHeight: number
    let scrollHeight: number
    let scrollTop: number

    if (scrollerElement === window) {
      // this is not a mistake
      scrollHeight = Math.max(correctItemSize(document.documentElement, 'height'), document.documentElement.scrollHeight)
      offsetHeight = window.innerHeight
      scrollTop = document.documentElement.scrollTop
    } else {
      scrollHeight = (scrollerElement as HTMLElement).scrollHeight
      offsetHeight = correctItemSize(scrollerElement as HTMLElement, 'height')
      scrollTop = (scrollerElement as HTMLElement).scrollTop
    }

    // avoid system hanging because the DOM never called back
    // with the scrollTop
    // scroller is already at this location
    if (approximatelyEqual(offsetHeight, scrollHeight) || location.top === scrollTop) {
      scrollTopCallback(scrollTop)
      if (isSmooth) {
        smoothScrollTargetReached(true)
      }
      return
    }

    const maxScrollTop = scrollHeight - offsetHeight
    location.top = Math.max(Math.min(maxScrollTop, location.top!), 0)

    if (isSmooth) {
      scrollTopTarget.current = location.top
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null
        scrollTopTarget.current = null
        smoothScrollTargetReached(true)
      }, 1000)
    } else {
      scrollTopTarget.current = null
    }

    scrollerElement.scrollTo(location)
  }

  function scrollByCallback(location: ScrollToOptions) {
    if (scrollTopTarget.current === null) {
      scrollerRef.current!.scrollBy(location)
    }
  }

  return { scrollerRef, scrollByCallback, scrollToCallback }
}
