import * as u from './urx'
import { findMaxKeyValue } from './AATree'
import { domIOSystem } from './domIOSystem'
import { offsetOf, originalIndexFromLocation, sizeSystem } from './sizeSystem'
import { loggerSystem } from './loggerSystem'
import { scrollToIndexSystem } from './scrollToIndexSystem'
import { listStateSystem } from './listStateSystem'
import { ScrollIntoViewLocation, CalculateViewLocation } from './interfaces'

const defaultCalculateViewLocation: CalculateViewLocation = ({
  itemTop,
  itemBottom,
  viewportTop,
  viewportBottom,
  locationParams: { behavior, align, ...rest },
}) => {
  if (itemTop < viewportTop) {
    return { ...rest, behavior, align: align ?? 'start' }
  }
  if (itemBottom > viewportBottom) {
    return { ...rest, behavior, align: align ?? 'end' }
  }
  return null
}

export const scrollIntoViewSystem = u.system(
  ([
    { sizes, totalCount, gap },
    { scrollTop, viewportHeight, headerHeight, fixedHeaderHeight, fixedFooterHeight, scrollingInProgress },
    { scrollToIndex },
  ]) => {
    const scrollIntoView = u.stream<ScrollIntoViewLocation>()

    u.connect(
      u.pipe(
        scrollIntoView,
        u.withLatestFrom(sizes, viewportHeight, totalCount, headerHeight, fixedHeaderHeight, fixedFooterHeight, scrollTop),
        u.withLatestFrom(gap),
        u.map(([[viewLocation, sizes, viewportHeight, totalCount, headerHeight, fixedHeaderHeight, fixedFooterHeight, scrollTop], gap]) => {
          const { done, behavior, align, calculateViewLocation = defaultCalculateViewLocation, ...rest } = viewLocation
          const actualIndex = originalIndexFromLocation(viewLocation, sizes, totalCount - 1)

          const itemTop = offsetOf(actualIndex, sizes.offsetTree, gap) + headerHeight + fixedHeaderHeight
          const itemBottom = itemTop + findMaxKeyValue(sizes.sizeTree, actualIndex)[1]!
          const viewportTop = scrollTop + fixedHeaderHeight
          const viewportBottom = scrollTop + viewportHeight - fixedFooterHeight

          const location = calculateViewLocation({
            itemTop,
            itemBottom,
            viewportTop,
            viewportBottom,
            locationParams: { behavior, align, ...rest },
          })

          if (location) {
            done &&
              u.handleNext(
                u.pipe(
                  scrollingInProgress,
                  u.filter((value) => value === false),
                  // skips the initial publish of false, and the cleanup call.
                  // but if scrollingInProgress is true, we skip the initial publish.
                  u.skip(u.getValue(scrollingInProgress) ? 1 : 2)
                ),
                done
              )
          } else {
            done && done()
          }

          return location
        }),
        u.filter((value) => value !== null)
      ),
      scrollToIndex
    )

    return {
      scrollIntoView,
    }
  },
  u.tup(sizeSystem, domIOSystem, scrollToIndexSystem, listStateSystem, loggerSystem),
  { singleton: true }
)
