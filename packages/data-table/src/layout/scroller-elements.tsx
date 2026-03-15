import React, { useEffect, useMemo } from 'react'
import type { CSSProperties } from 'react'

import { useCellValue, useCellValues, useEngine } from '@virtuoso.dev/reactive-engine-react'

import { emptyPlaceholder$, scrollElement$ } from '../core/components'
import { context$, totalCount$ } from '../core/data'
import { resizeObserverSingleton$ } from '../resize/resize-observer-singleton'
import { useScrollCallbacks, usePollForHeightInMobileSafari } from '../scroll/callbacks'
import {
  customScrollParent$,
  customScrollParentWrapper$,
  externalScrollerScrollTo$,
  externalScrollerScrollTop$,
  externalScrollerViewportHeight$,
  hasHorizontalScroll$,
  scrollHeight$,
  scrollLeft$,
  scrollerElement$,
  scrollTo$,
  scrollTop$,
  viewportHeight$,
} from '../scroll/dom'
import { mobileSafariIsReadjusting$ } from '../scroll/reverse-scroll-fix'
import { pendingScrollToInitialLocation$ } from '../scroll/scroll-to-row'
import { VirtuosoDataTableTestingContext } from '../VirtuosoDataTableTestingContext'

import type { ScrollerProps } from '../interfaces'

export interface ScrollableRootProps extends ScrollerProps {
  children: React.ReactNode
  tableBodyRef: React.RefObject<HTMLElement | null>
}

export const ScrollableElement: React.FC<ScrollableRootProps> = ({ children, tableBodyRef: listRef, style: passedStyle, ...htmlProps }) => {
  const engine = useEngine()

  const [
    mobileSafariIsReadjusting,
    hasHorizontalScroll,
    totalCount,
    pendingScrollToInitialLocation,
    EmptyPlaceholder,
    context,
    ScrollElement,
  ] = useCellValues(
    mobileSafariIsReadjusting$,
    hasHorizontalScroll$,
    totalCount$,
    pendingScrollToInitialLocation$,
    emptyPlaceholder$,
    context$,
    scrollElement$
  )

  const observer = useCellValue(resizeObserverSingleton$)

  const testingContext = React.useContext(VirtuosoDataTableTestingContext)
  const scrollerRef = React.useRef<HTMLElement | null>(null)

  const { onScroll, onWheel } = useScrollCallbacks({
    listRef,
    scrollLeftCell$: scrollLeft$,
    scrollTopCell$: scrollTop$,
    scrollToSignal$: scrollTo$,
    scrollableRef: scrollerRef,
  })

  const scrollerCallbackRef = React.useCallback(
    (el: HTMLElement | null) => {
      if (el) {
        engine.pub(scrollerElement$, el)
        scrollerRef.current = el
        el.addEventListener('scroll', onScroll, { passive: true })
        el.addEventListener('wheel', onWheel, { passive: true })
        if (testingContext) {
          engine.pubIn({
            [viewportHeight$]: testingContext.viewportHeight,
            [scrollHeight$]: testingContext.viewportHeight,
            [scrollTop$]: 0,
          })
        }
        observer?.observe(el, { box: 'border-box' })
      } else if (scrollerRef.current) {
        scrollerRef.current.removeEventListener('scroll', onScroll)
        scrollerRef.current.removeEventListener('wheel', onWheel)
        engine.pub(scrollerElement$, null)
        observer?.unobserve(scrollerRef.current)
        scrollerRef.current = null
      }
    },
    [observer, engine, onScroll, onWheel, testingContext]
  )

  usePollForHeightInMobileSafari(() => scrollerRef.current?.scrollHeight)

  React.useLayoutEffect(() => {
    if (totalCount > 0 && pendingScrollToInitialLocation === null && EmptyPlaceholder !== null) {
      engine.pub(scrollHeight$, scrollerRef.current?.scrollHeight)
    }
  }, [engine, totalCount, pendingScrollToInitialLocation, EmptyPlaceholder])

  const scrollerStyle = useMemo(
    () =>
      ({
        overflowY: mobileSafariIsReadjusting ? 'hidden' : 'auto',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        position: 'relative',
        boxSizing: 'border-box',
        height: hasHorizontalScroll ? 'calc(100% - var(--scrollbar-width))' : '100%',
        width: '100%',
        ...passedStyle,
      }) as CSSProperties,
    [mobileSafariIsReadjusting, hasHorizontalScroll, passedStyle]
  )

  return (
    <ScrollElement
      {...htmlProps}
      ref={scrollerCallbackRef}
      data-testid="virtuoso-table-scroller"
      style={scrollerStyle}
      {...(ScrollElement === 'div' ? {} : { context })}
    >
      {children}
    </ScrollElement>
  )
}

export const WindowScrollElementWrapper: React.FC<ScrollableRootProps> = ({ children, tableBodyRef: listRef, ...htmlProps }) => {
  const documentElementRef = React.useRef<HTMLElement | null>(null)
  const windowScrollWrapperRef = React.useRef<HTMLElement | null>(null)
  const observer = useCellValue(resizeObserverSingleton$)

  const engine = useEngine()

  const testingContext = React.useContext(VirtuosoDataTableTestingContext)

  const { onScroll, onWheel } = useScrollCallbacks({
    listRef,
    scrollLeftCell$: scrollLeft$,
    scrollTopCell$: externalScrollerScrollTop$,
    scrollToSignal$: externalScrollerScrollTo$,
    scrollableRef: documentElementRef,
  })

  const onResize = React.useCallback(() => {
    const element = documentElementRef.current
    if (element === null) {
      return
    }
    engine.pub(externalScrollerViewportHeight$, element.ownerDocument.defaultView?.innerHeight)
  }, [engine])

  const windowScrollWrapperCallbackRef = React.useCallback(
    (el: HTMLElement | null) => {
      if (el) {
        engine.pub(scrollerElement$, el)
        windowScrollWrapperRef.current = el
        const theElementWindow = el.ownerDocument.defaultView
        if (theElementWindow) {
          theElementWindow.addEventListener('scroll', onScroll)
          theElementWindow.addEventListener('wheel', onWheel)
          theElementWindow.addEventListener('resize', onResize)

          if (testingContext) {
            engine.pubIn({
              [externalScrollerViewportHeight$]: theElementWindow?.innerHeight,
              [scrollHeight$]: el.getBoundingClientRect().height,
              [externalScrollerScrollTop$]: 0,
            })
          }

          documentElementRef.current = el.ownerDocument.documentElement
        }
        observer?.observe(el, { box: 'border-box' })
      } else {
        if (windowScrollWrapperRef.current) {
          const theElementWindow = windowScrollWrapperRef.current.ownerDocument.defaultView
          if (theElementWindow) {
            theElementWindow.removeEventListener('scroll', onScroll)
            theElementWindow.removeEventListener('wheel', onWheel)
            theElementWindow.removeEventListener('resize', onResize)
          }
          engine.pub(scrollerElement$, null)
          observer?.unobserve(windowScrollWrapperRef.current)
          windowScrollWrapperRef.current = null
        }
        documentElementRef.current = null
      }
    },
    [observer, engine, onScroll, onWheel, onResize, testingContext]
  )

  usePollForHeightInMobileSafari(() => windowScrollWrapperRef.current?.getBoundingClientRect().height)

  return (
    <div ref={windowScrollWrapperCallbackRef} {...htmlProps}>
      {children}
    </div>
  )
}

export const CustomScrollParentWrapper: React.FC<ScrollableRootProps> = ({ children, tableBodyRef: listRef, ...htmlProps }) => {
  const engine = useEngine()
  const testingContext = React.useContext(VirtuosoDataTableTestingContext)
  const customScrollParent = useCellValue(customScrollParent$)
  const customScrollParentRef = React.useRef<HTMLElement | null>(customScrollParent)
  const customScrollParentWrapperRef = React.useRef<HTMLElement | null>(null)
  const observer = useCellValue(resizeObserverSingleton$)

  const { onWheel, onScroll } = useScrollCallbacks({
    listRef,
    scrollLeftCell$: scrollLeft$,
    scrollTopCell$: externalScrollerScrollTop$,
    scrollToSignal$: externalScrollerScrollTo$,
    scrollableRef: customScrollParentRef,
  })

  useEffect(() => {
    customScrollParentRef.current = customScrollParent
    if (!customScrollParent) {
      engine.pub(scrollerElement$, null)
      return
    }

    engine.pub(scrollerElement$, customScrollParent)
    customScrollParent.addEventListener('scroll', onScroll)
    customScrollParent.addEventListener('wheel', onWheel)
    observer?.observe(customScrollParent, { box: 'border-box' })

    if (testingContext) {
      engine.pubIn({
        [externalScrollerViewportHeight$]: customScrollParent.clientHeight,
        [scrollHeight$]: customScrollParentWrapperRef.current?.getBoundingClientRect().height,
        [externalScrollerScrollTop$]: 0,
      })
    }

    return () => {
      customScrollParent.removeEventListener('scroll', onScroll)
      customScrollParent.removeEventListener('wheel', onWheel)
      observer?.unobserve(customScrollParent)
    }
  }, [customScrollParent, onScroll, onWheel, observer, engine, testingContext])

  const customScrollParentWrapperCallbackRef = React.useCallback(
    (el: HTMLElement | null) => {
      if (el) {
        engine.pub(customScrollParentWrapper$, el)
        customScrollParentWrapperRef.current = el
        observer?.observe(el, { box: 'border-box' })
      } else {
        engine.pub(customScrollParentWrapper$, null)
        if (customScrollParentWrapperRef.current) {
          observer?.unobserve(customScrollParentWrapperRef.current)
        }
        customScrollParentWrapperRef.current = null
      }
    },
    [observer, engine]
  )

  usePollForHeightInMobileSafari(() => customScrollParentWrapperRef.current?.getBoundingClientRect().height)

  return (
    <div ref={customScrollParentWrapperCallbackRef} {...htmlProps}>
      {children}
    </div>
  )
}
