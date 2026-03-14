import React, { useLayoutEffect } from 'react'

import { usePublisher, useEngine } from '@virtuoso.dev/reactive-engine-react'

import { approximatelyEqual, isMobileSafari } from '../utils'
import { scrollBy$, scrolledWithMouseWheel$, scrollHeight$, scrollTargetReached$, scrollToInProgress$ } from './dom'
import { useSmoothScroll } from './smooth-scroll'

import type { ScrollToParams } from './dom'
import type { NodeRef } from '@virtuoso.dev/reactive-engine-core'

export interface ScrollCallbackParams {
  scrollableRef: React.RefObject<HTMLElement | null>
  listRef: React.RefObject<HTMLElement | null>
  scrollLeftCell$: NodeRef<number>
  scrollTopCell$: NodeRef<number>
  scrollToSignal$: NodeRef<ScrollToParams>
}

export function useScrollCallbacks({ scrollToSignal$, scrollableRef, listRef, scrollLeftCell$, scrollTopCell$ }: ScrollCallbackParams) {
  const engine = useEngine()

  const scrollTarget = React.useRef<number | null>(null)

  const scrollTo = useSmoothScroll(scrollableRef, listRef, scrollTarget)

  const scrollBy = React.useCallback(
    (amount: number) => {
      if (scrollableRef.current) {
        scrollableRef.current.scrollTop += amount
      }
    },
    [scrollableRef]
  )

  const onScroll = React.useCallback(() => {
    const element = scrollableRef.current
    if (element === null) {
      return
    }

    const pubPayload: Record<NodeRef, unknown> = {
      [scrollLeftCell$]: element.scrollLeft,
      [scrollTopCell$]: element.scrollTop,
    }

    if (scrollTarget.current !== null) {
      const maxLocation = element.scrollHeight - element.clientHeight
      if (approximatelyEqual(element.scrollTop, Math.min(maxLocation, scrollTarget.current))) {
        scrollTarget.current = null
        pubPayload[scrollToInProgress$] = false
        pubPayload[scrollTargetReached$] = element.scrollTop
      }
    }
    engine.pubIn(pubPayload)
  }, [engine, scrollableRef, scrollLeftCell$, scrollTopCell$])

  const onWheel = React.useCallback(
    (e: WheelEvent) => {
      engine.pub(scrolledWithMouseWheel$, e.deltaY > 0 ? 'down' : 'up')
    },
    [engine]
  )

  React.useLayoutEffect(() => {
    return engine.sub(scrollToSignal$, scrollTo)
  }, [scrollTo, engine, scrollToSignal$])

  React.useLayoutEffect(() => {
    return engine.sub(scrollBy$, scrollBy)
  }, [scrollBy, engine])

  return {
    onScroll,
    onWheel,
  }
}

export function usePollForHeightInMobileSafari(getHeight: () => number | undefined) {
  const publishScrollHeight = usePublisher(scrollHeight$)
  useLayoutEffect(() => {
    if (!isMobileSafari()) {
      return
    }
    const interval = setInterval(() => {
      publishScrollHeight(getHeight() ?? 0)
    }, 1000)
    return () => {
      clearInterval(interval)
    }
  }, [publishScrollHeight, getHeight])
}
