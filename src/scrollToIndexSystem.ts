/* eslint-disable @typescript-eslint/no-unsafe-call */
import * as u from '@virtuoso.dev/urx'
import { findMaxKeyValue } from './AATree'
import { domIOSystem } from './domIOSystem'
import { offsetOf, originalIndexFromItemIndex, sizeSystem } from './sizeSystem'
import { IndexLocationWithAlign } from './interfaces'
import { loggerSystem, LogLevel } from './loggerSystem'

export type IndexLocation = number | IndexLocationWithAlign

const SUPPORTS_SCROLL_TO_OPTIONS = typeof document !== 'undefined' && 'scrollBehavior' in document.documentElement.style

export function normalizeIndexLocation(location: IndexLocation) {
  const result: IndexLocationWithAlign = typeof location === 'number' ? { index: location } : location

  if (!result.align) {
    result.align = 'start'
  }
  if (!result.behavior || !SUPPORTS_SCROLL_TO_OPTIONS) {
    result.behavior = 'auto'
  }
  if (!result.offset) {
    result.offset = 0
  }
  return result as Required<IndexLocationWithAlign>
}

export const scrollToIndexSystem = u.system(
  ([
    { sizes, totalCount, listRefresh },
    { scrollingInProgress, viewportHeight, scrollTo, smoothScrollTargetReached, headerHeight, footerHeight },
    { log },
  ]) => {
    const scrollToIndex = u.stream<IndexLocation>()
    const topListHeight = u.statefulStream(0)

    let unsubscribeNextListRefresh: any = null
    let cleartTimeoutRef: any = null
    let unsubscribeListRefresh: any = null

    function cleanup() {
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
        u.withLatestFrom(sizes, viewportHeight, totalCount, topListHeight, headerHeight, footerHeight, log),
        u.map(([location, sizes, viewportHeight, totalCount, topListHeight, headerHeight, footerHeight, log]) => {
          const normalLocation = normalizeIndexLocation(location)
          const { align, behavior, offset } = normalLocation
          const lastIndex = totalCount - 1
          let index = normalLocation.index
          if (index === 'LAST') {
            index = lastIndex
          }

          index = originalIndexFromItemIndex(index, sizes)

          index = Math.max(0, index, Math.min(lastIndex, index))

          let top = offsetOf(index, sizes.offsetTree) + headerHeight
          if (align === 'end') {
            top = top - viewportHeight + findMaxKeyValue(sizes.sizeTree, index)[1]!
            if (index === lastIndex) {
              top += footerHeight
            }
          } else if (align === 'center') {
            top = top - viewportHeight / 2 + findMaxKeyValue(sizes.sizeTree, index)[1]! / 2
          } else {
            top -= topListHeight
          }

          if (offset) {
            top += offset
          }

          const retry = (listChanged: boolean) => {
            cleanup()
            if (listChanged) {
              log('retrying to scroll to', { location }, LogLevel.DEBUG)
              u.publish(scrollToIndex, location)
            } else {
              log('list did not change, scroll successful', {}, LogLevel.DEBUG)
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
            unsubscribeNextListRefresh = u.handleNext(u.pipe(listRefresh, watchChangesFor(50)), retry)
          }

          // if the scroll jump is too small, the list won't get rerendered.
          // clean this listener
          cleartTimeoutRef = setTimeout(() => {
            cleanup()
          }, 1200)

          u.publish(scrollingInProgress, true)
          log('scrolling from index to', { index, top, behavior }, LogLevel.DEBUG)
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
  u.tup(sizeSystem, domIOSystem, loggerSystem),
  { singleton: true }
)

function watchChangesFor(limit: number): u.Operator<boolean> {
  return (done) => {
    const timeoutRef = setTimeout(() => {
      done(false)
    }, limit)
    return (value) => {
      if (value) {
        done(true)
        clearTimeout(timeoutRef)
      }
    }
  }
}
