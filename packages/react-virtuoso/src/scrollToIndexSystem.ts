/* eslint-disable @typescript-eslint/no-unsafe-call */
import { findMaxKeyValue } from './AATree'
import { domIOSystem } from './domIOSystem'
import { IndexLocationWithAlign } from './interfaces'
import { loggerSystem, LogLevel } from './loggerSystem'
import { offsetOf, originalIndexFromLocation, sizeSystem } from './sizeSystem'
import * as u from './urx'

export type IndexLocation = IndexLocationWithAlign | number

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

  return result
}

export const scrollToIndexSystem = u.system(
  ([
    { gap, listRefresh, sizes, totalCount },
    {
      fixedFooterHeight,
      fixedHeaderHeight,
      footerHeight,
      headerHeight,
      scrollingInProgress,
      scrollTo,
      smoothScrollTargetReached,
      viewportHeight,
    },
    { log },
  ]) => {
    const scrollToIndex = u.stream<IndexLocation>()
    const scrollTargetReached = u.stream<true>()
    const topListHeight = u.statefulStream(0)

    let unsubscribeNextListRefresh: any = null
    let cleartTimeoutRef: null | ReturnType<typeof setTimeout> = null
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
        u.withLatestFrom(gap, fixedHeaderHeight, fixedFooterHeight),
        u.map(
          ([
            [location, sizes, viewportHeight, totalCount, topListHeight, headerHeight, footerHeight, log],
            gap,
            fixedHeaderHeight,
            fixedFooterHeight,
          ]) => {
            const normalLocation = normalizeIndexLocation(location)
            const { align, behavior, offset } = normalLocation
            const lastIndex = totalCount - 1

            const index = originalIndexFromLocation(normalLocation, sizes, lastIndex)

            let top = offsetOf(index, sizes.offsetTree, gap) + headerHeight
            if (align === 'end') {
              top += fixedHeaderHeight + findMaxKeyValue(sizes.sizeTree, index)[1]! - viewportHeight + fixedFooterHeight
              if (index === lastIndex) {
                top += footerHeight
              }
            } else if (align === 'center') {
              top += (fixedHeaderHeight + findMaxKeyValue(sizes.sizeTree, index)[1]! - viewportHeight + fixedFooterHeight) / 2
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
                u.publish(scrollTargetReached, true)
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
              unsubscribeNextListRefresh = u.handleNext(u.pipe(listRefresh, watchChangesFor(150)), retry)
            }

            // if the scroll jump is too small, the list won't get rerendered.
            // clean this listener
            cleartTimeoutRef = setTimeout(() => {
              cleanup()
            }, 1200)

            u.publish(scrollingInProgress, true)
            log('scrolling from index to', { behavior, index, top }, LogLevel.DEBUG)
            return { behavior, top }
          }
        )
      ),
      scrollTo
    )

    return {
      scrollTargetReached,
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
