import { findMaxKeyValue } from './AATree'
import { domIOSystem } from './domIOSystem'
import { CalculateViewLocation, ScrollIntoViewLocation } from './interfaces'
import { listStateSystem } from './listStateSystem'
import { loggerSystem } from './loggerSystem'
import { scrollToIndexSystem } from './scrollToIndexSystem'
import { offsetOf, originalIndexFromLocation, sizeSystem } from './sizeSystem'
import * as u from './urx'

const defaultCalculateViewLocation: CalculateViewLocation = ({
  itemBottom,
  itemTop,
  locationParams: { align, behavior, ...rest },
  viewportBottom,
  viewportTop,
}) => {
  if (itemTop < viewportTop) {
    return { ...rest, align: align ?? 'start', behavior }
  }
  if (itemBottom > viewportBottom) {
    return { ...rest, align: align ?? 'end', behavior }
  }
  return null
}

export const scrollIntoViewSystem = u.system(
  ([
    { gap, sizes, totalCount },
    { fixedFooterHeight, fixedHeaderHeight, headerHeight, scrollingInProgress, scrollTop, viewportHeight },
    { scrollToIndex },
    { didCalcList }
  ]) => {
    const scrollIntoView = u.stream<ScrollIntoViewLocation>()
    let pendingScrollHandle: any = null

    u.subscribe(
      u.pipe(
        scrollIntoView,
        u.withLatestFrom(sizes, viewportHeight, totalCount, headerHeight, fixedHeaderHeight, fixedFooterHeight, scrollTop),
        u.withLatestFrom(gap)
      ),
      (([[viewLocation, sizes, viewportHeight, totalCount, headerHeight, fixedHeaderHeight, fixedFooterHeight, scrollTop], gap]) => {
          const { align, behavior, calculateViewLocation = defaultCalculateViewLocation, done, targetsNextRefresh, ...rest } = viewLocation
          const actualIndex = originalIndexFromLocation(viewLocation, sizes, totalCount - 1)

          const itemTop = offsetOf(actualIndex, sizes.offsetTree, gap) + headerHeight + fixedHeaderHeight
          const itemBottom = itemTop + findMaxKeyValue(sizes.sizeTree, actualIndex)[1]!
          const viewportTop = scrollTop + fixedHeaderHeight
          const viewportBottom = scrollTop + viewportHeight - fixedFooterHeight

          function startScroll() {
            const location = calculateViewLocation({
              itemBottom,
              itemTop,
              locationParams: { align, behavior, ...rest },
              viewportBottom,
              viewportTop,
            })

            if (location) {
              done &&
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
            } else {
              done && done()
            }
            if (location){
              u.publish(scrollToIndex, location);
            }
          }

          if (targetsNextRefresh) {
            if (pendingScrollHandle) {
              pendingScrollHandle()
              pendingScrollHandle = null
            }
            pendingScrollHandle = u.handleNext(didCalcList, () => {
              pendingScrollHandle = null
              requestAnimationFrame(() => {
                startScroll()
              })
            })
          } else {
            startScroll()
          }
        })
      )

    return {
      scrollIntoView,
    }
  },
  u.tup(sizeSystem, domIOSystem, scrollToIndexSystem, listStateSystem, loggerSystem),
  { singleton: true }
)
