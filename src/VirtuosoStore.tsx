import { BehaviorSubject, combineLatest, Observable, Subject, Subscription } from 'rxjs'
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
import { OffsetList } from './OffsetList'
import { StubIndexTransposer, GroupIndexTransposer, ListItem } from './GroupIndexTransposer'
import { makeInput } from './rxio'

export interface ItemHeight {
  start: number
  end: number
  size: number
}

const getListTop = (items: ListItem[]) => (items.length > 0 ? items[0].offset : 0)

type MapToTotal = (input: [OffsetList, number]) => number

const mapToTotal: MapToTotal = ([offsetList, totalCount]) => offsetList.total(totalCount - 1)

type ListScanner = (overscan: number) => (items: ListItem[], viewState: [number[], OffsetList]) => ListItem[]

interface TVirtuosoConstructorParams {
  overscan?: number
  totalCount?: number
  topItems?: number
  itemHeight?: number
}

const VirtuosoStore = ({ overscan = 0, totalCount = 0, itemHeight }: TVirtuosoConstructorParams) => {
  const viewportHeight$ = new BehaviorSubject(0)
  const listHeight$ = new BehaviorSubject(0)
  const scrollTop$ = new BehaviorSubject(0)
  const footerHeight$ = new BehaviorSubject(0)
  const itemHeights$ = new Subject<ItemHeight[]>()
  const totalCount$ = new BehaviorSubject(totalCount)
  const groupCounts$ = new Subject<number[]>()
  const topItemCount$ = new Subject<number>()
  const isScrolling$ = new BehaviorSubject(false)
  let initialOffsetList = OffsetList.create()
  const stickyItems$ = new BehaviorSubject<number[]>([])

  if (itemHeight) {
    initialOffsetList = initialOffsetList.insert(0, 0, itemHeight)
  }

  const offsetList$ = new BehaviorSubject(initialOffsetList)

  if (!itemHeight) {
    itemHeights$.pipe(withLatestFrom(offsetList$, stickyItems$)).subscribe(([heights, offsetList, stickyItems]) => {
      const newList = heights.reduce((list, { start, end, size }) => {
        if (start === end && stickyItems.indexOf(start) > -1) {
          return list.insertException(start, size)
        }

        return list.insert(start, end, size)
      }, offsetList)
      if (newList !== offsetList) {
        offsetList$.next(newList)
      }
    })
  }

  let transposer: GroupIndexTransposer | StubIndexTransposer = new StubIndexTransposer()

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
      return transposer.transpose(offsetList.range(startOffset, endOffset, minIndex, maxIndex))
    }

    if (listTop > scrollTop + topListHeight) {
      const startOffset = Math.max(scrollTop + topListHeight - overscan * 2, topListHeight)
      const endOffset = scrollTop + viewportHeight - 1
      return transposer.transpose(offsetList.range(startOffset, endOffset, minIndex, maxIndex))
    }

    return items
  }

  groupCounts$.subscribe(counts => {
    transposer = new GroupIndexTransposer(counts)
    totalCount$.next(transposer.totalCount())
    stickyItems$.next(transposer.groupIndices())
  })

  const totalListHeight$ = combineLatest(offsetList$, totalCount$).pipe(map(mapToTotal))

  const totalHeight$ = combineLatest(totalListHeight$, footerHeight$).pipe(
    map(([totalListHeight, footerHeight]) => totalListHeight + footerHeight)
  )

  const stickyItemsIndexList$ = combineLatest(offsetList$, stickyItems$).pipe(
    map(([offsetList, stickyItems]) => {
      return offsetList.getOffsets(stickyItems)
    })
  )

  const topList$ = new BehaviorSubject<ListItem[]>([])

  combineLatest(offsetList$, topItemCount$, totalCount$)
    .pipe(
      filter(params => params[1] > 0),
      map(([offsetList, topItemCount, totalCount]) => {
        const endIndex = Math.max(0, Math.min(topItemCount - 1, totalCount))
        return transposer.transpose(offsetList.indexRange(0, endIndex))
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
        return transposer.transpose([item])
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
      return topList.length && topList[topList.length - 1].index + 1
    }),
    distinctUntilChanged()
  )

  const list$: Observable<ListItem[]> = combineLatest(
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

  const subscriptions: Subscription = new Subscription()

  return {
    // input
    groupCounts: makeInput(groupCounts$),
    itemHeights: makeInput(itemHeights$),
    footerHeight: makeInput(footerHeight$),
    listHeight: makeInput(listHeight$),
    viewportHeight: makeInput(viewportHeight$),
    scrollTop: makeInput(scrollTop$),
    topItemCount: makeInput(topItemCount$),
    totalCount: makeInput(totalCount$),

    // output
    list$,
    listOffset$,
    totalHeight$,
    topList$,
    endReached$,
    isScrolling$,
    subscriptions,
    stickyItems$,
  }
}

export { VirtuosoStore }
