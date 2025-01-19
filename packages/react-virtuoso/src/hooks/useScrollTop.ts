import React from 'react'
import ReactDOM from 'react-dom'
import type { ScrollContainerState } from '../interfaces'
import * as u from '../urx'
import { approximatelyEqual } from '../utils/approximatelyEqual'
import { correctItemSize } from '../utils/correctItemSize'

export type ScrollerRef = Window | HTMLElement | null

export default function useScrollTop(
  scrollContainerStateCallback: (state: ScrollContainerState) => void,
  smoothScrollTargetReached: (yes: true) => void,
  scrollerElement: any,
  scrollerRefCallback: (ref: ScrollerRef) => void = u.noop,
  customScrollParent?: HTMLElement,
  horizontalDirection?: boolean
) {
  const scrollerRef = React.useRef<HTMLElement | null | Window>(null)
  const scrollTopTarget = React.useRef<any>(null)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const handler = React.useCallback(
    (ev: Event) => {
      const el = ev.target as HTMLElement
      const windowScroll = (el as any) === window || (el as any) === document
      const scrollTop = horizontalDirection
        ? windowScroll
          ? window.pageXOffset || document.documentElement.scrollLeft
          : el.scrollLeft
        : windowScroll
          ? window.pageYOffset || document.documentElement.scrollTop
          : el.scrollTop

      const scrollHeight = horizontalDirection
        ? windowScroll
          ? document.documentElement.scrollWidth
          : el.scrollWidth
        : windowScroll
          ? document.documentElement.scrollHeight
          : el.scrollHeight

      const viewportHeight = horizontalDirection
        ? windowScroll
          ? window.innerWidth
          : el.offsetWidth
        : windowScroll
          ? window.innerHeight
          : el.offsetHeight

      const call = () => {
        scrollContainerStateCallback({
          scrollTop: Math.max(scrollTop, 0),
          scrollHeight,
          viewportHeight,
        })
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if ((ev as any).suppressFlushSync) {
        call()
      } else {
        ReactDOM.flushSync(call)
      }

      if (scrollTopTarget.current !== null) {
        if (scrollTop === scrollTopTarget.current || scrollTop <= 0 || scrollTop === scrollHeight - viewportHeight) {
          scrollTopTarget.current = null
          smoothScrollTargetReached(true)
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
          }
        }
      }
    },
    [scrollContainerStateCallback, smoothScrollTargetReached, horizontalDirection]
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useEffect(() => {
    const localRef = customScrollParent ? customScrollParent : scrollerRef.current!

    scrollerRefCallback(customScrollParent ? customScrollParent : scrollerRef.current)
    handler({ target: localRef, suppressFlushSync: true } as unknown as Event)
    localRef.addEventListener('scroll', handler, { passive: true })

    return () => {
      scrollerRefCallback(null)
      localRef.removeEventListener('scroll', handler)
    }
  }, [handler, scrollerElement, scrollerRefCallback, customScrollParent])

  function scrollToCallback(location: ScrollToOptions) {
    const scrollerElement = scrollerRef.current
    if (
      !scrollerElement ||
      (horizontalDirection
        ? 'offsetWidth' in scrollerElement && scrollerElement.offsetWidth === 0
        : 'offsetHeight' in scrollerElement && scrollerElement.offsetHeight === 0)
    ) {
      return
    }

    const isSmooth = location.behavior === 'smooth'

    let offsetHeight: number
    let scrollHeight: number
    let scrollTop: number

    if (scrollerElement === window) {
      // this is not a mistake
      scrollHeight = Math.max(
        correctItemSize(document.documentElement, horizontalDirection ? 'width' : 'height'),
        horizontalDirection ? document.documentElement.scrollWidth : document.documentElement.scrollHeight
      )
      offsetHeight = horizontalDirection ? window.innerWidth : window.innerHeight
      scrollTop = horizontalDirection ? document.documentElement.scrollLeft : document.documentElement.scrollTop
    } else {
      scrollHeight = (scrollerElement as HTMLElement)[horizontalDirection ? 'scrollWidth' : 'scrollHeight']
      offsetHeight = correctItemSize(scrollerElement as HTMLElement, horizontalDirection ? 'width' : 'height')
      scrollTop = (scrollerElement as HTMLElement)[horizontalDirection ? 'scrollLeft' : 'scrollTop']
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

    if (horizontalDirection) {
      location = { left: location.top, behavior: location.behavior }
    }

    scrollerElement.scrollTo(location)
  }

  function scrollByCallback(location: ScrollToOptions) {
    if (horizontalDirection) {
      location = { left: location.top, behavior: location.behavior }
    }
    scrollerRef.current!.scrollBy(location)
  }

  return { scrollerRef, scrollByCallback, scrollToCallback }
}
