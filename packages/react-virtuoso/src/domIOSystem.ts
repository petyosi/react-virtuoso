import { ScrollContainerState } from './interfaces'
import * as u from './urx'

export const domIOSystem = u.system(
  () => {
    const scrollContainerState = u.stream<ScrollContainerState>()
    const scrollTop = u.stream<number>()
    const deviation = u.statefulStream(0)
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
