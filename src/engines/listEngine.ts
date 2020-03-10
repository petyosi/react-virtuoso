import {
  scan,
  combineLatest,
  TObservable,
  map,
  subject,
  withLatestFrom,
  coldSubject,
  duc,
  debounceTime,
} from '../tinyrx'
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
  inverted: boolean
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
  inverted,
}: ListEngineParams) {
  const listHeight$ = subject(0)
  const endReached$ = coldSubject<number>()
  const list$ = subject<ListItem[]>([])

  const constrainedScrollTop$ = subject(0)

  combineLatest(scrollTop$, totalHeight$, viewportHeight$)
    .pipe(
      map(([scrollTop, totalHeight, viewportHeight]) => Math.max(0, Math.min(scrollTop, totalHeight - viewportHeight)))
    )
    .subscribe(constrainedScrollTop$.next)

  combineLatest(
    viewportHeight$,
    constrainedScrollTop$,
    topListHeight$,
    listHeight$,
    footerHeight$,
    minListIndex$,
    totalCount$,
    offsetList$,
    scrolledToTopMostItem$,
    transposer$
  )
    .pipe(
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
          ]
        ) => {
          const itemLength = items.length

          if (totalCount === 0) {
            return []
          }

          const listTop = getListTop(items)

          const listBottom = listTop - scrollTop + listHeight - footerHeight - topListHeight
          const maxIndex = Math.max(totalCount - 1, 0)
          const indexOutOfAllowedRange =
            itemLength > 0 && (items[0].index < minIndex || items[itemLength - 1].index > maxIndex)

          if (listBottom < viewportHeight || indexOutOfAllowedRange) {
            const endOffset = scrollTop + viewportHeight + overscan * 2 - 1
            items = transposer.transpose(offsetList.range(scrollTop, endOffset, minIndex, maxIndex))
          }

          if (listTop > scrollTop) {
            const startOffset = Math.max(scrollTop - overscan * 2, 0)
            const endOffset = scrollTop + viewportHeight - 1
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
      ),
      duc()
    )
    .subscribe(list$.next)

  const listOffset$ = combineLatest(list$, scrollTop$, topListHeight$).pipe(map(([items]) => getListTop(items)))

  let currentEndIndex = 0
  let currentInvertedIndex = Number.POSITIVE_INFINITY

  list$
    .pipe(
      map(items => {
        if (!items.length) {
          return undefined
        }

        return inverted ? items[0].index : items[items.length - 1].index
      }),
      withLatestFrom(totalCount$),
      debounceTime(250)
    )
    .subscribe(([endIndex, totalCount]) => {
      if (totalCount === 0 || endIndex == null) {
        return
      } else if (inverted) {
        if (currentInvertedIndex !== endIndex && endIndex <= 1) {
          currentInvertedIndex = endIndex
          endReached$.next(endIndex)
        } else if (endIndex > 1) {
          currentInvertedIndex = Number.POSITIVE_INFINITY
        }
      } else if (endIndex === totalCount - 1) {
        if (currentEndIndex !== endIndex) {
          currentEndIndex = endIndex
          endReached$.next(endIndex)
        }
      }
    })

  return { list$, listOffset$, listHeight$, endReached$ }
}
