import * as u from './urx'

import type { ScrollContainerState } from './interfaces'

export const domIOSystem = u.system(
  () => {
    const scrollContainerState = u.stream<ScrollContainerState>()
    const scrollTop = u.stream<number>()
    const deviation = u.statefulStream(0)
    // Published by the list renderer from a layout effect once a `deviation`
    // has actually reached the DOM. `upwardScrollFixSystem` waits for it before
    // scrolling, so the scroll never runs against the pre-deviation layout.
    const deviationCommitted = u.stream<number>()
    const smoothScrollTargetReached = u.stream<true>()
    const statefulScrollTop = u.statefulStream(0)
    const viewportHeight = u.stream<number>()
    const scrollHeight = u.stream<number>()
    const headerHeight = u.statefulStream(0)
    const fixedHeaderHeight = u.statefulStream(0)
    const fixedFooterHeight = u.statefulStream(0)
    const footerHeight = u.statefulStream(0)
    const scrollTo = u.stream<ScrollToOptions>()
    const scrollBy = u.stream<ScrollToOptions>()
    const scrollingInProgress = u.statefulStream(false)
    const horizontalDirection = u.statefulStream(false)
    const skipAnimationFrameInResizeObserver = u.statefulStream(false)

    u.connect(
      u.pipe(
        scrollContainerState,
        u.map(({ scrollTop }) => scrollTop)
      ),
      scrollTop
    )

    u.connect(
      u.pipe(
        scrollContainerState,
        u.map(({ scrollHeight }) => scrollHeight)
      ),
      scrollHeight
    )

    u.connect(scrollTop, statefulScrollTop)

    return {
      deviation,
      deviationCommitted,
      fixedFooterHeight,
      fixedHeaderHeight,
      footerHeight,
      headerHeight,
      horizontalDirection,
      scrollBy,
      // input
      scrollContainerState,
      scrollHeight,
      scrollingInProgress,
      // signals
      scrollTo,

      scrollTop,
      skipAnimationFrameInResizeObserver,

      smoothScrollTargetReached,
      // state
      statefulScrollTop,
      viewportHeight,
    }
  },
  [],
  { singleton: true }
)
