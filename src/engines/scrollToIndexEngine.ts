import { TScrollLocation } from '../EngineCommons'
import { OffsetList } from '../OffsetList'
import { coldSubject, subject, TObservable, TSubject, withLatestFrom, map } from '../tinyrx'
import { ItemHeight } from '../VirtuosoStore'
import { initialTopMostItemIndexEngine } from './initialTopMostItemEngine'

export interface ScrollToIndexParams {
  itemHeights$: TSubject<ItemHeight[]>
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
  itemHeights$,
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

  itemHeights$.pipe(withLatestFrom(scrolledToTopMostItem$)).subscribe(([heights, scrolledToTopMostItem]) => {
    if (heights.length === 0 && scrolledToTopMostItem) {
      scrollToIndexRequestPending$.next(false)
    }
  })

  scrollToIndex$
    .pipe(
      withLatestFrom(offsetList$, topListHeight$, stickyItems$, viewportHeight$, totalCount$, totalHeight$),
      map(([location, offsetList, topListHeight, stickyItems, viewportHeight, totalCount, totalHeight]) => {
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
          top: Math.min(offset, Math.floor(totalHeight - viewportHeight)),
          behavior: location.behavior ?? 'auto',
        }
      })
    )
    .subscribe(scrollTo$.next)

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
        console.log('retrying')
        scrollToIndex$.next(scrollToIndex)
      }
    })

  return {
    scrollToIndex$,
    scrollTo$,
    scrolledToTopMostItem$,
  }
}
