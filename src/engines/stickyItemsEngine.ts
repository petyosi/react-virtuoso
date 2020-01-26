import { subject, map, TObservable, combineLatest, filter, withLatestFrom, TSubject } from '../tinyrx'
import { OffsetList } from '../OffsetList'
import { Transposer, ListItem } from '../GroupIndexTransposer'

interface StickyItemsEngineParams {
  offsetList$: TObservable<OffsetList>
  scrollTop$: TObservable<number>
  topList$: TSubject<ListItem[]>
  transposer$: TObservable<Transposer>
}
export function stickyItemsEngine({ offsetList$, scrollTop$, topList$, transposer$ }: StickyItemsEngineParams) {
  const stickyItems$ = subject<number[]>([])

  const stickyItemsIndexList$ = combineLatest(offsetList$, stickyItems$).pipe(
    map(([offsetList, stickyItems]) => {
      return offsetList.getOffsets(stickyItems)
    })
  )

  combineLatest(offsetList$, stickyItemsIndexList$, scrollTop$)
    .pipe(
      filter(params => !params[1].empty() && !params[0].empty()),
      withLatestFrom(topList$, transposer$),
      map(([[offsetList, stickyItemsIndexList, scrollTop], topList, transposer]) => {
        const currentStickyItem = stickyItemsIndexList.findMaxValue(Math.max(scrollTop, 0))

        if (topList.length === 1 && topList[0].index === currentStickyItem) {
          return topList
        }

        const item = offsetList.itemAt(currentStickyItem)
        return transposer.transpose([item])
      })
    )
    .subscribe(topList$.next)

  return {
    stickyItems$,
  }
}
