import { TScrollLocation } from '../EngineCommons'
import { OffsetList } from '../OffsetList'
import { coldSubject, map, subject, TObservable, TSubject, withLatestFrom, filter } from '../tinyrx'
import { initialTopMostItemIndexEngine } from './initialTopMostItemEngine'

export interface ScrollToIndexParams {
  heightsChanged$: TSubject<[boolean, OffsetList]>
  offsetList$: TSubject<OffsetList>
  topListHeight$: TObservable<number>
  stickyItems$: TObservable<number[]>
  viewportHeight$: TSubject<number>
  totalCount$: TObservable<number>
  totalHeight$: TObservable<number>
  scrollTop$: TObservable<number>
  initialTopMostItemIndex: number | undefined
}

export function scrollToIndexEngine({
  offsetList$,
  topListHeight$,
  stickyItems$,
  viewportHeight$,
  totalCount$,
  totalHeight$,
  initialTopMostItemIndex,
  heightsChanged$,
  scrollTop$,
}: ScrollToIndexParams) {
  const scrollToIndex$ = coldSubject<TScrollLocation>()
  const scrollToIndexRequestPending$ = subject(false)
  const scrollTopReportedAfterScrollToIndex$ = subject(true)
  const scrollTo$ = coldSubject<ScrollToOptions>()

  const { scrolledToTopMostItem$ } = initialTopMostItemIndexEngine({
    scrollTo$,
    offsetList$,
    scrollToIndex$,
    scrollTop$,
    initialTopMostItemIndex,
  })

  heightsChanged$.pipe(withLatestFrom(scrolledToTopMostItem$)).subscribe(([[changed], scrolledToTopMostItem]) => {
    if (!changed && scrolledToTopMostItem) {
      scrollToIndexRequestPending$.next(false)
      scrollTopReportedAfterScrollToIndex$.next(true)
    }
  })

  scrollToIndex$
    .pipe(
      withLatestFrom(offsetList$, topListHeight$, stickyItems$, viewportHeight$, totalCount$, totalHeight$),
      map(([location, offsetList, topListHeight, stickyItems, viewportHeight, totalCount, totalHeight]) => {
        if (offsetList.empty()) {
          setTimeout(() => scrollToIndex$.next(location))
          return
        }

        if (typeof location === 'number') {
          location = { index: location, align: 'start', behavior: 'auto' }
        }
        let { index, align = 'start' } = location

        index = Math.max(0, index, Math.min(totalCount - 1, index))

        let offset = offsetList.offsetOf(index)
        if (align === 'end') {
          offset = offset - viewportHeight + offsetList.itemAt(index).size
        } else if (align === 'center') {
          offset = Math.round(offset - viewportHeight / 2 + offsetList.itemAt(index).size / 2)
        } else {
          if (stickyItems.indexOf(index) === -1) {
            offset -= topListHeight
          }
        }

        scrollTopReportedAfterScrollToIndex$.next(false)
        return {
          top: Math.max(0, Math.min(offset, Math.floor(totalHeight - viewportHeight))),
          behavior: location.behavior ?? 'auto',
        }
      }),
      filter(value => value !== undefined)
    )
    .subscribe(scrollTo$.next as any)

  scrollTop$.pipe(withLatestFrom(scrollTopReportedAfterScrollToIndex$)).subscribe(([_, scrollTopReported]) => {
    if (!scrollTopReported) {
      scrollTopReportedAfterScrollToIndex$.next(true)
      scrollToIndexRequestPending$.next(true)
    }
  })

  // if the list has received new heights, the scrollTo call calculations were wrong;
  // we will retry by re-requesting the same index
  offsetList$
    .pipe(withLatestFrom(scrollToIndexRequestPending$, scrollToIndex$))
    .subscribe(([_, scrollToIndexRequestPending, scrollToIndex]) => {
      if (scrollToIndexRequestPending) {
        scrollToIndex$.next(scrollToIndex)
      }
    })

  return {
    scrollToIndex$,
    scrollTo$,
    scrolledToTopMostItem$,
  }
}
