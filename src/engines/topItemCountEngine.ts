import { TObservable, subject, combineLatest, filter, withLatestFrom, map, TSubject } from '../tinyrx'
import { OffsetList } from '../OffsetList'
import { Transposer, ListItem } from '../GroupIndexTransposer'

interface TopItemCountParams {
  offsetList$: TObservable<OffsetList>
  totalCount$: TObservable<number>
  topList$: TSubject<ListItem[]>
  viewportHeight$: TObservable<number>
  transposer$: TObservable<Transposer>
}
export function topItemCountEngine({
  topList$,
  transposer$,
  viewportHeight$,
  totalCount$,
  offsetList$,
}: TopItemCountParams) {
  const topItemCount$ = subject<number>()

  combineLatest(offsetList$, topItemCount$, totalCount$, viewportHeight$)
    .pipe(
      filter(params => params[1] > 0 && params[3] > 0),
      withLatestFrom(transposer$),
      map(([[offsetList, topItemCount, totalCount], transposer]) => {
        const endIndex = Math.max(0, Math.min(topItemCount - 1, totalCount))
        return transposer.transpose(offsetList.indexRange(0, endIndex))
      })
    )
    .subscribe(topList$.next)
  return { topItemCount$ }
}
