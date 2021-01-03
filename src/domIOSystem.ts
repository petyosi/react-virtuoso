import * as u from '@virtuoso.dev/urx'

export const UP = 'up' as const
export const DOWN = 'down' as const
export type ScrollDirection = typeof UP | typeof DOWN

export const domIOSystem = u.system(
  () => {
    const scrollTop = u.stream<number>()
    const deviation = u.statefulStream(0)
    const smoothScrollTargetReached = u.stream<true>()
    const statefulScrollTop = u.statefulStream(0)
    const viewportHeight = u.stream<number>()
    const headerHeight = u.statefulStream(0)
    const footerHeight = u.statefulStream(0)
    const scrollTo = u.stream<ScrollToOptions>()
    const scrollBy = u.stream<ScrollToOptions>()

    u.connect(scrollTop, statefulScrollTop)
    const scrollDirection = u.statefulStream<ScrollDirection>(DOWN)

    u.connect(
      u.pipe(
        scrollTop,
        u.scan(
          (acc, scrollTop) => {
            return { direction: scrollTop < acc.prevScrollTop ? UP : DOWN, prevScrollTop: scrollTop }
          },
          { direction: DOWN, prevScrollTop: 0 } as { direction: ScrollDirection; prevScrollTop: number }
        ),
        u.map(value => value.direction)
      ),
      scrollDirection
    )

    return {
      // input
      scrollTop,
      viewportHeight,
      headerHeight,
      footerHeight,
      smoothScrollTargetReached,

      // signals
      scrollTo,
      scrollBy,

      // state
      scrollDirection,
      statefulScrollTop,
      deviation,
    }
  },
  [],
  { singleton: true }
)
