import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs'
import {
  auditTime,
  distinctUntilChanged,
  map,
  scan,
  withLatestFrom,
  debounceTime,
  mapTo,
  skip,
  filter,
} from 'rxjs/operators'
import { Item, OffsetList } from './OffsetList'

export interface ItemHeight {
  start: number
  end: number
  size: number
}

const getListTop = (items: Item[]) => (items.length > 0 ? items[0].offset : 0)

type MapToTotal = (input: [OffsetList, number]) => number

const mapToTotal: MapToTotal = ([offsetList, totalCount]) => offsetList.total(totalCount - 1)

type ListScanner = (overscan: number) => (items: Item[], viewState: [number[], OffsetList]) => Item[]

const listScanner: ListScanner = overscan => (
  items,
  [[viewportHeight, scrollTop, topListHeight, listHeight, footerHeight, minIndex, totalCount], offsetList]
) => {
  const listTop = getListTop(items)

  const listBottom = listTop - scrollTop + listHeight - footerHeight - topListHeight
  const maxIndex = Math.max(totalCount - 1, 0)
  const topIndexOutOfRange = items.length > 0 && items[0].index < minIndex

  if (listBottom < viewportHeight || topIndexOutOfRange) {
    const startOffset = Math.max(scrollTop + topListHeight, topListHeight)
    const endOffset = scrollTop + viewportHeight + overscan * 2 - 1
    return offsetList.range(startOffset, endOffset, minIndex, maxIndex)
  }

  if (listTop > scrollTop + topListHeight) {
    const startOffset = Math.max(scrollTop + topListHeight - overscan * 2, topListHeight)
    const endOffset = scrollTop + viewportHeight - 1
    return offsetList.range(startOffset, endOffset, minIndex, maxIndex)
  }

  return items
}

interface TVirtuosoConstructorParams {
  overscan?: number
  totalCount: number
  topItems?: number
  itemHeight?: number
}

const VirtuosoStore = ({ overscan = 0, totalCount, itemHeight }: TVirtuosoConstructorParams) => {
  const viewportHeight$ = new BehaviorSubject(0)
  const listHeight$ = new BehaviorSubject(0)
  const scrollTop$ = new BehaviorSubject(0)
  const footerHeight$ = new BehaviorSubject(0)
  const itemHeights$ = new Subject<ItemHeight[]>()
  const totalCount$ = new BehaviorSubject(totalCount)
  const topItemCount$ = new Subject<number>()
  const stickyItems$ = new BehaviorSubject<number[]>([])
  const isScrolling$ = new BehaviorSubject(false)
  let initialOffsetList = OffsetList.create()

  if (itemHeight) {
    initialOffsetList = initialOffsetList.insert(0, 0, itemHeight)
  }

  const offsetList$ = new BehaviorSubject(initialOffsetList)

  if (!itemHeight) {
    itemHeights$.pipe(withLatestFrom(offsetList$)).subscribe(([heights, offsetList]) => {
      const newList = heights.reduce((list, { start, end, size }) => list.insert(start, end, size), offsetList)
      if (newList !== offsetList) {
        offsetList$.next(newList)
      }
    })
  }

  const totalListHeight$ = combineLatest(offsetList$, totalCount$).pipe(map(mapToTotal))

  const totalHeight$ = combineLatest(totalListHeight$, footerHeight$).pipe(
    map(([totalListHeight, footerHeight]) => totalListHeight + footerHeight)
  )

  const stickyItemsIndexList$ = combineLatest(offsetList$, stickyItems$).pipe(
    map(([offsetList, stickyItems]) => {
      return offsetList.getOffsets(stickyItems)
    })
  )

  const topList$ = new BehaviorSubject<Item[]>([])

  combineLatest(offsetList$, topItemCount$, totalCount$)
    .pipe(
      filter(params => params[1] > 0),
      map(([offsetList, topItemCount, totalCount]) => {
        const endIndex = Math.max(0, Math.min(topItemCount - 1, totalCount))
        return offsetList.indexRange(0, endIndex)
      })
    )
    .subscribe(topList$)

  combineLatest(offsetList$, stickyItemsIndexList$, scrollTop$)
    .pipe(
      filter(params => !params[1].empty() && !params[0].empty()),
      withLatestFrom(topList$),
      map(([[offsetList, stickyItemsIndexList, scrollTop], topList]) => {
        const currentStickyItem = stickyItemsIndexList.findMaxValue(scrollTop)

        if (topList.length === 1 && topList[0].index === currentStickyItem) {
          return topList
        }

        const item = offsetList.itemAt(currentStickyItem)
        return [item]
      }),
      distinctUntilChanged()
    )
    .subscribe(topList$)

  const topListHeight$ = topList$.pipe(
    map(items => items.reduce((total, item) => total + item.size, 0)),
    distinctUntilChanged(),
    auditTime(0)
  )

  const minListIndex$ = topList$.pipe(
    map(topList => {
      if (topList.length === 0) {
        return 0
      }

      return topList[topList.length - 1].index + 1
    }),
    distinctUntilChanged()
  )

  const list$: Observable<Item[]> = combineLatest(
    viewportHeight$.pipe(distinctUntilChanged()),
    scrollTop$.pipe(distinctUntilChanged()),
    topListHeight$.pipe(distinctUntilChanged()),
    listHeight$.pipe(distinctUntilChanged()),
    footerHeight$.pipe(distinctUntilChanged()),
    minListIndex$,
    totalCount$
  ).pipe(
    withLatestFrom(offsetList$),
    scan(listScanner(overscan), []),
    distinctUntilChanged()
  )

  const endReached$ = list$.pipe(
    map(items => (items.length ? items[items.length - 1].index : 0)),
    scan((prev, current) => Math.max(prev, current)),
    distinctUntilChanged()
  )

  const listOffset$ = combineLatest(list$, scrollTop$, topListHeight$).pipe(
    map(([items, scrollTop, topListHeight]) => getListTop(items) - scrollTop - topListHeight)
  )

  scrollTop$
    .pipe(
      mapTo(true),
      skip(1)
    )
    .subscribe(isScrolling$)

  scrollTop$
    .pipe(
      debounceTime(200),
      mapTo(false),
      skip(1)
    )
    .subscribe(isScrolling$)

  return {
    // input
    totalCount$,
    footerHeight$,
    itemHeights$,
    listHeight$,
    scrollTop$,
    viewportHeight$,
    stickyItems$,
    topItemCount$,
    // output
    list$,
    listOffset$,
    totalHeight$,
    topList$,
    endReached$,
    isScrolling$,
  }
}

export { VirtuosoStore }
