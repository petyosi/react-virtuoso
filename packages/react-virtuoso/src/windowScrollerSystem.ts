import type React from 'react'

import { domIOSystem } from './domIOSystem'
import * as u from './urx'

import type { ScrollContainerState, WindowViewportInfo } from './interfaces'

export const windowScrollerSystem = u.system(([{ scrollContainerState, scrollTo }]) => {
  const windowScrollContainerState = u.stream<ScrollContainerState>()
  const windowViewportRect = u.stream<WindowViewportInfo>()
  const windowScrollTo = u.stream<ScrollToOptions>()
  const useWindowScroll = u.statefulStream(false)
  const customScrollParent = u.statefulStream<HTMLElement | undefined>(undefined)
  const scrollElementRef = u.statefulStream<React.RefObject<HTMLElement | null> | undefined>(undefined)

  u.connect(
    u.pipe(
      u.combineLatest(windowScrollContainerState, windowViewportRect),
      u.map(([{ scrollTop: windowScrollTop, viewportHeight }, { offsetTop, listHeight }]) => {
        return {
          scrollHeight: listHeight,
          scrollTop: Math.max(0, windowScrollTop - offsetTop),
          viewportHeight,
        }
      })
    ),
    scrollContainerState
  )

  u.connect(
    u.pipe(
      scrollTo,
      u.withLatestFrom(windowViewportRect),
      u.map(([scrollTo, { offsetTop }]) => {
        return {
          ...scrollTo,
          top: scrollTo.top! + offsetTop,
        }
      })
    ),
    windowScrollTo
  )

  return {
    customScrollParent,
    scrollElementRef,
    // config
    useWindowScroll,

    // input
    windowScrollContainerState,
    // signals
    windowScrollTo,

    windowViewportRect,
  }
}, u.tup(domIOSystem))
