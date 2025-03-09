import React from 'react'
import ReactDOM from 'react-dom'

import { ScrollContainerState } from '../interfaces'
import * as u from '../urx'
import { approximatelyEqual } from '../utils/approximatelyEqual'
import { correctItemSize } from '../utils/correctItemSize'

export type ScrollerRef = HTMLElement | null | Window

function isWindow(el: EventTarget): el is Window {
  return 'self' in el
}

function isDocument(el: EventTarget): el is Document {
  return 'body' in el
}

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
  const timeoutRef = React.useRef<null | ReturnType<typeof setTimeout>>(null)

  const handler = React.useCallback(
    (ev: Event) => {
      let scrollHeight: number
      let viewportHeight: number
      let scrollTop: number

      const el = ev.target as HTMLElement

      if (isDocument(el) || isWindow(el)) {
        const theWindow = isWindow(el) ? el : (el as unknown as Document).defaultView!
        scrollTop = horizontalDirection ? theWindow.scrollX : theWindow.scrollY

        scrollHeight = horizontalDirection
          ? theWindow.document.documentElement.scrollWidth
          : theWindow.document.documentElement.scrollHeight

        viewportHeight = horizontalDirection ? theWindow.innerWidth : theWindow.innerHeight
      } else {
        scrollTop = horizontalDirection ? el.scrollLeft : el.scrollTop

        scrollHeight = horizontalDirection ? el.scrollWidth : el.scrollHeight

        viewportHeight = horizontalDirection ? el.offsetWidth : el.offsetHeight
      }

      const call = () => {
        scrollContainerStateCallback({
          scrollHeight,
          scrollTop: Math.max(scrollTop, 0),
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
    [scrollContainerStateCallback, smoothScrollTargetReached]
  )

  React.useEffect(() => {
    const localRef = customScrollParent ? customScrollParent : scrollerRef.current!

    scrollerRefCallback(customScrollParent ? customScrollParent : scrollerRef.current)
    handler({ suppressFlushSync: true, target: localRef } as unknown as Event)
    localRef.addEventListener('scroll', handler, { passive: true })

    return () => {
      scrollerRefCallback(null)
      localRef.removeEventListener('scroll', handler)
    }
  }, [scrollerRef, handler, scrollerElement, scrollerRefCallback, customScrollParent])

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

    if (isWindow(scrollerElement)) {
      // this is not a mistake
      scrollHeight = Math.max(
        correctItemSize(scrollerElement.document.documentElement, horizontalDirection ? 'width' : 'height'),
        horizontalDirection ? scrollerElement.document.documentElement.scrollWidth : scrollerElement.document.documentElement.scrollHeight
      )
      offsetHeight = horizontalDirection ? scrollerElement.innerWidth : scrollerElement.innerHeight
      scrollTop = horizontalDirection ? window.scrollX : window.scrollY
    } else {
      scrollHeight = scrollerElement[horizontalDirection ? 'scrollWidth' : 'scrollHeight']
      offsetHeight = correctItemSize(scrollerElement, horizontalDirection ? 'width' : 'height')
      scrollTop = scrollerElement[horizontalDirection ? 'scrollLeft' : 'scrollTop']
    }

    const maxScrollTop = scrollHeight - offsetHeight
    location.top = Math.ceil(Math.max(Math.min(maxScrollTop, location.top!), 0))

    // avoid system hanging because the DOM never called back
    // with the scrollTop
    // scroller is already at this location
    if (approximatelyEqual(offsetHeight, scrollHeight) || location.top === scrollTop) {
      scrollContainerStateCallback({ scrollHeight, scrollTop, viewportHeight: offsetHeight })
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
      location = { behavior: location.behavior, left: location.top }
    }

    scrollerElement.scrollTo(location)
  }

  function scrollByCallback(location: ScrollToOptions) {
    if (horizontalDirection) {
      location = { behavior: location.behavior, left: location.top }
    }
    scrollerRef.current!.scrollBy(location)
  }

  return { scrollByCallback, scrollerRef, scrollToCallback }
}
