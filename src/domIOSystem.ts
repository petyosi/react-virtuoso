import { connect, pipe, scan, map, system, stream, statefulStream } from '@virtuoso.dev/urx'

export const UP = 'up' as const
export const DOWN = 'down' as const
export type ScrollDirection = typeof UP | typeof DOWN

export const domIOSystem = system(
  () => {
    const scrollTop = stream<number>()
    const deviation = statefulStream(0)
    const smoothScrollTargetReached = stream<true>()
    const statefulScrollTop = statefulStream(0)
    const viewportHeight = stream<number>()
    const scrollTo = stream<ScrollToOptions>()
    const scrollBy = stream<ScrollToOptions>()

    connect(scrollTop, statefulScrollTop)
    const scrollDirection = statefulStream<ScrollDirection>(DOWN)

    connect(
      pipe(
        scrollTop,
        scan(
          (acc, scrollTop) => {
            return { direction: scrollTop < acc.prevScrollTop ? UP : DOWN, prevScrollTop: scrollTop }
          },
          { direction: DOWN, prevScrollTop: 0 } as { direction: ScrollDirection; prevScrollTop: number }
        ),
        map(value => value.direction)
      ),
      scrollDirection
    )

    return {
      // input
      scrollTop,
      viewportHeight,
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
