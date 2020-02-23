import { scan, combineLatest, TObservable, map, subject, withLatestFrom, coldSubject } from '../tinyrx'
import { OffsetList } from '../OffsetList'
import { ListItem, Transposer } from '../GroupIndexTransposer'

export const getListTop = (items: ListItem[]) => (items.length > 0 ? items[0].offset : 0)

interface ListEngineParams {
  overscan: number
  viewportHeight$: TObservable<number>
  scrollTop$: TObservable<number>
  topListHeight$: TObservable<number>
  footerHeight$: TObservable<number>
  minListIndex$: TObservable<number>
  totalCount$: TObservable<number>
  offsetList$: TObservable<OffsetList>
  scrolledToTopMostItem$: TObservable<boolean>
  transposer$: TObservable<Transposer>
  totalHeight$: TObservable<number>
}

export function listEngine({
  overscan,
  viewportHeight$,
  scrollTop$,
  topListHeight$,
  footerHeight$,
  minListIndex$,
  totalCount$,
  offsetList$,
  scrolledToTopMostItem$,
  transposer$,
  totalHeight$,
}: ListEngineParams) {
  const listHeight$ = subject(0)
  const endReached$ = coldSubject<number>()

  const list$ = combineLatest(
    viewportHeight$,
    scrollTop$,
    topListHeight$,
    listHeight$,
    footerHeight$,
    minListIndex$,
    totalCount$,
    offsetList$,
    scrolledToTopMostItem$,
    transposer$,
    totalHeight$
  ).pipe(
    scan(
      (
        items,
        [
          viewportHeight,
          scrollTop,
          topListHeight,
          listHeight,
          footerHeight,
          minIndex,
          totalCount,
          offsetList,
          scrolledToTopMostItem,
          transposer,
          totalHeight,
        ]
      ) => {
        const itemLength = items.length

        if (totalCount === 0) {
          return []
        }

        const constrainedScrollTop = Math.max(0, Math.min(scrollTop, totalHeight - viewportHeight))

        const listTop = getListTop(items)

        const listBottom = listTop - constrainedScrollTop + listHeight - footerHeight - topListHeight
        const maxIndex = Math.max(totalCount - 1, 0)
        const indexOutOfAllowedRange =
          itemLength > 0 && (items[0].index < minIndex || items[itemLength - 1].index > maxIndex)

        if (listBottom < viewportHeight || indexOutOfAllowedRange) {
          const endOffset = constrainedScrollTop + viewportHeight + overscan * 2 - 1
          items = transposer.transpose(offsetList.range(constrainedScrollTop, endOffset, minIndex, maxIndex))
        }

        if (listTop > constrainedScrollTop) {
          const startOffset = Math.max(constrainedScrollTop - overscan * 2, 0)
          const endOffset = constrainedScrollTop + viewportHeight - 1
          items = transposer.transpose(offsetList.range(startOffset, endOffset, minIndex, maxIndex))
        }

        // this is a hack - we should let the probe item render,
        // but skip the real list until the viewport has scrolled
        // to the expected location
        if (items.length > 1 && !scrolledToTopMostItem) {
          return []
        }

        return items
      },
      [] as ListItem[]
    )
  )

  const listOffset$ = combineLatest(list$, scrollTop$, topListHeight$).pipe(map(([items]) => getListTop(items)))

  let currentEndIndex = 0

  list$
    .pipe(map(items => (items.length ? items[items.length - 1].index : 0)))
    .pipe(withLatestFrom(totalCount$))
    .subscribe(([endIndex, totalCount]) => {
      if (totalCount === 0) {
        return
      }

      if (endIndex === totalCount - 1) {
        if (currentEndIndex !== endIndex) {
          currentEndIndex = endIndex
          endReached$.next(endIndex)
        }
      }
    })

  return { list$, listOffset$, listHeight$, endReached$ }
}
