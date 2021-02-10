import { connect, system, handleNext, subscribe, map, pipe, publish, statefulStream, stream, tup, withLatestFrom } from '@virtuoso.dev/urx'
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

export const scrollToIndexSystem = system(
  ([{ sizes, totalCount, listRefresh }, { viewportHeight, scrollTo, smoothScrollTargetReached, headerHeight }]) => {
    const scrollToIndex = stream<IndexLocation>()
    const topListHeight = statefulStream(0)

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
    }

    connect(
      pipe(
        scrollToIndex,
        withLatestFrom(sizes, viewportHeight, totalCount, topListHeight, headerHeight),
        map(([location, sizes, viewportHeight, totalCount, topListHeight, headerHeight]) => {
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
              publish(scrollToIndex, location)
            }
          }

          cleanup()

          if (behavior === 'smooth') {
            let listChanged = false
            unsubscribeListRefresh = subscribe(listRefresh, changed => {
              listChanged = listChanged || changed
            })

            unsubscribeNextListRefresh = handleNext(smoothScrollTargetReached, () => {
              retry(listChanged)
            })
          } else {
            unsubscribeNextListRefresh = handleNext(listRefresh, retry)
          }

          // if the scroll jump is too small, the list won't get rerendered.
          // clean this listener
          cleartTimeoutRef = setTimeout(() => {
            cleanup()
          }, 1200)

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
  tup(sizeSystem, domIOSystem),
  { singleton: true }
)
