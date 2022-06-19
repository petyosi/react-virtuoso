import { useRef, useCallback, useEffect } from 'react'
import * as u from '@virtuoso.dev/urx'
import { correctItemSize } from '../utils/correctItemSize'
import { ScrollContainerState } from '../interfaces'
import { flushSync } from 'react-dom'
import { approximatelyEqual } from '../utils/approximatelyEqual'

export type ScrollerRef = Window | HTMLElement | null

export default function useScrollTop(
  scrollContainerStateCallback: (state: ScrollContainerState) => void,
  smoothScrollTargetReached: (yes: true) => void,
  scrollerElement: any,
  scrollerRefCallback: (ref: ScrollerRef) => void = u.noop,
  customScrollParent?: HTMLElement
) {
  const scrollerRef = useRef<HTMLElement | null | Window>(null)
  const scrollTopTarget = useRef<any>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shouldFlushSync = useRef(false)

  const handler = useCallback(
    (ev: Event) => {
      const el = ev.target as HTMLElement
      const scrollTop =
        (el as any) === window || (el as any) === document ? window.pageYOffset || document.documentElement.scrollTop : el.scrollTop
      const scrollHeight = (el as any) === window ? document.documentElement.scrollHeight : el.scrollHeight
      const viewportHeight = (el as any) === window ? window.innerHeight : el.offsetHeight

      const call = () => {
        scrollContainerStateCallback({
          scrollTop: Math.max(scrollTop, 0),
          scrollHeight,
          viewportHeight,
        })
      }

      if (shouldFlushSync.current) {
        flushSync(call)
      } else {
        call()
      }
      shouldFlushSync.current = false

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
    [scrollContainerStateCallback, smoothScrollTargetReached]
  )

  useEffect(() => {
    const localRef = customScrollParent ? customScrollParent : scrollerRef.current!

    scrollerRefCallback(customScrollParent ? customScrollParent : scrollerRef.current)
    handler({ target: localRef } as unknown as Event)
    localRef.addEventListener('scroll', handler, { passive: true })

    return () => {
      scrollerRefCallback(null)
      localRef.removeEventListener('scroll', handler)
    }
  }, [scrollerRef, handler, scrollerElement, scrollerRefCallback, customScrollParent])

  function scrollToCallback(location: ScrollToOptions) {
    const scrollerElement = scrollerRef.current
    if (!scrollerElement || ('offsetHeight' in scrollerElement && scrollerElement.offsetHeight === 0)) {
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

    const maxScrollTop = scrollHeight - offsetHeight
    location.top = Math.ceil(Math.max(Math.min(maxScrollTop, location.top!), 0))

    // avoid system hanging because the DOM never called back
    // with the scrollTop
    // scroller is already at this location
    if (approximatelyEqual(offsetHeight, scrollHeight) || location.top === scrollTop) {
      scrollContainerStateCallback({ scrollTop, scrollHeight, viewportHeight: offsetHeight })
      if (isSmooth) {
        smoothScrollTargetReached(true)
      }
      return
    }

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
    shouldFlushSync.current = true
    scrollerRef.current!.scrollBy(location)
  }

  return { scrollerRef, scrollByCallback, scrollToCallback }
}
