import { TObservable, withLatestFrom, coldSubject, TSubject, subject } from '../tinyrx'
import { OffsetList } from '../OffsetList'

interface AdjustForPrependedItemsParams {
  offsetList$: TSubject<OffsetList>
  scrollTop$: TObservable<number>
  scrollTo$: TSubject<ScrollToOptions>
}

export function adjustForPrependedItemsEngine({ offsetList$, scrollTop$, scrollTo$ }: AdjustForPrependedItemsParams) {
  const adjustForPrependedItems$ = coldSubject<number>()

  const adjustmentInProgress$ = subject(false)
  adjustForPrependedItems$
    .pipe(withLatestFrom(offsetList$, scrollTop$, adjustmentInProgress$))
    .subscribe(([count, offsetList, scrollTop, inProgress]) => {
      if (inProgress || offsetList.empty()) {
        return
      }

      adjustmentInProgress$.next(true)
      offsetList$.next(offsetList.adjustForPrependedItems(count))

      setTimeout(() => {
        scrollTo$.next({ top: count * offsetList.getDefaultSize() + scrollTop })
        adjustmentInProgress$.next(false)
      })
    })

  return { adjustForPrependedItems$, adjustmentInProgress$ }
}
