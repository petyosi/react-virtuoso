import { OffsetList } from '../OffsetList'
import { combineLatest, map, subject, TSubject, withLatestFrom, coldSubject } from '../tinyrx'
import { ItemHeight } from '../VirtuosoStore'
import { initialItemCountEngine } from './initialItemCountEngine'
import { Transposer, ListItem } from '../GroupIndexTransposer'
import { stickyItemsEngine } from './stickyItemsEngine'

interface OffsetListEngineParams {
  itemHeight: number | undefined
  defaultItemHeight: number | undefined
  initialTopMostItemIndex: number | undefined
  totalCount: number
  viewportHeight$: TSubject<number>
  scrollTop$: TSubject<number>
  topList$: TSubject<ListItem[]>
  transposer$: TSubject<Transposer>
}

export function offsetListEngine({
  totalCount,
  itemHeight,
  defaultItemHeight,
  initialTopMostItemIndex,
  viewportHeight$,
  scrollTop$,
  topList$,
  transposer$,
}: OffsetListEngineParams) {
  const footerHeight$ = subject(0)
  const totalCount$ = subject(totalCount)
  const itemHeights$ = subject<ItemHeight[]>()
  const { pendingRenderAfterInitial$, initialItemCount$ } = initialItemCountEngine({ itemHeights$, viewportHeight$ })
  const heightsChanged$ = coldSubject<[boolean, OffsetList]>()

  let initialOffsetList = OffsetList.create()

  if (itemHeight) {
    initialOffsetList = initialOffsetList.insert(0, 0, itemHeight)
  }

  if (defaultItemHeight) {
    initialOffsetList = initialOffsetList.insert(0, 0, defaultItemHeight)
  }

  if (initialTopMostItemIndex) {
    initialOffsetList = initialOffsetList.setInitialIndex(initialTopMostItemIndex)
  }

  const offsetList$ = subject(initialOffsetList)
  const { stickyItems$ } = stickyItemsEngine({ offsetList$, scrollTop$, topList$, transposer$ })

  const totalHeight$ = combineLatest(offsetList$, totalCount$, footerHeight$).pipe(
    map(([offsetList, totalCount, footerHeight]) => offsetList.total(totalCount - 1) + footerHeight)
  )

  if (!itemHeight) {
    itemHeights$
      .pipe(withLatestFrom(offsetList$, stickyItems$, pendingRenderAfterInitial$))
      .subscribe(([heights, offsetList, stickyItems, pendingRenderAfterInitial]) => {
        let newList = offsetList

        if (pendingRenderAfterInitial) {
          newList = OffsetList.create()
          pendingRenderAfterInitial = false
        }

        for (const { start, end, size } of heights) {
          if (newList.empty() && start === end && stickyItems.indexOf(start) > -1) {
            newList = newList.insertSpots(stickyItems, size)
          } else {
            newList = newList.insert(start, end, size)
          }
        }

        if (newList !== offsetList) {
          offsetList$.next(newList)
          heightsChanged$.next([true, newList])
        } else {
          heightsChanged$.next([false, newList])
        }
      })
  }

  return {
    totalCount$,
    offsetList$,
    totalHeight$,
    footerHeight$,
    initialItemCount$,
    itemHeights$,
    stickyItems$,
    heightsChanged$,
  }
}
