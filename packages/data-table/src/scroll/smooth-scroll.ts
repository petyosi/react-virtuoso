import React from 'react'

import { useEngine } from '@virtuoso.dev/reactive-engine-react'

import {
  cancelSmoothScroll$,
  DEFAULT_SMOOTH_SCROLL_BEZIER_FUNCTION,
  DEFAULT_SMOOTH_SCROLL_FRAME_COUNT,
  scrolledWithMouseWheel$,
  scrollTargetReached$,
  scrollToInProgress$,
} from './dom'

import type { BezierFunction, ScrollBehavior } from '../interfaces'

function scrollTopIsAlmostEqual(newValue: number, currentValue: number) {
  return Math.abs(newValue - currentValue) < 0.5
}

export function useSmoothScroll(
  scrollerRef: React.RefObject<HTMLElement | null>,
  listRef: React.RefObject<HTMLElement | null>,
  scrollTarget: React.MutableRefObject<number | null>
) {
  const engine = useEngine()
  const animationFrameRef = React.useRef<ReturnType<typeof requestAnimationFrame> | null>(null)
  const smoothScrollDirectionRef = React.useRef<'up' | 'down' | null>(null)

  const cancelScroll = React.useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
      smoothScrollDirectionRef.current = null
    }
  }, [])

  React.useEffect(() => {
    return engine.sub(scrolledWithMouseWheel$, (direction) => {
      if (direction !== smoothScrollDirectionRef.current) {
        cancelScroll()
      }
    })
  }, [engine, cancelScroll])

  React.useEffect(() => {
    return engine.sub(cancelSmoothScroll$, cancelScroll)
  }, [engine, cancelScroll])

  const smoothScroll = React.useCallback(
    (location: number, easing: BezierFunction, frameCount: number) => {
      if (animationFrameRef.current) {
        cancelScroll()
      }
      const start = scrollerRef.current?.scrollTop ?? 0
      smoothScrollDirectionRef.current = start < location ? 'down' : 'up'
      let x = 0
      let framesPassed = 0

      function step() {
        const top = start + (location - start) * easing(x)
        scrollerRef.current?.scrollTo({ top, behavior: 'instant' })
        x += 1 / frameCount
        framesPassed += 1
        if (framesPassed < frameCount) {
          animationFrameRef.current = requestAnimationFrame(step)
        } else {
          scrollerRef.current?.scrollTo({ top: location, behavior: 'instant' })
          animationFrameRef.current = null
          smoothScrollDirectionRef.current = null
        }
      }
      step()
    },
    [scrollerRef, cancelScroll]
  )

  const scrollTo = React.useCallback(
    (options: { top?: number; left?: number; behavior?: ScrollBehavior; forceBottomSpace?: number }) => {
      const element = scrollerRef.current
      if (!element || options.top === undefined) {
        return
      }

      const maxScrollTop = element.scrollHeight - element.clientHeight

      // constrain the location, if outside of scrollable range, we should still fire the scrollTargetReached event
      const location = Math.max(0, Math.min(options.top, maxScrollTop))

      if (scrollTopIsAlmostEqual(location, element.scrollTop) || element.scrollHeight <= element.clientHeight) {
        // this is necessary to avoid sync/async discrepancies
        requestAnimationFrame(() => {
          engine.pub(scrollTargetReached$, scrollerRef.current?.scrollTop)
        })
        return
      }

      scrollTarget.current = location
      engine.pub(scrollToInProgress$, true)

      // this is is a temporary assignment, the next react rerender will update the margin
      if (options.forceBottomSpace !== undefined && listRef.current) {
        listRef.current.style.paddingBottom = `${options.forceBottomSpace}px`
      }
      if (options.behavior === 'smooth') {
        smoothScroll(location ?? 0, DEFAULT_SMOOTH_SCROLL_BEZIER_FUNCTION, DEFAULT_SMOOTH_SCROLL_FRAME_COUNT)
      } else if (options.behavior === 'auto' || options.behavior === 'instant' || options.behavior === undefined) {
        cancelScroll()
        scrollerRef.current?.scrollTo(options as ScrollToOptions)
      } else {
        const { easing, animationFrameCount } = options.behavior(scrollerRef.current?.scrollTop ?? 0, location ?? 0)
        smoothScroll(location ?? 0, easing, animationFrameCount)
      }
    },
    [engine, smoothScroll, listRef, scrollerRef, scrollTarget, cancelScroll]
  )
  return scrollTo
}
