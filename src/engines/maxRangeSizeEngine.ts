import { TObservable, TSubject, subject, withLatestFrom } from '../tinyrx'
import { OffsetList } from '../OffsetList'
import { ListItem } from '../GroupIndexTransposer'

export interface MaxRangeSizeParams {
  offsetList$: TSubject<OffsetList>
  scrollTo$: TSubject<ScrollToOptions>
  scrollTop$: TObservable<number>
  list$: TObservable<ListItem[]>
}

export function maxRangeSizeEngine({ list$, offsetList$, scrollTop$, scrollTo$ }: MaxRangeSizeParams) {
  const scheduledReadjust$ = subject<{ index: number; offset: number } | null>(null)
  const maxRangeSize$ = subject(Infinity)

  //////////////
  // Max range size implementation
  // the scheduledReadjust$ can be removed through the trapNext pattern
  //////////////

  // 1. List warns us that it will reset itself.
  offsetList$
    .pipe(withLatestFrom(maxRangeSize$, scrollTop$, list$))
    .subscribe(([offsetList, maxRangeSize, scrollTop, list]) =>
      offsetList.configureMaxRangeSize(maxRangeSize, () => {
        // 2. we pick the adjustment signal and capture the list state *before* it gets reset
        scheduledReadjust$.next({ index: list[0].index, offset: scrollTop - list[0].offset })
      })
    )

  // 3. once the offset list is reset, we compensate the scroll.
  offsetList$.pipe(withLatestFrom(scheduledReadjust$)).subscribe(([offsetList, adjust]) => {
    if (adjust !== null) {
      const scrollTo = offsetList.offsetOf(adjust!.index) + adjust!.offset
      scrollTo$.next({ top: scrollTo })
      scheduledReadjust$.next(null)
    }
  })
  return {
    maxRangeSize$,
  }
}
