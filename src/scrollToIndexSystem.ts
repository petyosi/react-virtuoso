/* eslint-disable @typescript-eslint/no-unsafe-call */
import * as u from '@virtuoso.dev/urx'
import { findMaxKeyValue } from './AATree'
import { domIOSystem } from './domIOSystem'
import { offsetOf, originalIndexFromItemIndex, sizeSystem } from './sizeSystem'
import { IndexLocationWithAlign } from './interfaces'

export type IndexLocation = number | IndexLocationWithAlign

export function normalizeIndexLocation(location: IndexLocation) {
  const result: IndexLocationWithAlign = typeof location === 'number' ? { index: location } : location

  if (!result.align) {
    result.align = 'start'
  }
  if (!result.behavior) {
    result.behavior = 'auto'
  }
  return result as Required<IndexLocationWithAlign>
}

export const scrollToIndexSystem = u.system(
  ([{ sizes, totalCount, listRefresh }, { scrollingInProgress, viewportHeight, scrollTo, smoothScrollTargetReached, headerHeight }]) => {
    const scrollToIndex = u.stream<IndexLocation>()
    const topListHeight = u.statefulStream(0)

    let unsubscribeNextListRefresh: any = null
    let cleartTimeoutRef: any = null
    let unsubscribeListRefresh: any = null

    const cleanup = () => {
      if (unsubscribeNextListRefresh) {
        unsubscribeNextListRefresh()
        unsubscribeNextListRefresh = null
      }

      if (unsubscribeListRefresh) {
        unsubscribeListRefresh()
        unsubscribeListRefresh = null
      }

      if (cleartTimeoutRef) {
        clearTimeout(cleartTimeoutRef)
        cleartTimeoutRef = null
      }
      u.publish(scrollingInProgress, false)
    }

    u.connect(
      u.pipe(
        scrollToIndex,
        u.withLatestFrom(sizes, viewportHeight, totalCount, topListHeight, headerHeight),
        u.map(([location, sizes, viewportHeight, totalCount, topListHeight, headerHeight]) => {
          const normalLocation = normalizeIndexLocation(location)
          const { align, behavior } = normalLocation
          let index = normalLocation.index

          index = originalIndexFromItemIndex(index, sizes)

          index = Math.max(0, index, Math.min(totalCount - 1, index))

          let top = offsetOf(index, sizes) + headerHeight
          if (align === 'end') {
            top = Math.round(top - viewportHeight + findMaxKeyValue(sizes.sizeTree, index)[1]!)
          } else if (align === 'center') {
            top = Math.round(top - viewportHeight / 2 + findMaxKeyValue(sizes.sizeTree, index)[1]! / 2)
          } else {
            top -= topListHeight
          }

          const retry = (listChanged: boolean) => {
            cleanup()
            if (listChanged) {
              u.publish(scrollToIndex, location)
            }
          }

          cleanup()

          if (behavior === 'smooth') {
            let listChanged = false
            unsubscribeListRefresh = u.subscribe(listRefresh, (changed) => {
              listChanged = listChanged || changed
            })

            unsubscribeNextListRefresh = u.handleNext(smoothScrollTargetReached, () => {
              retry(listChanged)
            })
          } else {
            unsubscribeNextListRefresh = u.handleNext(listRefresh, retry)
          }

          // if the scroll jump is too small, the list won't get rerendered.
          // clean this listener
          cleartTimeoutRef = setTimeout(() => {
            cleanup()
          }, 1200)

          u.publish(scrollingInProgress, true)
          return { top, behavior }
        })
      ),
      scrollTo
    )

    return {
      scrollToIndex,
      topListHeight,
    }
  },
  u.tup(sizeSystem, domIOSystem),
  { singleton: true }
)
