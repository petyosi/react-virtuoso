import { Cell, e, Stream } from '@virtuoso.dev/reactive-engine-core'

import { totalCount$ } from '../core/data'
import { sizeState$, totalHeight$ } from '../resize/sizes'
import { empty, findMaxKeyValue } from '../sizing/AATree'
import { itemOffsetAndSize as rowOffsetAndHeight, offsetOf } from '../sizing/offsetOf'
import {
  headerHeight$,
  scrollBy$,
  scrollLocation$,
  scrollOffset$,
  scrollTargetReached$,
  scrollTo$,
  scrollTop$,
  stickyFooterHeight$,
  stickyHeaderHeight$,
  viewportHeight$,
} from './dom'
import { initialLocation$, pendingScrollToInitialLocation$, scrollIntoView$, scrollToRow$, isScrollingToBottom$ } from './state'

import type { RowLocation } from '../interfaces'
import type { SizeState } from '../sizing/SizeState'
import type { NodeRef } from '@virtuoso.dev/reactive-engine-core'

export { initialLocation$, pendingScrollToInitialLocation$, scrollIntoView$, scrollToRow$ } from './state'

export function normalizeRowLocation(location: RowLocation, lastIndex: number) {
  if (typeof location === 'number') {
    return {
      index: location,
      offset: 0,
      behavior: 'auto',
      align: 'start-no-overflow',
    }
  }

  const result = {
    index: Number.NaN,
    align: location.align ?? 'start-no-overflow',
    behavior: location.behavior ?? 'auto',
    offset: location.offset ?? 0,
  }

  if (location.index === 'LAST') {
    result.index = lastIndex
  } else if (location.index < 0) {
    result.index = lastIndex + location.index
  } else {
    result.index = location.index
  }

  return result
}

export interface ScrollToLocationFromScrollToRowLocationParams {
  location: RowLocation
  sizeState: SizeState
  totalHeight: number
  totalCount: number
  viewportHeight: number
  headerHeight: number
  stickyHeaderHeight: number
  stickyFooterHeight: number
}

export function scrollToLocationFromScrollToRowLocation({
  location,
  sizeState: { sizeTree, offsetTree },
  totalHeight,
  totalCount,
  viewportHeight,
  headerHeight,
  stickyHeaderHeight,
  stickyFooterHeight,
}: ScrollToLocationFromScrollToRowLocationParams) {
  const { align, behavior, offset, index } = normalizeRowLocation(location, totalCount - 1)

  function rowHeight() {
    const [, height] = findMaxKeyValue(sizeTree, index)
    if (height === undefined) {
      throw new Error(`Row at index ${index} not found`)
    }
    return height
  }

  viewportHeight -= stickyHeaderHeight + stickyFooterHeight

  let top = offsetOf(index, offsetTree) + headerHeight - stickyHeaderHeight
  if (align === 'end') {
    top = top - viewportHeight + rowHeight()
  } else if (align === 'center') {
    top = top - viewportHeight / 2 + rowHeight() / 2
  }

  if (offset) {
    top += offset
  }

  // if scrolling aims to align a row to the top of the viewport
  // but the list is not tall enough (because last row), force a margin
  // the margin will be accessed in the scrollTo hook for immediate dom manipulation
  // in dom.ts, we will calculate the margin in the state
  let forceBottomSpace = 0
  if (align === 'start') {
    forceBottomSpace = Math.max(0, Math.min(top - (totalHeight - viewportHeight)))
  }

  top = Math.max(0, top)

  return { top, behavior, align, forceBottomSpace } as ScrollToOptions
}

export const lastScrollToRowLocation$ = Cell<RowLocation | null>(null)
export const listHasRefreshed$ = Cell(false)
export const scrollToRowComplete$ = Cell(true)

export const cancelScrollToRow$ = Stream<true>()
e.link(e.pipe(cancelScrollToRow$, e.mapTo(true)), scrollToRowComplete$)

e.link(e.pipe(cancelScrollToRow$, e.mapTo(null)), lastScrollToRowLocation$)

e.link(
  e.pipe(
    scrollIntoView$,
    e.withLatestFrom(totalCount$, sizeState$, scrollLocation$),
    e.map(([location, totalCount, { offsetTree }, scrollLocation]) => {
      const normalized = normalizeRowLocation(location, totalCount - 1)
      const { behavior, offset, index } = normalized
      let { align } = normalized
      const done = typeof location === 'number' ? undefined : location.done
      const [rowOffset, rowHeight] = rowOffsetAndHeight(index, offsetTree)
      if (rowOffset < -scrollLocation.listOffset) {
        if (typeof location === 'number' || location.align === undefined) {
          align = 'start-no-overflow'
        }
        return { index, align, behavior, offset, done }
      }
      if (rowOffset + rowHeight > -scrollLocation.listOffset + scrollLocation.visibleListHeight) {
        if (typeof location === 'number' || location.align === undefined) {
          align = 'end'
        }
        return { index, align, behavior, offset, done }
      }
      return null
    }),
    e.filter((value) => value !== null)
  ),
  // @ts-expect-error contravariance
  scrollToRow$
)

const scrollToLocation$: NodeRef<ScrollOptions> = e.pipe(
  scrollToRow$,
  e.withLatestFrom(sizeState$, totalCount$, viewportHeight$, headerHeight$, stickyHeaderHeight$, stickyFooterHeight$, totalHeight$),
  e.map(([location, sizeState, totalCount, viewportHeight, headerHeight, stickyHeaderHeight, stickyFooterHeight, totalHeight]) => {
    try {
      return scrollToLocationFromScrollToRowLocation({
        location,
        totalHeight,
        sizeState,
        totalCount,
        viewportHeight,
        headerHeight,
        stickyHeaderHeight,
        stickyFooterHeight,
      })
    } catch {
      return null
    }
  }),
  e.filter((value) => value !== null)
)

e.link(scrollToRow$, lastScrollToRowLocation$)

e.link(scrollToLocation$, scrollTo$)

e.link(
  e.pipe(
    scrollToRow$,
    e.filter((location) => {
      return typeof location !== 'number' && location.index === 'LAST'
    }),
    e.mapTo(true)
  ),
  isScrollingToBottom$
)

e.link(e.pipe(scrollToLocation$, e.mapTo(false)), scrollToRowComplete$)
e.link(e.pipe(scrollToLocation$, e.mapTo(false)), listHasRefreshed$)

e.link(
  e.pipe(
    sizeState$,
    // wait for the list to render with the specified sizeTree, so that enough space is available to scroll by
    e.debounceTime(0),
    e.withLatestFrom(scrollToRowComplete$, lastScrollToRowLocation$),
    e.filter(([, complete, location]) => {
      return !complete && location !== null
    }),
    e.map(([, , location]) => {
      return location
    })
  ),
  scrollToRow$
)

// wait for the retry to potentially activate
e.sub(e.pipe(scrollTargetReached$, e.debounceTime(10)), () => {
  const location = e.getValue(lastScrollToRowLocation$)
  if (location !== null && typeof location !== 'number' && location.done !== undefined) {
    location.done()
  }
  e.pubIn({
    [lastScrollToRowLocation$]: null,
    [scrollToRowComplete$]: true,
  })
})

e.link(
  e.pipe(
    scrollOffset$,
    // wait for the list to render with the specified scrollOffset, so that enough space is available to scroll by
    e.delayWithMicrotask(),
    e.filter((value) => value !== 0)
  ),
  scrollBy$
)

e.link(
  e.pipe(
    scrollOffset$,
    e.onNext(scrollTop$),
    e.map(() => {
      return 0
    })
  ),
  scrollOffset$
)

e.link(
  e.pipe(
    initialLocation$,
    e.filter((location) => location !== null)
  ),
  pendingScrollToInitialLocation$
)

const scrollToTheInitialLocation$ = e.pipe(
  e.combine(initialLocation$, sizeState$),
  e.withLatestFrom(pendingScrollToInitialLocation$),
  e.filter(([[initialLocation, { sizeTree }], pending]) => {
    return initialLocation !== null && !empty(sizeTree) && pending !== null
  }),
  e.map(([[location]]) => location)
)

// delay prevents conflicting resolutions for the scrollToRow value in the update cycle
// conflict is with the retry logic
e.link(e.pipe(scrollToTheInitialLocation$, e.throttleTime(0)), scrollToRow$)

e.link(
  e.pipe(
    scrollToTheInitialLocation$,
    e.onNext(e.pipe(scrollToRowComplete$, e.filter(Boolean))),
    e.mapTo(null)
    // unset the location after the scroll completes
  ),
  pendingScrollToInitialLocation$
)
