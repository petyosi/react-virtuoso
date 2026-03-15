import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { CSSProperties, RefObject } from 'react'

import { useCellValue, useCellValues, usePublisher } from '@virtuoso.dev/reactive-engine-react'

import { scrollBarScrollerWidth$, scrollerElement$, scrollOverlayContentHeight$, scrollOverlayContentWidth$ } from '../scroll/dom'

const childVisibilityStyle: CSSProperties = { visibility: 'hidden' }

const overlayScrollbarStyle: CSSProperties = {
  width: '100%',
  height: 'calc(100% - var(--header-height))',
  position: 'absolute',
  top: 'var(--header-height)',
  left: 0,
  zIndex: 4,
  overflow: 'auto',
  clipPath:
    'polygon(calc(100% - var(--overlay-scrollbar-visible-size)) 0, 100% 0, 100% 100%, calc(100% - var(--overlay-scrollbar-visible-size)) 100%, calc(100% - var(--overlay-scrollbar-visible-size)) calc(100% - var(--overlay-scrollbar-visible-size)), 0 calc(100% - var(--overlay-scrollbar-visible-size)), 0 100%, calc(100% - var(--overlay-scrollbar-visible-size)) 100%)',
} as CSSProperties

const verticalOverlayScrollbarStyle: CSSProperties = {
  width: 'var(--overlay-scrollbar-visible-size)',
  height: 'calc(100% - var(--header-height))',
  position: 'absolute',
  top: 'var(--header-height)',
  right: 0,
  zIndex: 4,
  overflowX: 'hidden',
  overflowY: 'scroll',
}

const horizontalOverlayScrollbarStyle: CSSProperties = {
  height: 'var(--overlay-scrollbar-visible-size)',
  width: 'calc(100% - var(--overlay-scrollbar-visible-size))',
  position: 'absolute',
  bottom: 0,
  left: 0,
  zIndex: 4,
  overflowX: 'scroll',
  overflowY: 'hidden',
}

export namespace ScrollbarOverlay {
  export type Props = Record<string, never>
}

export function ScrollbarOverlay() {
  const verticalScrollbarRef = useRef<HTMLDivElement | null>(null)
  const verticalContentRef = useRef<HTMLDivElement | null>(null)
  const horizontalScrollbarRef = useRef<HTMLDivElement | null>(null)
  const horizontalContentRef = useRef<HTMLDivElement | null>(null)

  const muteOverlayScrollEventsTimeoutRef = useRef<number | null>(null)
  const muteContentScrollEventsTimeoutRef = useRef<number | null>(null)
  const scrollableElement = useCellValue(scrollerElement$)
  const setScrollbarScrollerWidth = usePublisher(scrollBarScrollerWidth$)

  const [scrollOverlayContentHeight, scrollbarOverlayContentWidth] = useCellValues(scrollOverlayContentHeight$, scrollOverlayContentWidth$)

  const verticalContentStyle = useMemo(
    () => ({ width: 1, height: scrollOverlayContentHeight, ...childVisibilityStyle }) satisfies CSSProperties,
    [scrollOverlayContentHeight]
  )

  const horizontalContentStyle = useMemo(
    () => ({ width: scrollbarOverlayContentWidth, height: 1, ...childVisibilityStyle }),
    [scrollbarOverlayContentWidth]
  )

  const combinedContentStyle = useMemo(
    () => ({ width: scrollbarOverlayContentWidth, height: scrollOverlayContentHeight, ...childVisibilityStyle }),
    [scrollbarOverlayContentWidth, scrollOverlayContentHeight]
  )

  const setVerticalScrollbarRef = useCallback((el: HTMLDivElement | null) => {
    verticalScrollbarRef.current = el
  }, [])

  const setVerticalContentRef = useCallback((el: HTMLDivElement | null) => {
    verticalContentRef.current = el
  }, [])

  const setHorizontalScrollbarRef = useCallback((el: HTMLDivElement | null) => {
    horizontalScrollbarRef.current = el
  }, [])

  const setHorizontalContentRef = useCallback((el: HTMLDivElement | null) => {
    horizontalContentRef.current = el
  }, [])

  const setCombinedScrollbarRef = useCallback((el: HTMLDivElement | null) => {
    verticalScrollbarRef.current = el
    horizontalScrollbarRef.current = el
  }, [])

  const setCombinedContentRef = useCallback((el: HTMLDivElement | null) => {
    verticalContentRef.current = el
    horizontalContentRef.current = el
  }, [])

  useEffect(() => {
    const el = horizontalScrollbarRef.current
    if (!el) {
      return
    }
    const size = el.offsetWidth - el.clientWidth
    setScrollbarScrollerWidth(size)

    let muteOverlayScrollEvents = false
    let muteContentScrollEvents = false

    horizontalScrollbarRef.current?.addEventListener('scroll', () => {
      if (!muteOverlayScrollEvents) {
        muteContentScrollEvents = true
        if (scrollableElement) {
          scrollableElement.scrollLeft = horizontalScrollbarRef.current!.scrollLeft
        }
        reschedule(
          muteContentScrollEventsTimeoutRef,
          () => {
            muteContentScrollEvents = false
          },
          100
        )
      }
    })

    verticalScrollbarRef.current?.addEventListener('scroll', () => {
      if (!muteOverlayScrollEvents) {
        muteContentScrollEvents = true
        if (scrollableElement) {
          scrollableElement.scrollTop = verticalScrollbarRef.current!.scrollTop
        }
        reschedule(
          muteContentScrollEventsTimeoutRef,
          () => {
            muteContentScrollEvents = false
          },
          100
        )
      }
    })

    scrollableElement?.addEventListener('scroll', () => {
      if (!muteContentScrollEvents) {
        muteOverlayScrollEvents = true
        if (horizontalScrollbarRef.current) {
          horizontalScrollbarRef.current.scrollLeft = scrollableElement?.scrollLeft
        }
        if (verticalScrollbarRef.current) {
          verticalScrollbarRef.current.scrollTop = scrollableElement?.scrollTop
        }

        reschedule(
          muteOverlayScrollEventsTimeoutRef,
          () => {
            muteOverlayScrollEvents = false
          },
          100
        )
      }
    })
  }, [scrollableElement, setScrollbarScrollerWidth])

  const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

  if (isSafari) {
    return (
      <>
        <div style={verticalOverlayScrollbarStyle} ref={setVerticalScrollbarRef}>
          <div style={verticalContentStyle} ref={setVerticalContentRef} />
        </div>

        <div style={horizontalOverlayScrollbarStyle} ref={setHorizontalScrollbarRef}>
          <div style={horizontalContentStyle} ref={setHorizontalContentRef} />
        </div>
      </>
    )
  }

  return (
    <div style={overlayScrollbarStyle} ref={setCombinedScrollbarRef}>
      <div style={combinedContentStyle} ref={setCombinedContentRef} />
    </div>
  )
}

function reschedule(ref: RefObject<number | null>, cb: () => unknown, delay: number) {
  if (ref.current !== null) {
    clearTimeout(ref.current)
  }
  ref.current = window.setTimeout(() => {
    cb()
    ref.current = null
  }, delay)
}
