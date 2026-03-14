import { DerivedCell, Trigger, Cell, Stream, e } from '@virtuoso.dev/reactive-engine-core'

import { recalcInProgress$, totalHeight$ } from '../resize/sizes'
import { easeOutExpo } from '../utils'
import { pendingScrollToInitialLocation$, mobileSafariIsReadjusting$, atBottomThreshold$, isScrollingToBottom$ } from './state'

import type { ListScrollLocation } from '../interfaces'

export const scrollToPending$ = Stream<boolean>()
export const scrollToInProgress$ = Cell<boolean>(false)

export const scrollTargetReached$ = Stream<number>(false)
e.link(e.pipe(scrollTargetReached$, e.mapTo(false)), scrollToPending$)

export const scrollTop$ = Cell(0)

export const scrollLeft$ = Cell(0)

export const viewportHeight$ = Cell(0)
export const viewportWidth$ = Cell(0)

export const scrollHeight$ = Cell(0)
export const scrollWidth$ = Cell(0)

export const hasHorizontalScroll$ = DerivedCell(
  false,
  e.pipe(
    e.combine(scrollWidth$, viewportWidth$),
    e.map(([scrollWidth, viewportWidth]) => scrollWidth > viewportWidth)
  )
)

export const scrollOverlayContentWidth$ = DerivedCell(
  'auto',
  e.pipe(
    e.combine(hasHorizontalScroll$, scrollWidth$),
    e.map(([hasHorizontalScroll, scrollWidth]) => {
      return hasHorizontalScroll ? scrollWidth : 'auto'
    })
  )
)

export const listScrollTop$ = scrollTop$

export const scrollOffset$ = Cell(0)

export const scrollBarScrollerWidth$ = Cell(0)

export const stickyHeaderHeight$ = Cell(0)
export const scrollableHeaderHeight$ = Cell(0)

export const scrollOverlayContentHeight$ = DerivedCell(
  0,
  e.pipe(
    e.combine(scrollHeight$, stickyHeaderHeight$),
    e.map(([scrollHeight, headerHeight]) => scrollHeight - headerHeight)
  )
)

export const stickyFooterHeight$ = Cell(0)
export const scrollableFooterHeight$ = Cell(0)

export const scrollerElement$ = Cell<HTMLDivElement | null>(null)

export const cancelSmoothScroll$ = Trigger()

export const increaseViewportBy$ = Cell(0)

export const enforceStickyFooterAtBottom$ = Cell(false)

export const DEFAULT_SMOOTH_SCROLL_BEZIER_FUNCTION = easeOutExpo

export const DEFAULT_SMOOTH_SCROLL_FRAME_COUNT = 50

export const headerHeight$ = DerivedCell(
  0,
  e.pipe(
    e.combine(stickyHeaderHeight$, scrollableHeaderHeight$),
    e.map(([stickyHeaderHeight, scrollableHeaderHeight]) => {
      return stickyHeaderHeight + scrollableHeaderHeight
    })
  )
)

export const footerHeight$ = DerivedCell(
  0,
  e.pipe(
    e.combine(stickyFooterHeight$, scrollableFooterHeight$),
    e.map(([stickyFooterHeight, scrollableFooterHeight]) => {
      return stickyFooterHeight + scrollableFooterHeight
    })
  )
)

export const visibleHeaderHeight$ = DerivedCell(
  0,
  e.pipe(
    e.combine(stickyHeaderHeight$, scrollableHeaderHeight$, scrollTop$),
    e.map(([stickyHeaderHeight, scrollableHeaderHeight, scrollTop]) => {
      return stickyHeaderHeight + Math.max(scrollableHeaderHeight - scrollTop, 0)
    })
  )
)

export const visibleFooterHeight$ = DerivedCell(
  0,
  e.pipe(
    e.combine(stickyFooterHeight$, scrollableFooterHeight$, scrollTop$, viewportHeight$, scrollHeight$),
    e.map(([stickyFooterHeight, scrollableFooterHeight, scrollTop, viewportHeight, scrollHeight]) => {
      scrollTop = Math.min(scrollTop, scrollHeight - viewportHeight)
      const visibleScrollableFooterHeight = Math.max(scrollableFooterHeight - (scrollHeight - (scrollTop + viewportHeight)), 0)
      return stickyFooterHeight + visibleScrollableFooterHeight
    })
  )
)

export const visibleListHeight$ = DerivedCell(
  0,
  e.pipe(
    e.combine(viewportHeight$, visibleHeaderHeight$, visibleFooterHeight$),
    e.map(([viewportHeight, visibleHeaderHeight, visibleFooterHeight]) => {
      return Math.max(0, viewportHeight - visibleHeaderHeight - visibleFooterHeight)
    })
  )
)

export const tableBodyForceBottomSpace$ = Cell(0)

// increase the minScrollTop when the list is shrinking
/*
  r.link(
    r.pipe(
      totalHeight$,
      withLatestFrom(minScrollTop$),
      scan(
        (prev, [totalHeight, minScrollTop]) => {
          if (prev.prevTotalHeight === null) {
            return { prevTotalHeight: totalHeight, adjustedMinScrollTop: minScrollTop }
          }
          const diff = Math.min(totalHeight - prev.prevTotalHeight, 0)
          const adjustedMinScrollTop = minScrollTop === 0 ? 0 : minScrollTop + diff

          return { prevTotalHeight: totalHeight, adjustedMinScrollTop }
        },
        { prevTotalHeight: null, adjustedMinScrollTop: 0 } as { prevTotalHeight: number | null; adjustedMinScrollTop: number }
      ),
      map(({ adjustedMinScrollTop }) => adjustedMinScrollTop)
    ),
    minScrollTop$
  )*/

export const minScrollTop$ = Cell(0)

e.link(
  e.pipe(
    e.combine(minScrollTop$, totalHeight$, viewportHeight$, headerHeight$, stickyHeaderHeight$),
    e.map(([minScrollTop, totalHeight, viewportHeight, headerHeight, stickyHeaderHeight]) => {
      if (minScrollTop === 0) {
        return 0
      }
      return Math.max(0, Math.min(minScrollTop - (totalHeight + headerHeight + stickyHeaderHeight - viewportHeight)))
    })
  ),
  tableBodyForceBottomSpace$
)

export interface ScrollToParams {
  left?: number
  top?: number
  behavior?: ScrollBehavior
  align?: 'start' | 'end' | 'center'
}

export const scrollTo$ = Stream<ScrollToParams>()
e.link(
  e.pipe(
    scrollTo$,
    e.map((location) => {
      return location.align === 'start' ? (location.top ?? 0) : 0
    })
  ),
  minScrollTop$
)

e.link(
  e.pipe(
    scrollTo$,
    e.withLatestFrom(scrollTop$),
    e.filter(([options, currentScrollTop]) => {
      return options.top !== currentScrollTop
    }),
    e.mapTo(true)
  ),
  scrollToPending$
)

export const externalScrollerScrollTo$ = Stream<ScrollToParams>()

export const scrollLocation$ = DerivedCell<ListScrollLocation>(
  {
    listOffset: 0,
    visibleListHeight: 0,
    scrollHeight: 0,
    bottomOffset: 0,
    isAtBottom: false,
  },
  e.pipe(
    e.combine(
      scrollTop$,
      headerHeight$,
      footerHeight$,
      scrollableHeaderHeight$,
      visibleListHeight$,
      scrollHeight$,
      tableBodyForceBottomSpace$,
      recalcInProgress$,
      pendingScrollToInitialLocation$,
      mobileSafariIsReadjusting$,
      isScrollingToBottom$
    ),
    e.filter(([, , , , , , , recalcInProgress, pendingScrollToInitialLocation, mobileSafariIsReadjusting]) => {
      return !recalcInProgress && pendingScrollToInitialLocation === null && !mobileSafariIsReadjusting
    }),
    e.map(
      ([
        scrollTop,
        headerHeight,
        footerHeight,
        scrollableHeaderHeight,
        visibleListHeight,
        scrollHeight,
        tableBodyMarginBottom,
        _recalc,
        _pendingScroll,
        _mobileSafariIsReadjusting,
        isScrollingToBottom,
      ]) => {
        const bottomThreshold = e.getValue(atBottomThreshold$)
        const theScrollHeight = scrollHeight - headerHeight - footerHeight
        const listOffset = -scrollTop + scrollableHeaderHeight
        const bottomOffset = theScrollHeight + Math.min(0, listOffset) - visibleListHeight - tableBodyMarginBottom
        return {
          scrollHeight: theScrollHeight,
          listOffset,
          visibleListHeight,
          bottomOffset,
          isAtBottom: isScrollingToBottom || bottomOffset <= bottomThreshold,
        }
      }
    )
  )
)

export const onScroll$ = Stream<ListScrollLocation>()

e.link(
  e.pipe(
    scrollTop$,
    e.debounceTime(0),
    e.withLatestFrom(scrollLocation$, pendingScrollToInitialLocation$, recalcInProgress$),
    e.filter(([, location, pending, recalc]) => location.scrollHeight > 0 && pending === null && !recalc),
    e.map(([, location]) => location)
  ),
  onScroll$
)

export const scrollBy$ = Stream<number>()

export const deviation$ = Cell(0)

export const transformDeviation$ = Cell(0)

export const tableBodyMarginTop$ = Cell(0)

export const tableBodyCssTransition$ = Cell('')

export const scrolledWithMouseWheel$ = Stream<'up' | 'down'>()

export const measureItems$ = Trigger()

export const emptyRenderCycle$ = Trigger()

export const useWindowScroll$ = Cell(false)

export const customScrollParent$ = Cell<HTMLElement | null>(null)
export const customScrollParentWrapper$ = Cell<HTMLElement | null>(null)

export const externalScrollerHeight$ = Cell(0)

export const offsetTopInExternalScroller$ = Cell(0)

e.link(
  e.pipe(
    scrollTo$,
    e.withLatestFrom(offsetTopInExternalScroller$),
    e.map(([params, offsetTop]) => {
      if ('top' in params && params.top !== undefined) {
        params = { ...params, top: params.top + offsetTop }
      }
      return params
    })
  ),
  externalScrollerScrollTo$
)

export const externalScrollerScrollTop$ = Cell(0)

e.link(
  e.pipe(
    e.combine(externalScrollerScrollTop$, offsetTopInExternalScroller$),
    e.map(([scrollTop, offsetTop]) => {
      return Math.max(0, scrollTop - offsetTop)
    })
  ),
  scrollTop$
)

export const externalScrollerViewportHeight$ = Cell(0)

e.link(
  e.pipe(
    e.combine(externalScrollerViewportHeight$, externalScrollerScrollTop$, offsetTopInExternalScroller$),
    e.map(([esViewportHeight, esScrollTop, offsetTop]) => {
      return esViewportHeight - Math.max(0, offsetTop - esScrollTop)
    })
  ),
  viewportHeight$
)
