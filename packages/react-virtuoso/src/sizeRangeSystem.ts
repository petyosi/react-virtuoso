import {
  combineLatest,
  duc,
  filter,
  map,
  pipe,
  StatefulStream,
  statefulStream,
  statefulStreamFromEmitter,
  stream,
  system,
  tup,
} from '@virtuoso.dev/urx'
import { domIOSystem, DOWN, ScrollDirection, UP } from './domIOSystem'

export type NumberTuple = [number, number]
export type Overscan = number | { main: number; reverse: number }
export const TOP = 'top' as const
export const BOTTOM = 'bottom' as const
export const NONE = 'none' as const
export type ListEnd = typeof TOP | typeof BOTTOM
export type ChangeDirection = typeof UP | typeof DOWN | typeof NONE

const boundryComparator = (prev: NumberTuple, current: NumberTuple) => prev && prev[0] === current[0] && prev[1] === current[1]

export const getOverscan = (overscan: Overscan, end: ListEnd, direction: ScrollDirection) => {
  if (typeof overscan === 'number') {
    return (direction === UP && end === TOP) || (direction === DOWN && end === BOTTOM) ? overscan : 0
  } else {
    if (direction === UP) {
      return end === TOP ? overscan.main : overscan.reverse
    } else {
      return end === BOTTOM ? overscan.main : overscan.reverse
    }
  }
}

export const sizeRangeSystem = system(
  ([{ scrollTop, viewportHeight }]) => {
    const listBoundary = stream<NumberTuple>()
    const headerHeight = statefulStream(0)
    const footerHeight = statefulStream(0)
    const topListHeight = statefulStream(0)
    const overscan = statefulStream<Overscan>(0)

    const visibleRange = (statefulStreamFromEmitter(
      pipe(
        combineLatest(
          duc(scrollTop),
          duc(viewportHeight),
          duc(headerHeight),
          duc(listBoundary, boundryComparator),
          duc(overscan),
          duc(topListHeight)
        ),
        map(([scrollTop, viewportHeight, headerHeight, [listTop, listBottom], overscan, topListHeight]) => {
          const top = scrollTop - headerHeight
          let direction: ChangeDirection = NONE

          if (listTop > scrollTop + topListHeight) {
            direction = UP
          }

          if (listBottom < scrollTop + viewportHeight) {
            direction = DOWN
          }

          if (direction !== NONE) {
            return [
              Math.max(top - getOverscan(overscan, TOP, direction), 0),
              top + viewportHeight + getOverscan(overscan, BOTTOM, direction),
            ] as NumberTuple
          }

          return null
        }),
        filter(value => value != null)
      ),
      [0, 0]
    ) as unknown) as StatefulStream<NumberTuple>

    return {
      // input
      listBoundary,
      headerHeight,
      footerHeight,
      overscan,
      topListHeight,

      // output
      visibleRange,
    }
  },
  tup(domIOSystem),
  { singleton: true }
)
