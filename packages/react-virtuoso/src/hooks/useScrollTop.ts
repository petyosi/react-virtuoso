import React from 'react'
import ReactDOM from 'react-dom'

import * as u from '../urx'
import { approximatelyEqual } from '../utils/approximatelyEqual'
import { correctItemSize } from '../utils/correctItemSize'
import { clearHorizontalScrollDirectionCache, getLogicalScrollLeft, getPhysicalScrollLeft } from '../utils/horizontalScroll'

import type { ScrollContainerState } from '../interfaces'

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
        scrollTop = horizontalDirection === true ? getLogicalScrollLeft(theWindow, theWindow.scrollX) : theWindow.scrollY

        scrollHeight =
          horizontalDirection === true ? theWindow.document.documentElement.scrollWidth : theWindow.document.documentElement.scrollHeight

        viewportHeight = horizontalDirection === true ? theWindow.innerWidth : theWindow.innerHeight
      } else {
        scrollTop = horizontalDirection === true ? getLogicalScrollLeft(el, el.scrollLeft) : el.scrollTop

        scrollHeight = horizontalDirection === true ? el.scrollWidth : el.scrollHeight

        viewportHeight = horizontalDirection === true ? el.offsetWidth : el.offsetHeight
      }

      const call = () => {
        scrollContainerStateCallback({
          scrollHeight,
          scrollTop: Math.max(scrollTop, 0),
          viewportHeight,
        })
      }
      if ((ev as any).suppressFlushSync === true) {
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

  React.useEffect(() => {
    const localRef = customScrollParent ?? scrollerRef.current!

    clearHorizontalScrollDirectionCache(localRef)
    scrollerRefCallback(customScrollParent ?? scrollerRef.current)
    handler({ suppressFlushSync: true, target: localRef } as unknown as Event)
    localRef.addEventListener('scroll', handler, { passive: true })

    return () => {
      clearHorizontalScrollDirectionCache(localRef)
      scrollerRefCallback(null)
      localRef.removeEventListener('scroll', handler)
    }
  }, [scrollerRef, handler, scrollerElement, scrollerRefCallback, customScrollParent])

  function scrollToCallback(location: ScrollToOptions) {
    const scrollerElement = scrollerRef.current
    if (
      !scrollerElement ||
      (horizontalDirection === true
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
        correctItemSize(scrollerElement.document.documentElement, horizontalDirection === true ? 'width' : 'height'),
        horizontalDirection === true
          ? scrollerElement.document.documentElement.scrollWidth
          : scrollerElement.document.documentElement.scrollHeight
      )
      offsetHeight = horizontalDirection === true ? scrollerElement.innerWidth : scrollerElement.innerHeight
      scrollTop = horizontalDirection === true ? getLogicalScrollLeft(scrollerElement, scrollerElement.scrollX) : scrollerElement.scrollY
    } else {
      scrollHeight = scrollerElement[horizontalDirection === true ? 'scrollWidth' : 'scrollHeight']
      offsetHeight = correctItemSize(scrollerElement, horizontalDirection === true ? 'width' : 'height')
      scrollTop =
        horizontalDirection === true ? getLogicalScrollLeft(scrollerElement, scrollerElement.scrollLeft) : scrollerElement.scrollTop
    }

    const maxScrollTop = scrollHeight - offsetHeight
    if (location.top === undefined) {
      scrollerElement.scrollTo(location)
      return
    }

    const top = Math.ceil(Math.max(Math.min(maxScrollTop, location.top), 0))
    location.top = top

    // avoid system hanging because the DOM never called back
    // with the scrollTop
    // scroller is already at this location
    if (approximatelyEqual(offsetHeight, scrollHeight) || top === scrollTop) {
      scrollContainerStateCallback({ scrollHeight, scrollTop, viewportHeight: offsetHeight })
      if (isSmooth) {
        smoothScrollTargetReached(true)
      }
      return
    }

    if (isSmooth) {
      scrollTopTarget.current = top
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

    if (horizontalDirection === true) {
      location = {
        ...(location.behavior === undefined ? {} : { behavior: location.behavior }),
        left: getPhysicalScrollLeft(scrollerElement, top),
      }
    }

    scrollerElement.scrollTo(location)
  }

  function scrollByCallback(location: ScrollToOptions) {
    if (horizontalDirection === true) {
      location = {
        ...(location.behavior === undefined ? {} : { behavior: location.behavior }),
        ...(location.top === undefined ? {} : { left: getPhysicalScrollLeft(scrollerRef.current!, location.top) }),
      }
    }
    scrollerRef.current!.scrollBy(location)
  }

  return { scrollByCallback, scrollerRef, scrollToCallback }
}
