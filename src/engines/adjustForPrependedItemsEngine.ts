import { TObservable, withLatestFrom, coldSubject, TSubject } from '../tinyrx'
import { OffsetList } from '../OffsetList'

interface AdjustForPrependedItemsParams {
  offsetList$: TSubject<OffsetList>
  scrollTop$: TObservable<number>
  scrollTo$: TSubject<ScrollToOptions>
}

export function adjustForPrependedItemsEngine({ offsetList$, scrollTop$, scrollTo$ }: AdjustForPrependedItemsParams) {
  const adjustForPrependedItems$ = coldSubject<number>()

  adjustForPrependedItems$.pipe(withLatestFrom(offsetList$, scrollTop$)).subscribe(([count, offsetList, scrollTop]) => {
    if (offsetList.empty()) {
      return
    }

    offsetList$.next(offsetList.adjustForPrependedItems(count))

    setTimeout(() => {
      scrollTo$.next({ top: count * offsetList.getDefaultSize() + scrollTop })
    })
  })

  return { adjustForPrependedItems$ }
}
