import { subject, TObservable, TSubject, withLatestFrom } from '../tinyrx'
import { TScrollLocation } from '../EngineCommons'
import { OffsetList } from '../OffsetList'

export interface InitialTopMostItemIndexParams {
  initialTopMostItemIndex: number | undefined
  scrollTop$: TObservable<number>
  scrollTo$: TSubject<ScrollToOptions>
  scrollToIndex$: TSubject<TScrollLocation>
  offsetList$: TObservable<OffsetList>
}

export function initialTopMostItemIndexEngine({
  initialTopMostItemIndex,
  scrollToIndex$,
  scrollTop$,
  scrollTo$,
  offsetList$,
}: InitialTopMostItemIndexParams) {
  const scrolledToTopMostItem$ = subject(!initialTopMostItemIndex)

  scrollTop$
    .pipe(withLatestFrom(scrollTo$, scrolledToTopMostItem$))
    .subscribe(([scrollTop, scrollTo, scrolledToTopMostItem]) => {
      if (scrollTop === scrollTo.top && !scrolledToTopMostItem) {
        // skip a tick, so that the list$ can grab the scrollTop$ update
        setTimeout(() => {
          scrolledToTopMostItem$.next(true)
        })
      }
    })

  offsetList$.pipe(withLatestFrom(scrolledToTopMostItem$)).subscribe(([_, scrolledToTopMostItem]) => {
    if (!scrolledToTopMostItem) {
      // hack: wait for the viewport to get populated :(
      setTimeout(() => {
        scrollToIndex$.next(initialTopMostItemIndex!)
      })
    }
  })

  return {
    scrolledToTopMostItem$,
  }
}
