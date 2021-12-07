import * as u from '@virtuoso.dev/urx'

export const domIOSystem = u.system(
  () => {
    const scrollTop = u.stream<number>()
    const deviation = u.statefulStream(0)
    const smoothScrollTargetReached = u.stream<true>()
    const statefulScrollTop = u.statefulStream(0)
    const viewportHeight = u.stream<number>()
    const scrollHeight = u.stream<number>()
    const headerHeight = u.statefulStream(0)
    const footerHeight = u.statefulStream(0)
    const scrollTo = u.stream<ScrollToOptions>()
    const scrollBy = u.stream<ScrollToOptions>()
    const scrollingInProgress = u.statefulStream(false)

    u.connect(scrollTop, statefulScrollTop)

    return {
      // input
      scrollTop,
      viewportHeight,
      headerHeight,
      footerHeight,
      scrollHeight,
      smoothScrollTargetReached,

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
