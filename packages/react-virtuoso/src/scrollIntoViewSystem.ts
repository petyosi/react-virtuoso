import { findMaxKeyValue } from './AATree'
import { domIOSystem } from './domIOSystem'
import { listStateSystem } from './listStateSystem'
import { loggerSystem } from './loggerSystem'
import { scrollToIndexSystem } from './scrollToIndexSystem'
import { offsetOf, originalIndexFromLocation, sizeSystem } from './sizeSystem'
import * as u from './urx'

import type { CalculateViewLocation, ScrollIntoViewLocation } from './interfaces'

const defaultCalculateViewLocation: CalculateViewLocation = ({
  itemBottom,
  itemTop,
  locationParams: { align, behavior, ...rest },
  viewportBottom,
  viewportTop,
}) => {
  if (itemTop < viewportTop) {
    return { ...rest, align: align ?? 'start', ...(behavior === undefined ? {} : { behavior }) }
  }
  if (itemBottom > viewportBottom) {
    return { ...rest, align: align ?? 'end', ...(behavior === undefined ? {} : { behavior }) }
  }
  return null
}

export const scrollIntoViewSystem = u.system(
  ([
    { gap, sizes, totalCount },
    { fixedFooterHeight, fixedHeaderHeight, headerHeight, scrollingInProgress, scrollTop, viewportHeight },
    { scrollToIndex },
  ]) => {
    const scrollIntoView = u.stream<ScrollIntoViewLocation>()

    u.connect(
      u.pipe(
        scrollIntoView,
        u.withLatestFrom(sizes, viewportHeight, totalCount, headerHeight, fixedHeaderHeight, fixedFooterHeight, scrollTop),
        u.withLatestFrom(gap),
        u.map(([[viewLocation, sizes, viewportHeight, totalCount, headerHeight, fixedHeaderHeight, fixedFooterHeight, scrollTop], gap]) => {
          const { calculateViewLocation = defaultCalculateViewLocation, done, ...locationParams } = viewLocation
          const actualIndex = originalIndexFromLocation(viewLocation, sizes, totalCount - 1)

          const itemTop = offsetOf(actualIndex, sizes.offsetTree, gap) + headerHeight + fixedHeaderHeight
          const itemBottom = itemTop + findMaxKeyValue(sizes.sizeTree, actualIndex)[1]!
          const viewportTop = scrollTop + fixedHeaderHeight
          const viewportBottom = scrollTop + viewportHeight - fixedFooterHeight

          const location = calculateViewLocation({
            itemBottom,
            itemTop,
            locationParams,
            viewportBottom,
            viewportTop,
          })

          if (location === null) {
            done?.()
          } else {
            if (done) {
              u.handleNext(
                u.pipe(
                  scrollingInProgress,
                  u.filter((value) => !value),
                  // skips the initial publish of false, and the cleanup call.
                  // but if scrollingInProgress is true, we skip the initial publish.
                  u.skip(u.getValue(scrollingInProgress) ? 1 : 2)
                ),
                done
              )
            }
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
