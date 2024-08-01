import * as u from './urx'
import { ScrollContainerState } from './interfaces'

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
      // input
      scrollContainerState,
      scrollTop,
      viewportHeight,
      headerHeight,
      fixedHeaderHeight,
      fixedFooterHeight,
      footerHeight,
      scrollHeight,
      smoothScrollTargetReached,
      horizontalDirection,
      skipAnimationFrameInResizeObserver,

      // signals
      scrollTo,
      scrollBy,

      // state
      statefulScrollTop,
      deviation,
      scrollingInProgress,
    }
  },
  [],
  { singleton: true }
)
